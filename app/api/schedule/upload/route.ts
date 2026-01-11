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

        console.log(`Processing ${schedules.length} teachers...`);

        // Step 1: Batch upsert all teachers
        const teacherData = schedules.map(schedule => ({
            email: `${schedule.teacherName.replace(/\s+/g, '.').toLowerCase()}@school.com`,
            name: schedule.teacherName,
        }));

        // Upsert teachers in batch
        await Promise.all(
            teacherData.map(data =>
                prisma.teacher.upsert({
                    where: { email: data.email },
                    update: { name: data.name },
                    create: data,
                })
            )
        );

        // Step 2: Get all teachers with their IDs
        const teachers = await prisma.teacher.findMany({
            where: {
                email: { in: teacherData.map(d => d.email) }
            }
        });

        const teacherMap = new Map(teachers.map(t => [t.name, t.id]));

        // Step 3: Delete all existing slots for these teachers in one query
        await prisma.scheduleSlot.deleteMany({
            where: {
                teacherId: { in: teachers.map(t => t.id) }
            }
        });

        // Step 4: Prepare all slot data
        const allSlots = [];
        for (const schedule of schedules) {
            const teacherId = teacherMap.get(schedule.teacherName);
            if (!teacherId) continue;

            for (const slot of schedule.slots) {
                allSlots.push({
                    teacherId,
                    dayOfWeek: slot.dayOfWeek,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    subject: slot.subject,
                    classRoom: slot.classRoom,
                });
            }
        }

        // Step 5: Bulk insert all slots
        console.log(`Inserting ${allSlots.length} schedule slots...`);
        await prisma.scheduleSlot.createMany({
            data: allSlots,
        });

        const results = schedules.map(s => ({
            teacher: s.teacherName,
            slots: s.slots.length
        }));

        console.log(`Successfully processed ${schedules.length} teachers with ${allSlots.length} total slots`);
        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process schedule' },
            { status: 500 }
        );
    }
}
