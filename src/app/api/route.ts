import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

// GET /api - Health check
export async function GET() {
  return NextResponse.json({ 
    message: "CleanIndia QR API is running",
    version: "1.0.0",
    endpoints: {
      feedback: "POST /api/feedback - Submit toilet feedback",
      toilets: "GET /api/toilets - Get all toilets",
      dashboard: "GET /api/dashboard - Get dashboard stats"
    }
  });
}