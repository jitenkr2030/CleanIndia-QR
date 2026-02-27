import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/alerts - Get active alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const companyId = searchParams.get('companyId');
    const severity = searchParams.get('severity'); // low, medium, high, critical

    // Build where clauses
    const feedbackWhere: any = {};
    const toiletWhere: any = {};
    
    if (locationId) {
      feedbackWhere.toilet = { floor: { locationId } };
      toiletWhere.floor = { locationId };
    }
    
    if (companyId) {
      if (!feedbackWhere.toilet) feedbackWhere.toilet = {};
      if (!feedbackWhere.toilet.floor) feedbackWhere.toilet.floor = {};
      if (!toiletWhere.floor) toiletWhere.floor = {};
      feedbackWhere.toilet.floor.location = { companyId };
      toiletWhere.floor.location = { companyId };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const alerts = [];

    // Alert 1: Low ratings in last 24 hours
    const lowRatings = await db.feedback.findMany({
      where: {
        ...feedbackWhere,
        rating: { lte: 2 },
        createdAt: { gte: twentyFourHoursAgo }
      },
      include: {
        toilet: {
          include: {
            floor: {
              include: {
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    lowRatings.forEach(feedback => {
      alerts.push({
        id: `low-rating-${feedback.id}`,
        type: 'LOW_RATING',
        severity: feedback.rating === 1 ? 'critical' : 'high',
        title: `Low Rating Alert`,
        message: `Toilet ${feedback.toilet.toiletNumber} received a ${feedback.rating}-star rating`,
        toiletId: feedback.toiletId,
        location: `${feedback.toilet.floor.location.name} - ${feedback.toilet.floor.name}`,
        toiletNumber: feedback.toilet.toiletNumber,
        createdAt: feedback.createdAt,
        data: {
          rating: feedback.rating,
          comment: feedback.comment,
          issueType: feedback.issueType
        }
      });
    });

    // Alert 2: Missed cleaning schedules
    const overdueCleanings = await db.toilet.findMany({
      where: {
        ...toiletWhere,
        nextCleaningDue: { lt: now },
        status: 'ACTIVE'
      },
      include: {
        floor: {
          include: {
            location: true
          }
        }
      }
    });

    overdueCleanings.forEach(toilet => {
      const hoursOverdue = Math.floor((now.getTime() - new Date(toilet.nextCleaningDue!).getTime()) / (1000 * 60 * 60));
      alerts.push({
        id: `missed-cleaning-${toilet.id}`,
        type: 'MISSED_CLEANING',
        severity: hoursOverdue > 4 ? 'high' : 'medium',
        title: `Missed Cleaning Alert`,
        message: `Toilet ${toilet.toiletNumber} is ${hoursOverdue} hours overdue for cleaning`,
        toiletId: toilet.id,
        location: `${toilet.floor.location.name} - ${toilet.floor.name}`,
        toiletNumber: toilet.toiletNumber,
        createdAt: toilet.nextCleaningDue,
        data: {
          hoursOverdue,
          lastCleanedAt: toilet.lastCleanedAt,
          cleaningFrequency: toilet.cleaningFrequency
        }
      });
    });

    // Alert 3: Multiple complaints for same toilet
    const complaintCounts = await db.feedback.groupBy({
      by: ['toiletId'],
      where: {
        ...feedbackWhere,
        rating: { lte: 2 },
        createdAt: { gte: twentyFourHoursAgo }
      },
      _count: { rating: true },
      having: {
        rating: { _count: { gt: 2 } }
      }
    });

    for (const complaint of complaintCounts) {
      const toilet = await db.toilet.findUnique({
        where: { id: complaint.toiletId },
        include: {
          floor: {
            include: {
              location: true
            }
          }
        }
      });

      if (toilet) {
        alerts.push({
          id: `multiple-complaints-${toilet.id}`,
          type: 'MULTIPLE_COMPLAINTS',
          severity: 'high',
          title: `Multiple Complaints Alert`,
          message: `Toilet ${toilet.toiletNumber} received ${complaint._count.rating} complaints in 24 hours`,
          toiletId: toilet.id,
          location: `${toilet.floor.location.name} - ${toilet.floor.name}`,
          toiletNumber: toilet.toiletNumber,
          createdAt: new Date(),
          data: {
            complaintCount: complaint._count.rating
          }
        });
      }
    }

    // Alert 4: No cleaning logs in extended period
    const notCleanedRecently = await db.toilet.findMany({
      where: {
        ...toiletWhere,
        OR: [
          { lastCleanedAt: { lt: twentyFourHoursAgo } },
          { lastCleanedAt: null }
        ],
        status: 'ACTIVE'
      },
      include: {
        floor: {
          include: {
            location: true
          }
        }
      }
    });

    notCleanedRecently.forEach(toilet => {
      const hoursSinceCleaning = toilet.lastCleanedAt 
        ? Math.floor((now.getTime() - new Date(toilet.lastCleanedAt).getTime()) / (1000 * 60 * 60))
        : 999;

      if (hoursSinceCleaning > toilet.cleaningFrequency * 2) {
        alerts.push({
          id: `no-cleaning-${toilet.id}`,
          type: 'NO_CLEANING_LOG',
          severity: 'medium',
          title: `No Cleaning Record Alert`,
          message: `Toilet ${toilet.toiletNumber} hasn't been cleaned in ${hoursSinceCleaning} hours`,
          toiletId: toilet.id,
          location: `${toilet.floor.location.name} - ${toilet.floor.name}`,
          toiletNumber: toilet.toiletNumber,
          createdAt: toilet.lastCleanedAt || new Date(0),
          data: {
            hoursSinceCleaning,
            lastCleanedAt: toilet.lastCleanedAt
          }
        });
      }
    });

    // Alert 5: Emergency issues (no water, broken fixtures)
    const emergencyIssues = await db.feedback.findMany({
      where: {
        ...feedbackWhere,
        issueType: { in: ['NO_WATER', 'BROKEN_FIXTURES'] },
        createdAt: { gte: oneHourAgo }
      },
      include: {
        toilet: {
          include: {
            floor: {
              include: {
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    emergencyIssues.forEach(feedback => {
      alerts.push({
        id: `emergency-${feedback.id}`,
        type: 'EMERGENCY_ISSUE',
        severity: 'critical',
        title: `Emergency Issue Alert`,
        message: `Toilet ${feedback.toilet.toiletNumber} has ${feedback.issueType?.replace('_', ' ')}`,
        toiletId: feedback.toiletId,
        location: `${feedback.toilet.floor.location.name} - ${feedback.toilet.floor.name}`,
        toiletNumber: feedback.toilet.toiletNumber,
        createdAt: feedback.createdAt,
        data: {
          issueType: feedback.issueType,
          comment: feedback.comment
        }
      });
    });

    // Filter by severity if specified
    const filteredAlerts = severity 
      ? alerts.filter(alert => alert.severity === severity)
      : alerts;

    // Sort by severity and creation time
    const sortedAlerts = filteredAlerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                          (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      alerts: sortedAlerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create manual alert or acknowledge alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, type, toiletId, message, severity } = body;

    if (action === 'acknowledge') {
      // In a real implementation, this would mark the alert as acknowledged
      // For now, we'll just return success
      return NextResponse.json({
        success: true,
        message: "Alert acknowledged successfully"
      });
    }

    if (action === 'create') {
      // Create a manual alert
      if (!type || !toiletId || !message) {
        return NextResponse.json(
          { error: "Missing required fields: type, toiletId, message" },
          { status: 400 }
        );
      }

      // Validate toilet exists
      const toilet = await db.toilet.findUnique({
        where: { id: toiletId },
        include: {
          floor: {
            include: {
              location: true
            }
          }
        }
      });

      if (!toilet) {
        return NextResponse.json(
          { error: "Toilet not found" },
          { status: 404 }
        );
      }

      // In a real implementation, this would store the alert in the database
      const manualAlert = {
        id: `manual-${Date.now()}`,
        type,
        severity: severity || 'medium',
        title: `Manual Alert: ${type}`,
        message,
        toiletId,
        location: `${toilet.floor.location.name} - ${toilet.floor.name}`,
        toiletNumber: toilet.toiletNumber,
        createdAt: new Date(),
        isManual: true
      };

      return NextResponse.json({
        success: true,
        alert: manualAlert
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing alert request:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}