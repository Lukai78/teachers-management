import { NextRequest, NextResponse } from 'next/server';
// import { parseSchedulePdf } from '@/lib/pdf-parser'; // Disabled for server-side compatibility
import { parseScheduleExcel } from '@/lib/excel-parser';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Detect file type and use appropriate parser
        let schedules;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.pdf')) {
            // PDF upload temporarily disabled
            return NextResponse.json(
                { error: 'PDF upload is temporarily disabled. Please use Excel (.xlsx) files.' },
                { status: 400 }
            );
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            schedules = await parseScheduleExcel(buffer);
        } else {
            return NextResponse.json(
                { error: 'Unsupported file format. Please upload an Excel file (.xlsx).' },
                { status: 400 }
            );
        }

        const results = [];

        for (const schedule of schedules) {
            // 1. Upsert Teacher
            const teacher = await prisma.teacher.upsert({
                where: { email: `${schedule.teacherName.replace(/\s+/g, '.').toLowerCase()}@school.com` }, // Mock email generation
                update: { name: schedule.teacherName },
                create: {
                    name: schedule.teacherName,
                    email: `${schedule.teacherName.replace(/\s+/g, '.').toLowerCase()}@school.com`,
                },
            });

            // 2. Clear existing slots for clean update (optional strategy)
            await prisma.scheduleSlot.deleteMany({
                where: { teacherId: teacher.id },
            });

            // 3. Create new slots
            for (const slot of schedule.slots) {
                await prisma.scheduleSlot.create({
                    data: {
                        teacherId: teacher.id,
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        subject: slot.subject,
                        classRoom: slot.classRoom,
                    },
                });
            }
            results.push({ teacher: teacher.name, slots: schedule.slots.length });
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process schedule' },
            { status: 500 }
        );
    }
}
