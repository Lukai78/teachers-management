// PDF parsing temporarily disabled for server-side compatibility
// import { pdfjs } from '@/lib/pdf-worker';

export interface ParsedScheduleSlot {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: string;
    classRoom: string;
}

export interface ParsedTeacherSchedule {
    teacherName: string;
    slots: ParsedScheduleSlot[];
}

export async function parseSchedulePdf(buffer: Buffer): Promise<ParsedTeacherSchedule[]> {
    // PDF parsing is temporarily disabled for server-side compatibility
    throw new Error('PDF upload is not supported. Please use Excel (.xlsx) files instead.');
}
