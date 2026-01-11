import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { teacherNames, date, reason } = body;

        if (!teacherNames || !Array.isArray(teacherNames) || teacherNames.length === 0) {
            return NextResponse.json(
                { error: 'Teacher names are required and must be an array' },
                { status: 400 }
            );
        }

        if (!date) {
            return NextResponse.json(
                { error: 'Date is required' },
                { status: 400 }
            );
        }

        const absenceDate = new Date(date);
        const createdAbsences = [];

        // Create absence record for each teacher
        for (const teacherName of teacherNames) {
            // Find teacher by name (exact match or contains)
            const teacher = await prisma.teacher.findFirst({
                where: { name: teacherName }
            });

            if (!teacher) {
                console.warn(`Teacher not found: ${teacherName}`);
                continue;
            }

            // Create absence record
            const absence = await prisma.absence.create({
                data: {
                    teacherId: teacher.id,
                    date: absenceDate,
                    reason: reason || null
                },
                include: {
                    teacher: true
                }
            });

            createdAbsences.push(absence);
        }

        return NextResponse.json({
            success: true,
            count: createdAbsences.length,
            absences: createdAbsences.map(a => ({
                id: a.id,
                teacherName: a.teacher.name,
                date: a.date,
                reason: a.reason
            }))
        });

    } catch (error) {
        console.error('Create absence error:', error);
        return NextResponse.json(
            { error: 'Failed to create absence records' },
            { status: 500 }
        );
    }
}
