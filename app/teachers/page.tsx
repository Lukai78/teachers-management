'use client';

import { useState, useEffect } from 'react';
import { User, Calendar, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<string[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    async function fetchTeachers() {
        try {
            const res = await fetch('/api/teachers');
            if (res.ok) {
                const data = await res.json();
                setTeachers(data.teachers);
            }
        } catch (err) {
            console.error('Failed to fetch teachers:', err);
        }
    }

    async function viewSchedule(teacherName: string) {
        setSelectedTeacher(teacherName);
        setLoading(true);

        try {
            const res = await fetch(`/api/teachers/${encodeURIComponent(teacherName)}/schedule`);
            if (res.ok) {
                const data = await res.json();
                setSchedule(data);
            }
        } catch (err) {
            console.error('Failed to fetch schedule:', err);
        } finally {
            setLoading(false);
        }
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Teacher Schedules</h1>
                    <p className="text-gray-600">View any teacher's complete weekly schedule</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Teacher List */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={20} />
                            All Teachers ({teachers.length})
                        </h2>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {teachers.map(teacher => (
                                <button
                                    key={teacher}
                                    onClick={() => viewSchedule(teacher)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedTeacher === teacher
                                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                                        : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {teacher}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Schedule View */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                        {!selectedTeacher ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <Calendar size={48} className="mx-auto mb-4" />
                                    <p>Select a teacher to view their schedule</p>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : schedule ? (
                            <div>
                                <div className="mb-6 pb-4 border-b">
                                    <h2 className="text-2xl font-bold text-gray-900">{schedule.teacher.name}</h2>
                                    <p className="text-gray-600 mt-1">
                                        Total Classes: {schedule.totalSlots}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {days.map(day => (
                                        <div key={day}>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <Calendar size={18} />
                                                {day}
                                            </h3>

                                            {schedule.scheduleByDay[day].length === 0 ? (
                                                <p className="text-gray-400 ml-7">No classes</p>
                                            ) : (
                                                <div className="ml-7 space-y-2">
                                                    {schedule.scheduleByDay[day].map((slot: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                                                        <Clock size={14} />
                                                                        {slot.startTime} - {slot.endTime}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                                                        <BookOpen size={16} />
                                                                        {slot.subject}
                                                                    </div>
                                                                    {slot.classRoom && (
                                                                        <div className="text-sm text-gray-600 mt-1">
                                                                            {slot.classRoom}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        href="/dashboard"
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        ← Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
