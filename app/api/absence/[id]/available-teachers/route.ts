import { NextRequest, NextResponse } from 'next/server';
import { findAvailableTeachers } from '@/lib/cover-finder';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: absenceId } = await params;

        if (!absenceId) {
            return NextResponse.json(
                { error: 'Absence ID is required' },
                { status: 400 }
            );
        }

        const result = await findAvailableTeachers(absenceId);

        if (!result) {
            return NextResponse.json(
                { error: 'Absence not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Get available teachers error:', error);
        return NextResponse.json(
            { error: 'Failed to find available teachers' },
            { status: 500 }
        );
    }
}
