'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function FileUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];

        if (!validTypes.includes(file.type)) {
            setStatus('error');
            setMessage('Please upload a PDF or Excel file.');
            return;
        }
        setFile(file);
        setStatus('idle');
        setMessage('');
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/schedule/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setStatus('success');
            setMessage(`Successfully processed schedule for ${data.results.length} teachers.`);
            setFile(null);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Schedule</h2>
            <p className="text-gray-500 mb-6 text-sm">Upload a PDF or Excel file containing teacher schedules to parse and save them.</p>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 transition-colors duration-200 ease-in-out cursor-pointer flex flex-col items-center justify-center gap-4",
                    isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                    status === 'error' && "border-red-300 bg-red-50",
                    status === 'success' && "border-green-300 bg-green-50"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.xlsx,.xls"
                    onChange={handleFileChange}
                />

                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="p-4 bg-indigo-100 rounded-full mb-3 text-indigo-600">
                                <Upload size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Click or drag file here</p>
                            <p className="text-xs text-gray-400 mt-1">Accepts PDF and Excel (.xlsx, .xls) files</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="file-preview"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="p-4 bg-indigo-100 rounded-full mb-3 text-indigo-600">
                                <FileText size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "mt-4 p-3 rounded-lg text-sm flex items-center gap-2",
                        status === 'error' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    )}
                >
                    {status === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                    {message}
                </motion.div>
            )}

            <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className={cn(
                    "w-full mt-6 py-2.5 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2",
                    !file || status === 'uploading'
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]"
                )}
            >
                {status === 'uploading' ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    "Upload Schedule"
                )}
            </button>
        </div>
    );
}
