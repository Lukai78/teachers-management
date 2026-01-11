'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, BookOpen, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    async function fetchDashboard() {
        try {
            const res = await fetch('/api/dashboard');
            if (res.ok) {
                const dashboardData = await res.json();
                setData(dashboardData);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Overview of teacher schedules and absences</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <Users className="text-indigo-600" size={24} />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {data?.stats.totalTeachers}
                            </span>
                        </div>
                        <p className="text-gray-600 font-medium">Total Teachers</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-red-100 p-3 rounded-lg">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {data?.stats.todayAbsences}
                            </span>
                        </div>
                        <p className="text-gray-600 font-medium">Absent Today</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <BookOpen className="text-green-600" size={24} />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {data?.stats.totalSlots}
                            </span>
                        </div>
                        <p className="text-gray-600 font-medium">Total Classes</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <TrendingUp className="text-blue-600" size={24} />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {data?.stats.averageSlotsPerTeacher}
                            </span>
                        </div>
                        <p className="text-gray-600 font-medium">Avg Classes/Teacher</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Absences */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar size={20} />
                            Upcoming Absences
                        </h2>

                        {data?.upcomingAbsences.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <CheckCircle size={48} className="mx-auto mb-2" />
                                <p>No upcoming absences</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data?.upcomingAbsences.map((absence: any) => (
                                    <div
                                        key={absence.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{absence.teacherName}</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {new Date(absence.date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                {absence.reason && (
                                                    <p className="text-sm text-gray-500 mt-1">{absence.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Absences */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar size={20} />
                            Recent Absences (Last 7 Days)
                        </h2>

                        {data?.recentAbsences.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <CheckCircle size={48} className="mx-auto mb-2" />
                                <p>No recent absences</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data?.recentAbsences.map((absence: any) => (
                                    <div
                                        key={absence.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{absence.teacherName}</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {new Date(absence.date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                {absence.reason && (
                                                    <p className="text-sm text-gray-500 mt-1">{absence.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/absence"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-6 rounded-lg transition-colors text-center"
                    >
                        Find Cover Teachers
                    </Link>
                    <Link
                        href="/teachers"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors text-center"
                    >
                        View Teacher Schedules
                    </Link>
                    <Link
                        href="/"
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-6 rounded-lg transition-colors text-center"
                    >
                        Upload New Schedule
                    </Link>
                </div>
            </div>
        </div>
    );
}
