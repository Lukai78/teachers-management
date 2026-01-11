import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name: teacherName } = await params;

        if (!teacherName) {
            return NextResponse.json(
                { error: 'Teacher name is required' },
                { status: 400 }
            );
        }

        // Decode the URL-encoded name
        const decodedName = decodeURIComponent(teacherName);

        // Find teacher
        const teacher = await prisma.teacher.findFirst({
            where: { name: decodedName },
            include: {
                scheduleSlots: {
                    orderBy: [
                        { dayOfWeek: 'asc' },
                        { startTime: 'asc' }
                    ]
                }
            }
        });

        if (!teacher) {
            return NextResponse.json(
                { error: 'Teacher not found' },
                { status: 404 }
            );
        }

        // Organize schedule by day
        const scheduleByDay: { [day: string]: any[] } = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: []
        };

        teacher.scheduleSlots.forEach(slot => {
            if (scheduleByDay[slot.dayOfWeek]) {
                scheduleByDay[slot.dayOfWeek].push({
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    subject: slot.subject,
                    classRoom: slot.classRoom
                });
            }
        });

        return NextResponse.json({
            teacher: {
                name: teacher.name,
                email: teacher.email
            },
            totalSlots: teacher.scheduleSlots.length,
            scheduleByDay
        });

    } catch (error) {
        console.error('Get teacher schedule error:', error);
        return NextResponse.json(
            { error: 'Failed to get teacher schedule' },
            { status: 500 }
        );
    }
}
