import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's absences
        const todayAbsences = await prisma.absence.count({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        // Get total teachers
        const totalTeachers = await prisma.teacher.count();

        // Get total schedule slots
        const totalSlots = await prisma.scheduleSlot.count();

        // Get recent absences (last 7 days)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentAbsences = await prisma.absence.findMany({
            where: {
                date: {
                    gte: sevenDaysAgo
                }
            },
            include: {
                teacher: true
            },
            orderBy: {
                date: 'desc'
            },
            take: 10
        });

        // Get upcoming absences
        const upcomingAbsences = await prisma.absence.findMany({
            where: {
                date: {
                    gte: today
                }
            },
            include: {
                teacher: true
            },
            orderBy: {
                date: 'asc'
            },
            take: 10
        });

        return NextResponse.json({
            stats: {
                todayAbsences,
                totalTeachers,
                totalSlots,
                averageSlotsPerTeacher: Math.round(totalSlots / totalTeachers)
            },
            recentAbsences: recentAbsences.map(a => ({
                id: a.id,
                teacherName: a.teacher.name,
                date: a.date,
                reason: a.reason
            })),
            upcomingAbsences: upcomingAbsences.map(a => ({
                id: a.id,
                teacherName: a.teacher.name,
                date: a.date,
                reason: a.reason
            }))
        });

    } catch (error) {
        console.error('Dashboard data error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
