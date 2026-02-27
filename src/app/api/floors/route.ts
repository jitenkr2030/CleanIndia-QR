import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/floors - Get all floors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (locationId) {
      where.locationId = locationId;
    }

    const floors = await db.floor.findMany({
      where,
      include: {
        location: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            toilets: true,
          },
        },
      },
      orderBy: { floorNumber: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await db.floor.count({ where });

    return NextResponse.json({
      floors,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching floors:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/floors - Create new floor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId, floorNumber, name } = body;

    // Validate required fields
    if (!locationId || !floorNumber) {
      return NextResponse.json(
        { error: "Missing required fields: locationId, floorNumber" },
        { status: 400 }
      );
    }

    // Validate that location exists
    const location = await db.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if floor already exists
    const existingFloor = await db.floor.findFirst({
      where: {
        locationId,
        floorNumber,
      },
    });

    if (existingFloor) {
      return NextResponse.json(
        { error: "Floor with this number already exists in this location" },
        { status: 400 }
      );
    }

    // Create floor
    const floor = await db.floor.create({
      data: {
        locationId,
        floorNumber,
        name: name || null,
      },
      include: {
        location: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      floor,
    });

  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}