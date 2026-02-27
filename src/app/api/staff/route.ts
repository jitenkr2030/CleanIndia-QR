import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/staff - Get all staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (role) {
      where.role = role;
    }

    const staff = await db.staff.findMany({
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
            assignments: true,
            cleaningLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.staff.count({ where });

    return NextResponse.json({
      staff,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, email, phone, role } = body;

    // Validate required fields
    if (!companyId || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: companyId, name, email" },
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

    // Check if staff with this email already exists
    const existingStaff = await db.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Staff member with this email already exists" },
        { status: 400 }
      );
    }

    // Create staff
    const staff = await db.staff.create({
      data: {
        companyId,
        name,
        email,
        phone: phone || null,
        role: role || 'CLEANER',
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
      staff,
    });

  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}