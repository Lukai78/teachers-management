'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Loader2, Calendar, Clock, BookOpen, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

export default function AbsencePage() {
    const [teachers, setTeachers] = useState<string[]>([]);
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [absenceId, setAbsenceId] = useState<string | null>(null);
    const [coverResults, setCoverResults] = useState<any>(null);
    const [error, setError] = useState('');

    // Fetch teachers on mount
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

    function handleTeacherToggle(teacher: string) {
        setSelectedTeachers(prev =>
            prev.includes(teacher)
                ? prev.filter(t => t !== teacher)
                : [...prev, teacher]
        );
    }

    function removeTeacher(teacher: string) {
        setSelectedTeachers(prev => prev.filter(t => t !== teacher));
    }

    async function handleFindCovers() {
        if (selectedTeachers.length === 0 || !date) {
            setError('Please select at least one teacher and a date');
            return;
        }

        setLoading(true);
        setError('');
        setCoverResults(null);

        try {
            // Create absence
            const createRes = await fetch('/api/absence/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherNames: selectedTeachers,
                    date,
                    reason: reason || undefined
                })
            });

            const createData = await createRes.json();

            if (!createRes.ok || !createData.absences?.[0]) {
                throw new Error(createData.error || 'Failed to create absence');
            }

            const newAbsenceId = createData.absences[0].id;
            setAbsenceId(newAbsenceId);

            // Get available teachers
            const availableRes = await fetch(`/api/absence/${newAbsenceId}/available-teachers`);
            const availableData = await availableRes.json();

            if (!availableRes.ok) {
                throw new Error(availableData.error || 'Failed to find covers');
            }

            setCoverResults(availableData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Cover Teacher Finder</h1>
                    <p className="text-gray-600">Find available teachers to cover for absences</p>
                </div>

                {/* Input Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Search size={20} />
                        Find Cover Teachers
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Absent Teachers (select multiple)
                            </label>

                            {/* Selected teachers chips */}
                            {selectedTeachers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                                    {selectedTeachers.map(teacher => (
                                        <div
                                            key={teacher}
                                            className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                                        >
                                            {teacher}
                                            <button
                                                onClick={() => removeTeacher(teacher)}
                                                className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                                                title="Remove teacher"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleTeacherToggle(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Select a teacher to add...</option>
                                {teachers
                                    .filter(t => !selectedTeachers.includes(t))
                                    .map(teacher => (
                                        <option key={teacher} value={teacher}>{teacher}</option>
                                    ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Sick leave"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleFindCovers}
                            disabled={loading || selectedTeachers.length === 0 || !date}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Finding Available Teachers...
                                </>
                            ) : (
                                <>
                                    <Users size={20} />
                                    Find Available Teachers ({selectedTeachers.length} absent)
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <X size={20} />
                        {error}
                    </div>
                )}

                {/* Results */}
                {coverResults && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-6 pb-4 border-b">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Available Cover Teachers
                            </h2>
                            <p className="text-gray-600">
                                Absent Teacher: <span className="font-semibold">{coverResults.absentTeacher}</span>
                                <span className="mx-2">•</span>
                                Date: <span className="font-semibold">{new Date(coverResults.date).toLocaleDateString()}</span>
                                <span className="mx-2">•</span>
                                Day: <span className="font-semibold">{coverResults.dayOfWeek}</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            {coverResults.slots.map((slot: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                {slot.time}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {slot.subject} {slot.classRoom && `• ${slot.classRoom}`}
                                            </p>
                                        </div>
                                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {slot.availableTeachers.length} available
                                        </span>
                                    </div>

                                    {slot.availableTeachers.length === 0 ? (
                                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm flex items-center gap-2">
                                            <X size={16} />
                                            No teachers available for this slot
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {slot.availableTeachers.map((teacher: any) => (
                                                <div
                                                    key={teacher.id}
                                                    className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                                                >
                                                    <CheckCircle size={14} />
                                                    {teacher.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation */}
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
