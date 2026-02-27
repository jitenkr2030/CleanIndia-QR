import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const locationId = searchParams.get('locationId');
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

    // Build where clauses
    const feedbackWhere: any = {};
    const cleaningWhere: any = {};
    
    if (locationId) {
      feedbackWhere.toilet = { floor: { locationId } };
      cleaningWhere.toilet = { floor: { locationId } };
    }
    
    if (companyId) {
      if (!feedbackWhere.toilet) feedbackWhere.toilet = {};
      if (!cleaningWhere.toilet) cleaningWhere.toilet = {};
      if (!feedbackWhere.toilet.floor) feedbackWhere.toilet.floor = {};
      if (!cleaningWhere.toilet.floor) cleaningWhere.toilet.floor = {};
      feedbackWhere.toilet.floor.location = { companyId };
      cleaningWhere.toilet.floor.location = { companyId };
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    switch (type) {
      case 'overview':
        // Overall statistics
        const [
          totalFeedback,
          avgRating,
          totalCleanings,
          lowRatingCount,
          issueDistribution,
          dailyTrends
        ] = await Promise.all([
          db.feedback.count({ where: { ...feedbackWhere, createdAt: { gte: startDate } } }),
          db.feedback.aggregate({ 
            where: { ...feedbackWhere, createdAt: { gte: startDate } },
            _avg: { rating: true } 
          }),
          db.cleaningLog.count({ where: { ...cleaningWhere, cleanedAt: { gte: startDate } } }),
          db.feedback.count({ 
            where: { ...feedbackWhere, rating: { lte: 2 }, createdAt: { gte: startDate } } 
          }),
          db.feedback.groupBy({
            by: ['issueType'],
            where: { ...feedbackWhere, issueType: { not: null }, createdAt: { gte: startDate } },
            _count: { issueType: true }
          }),
          getDailyTrends(feedbackWhere, cleaningWhere, startDate, now)
        ]);

        return NextResponse.json({
          overview: {
            totalFeedback,
            averageRating: avgRating._avg.rating || 0,
            totalCleanings,
            lowRatingCount,
            issueDistribution: issueDistribution.map(item => ({
              issue: item.issueType,
              count: item._count.issueType
            })),
            dailyTrends
          }
        });

      case 'ratings':
        // Rating distribution and trends
        const ratingDistribution = await db.feedback.groupBy({
          by: ['rating'],
          where: { ...feedbackWhere, createdAt: { gte: startDate } },
          _count: { rating: true }
        });

        const ratingTrends = await getRatingTrends(feedbackWhere, startDate, now);

        return NextResponse.json({
          ratings: {
            distribution: ratingDistribution.map(item => ({
              rating: item.rating,
              count: item._count.rating
            })),
            trends: ratingTrends
          }
        });

      case 'cleaning':
        // Cleaning performance metrics
        const cleaningPerformance = await getCleaningPerformance(cleaningWhere, startDate, now);
        
        return NextResponse.json({
          cleaning: cleaningPerformance
        });

      case 'issues':
        // Detailed issue analysis
        const issueAnalysis = await getIssueAnalysis(feedbackWhere, startDate, now);
        
        return NextResponse.json({
          issues: issueAnalysis
        });

      default:
        return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get daily trends
async function getDailyTrends(feedbackWhere: any, cleaningWhere: any, startDate: Date, endDate: Date) {
  const trends = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const [feedbackCount, avgRating, cleaningCount] = await Promise.all([
      db.feedback.count({
        where: {
          ...feedbackWhere,
          createdAt: { gte: currentDate, lt: nextDate }
        }
      }),
      db.feedback.aggregate({
        where: {
          ...feedbackWhere,
          createdAt: { gte: currentDate, lt: nextDate }
        },
        _avg: { rating: true }
      }),
      db.cleaningLog.count({
        where: {
          ...cleaningWhere,
          cleanedAt: { gte: currentDate, lt: nextDate }
        }
      })
    ]);
    
    trends.push({
      date: currentDate.toISOString().split('T')[0],
      feedback: feedbackCount,
      averageRating: avgRating._avg.rating || 0,
      cleanings: cleaningCount
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return trends;
}

// Helper function to get rating trends
async function getRatingTrends(feedbackWhere: any, startDate: Date, endDate: Date) {
  const trends = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const ratingData = await db.feedback.groupBy({
      by: ['rating'],
      where: {
        ...feedbackWhere,
        createdAt: { gte: currentDate, lt: nextDate }
      },
      _count: { rating: true }
    });
    
    trends.push({
      date: currentDate.toISOString().split('T')[0],
      ratings: ratingData.map(item => ({
        rating: item.rating,
        count: item._count.rating
      }))
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return trends;
}

// Helper function to get cleaning performance
async function getCleaningPerformance(cleaningWhere: any, startDate: Date, endDate: Date) {
  // Get staff performance
  const staffPerformance = await db.staff.findMany({
    where: { isActive: true },
    include: {
      cleaningLogs: {
        where: { cleanedAt: { gte: startDate } },
        include: {
          toilet: {
            include: {
              feedback: {
                where: { createdAt: { gte: startDate } }
              }
            }
          }
        }
      }
    }
  });

  const performanceData = staffPerformance.map(staff => {
    const cleanings = staff.cleaningLogs.length;
    const avgRating = staff.cleaningLogs.reduce((acc, log) => {
      const ratings = log.toilet.feedback.map(f => f.rating);
      return acc + (ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0);
    }, 0) / (cleanings || 1);

    return {
      staffId: staff.id,
      staffName: staff.name,
      cleanings,
      averageRating: avgRating.toFixed(1)
    };
  });

  return {
    staffPerformance: performanceData.sort((a, b) => b.cleanings - a.cleanings),
    totalCleanings: performanceData.reduce((acc, staff) => acc + staff.cleanings, 0),
    averageCleaningsPerStaff: (performanceData.reduce((acc, staff) => acc + staff.cleanings, 0) / performanceData.length).toFixed(1)
  };
}

// Helper function to get issue analysis
async function getIssueAnalysis(feedbackWhere: any, startDate: Date, endDate: Date) {
  const issueTrends = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const issueData = await db.feedback.groupBy({
      by: ['issueType'],
      where: {
        ...feedbackWhere,
        issueType: { not: null },
        createdAt: { gte: currentDate, lt: nextDate }
      },
      _count: { issueType: true }
    });
    
    issueTrends.push({
      date: currentDate.toISOString().split('T')[0],
      issues: issueData.map(item => ({
        type: item.issueType,
        count: item._count.issueType
      }))
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get most problematic toilets
  const problematicToilets = await db.toilet.findMany({
    include: {
      feedback: {
        where: { ...feedbackWhere, rating: { lte: 2 }, createdAt: { gte: startDate } }
      },
      floor: {
        include: {
          location: true
        }
      }
    }
  });

  const toiletIssues = problematicToilets
    .filter(toilet => toilet.feedback.length > 0)
    .map(toilet => ({
      toiletId: toilet.id,
      toiletNumber: toilet.toiletNumber,
      location: `${toilet.floor.location.name} - ${toilet.floor.name}`,
      issueCount: toilet.feedback.length,
      averageRating: toilet.feedback.reduce((acc, f) => acc + f.rating, 0) / toilet.feedback.length
    }))
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 10);

  return {
    trends: issueTrends,
    problematicToilets: toiletIssues
  };
}