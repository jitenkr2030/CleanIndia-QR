import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// POST /api/cleaning-logs - Log cleaning activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toiletId, staffId, checklist, notes, photoUrl } = body;

    // Validate required fields
    if (!toiletId || !staffId) {
      return NextResponse.json(
        { error: "Missing required fields: toiletId, staffId" },
        { status: 400 }
      );
    }

    // Validate that the toilet exists
    const toilet = await db.toilet.findUnique({
      where: { id: toiletId },
    });

    if (!toilet) {
      return NextResponse.json(
        { error: "Toilet not found" },
        { status: 404 }
      );
    }

    // Validate that the staff exists
    const staff = await db.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    // Create cleaning log
    const cleaningLog = await db.cleaningLog.create({
      data: {
        toiletId,
        staffId,
        checklist: checklist || null,
        notes: notes || null,
        photoUrl: photoUrl || null,
      },
    });

    // Update toilet's cleaning status
    const now = new Date();
    await db.toilet.update({
      where: { id: toiletId },
      data: {
        lastCleanedAt: now,
        nextCleaningDue: new Date(now.getTime() + toilet.cleaningFrequency * 60 * 60 * 1000),
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      cleaningLog: {
        id: cleaningLog.id,
        toiletId: cleaningLog.toiletId,
        staffId: cleaningLog.staffId,
        checklist: cleaningLog.checklist,
        notes: cleaningLog.notes,
        cleanedAt: cleaningLog.cleanedAt,
      },
      nextCleaningDue: new Date(now.getTime() + toilet.cleaningFrequency * 60 * 60 * 1000),
    });

  } catch (error) {
    console.error('Error logging cleaning:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/cleaning-logs - Get cleaning logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toiletId = searchParams.get('toiletId');
    const staffId = searchParams.get('staffId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    
    if (toiletId) {
      where.toiletId = toiletId;
    }
    
    if (staffId) {
      where.staffId = staffId;
    }

    const cleaningLogs = await db.cleaningLog.findMany({
      where,
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
        staff: true,
      },
      orderBy: { cleanedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.cleaningLog.count({ where });

    return NextResponse.json({
      cleaningLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching cleaning logs:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}