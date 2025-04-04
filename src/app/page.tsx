"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function TimerApp() {
  const [showMenu, setShowMenu] = useState(false);
  const [showCookiesPopup, setShowCookiesPopup] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [logs, setLogs] = useState<{ task: string; startTime: string; endTime: string | null }[]>([]);
  const [timeSpentLogs, setTimeSpentLogs] = useState<Record<string, number>>({});
  const [updateInterval, setUpdateInterval] = useState<number>(60); // Default to 60 seconds

  const clear = () => {
    if (!confirm("Are you sure you want to clear all task logs?")) return;
    setLogs([]);
    setTimeSpentLogs({});
    Cookies.set("taskLogs", JSON.stringify([]));
    Cookies.set("timeSpentLogs", JSON.stringify({}));
    console.log("Task logs cleared!");
  };

  const reset = () => {
    if (!confirm("Are you sure you want to reset and clear all cookies?")) return;
    Object.keys(Cookies.get() || {}).forEach((cookieName) => {
      Cookies.remove(cookieName); // Remove all cookies
    });
    setLogs([]);
    setTasks([]);
    setTimeSpentLogs({});
    console.log("All cookies cleared!");
  };

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const toggleCookiesPopup = () => {
    setShowCookiesPopup((prev) => !prev);
  };

  const handleAddTask = () => {
    if (taskInput.trim() === "") return alert("Task name cannot be empty.");
    const updatedTasks = [...tasks, taskInput.trim()];
    setTasks(updatedTasks);
    Cookies.set("tasks", JSON.stringify(updatedTasks));
    setTaskInput("");
  };

  const handleTaskButtonClick = (taskName: string) => {
    const now = new Date().toISOString();
    const updatedLogs = [...logs];

    // If there is a currently running task, update its end time
    if (logs.length > 0 && logs[logs.length - 1].endTime === null) {
      updatedLogs[logs.length - 1].endTime = now;
    }

    // Add a new log entry for the started task
    updatedLogs.push({ task: taskName, startTime: now, endTime: null });
    setLogs(updatedLogs);
    Cookies.set("taskLogs", JSON.stringify(updatedLogs));

    // Save logs to cookies
    validateTimeSpentLogs();

    console.log(`Started ${taskName} at ${new Date(now).toLocaleTimeString()}`);
  };

  const handleBreak = () => {
    const now = new Date().toISOString();
    const updatedLogs = [...logs];

    // If there is a currently running task, update its end time
    if (logs.length > 0 && logs[logs.length - 1].endTime === null) {
      logs[logs.length - 1].endTime = now;
      updatedLogs[logs.length - 1] = { ...logs[logs.length - 1] };
      setLogs(updatedLogs);
      Cookies.set("taskLogs", JSON.stringify(updatedLogs));
      validateTimeSpentLogs();
      console.log("Break added. End time updated for the last task.");
    } else {
      console.log("No active task to end.");
    }
  };

  const validateTimeSpentLogs = () => {
    const taskLogs = JSON.parse(Cookies.get("taskLogs") || "[]");
    const updatedTimeSpentLogs: Record<string, number> = {};

    taskLogs.forEach((log: { task: string; startTime: string; endTime: string | null }) => {
      if (log.endTime) {
        const start = new Date(log.startTime);
        const end = new Date(log.endTime);
        const timeSpent = Math.floor((end.getTime() - start.getTime()) / 1000); // Time in seconds
        updatedTimeSpentLogs[log.task] = (updatedTimeSpentLogs[log.task] || 0) + timeSpent;
      } else {
        // Handle case where task is still running
        const start = new Date(log.startTime);
        const now = new Date();
        const timeSpent = Math.floor((now.getTime() - start.getTime()) / 1000); // Time in seconds
        updatedTimeSpentLogs[log.task] = (updatedTimeSpentLogs[log.task] || 0) + timeSpent;
      }
    });

    setTimeSpentLogs(updatedTimeSpentLogs);
    Cookies.set("timeSpentLogs", JSON.stringify(updatedTimeSpentLogs));
  };

  useEffect(() => {
    // Load tasks and logs from cookies on page load
    const savedTasks = JSON.parse(Cookies.get("tasks") || "[]");
    const savedLogs = JSON.parse(Cookies.get("taskLogs") || "[]");
    const savedTimeSpentLogs = JSON.parse(Cookies.get("timeSpentLogs") || "{}");
    setTasks(savedTasks);
    setLogs(savedLogs);
    setTimeSpentLogs(savedTimeSpentLogs);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      validateTimeSpentLogs();
    }, updateInterval * 1000); // Convert seconds to milliseconds

    return () => clearInterval(interval);
  }, [updateInterval]);

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

  const getRunningTask = () => {
    const lastLog = logs[logs.length - 1];
    return lastLog && lastLog.endTime === null ? lastLog.task : "None";
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const exportToJSON = () => {
    const data = { tasks, logs, timeSpentLogs };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "time_data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ["Task", "Start Time", "End Time"];
    const rows = logs.map((log) => [
      log.task,
      log.startTime,
      log.endTime || "N/A",
    ]);
    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "time_data.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex flex-wrap gap-8 w-full max-w-4xl">
        {/* Left Card */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="mb-4 flex flex-col items-center">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Enter task name..."
              className="w-full max-w-md px-4 py-2 border rounded mb-2"
            />
            <div className="flex gap-2 w-full max-w-md">
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Task
              </button>
              <button
                onClick={handleBreak}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Take Break
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Time Spent Logs</h3>
            <table className="table-auto w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Task</th>
                  <th className="px-4 py-2 border-b">Time Spent</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(timeSpentLogs).map(([task, time]) => (
                  <tr key={task}>
                    <td className="px-4 py-2 border-b">{task}</td>
                    <td className="px-4 py-2 border-b">{formatTime(time)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-4 py-2 font-bold border-t">Total</td>
                  <td className="px-4 py-2 font-bold border-t">
                    {formatTime(Object.values(timeSpentLogs).reduce((acc, time) => acc + time, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
            <button
              onClick={validateTimeSpentLogs}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 w-full"
            >
              Update Time Logs
            </button>
          </div>
        </div>

        {/* Right Card */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="mb-4">
            <h3 className="text-lg font-bold">Current Task</h3>
            <p>{getRunningTask()}</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Tasks</h3>
            <div className="flex flex-col gap-2">
              {tasks.map((task, index) => (
                <button
                  key={index}
                  onClick={() => handleTaskButtonClick(task)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {task}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
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
          <div className="flex flex-col gap-4 mt-12">
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset
            </button>
            <button
              onClick={clear}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Clear
            </button>
            <button
              onClick={exportToJSON}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export to JSON
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export to CSV
            </button>
            <button
              onClick={toggleCookiesPopup}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Show Cookies
            </button>
            <div className="flex flex-col gap-2">
              <label htmlFor="updateInterval" className="text-sm font-bold">
                Update Interval (seconds):
              </label>
              <input
                id="updateInterval"
                type="number"
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                className="px-2 py-1 border rounded"
                min={1}
              />
            </div>
          </div>
        )}
      </div>

      {showCookiesPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white p-6 rounded-lg w-3/4 max-h-3/4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Cookies</h2>
            <code className="block whitespace-pre-wrap text-sm">
              {JSON.stringify(sortedCookies, null, 2)}
            </code>
            <button
              onClick={toggleCookiesPopup}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
