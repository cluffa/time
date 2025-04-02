"use client";

import { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";

export default function TimerApp() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  useEffect(() => {
    // Load session data from cookies
    const savedTime = Cookies.get("elapsedTime");
    const savedIsRunning = Cookies.get("isRunning") === "true";
    const savedStartTime = Cookies.get("startTime");

    if (savedTime) {
      setTime(Number(savedTime));
    }

    if (savedIsRunning && savedStartTime) {
      const elapsed = Math.floor((Date.now() - new Date(savedStartTime).getTime()) / 1000);
      setTime((prevTime) => prevTime + elapsed);
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      Cookies.set("isRunning", "false");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      setIsRunning(true);
      const startTime = new Date().toISOString();
      Cookies.set("startTime", startTime);
      Cookies.set("isRunning", "true");
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    Cookies.remove("elapsedTime");
    Cookies.remove("isRunning");
    Cookies.remove("startTime");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  useEffect(() => {
    // Save elapsed time to cookies
    Cookies.set("elapsedTime", time.toString());
  }, [time]);

  const allCookies = Cookies.get();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <button
        onClick={toggleMenu}
        className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Menu
      </button>
      {showMenu && (
        <div className="absolute top-16 left-4 bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded shadow-lg">
          <h2 className="text-lg font-bold mb-2">Saved Data</h2>
          <pre className="text-sm">{JSON.stringify(allCookies, null, 2)}</pre>
          <button
            onClick={resetTimer}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Reset
          </button>
        </div>
      )}
      <h1 className="text-4xl font-bold mb-8">Simple Timer</h1>
      <div className="text-6xl font-mono mb-8">{formatTime(time)}</div>
      <div className="flex gap-4">
        <button
          onClick={toggleTimer}
          className={`px-4 py-2 rounded text-white ${
            isRunning
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isRunning ? "Stop" : "Start"}
        </button>
      </div>
    </div>
  );
}
