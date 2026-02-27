import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/locations - Get all locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const locations = await db.location.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            floors: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.location.count({ where });

    return NextResponse.json({
      locations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, address, city, state, pincode } = body;

    // Validate required fields
    if (!companyId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: companyId, name" },
        { status: 400 }
      );
    }

    // Validate that company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Create location
    const location = await db.location.create({
      data: {
        companyId,
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      location,
    });

  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}