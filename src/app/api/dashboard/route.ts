import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const companyId = searchParams.get('companyId');

    // Build where clauses based on filters
    const toiletWhere: any = {};
    const feedbackWhere: any = {};
    
    if (locationId) {
      toiletWhere.floor = { locationId };
      feedbackWhere.toilet = { floor: { locationId } };
    }
    
    if (companyId) {
      if (!toiletWhere.floor) toiletWhere.floor = {};
      toiletWhere.floor.location = { companyId };
      if (!feedbackWhere.toilet) feedbackWhere.toilet = {};
      if (!feedbackWhere.toilet.floor) feedbackWhere.toilet.floor = {};
      feedbackWhere.toilet.floor.location = { companyId };
    }

    // Get total toilets count
    const totalToilets = await db.toilet.count({ where: toiletWhere });

    // Get average rating
    const ratingResult = await db.feedback.aggregate({
      where: feedbackWhere,
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Get today's feedback count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysFeedback = await db.feedback.count({
      where: {
        ...feedbackWhere,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get toilets that need cleaning (overdue)
    const now = new Date();
    const overdueCleanings = await db.toilet.count({
      where: {
        ...toiletWhere,
        nextCleaningDue: {
          lt: now,
        },
        status: 'ACTIVE',
      },
    });

    // Get recent feedback with details
    const recentFeedback = await db.feedback.findMany({
      where: feedbackWhere,
      include: {
        toilet: {
          include: {
            floor: {
              include: {
                location: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get low rating alerts (rating <= 2) from last 24 hours
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const lowRatingAlerts = await db.feedback.count({
      where: {
        ...feedbackWhere,
        rating: {
          lte: 2,
        },
        createdAt: {
          gte: yesterday,
        },
      },
    });

    // Get cleaning stats for today
    const todaysCleaning = await db.cleaningLog.count({
      where: {
        cleanedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get staff performance (if companyId is provided)
    let staffPerformance = [];
    if (companyId) {
      staffPerformance = await db.staff.findMany({
        where: { companyId, isActive: true },
        include: {
          cleaningLogs: {
            where: {
              cleanedAt: {
                gte: today,
                lt: tomorrow,
              },
            },
          },
          assignments: {
            include: {
              toilet: {
                include: {
                  feedback: {
                    where: {
                      createdAt: {
                        gte: yesterday,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calculate issue distribution
    const issueDistribution = await db.feedback.groupBy({
      by: ['issueType'],
      where: {
        ...feedbackWhere,
        issueType: { not: null },
        createdAt: {
          gte: yesterday,
        },
      },
      _count: { issueType: true },
    });

    return NextResponse.json({
      stats: {
        totalToilets,
        averageRating: ratingResult._avg.rating || 0,
        totalFeedback: ratingResult._count.rating,
        todaysFeedback,
        overdueCleanings,
        lowRatingAlerts,
        todaysCleaning,
      },
      recentFeedback: recentFeedback.map(fb => ({
        id: fb.id,
        rating: fb.rating,
        issueType: fb.issueType,
        comment: fb.comment,
        createdAt: fb.createdAt,
        toilet: {
          id: fb.toilet.id,
          toiletNumber: fb.toilet.toiletNumber,
          location: `${fb.toilet.floor.location.name} - Floor ${fb.toilet.floor.floorNumber}`,
        },
      })),
      staffPerformance: staffPerformance.map(staff => ({
        id: staff.id,
        name: staff.name,
        role: staff.role,
        todayCleanings: staff.cleaningLogs.length,
        assignedToilets: staff.assignments.length,
        averageRating: staff.assignments.reduce((acc, assignment) => {
          const ratings = assignment.toilet.feedback.map(f => f.rating);
          return acc + (ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0);
        }, 0) / (staff.assignments.length || 1),
      })),
      issueDistribution: issueDistribution.map(item => ({
        issue: item.issueType,
        count: item._count.issueType,
      })),
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}