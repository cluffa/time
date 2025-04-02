"use client";

import { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";

export default function TimerApp() {
  const [time, setTime] = useState(0); // Time in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSubTimer, setActiveSubTimer] = useState<string | null>(null);
  const [subTimers, setSubTimers] = useState<{ [key: string]: number }>({});
  const [showDialog, setShowDialog] = useState(false);
  const [newSubTimerName, setNewSubTimerName] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveStateRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (milliseconds: number) => {
    const hrs = String(Math.floor(milliseconds / 3600000)).padStart(2, "0");
    const mins = String(Math.floor((milliseconds % 3600000) / 60000)).padStart(2, "0");
    const secs = String(Math.floor((milliseconds % 60000) / 1000)).padStart(2, "0");
    const ms = String(Math.floor((milliseconds % 1000) / 100)); // Show only the first decimal point
    return `${hrs}:${mins}:${secs}.${ms}`;
  };

  useEffect(() => {
    // Load session data from cookies
    const savedTime = Cookies.get("elapsedTime");
    const savedIsRunning = Cookies.get("isRunning") === "true";
    const savedStartTime = Cookies.get("startTime");
    const savedSubTimers = Cookies.get("subTimers");
    const savedActiveSubTimer = Cookies.get("activeSubTimer"); // Load active sub-timer
    const savedLastSavedTime = Cookies.get("lastSavedTime");

    if (savedTime) {
      setTime(Number(savedTime));
    }

    if (savedSubTimers) {
      setSubTimers(JSON.parse(savedSubTimers));
    }

    if (savedActiveSubTimer) {
      setActiveSubTimer(savedActiveSubTimer); // Restore active sub-timer
    }

    if (savedLastSavedTime) {
      const lastSavedTime = new Date(savedLastSavedTime).getTime();
      const now = Date.now();
      const elapsedSinceLastSave = now - lastSavedTime;

      if (savedIsRunning) {
        setTime((prevTime) => prevTime + elapsedSinceLastSave);
        if (savedActiveSubTimer) {
          setSubTimers((prev) => ({
            ...prev,
            [savedActiveSubTimer]: (prev[savedActiveSubTimer] || 0) + elapsedSinceLastSave,
          }));
        }
      }
    }

    if (savedIsRunning && savedStartTime) {
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 10); // Increment by 10ms
        if (activeSubTimer) {
          setSubTimers((prev) => ({
            ...prev,
            [activeSubTimer]: (prev[activeSubTimer] || 0) + 10, // Increment sub-timer by 10ms
          }));
        }
      }, 10);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (saveStateRef.current) {
        clearInterval(saveStateRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Ensure the main timer continues running independently of the active sub-timer
    if (isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 10); // Increment by 10ms
        setSubTimers((prev) => {
          if (activeSubTimer) {
            return {
              ...prev,
              [activeSubTimer]: (prev[activeSubTimer] || 0) + 10, // Increment active sub-timer by 10ms
            };
          }
          return prev;
        });
      }, 10);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, activeSubTimer]);

  useEffect(() => {
    // Save the app state every 15 seconds
    saveStateRef.current = setInterval(() => {
      Cookies.set("elapsedTime", time.toString());
      Cookies.set("subTimers", JSON.stringify(subTimers)); // Save sub-timers state
      Cookies.set("activeSubTimer", activeSubTimer || ""); // Save active sub-timer
      Cookies.set("lastSavedTime", new Date().toISOString());
      Cookies.set("isRunning", isRunning.toString());
    }, 15000);

    return () => {
      if (saveStateRef.current) {
        clearInterval(saveStateRef.current);
      }
    };
  }, [time, subTimers, activeSubTimer, isRunning]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRunning) {
        event.preventDefault();
        event.returnValue = ""; // Show a confirmation dialog
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      Cookies.set("isRunning", "false");
      Cookies.set("elapsedTime", time.toString()); // Save the current time
      Cookies.set("lastSavedTime", new Date().toISOString());
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
        setTime((prevTime) => prevTime + 10); // Increment by 10ms
        if (activeSubTimer) {
          setSubTimers((prev) => ({
            ...prev,
            [activeSubTimer]: (prev[activeSubTimer] || 0) + 10, // Increment sub-timer by 10ms
          }));
        }
      }, 10);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    setSubTimers({});
    setActiveSubTimer(null);
    Cookies.remove("elapsedTime");
    Cookies.remove("isRunning");
    Cookies.remove("startTime");
    Cookies.remove("subTimers");
    Cookies.remove("activeSubTimer"); // Clear active sub-timer
    Cookies.remove("lastSavedTime"); // Clear saved state
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearSubTimers = () => {
    setTime(0); // Reset the main timer
    setSubTimers({});
    Cookies.remove("elapsedTime");
    Cookies.remove("subTimers");
    Cookies.remove("activeSubTimer"); // Clear active sub-timer
    Cookies.remove("lastSavedTime"); // Clear saved state
  };

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const switchSubTimer = (name: string) => {
    if (activeSubTimer) {
      // Save the current active sub-timer's elapsed time
      Cookies.set("subTimers", JSON.stringify(subTimers));
    }
    setActiveSubTimer(name); // Switch to the selected sub-timer
    Cookies.set("activeSubTimer", name); // Save the active sub-timer to cookies
  };

  const handleAddSubTimer = () => {
    if (newSubTimerName.trim() !== "") {
      setSubTimers((prev) => {
        const isFirstSubTimer = Object.keys(prev).length === 0;
        const updatedSubTimers = {
          ...prev,
          [newSubTimerName]: isFirstSubTimer ? time : 0, // Inherit main timer time if it's the first sub-timer
        };
        if (isFirstSubTimer) {
          setActiveSubTimer(newSubTimerName); // Automatically activate the first sub-timer
          Cookies.set("activeSubTimer", newSubTimerName); // Save the active sub-timer to cookies
        }
        Cookies.set("subTimers", JSON.stringify(updatedSubTimers)); // Save updated sub-timers to cookies
        return updatedSubTimers;
      });
      setNewSubTimerName("");
      setShowDialog(false);
    }
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
      <button
        onClick={toggleMenu}
        className="absolute top-4 left-4"
      >
        Menu
      </button>
      {showMenu && (
        <div className="absolute top-16 left-4 bg-white dark:bg-gray-800 text-black dark:text-white p-4 rounded shadow-lg">
          <h2 className="text-lg font-bold mb-2">Saved Data</h2>
          <pre className="text-sm">{JSON.stringify(sortedCookies, null, 2)}</pre> {/* Pretty-print and sort */}
          <div className="flex gap-4 mt-4">
            <button onClick={() => setShowResetDialog(true)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Reset</button>
            <button onClick={() => setShowClearDialog(true)} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Clear</button>
          </div>
        </div>
      )}

      {showResetDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirm Reset</h2>
            <p className="mb-4">Are you sure you want to reset all timers and sub-timers?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowResetDialog(false)} className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400">Cancel</button>
              <button
                onClick={() => {
                  resetTimer();
                  setShowResetDialog(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirm Clear</h2>
            <p className="mb-4">Are you sure you want to clear all timer values but keep sub-timers?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowClearDialog(false)} className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400">Cancel</button>
              <button
                onClick={() => {
                  clearSubTimers();
                  setShowClearDialog(false);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-6xl font-mono mb-8">{formatTime(time)}</div>
      <div className="flex gap-4">
        <button onClick={toggleTimer} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">{isRunning ? "Stop" : "Start"}</button>
        <button onClick={() => setShowDialog(true)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Sub-Timer</button>
      </div>
      <div className="mt-8 flex flex-col gap-4 items-start">
        {Object.entries(subTimers).map(([name, subTime]) => (
          <div
            key={name}
            className={`w-full p-4 rounded shadow ${
              activeSubTimer === name
                ? "bg-gray-200 text-black" // Selected sub-timer: lighter gray
                : "bg-gray-700 text-white" // Unselected sub-timer: darker gray
            }`}
            onClick={() => switchSubTimer(name)}
          >
            <div className="font-bold text-lg">{name}</div>
            <div className="text-2xl font-mono">{formatTime(subTime)}</div>
          </div>
        ))}
      </div>
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Name Your Sub-Timer</h2>
            <input
              type="text"
              value={newSubTimerName}
              onChange={(e) => setNewSubTimerName(e.target.value)}
              className="w-full px-4 py-2 mb-4 border rounded"
              placeholder="Enter sub-timer name"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubTimer}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
