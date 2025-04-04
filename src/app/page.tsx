"use client";

import { useState } from "react";
import Cookies from "js-cookie";

export default function TimerApp() {
  const [showMenu, setShowMenu] = useState(false);

  const clear = () => {
    // Empty clear function
  };

  const reset = () => {
    // Empty reset function
  };

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const allCookies = Cookies.get() || {}; // Ensure allCookies is an object
  const sortedCookies = Object.keys(allCookies)
    .sort()
    .reduce((acc, key) => {
      try {
        acc[key] = JSON.parse(allCookies[key]); // Parse JSON for sub-objects
      } catch {
        acc[key] = allCookies[key]; // Keep as string if not JSON
      }
      return acc;
    }, {} as Record<string, unknown>);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <div
        className={`absolute top-4 left-4 bg-gray-700 text-white shadow transition-all ${
          showMenu ? "w-64 h-auto p-4 rounded-lg" : "w-12 h-12 rounded-md"
        }`}
      >
        <div
          className="cursor-pointer flex items-center justify-center w-12 h-12 absolute top-0 left-0"
          onClick={toggleMenu}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
        {showMenu && (
          <div
            className={`flex flex-col gap-4 transition-opacity duration-300 mt-12`}
          >
            <h2 className="text-lg font-bold">Cookies</h2>
            <pre className="text-sm">{JSON.stringify(sortedCookies, null, 2)}</pre> {/* Pretty-print and sort */}
            <div className="flex gap-4">
              <button onClick={reset} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Reset</button>
              <button onClick={clear} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
