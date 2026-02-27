import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/toilets - Get all toilets with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const floorId = searchParams.get('floorId');
    const qr = searchParams.get('qr');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    
    if (locationId) {
      where.floor = { locationId };
    }
    
    if (floorId) {
      where.floorId = floorId;
    }
    
    if (qr) {
      where.qrCode = qr;
    }
    
    if (status) {
      where.status = status;
    }

    const toilets = await db.toilet.findMany({
      where,
      include: {
        floor: {
          include: {
            location: true,
          },
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        cleaningLogs: {
          orderBy: { cleanedAt: 'desc' },
          take: 3,
        },
        staffAssignments: {
          include: {
            staff: true,
          },
        },
        _count: {
          select: {
            feedback: true,
            cleaningLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Calculate average rating for each toilet
    const toiletsWithRatings = await Promise.all(
      toilets.map(async (toilet) => {
        const ratingResult = await db.feedback.aggregate({
          where: { toiletId: toilet.id },
          _avg: { rating: true },
          _count: { rating: true },
        });

        return {
          ...toilet,
          averageRating: ratingResult._avg.rating || 0,
          totalFeedback: ratingResult._count.rating,
        };
      })
    );

    const total = await db.toilet.count({ where });

    return NextResponse.json({
      toilets: toiletsWithRatings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching toilets:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/toilets - Create new toilet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { floorId, toiletNumber, qrCode, cleaningFrequency } = body;

    // Validate required fields
    if (!floorId || !toiletNumber || !qrCode) {
      return NextResponse.json(
        { error: "Missing required fields: floorId, toiletNumber, qrCode" },
        { status: 400 }
      );
    }

    // Check if QR code already exists
    const existingToilet = await db.toilet.findUnique({
      where: { qrCode },
    });

    if (existingToilet) {
      return NextResponse.json(
        { error: "QR code already exists" },
        { status: 400 }
      );
    }

    // Create toilet
    const toilet = await db.toilet.create({
      data: {
        floorId,
        toiletNumber,
        qrCode,
        cleaningFrequency: cleaningFrequency || 2,
        nextCleaningDue: new Date(Date.now() + (cleaningFrequency || 2) * 60 * 60 * 1000), // Add hours in milliseconds
      },
      include: {
        floor: {
          include: {
            location: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      toilet,
    });

  } catch (error) {
    console.error('Error creating toilet:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}