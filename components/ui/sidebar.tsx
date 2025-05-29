"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Apply dark mode to <html>
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Persist and apply dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white dark:bg-zinc-800 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <FaBars className="text-zinc-800 dark:text-white" />
        </button>
      )}

      {/* Sidebar Overlay */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 shadow-xl z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <FaTimes size={20} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center gap-2 text-sm my-6 text-zinc-700 dark:text-zinc-300"
        >
          {isDark ? <FaSun /> : <FaMoon />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        {/* Navigation Link */}
        <Link
          href="/upload"
          className="block text-blue-600 dark:text-blue-400 text-sm hover:underline"
          onClick={() => setIsOpen(false)}
        >
          Upload Documents
        </Link>
      </div>

      {/* Optional overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
