import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api/companies - Get all companies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const companies = await db.company.findMany({
      include: {
        _count: {
          select: {
            locations: true,
            staff: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.company.count();

    return NextResponse.json({
      companies,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    // Check if company with this email already exists
    const existingCompany = await db.company.findUnique({
      where: { email },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Company with this email already exists" },
        { status: 400 }
      );
    }

    // Create company
    const company = await db.company.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json({
      success: true,
      company,
    });

  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}