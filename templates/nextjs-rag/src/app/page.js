"use client";
import React, { useState, useRef, useEffect } from "react";

/**
 * Main Chat Interface Component.
 * Features:
 * - Real-time chat with RAG backend
 * - Document upload and ingestion
 * - Modern, responsive UI with Tailwind CSS
 */
export default function Home() {
    const [messages, setMessages] = useState([
        {
            role: "bot",
            content: "Hello! I'm your AI assistant. How can I help you with your documents today?",
        },
    ]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    /**
     * Auto-scroll to the bottom of the chat when new messages arrive.
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * Handle sending a query to the chat API.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const currentQuery = query;
        setQuery("");
        setLoading(true);

        // Optimistically add user message
        setMessages((prev) => [
            ...prev,
            { role: "user", content: currentQuery },
        ]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: currentQuery }),
            });

            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: data.response },
            ]);
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: "Sorry, I encountered an error processing your request." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle file selection and upload to the ingestion API.
     */
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/ingest", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                // Success feedback
                setIsUploadModalOpen(false);
                setMessages((prev) => [
                    ...prev,
                    { role: "bot", content: `✅ I have processed the document: **${file.name}**. You can now ask questions about it.` },
                ]);
            } else {
                alert("Error uploading file: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Upload Error:", err);
            alert("Failed to upload file. Please try again.");
        } finally {
            setUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 h-16 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent hidden sm:block">
                        RAG Assistant
                    </h1>
                </div>

                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:text-white transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    aria-label="Upload Document"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Doc
                </button>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 overflow-y-auto pt-24 pb-32 px-4 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto space-y-8">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-4 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""
                                }`}
                        >
                            {/* Avatar */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user"
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                    }`}
                            >
                                {msg.role === "user" ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div
                                className={`group relative max-w-[85%] px-5 py-3 rounded-2xl shadow-sm leading-relaxed text-sm sm:text-base ${msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                                    }`}
                            >
                                <div className="bg-transparent whitespace-pre-wrap break-words">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex items-start gap-4 animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center flex-shrink-0 border border-zinc-700">
                                <svg
                                    className="w-5 h-5 animate-spin"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl rounded-tl-none text-zinc-400 text-sm">
                                Reasoning...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-zinc-950 pt-20 pb-8 z-40 pointer-events-none">
                <div className="max-w-3xl mx-auto px-4 pointer-events-auto">
                    <form
                        onSubmit={handleSubmit}
                        className="relative flex items-center gap-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-2 rounded-2xl shadow-2xl shadow-black/50 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50"
                        autoComplete="off"
                    >
                        <input
                            type="text"
                            name="message"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask anything about your documents..."
                            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 px-4 py-3 outline-none min-w-0"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="p-3 mr-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-900/20 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                            aria-label="Send message"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 12h14M12 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </form>
                    <div className="mt-3 text-center">
                        <p className="text-xs text-zinc-600">
                            AI can make mistakes. Please verify important information.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Modal Overlay */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Upload Document</h2>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                                aria-label="Close modal"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Drag & Drop Zone */}
                            <div
                                className="border-2 border-dashed border-zinc-800 rounded-xl p-8 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all text-center cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".txt,.pdf"
                                    disabled={uploading}
                                />
                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <p className="text-sm text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors">Click to upload or drag and drop</p>
                                <p className="text-xs text-zinc-600 mt-1">Supported formats: PDF, TXT (Max 5MB)</p>
                            </div>

                            {uploading && (
                                <div className="flex items-center justify-center gap-3 text-sm text-zinc-400 animate-pulse">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                    Processing document... This may take a moment.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
