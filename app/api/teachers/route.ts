import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const teachers = await prisma.teacher.findMany({
            select: {
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            teachers: teachers.map(t => t.name)
        });
    } catch (error) {
        console.error('Get teachers error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch teachers' },
            { status: 500 }
        );
    }
}
