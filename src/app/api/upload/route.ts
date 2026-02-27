import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'feedback' or 'cleaning'
    const toiletId = formData.get('toiletId') as string;
    const feedbackId = formData.get('feedbackId') as string;
    const cleaningLogId = formData.get('cleaningLogId') as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type || !['feedback', 'cleaning'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid or missing type" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', type);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create public URL
    const publicUrl = `/uploads/${type}/${filename}`;

    // Update database record based on type
    if (type === 'feedback' && feedbackId) {
      await db.feedback.update({
        where: { id: feedbackId },
        data: { photoUrl: publicUrl }
      });
    } else if (type === 'cleaning' && cleaningLogId) {
      await db.cleaningLog.update({
        where: { id: cleaningLogId },
        data: { photoUrl: publicUrl }
      });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET /api/upload - Get upload info (for validation)
export async function GET() {
  return NextResponse.json({
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxSizeMB: 5,
    supportedFormats: ['JPEG', 'PNG', 'WebP']
  });
}