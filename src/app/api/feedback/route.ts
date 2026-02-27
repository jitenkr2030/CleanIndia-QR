import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// POST /api/feedback - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toiletId, rating, issueType, comment, photoUrl } = body;

    // Validate required fields
    if (!toiletId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: toiletId, rating" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get user agent and IP address
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined;

    // Create feedback record
    const feedback = await db.feedback.create({
      data: {
        toiletId,
        rating,
        issueType: issueType || null,
        comment: comment || null,
        photoUrl: photoUrl || null,
        userAgent,
        ipAddress,
      },
    });

    // Update toilet's last feedback timestamp (if needed)
    await db.toilet.update({
      where: { id: toiletId },
      data: { updatedAt: new Date() },
    });

    // Trigger alert if rating is low (<= 2)
    if (rating <= 2) {
      // In a real implementation, this would send notifications
      console.log(`ALERT: Low rating (${rating}) received for toilet ${toiletId}`);
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        issueType: feedback.issueType,
        createdAt: feedback.createdAt,
      },
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Get all feedback (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toiletId = searchParams.get('toiletId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = toiletId ? { toiletId } : {};

    const feedback = await db.feedback.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.feedback.count({ where });

    return NextResponse.json({
      feedback,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}