"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Brain,
  Sparkles,
  ChevronRight,
  Upload,
  Video,
  Download,
  X,
  Mail,
  FileText,
  Github,
  Twitter,
  ExternalLink,
  Loader,
  AlertCircle 
} from "lucide-react";
import ZoomMeetingEmbed from "@/components/ZoomMeetingEmbed";
import ZoomIframeEmbed from "@/components/ZoomIframeEmbed";
import InsightsComponent from "@/components/InsightsComponent";
import formatInsights from "@/utils/formatInsights";
import generatePDF from "@/utils/generatePDF";
import AudioUploader from "@/components/AudioUploader";
import Header from "@/components/Header";

// API base URL - change this based on your deployment
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [zoomId, setZoomId] = useState("");
  const [zoomPasscode, setZoomPasscode] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState({
    transcript: "",
    summary: "",
    insights: [],
  });
  const [sessionId, setSessionId] = useState("");
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [createMeetingForm, setCreateMeetingForm] = useState({
    topic: "",
    duration: 60,
  });
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  

  const [showZoomEmbed, setShowZoomEmbed] = useState(false);
  const [meetingEmbedInfo, setMeetingEmbedInfo] = useState({
    meetingNumber: "",
    password: "",
    userName: "SyncScribe User",
  });

  // Create a session when component mounts
  useEffect(() => {
    createSession();
  }, []);


  // Add this function to your component
const generateServerPDF = async (results, meetingInfo) => {
  try {
    setLoading(true);
    
    generatePDF(results, meetingInfo);
  
    
  } catch (error) {
    console.error('Error generating PDF on server:', error);
    alert('Failed to generate PDF on server, trying client-side generation...');
    
  } finally {
    setLoading(false);
  }
};

  const handleMeetingStatusChange = (status, error = null) => {
    console.log("Meeting status changed:", status);

    if (status === "joined") {
      // Start recording automatically when meeting is joined
      startRecording();
    } else if (status === "ended") {
      // Stop recording when meeting ends
      if (isRecording) {
        stopRecording();
      }
      setShowZoomEmbed(false);
    } else if (status === "error") {
      setError(
        `Failed to join Zoom meeting: ${error?.message || "Unknown error"}`
      );
      setShowZoomEmbed(false);
    }
  };

  {
    /* Add this function to embed the meeting */
  }
  const embedZoomMeeting = () => {
    if (!zoomId) {
      setError('Meeting ID is required');
      return;
    }
    
    // Start your recording backend process first
    joinMeetingAndRecord();
    
    // Then show the iframe
    setShowZoomEmbed(true);
  };

  const joinMeetingAndRecord = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Make the API call to join the meeting on the backend
      const response = await fetch(`${API_BASE_URL}/zoom/meetings/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          meeting_id: zoomId,
          passcode: zoomPasscode,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to join meeting on backend');
      }
  
      const data = await response.json();
  
      if (data.success) {
        // Start recording
        startRecording();
      } else {
        setError(data.error || 'Failed to join meeting');
      }
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to create a session
  const createSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/zoom/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      if (data.session_id) {
        setSessionId(data.session_id);
        console.log("Session created:", data.session_id);
      }
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Failed to connect to the API server");
    } finally {
      setLoading(false);
    }
  };

  // Function to create a meeting
  const createMeeting = async (e) => {
    e.preventDefault();

    if (!createMeetingForm.topic) {
      setError("Meeting topic is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/zoom/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          topic: createMeetingForm.topic,
          duration: parseInt(createMeetingForm.duration),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await response.json();

      if (data.success) {
        setMeetingInfo(data.meeting_info);
        setZoomId(data.meeting_info.id);
        setZoomPasscode(data.meeting_info.password);
        setShowCreateMeeting(false);
        setError("");
      } else {
        setError(data.error || "Failed to create meeting");
      }
    } catch (err) {
      console.error("Error creating meeting:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeZoomEmbed = () => {
    if (isRecording) {
      stopRecording();
    }
    setShowZoomEmbed(false);
  };
  // Function to join a meeting
  const joinMeeting = async (e) => {
    e.preventDefault();

    if (!zoomId) {
      setError("Meeting ID is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // We'll still make the API call to join the meeting on the backend
      const response = await fetch(`${API_BASE_URL}/zoom/meetings/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          meeting_id: zoomId,
          passcode: zoomPasscode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to join meeting on backend");
      }

      const data = await response.json();

      if (data.success) {
        // Embed the Zoom meeting in the UI
        embedZoomMeeting();
      } else {
        setError(data.error || "Failed to join meeting");
      }
    } catch (err) {
      console.error("Error joining meeting:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/zoom/meetings/start-recording`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          meeting_id: zoomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start recording");
      }

      const data = await response.json();

      if (data.success) {
        setIsRecording(true);
      } else {
        setError(data.error || "Failed to start recording");
      }
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to stop recording
  const stopRecording = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/zoom/meetings/stop-recording`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          meeting_id: zoomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to stop recording");
      }

      console.log("r", response);

      const data = await response.json();

      if (data.success) {
        setIsRecording(false);
        // Get reports after stopping recording
        getReports();
      } else {
        setError(data.error || "Failed to stop recording");
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to end meeting
  const endMeeting = async () => {
    try {
      setLoading(true);
      setError("");

      // Stop recording first if it's running
      if (isRecording) {
        await stopRecording();
      }

      const response = await fetch(`${API_BASE_URL}/zoom/meetings/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          meeting_id: zoomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to end meeting");
      }

      const data = await response.json();

      if (data.success) {
        // Show results after ending meeting
        getReports();
      } else {
        setError(data.error || "Failed to end meeting");
      }
    } catch (err) {
      console.error("Error ending meeting:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to get reports
  const getReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/reports/${zoomId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // No reports available yet
          setError(
            "No reports available yet. Please wait a moment and try again."
          );
          return;
        }
        throw new Error("Failed to get reports");
      }

      const data = await response.json();

      if (data.success && data.reports.length > 0) {
        // Find the report files
        const reportFile = data.reports.find((r) =>
          r.filename.includes("meeting_report")
        );
        const transcriptFile = data.reports.find((r) =>
          r.filename.includes("raw_transcript")
        );
        const summaryFile = data.reports.find((r) =>
          r.filename.includes("live_summaries")
        );

        // Get content of each file
        let processedResults = {
          transcript: "",
          summary: "",
          insights: [],
        };

        if (reportFile) {
          const reportResponse = await fetch(`${API_BASE_URL}/reports/content/${reportFile.filename}`);
          if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            if (reportData.success) {
              const content = reportData.content;

              // Extract summary section
              const summaryMatch = content.match(
                /## SUMMARY\n\n([\s\S]*?)(?=\n\n##|$)/
              );
              if (summaryMatch && summaryMatch[1]) {
                processedResults.summary = summaryMatch[1].trim();
              }

              // Extract insights section
              const insightsMatch = content.match(
                /## INSIGHTS AND ACTION ITEMS\n\n([\s\S]*?)(?=\n\n##|$)/
              );
              if (insightsMatch && insightsMatch[1]) {
                processedResults.insights = insightsMatch[1]
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line) => line.trim());
              }
            }
          }
        }

        if (transcriptFile) {
          const transcriptResponse = await fetch(`${API_BASE_URL}/reports/content/${transcriptFile.filename}`);
          if (transcriptResponse.ok) {
            const transcriptData = await transcriptResponse.json();
            if (transcriptData.success) {
              processedResults.transcript = transcriptData.content;
            }
          }
        }

        setResults(processedResults);
        setShowResults(true);
      } else {
        setError("No reports found");
      }
    } catch (err) {
      console.error("Error getting reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "audio/wav") {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "audio/wav") {
      setFile(selectedFile);
    }
  };

  const handleProcessAudio = async (e) => {
    e.preventDefault();
    // For demo purposes, we'll just show mock results for file uploads
    // In a real implementation, you'd upload the file to your API
    setLoading(true);

    setTimeout(() => {
      setResults({
        transcript: "This is a sample transcript of the uploaded audio file...",
        summary:
          "The audio contains discussions about project timelines and feature implementations...",
        insights: [
          "Action Item: Review project requirements by next week",
          "Decision: New UI design approved for implementation",
          "Follow-up: Schedule technical review with engineering team",
        ],
      });
      setShowResults(true);
      setLoading(false);
    }, 2000);
  };

  const handleDownload = () => {
    // Implementation for downloading report
    const report = `
      SyncScribe AI Report
      
      Transcript:
      ${results.transcript}
      
      Summary:
      ${results.summary}
      
      Insights:
      ${results.insights.join("\n")}
    `;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "syncscribe-report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      {/* <Header /> */}

      <div className="container mx-auto px-4 py-32">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text sm:text-6xl">
            SyncScribe AI
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your meetings into actionable insights with AI-powered
            transcription, summaries, and intelligent analysis.
          </p>
        </motion.div>

        {/* API Status */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-500/20 p-4 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

{showZoomEmbed && (
  <ZoomIframeEmbed
    meetingNumber={zoomId}
    password={zoomPasscode}
    onClose={closeZoomEmbed}
  />
)}



        {/* Tabs */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                activeTab === "upload"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 " />
                Upload Audio
              </div>
            </button>
            <button
              onClick={() => setActiveTab("zoom")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                activeTab === "zoom"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <Video className="w-4 h-4 " />
                Zoom Meeting
              </div>
            </button>
          </div>

          {/* File Upload Section */}
          {activeTab === 'upload' && !showResults && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.2 }}
    className="cursor-pointer"
  >
    <AudioUploader 
      onUploadComplete={(data) => {
        // Set the results from the audio processing
        setResults({
          transcript: data.transcript,
          summary: data.summary,
          insights: data.insights
        });
        
        // Show the results section
        setShowResults(true);
      }}
      API_BASE_URL={API_BASE_URL}
    />
  </motion.div>
)}

          {/* Zoom Meeting Section */}
          {activeTab === "zoom" && !showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 rounded-xl p-10"
            >
              {/* Toggle between Join and Create */}
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => setShowCreateMeeting(false)}
                  className={`px-4 py-2 ${
                    !showCreateMeeting ? "bg-blue-500" : "bg-gray-700"
                  } rounded-l-lg transition-colors`}
                >
                  Join Meeting
                </button>
                <button
                  onClick={() => setShowCreateMeeting(true)}
                  className={`px-4 py-2 ${
                    showCreateMeeting ? "bg-blue-500" : "bg-gray-700"
                  } rounded-r-lg transition-colors`}
                >
                  Create Meeting
                </button>
              </div>

              {showCreateMeeting ? (
                // Create Meeting Form
                <form onSubmit={createMeeting} className="space-y-6">
                  <div>
                    <label
                      htmlFor="meeting-topic"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Meeting Topic
                    </label>
                    <input
                      type="text"
                      id="meeting-topic"
                      value={createMeetingForm.topic}
                      onChange={(e) =>
                        setCreateMeetingForm({
                          ...createMeetingForm,
                          topic: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter meeting topic"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="meeting-duration"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="meeting-duration"
                      value={createMeetingForm.duration}
                      onChange={(e) =>
                        setCreateMeetingForm({
                          ...createMeetingForm,
                          duration: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter duration in minutes"
                      min="1"
                      max="240"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !sessionId}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Creating Meeting...
                      </div>
                    ) : (
                      "Create Meeting"
                    )}
                  </button>
                </form>
              ) : (
                // Join Meeting Form
                <form onSubmit={joinMeeting} className="space-y-6">
                  <div>
                    <label
                      htmlFor="meeting-id"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      id="meeting-id"
                      value={zoomId}
                      onChange={(e) => setZoomId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter Zoom Meeting ID"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="passcode"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Passcode
                    </label>
                    <input
                      type="password"
                      id="passcode"
                      value={zoomPasscode}
                      onChange={(e) => setZoomPasscode(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter meeting passcode"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !sessionId || !zoomId}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Joining Meeting...
                      </div>
                    ) : (
                      "Join Meeting"
                    )}
                  </button>
                </form>
              )}

<button
  type="button"
  onClick={embedZoomMeeting}
  disabled={loading || !zoomId}
  className="mt-2 w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  Embed Meeting in Browser
</button>

              {/* Display meeting info if created */}
              {meetingInfo && (
                <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="font-semibold text-blue-400 mb-2">
                    Meeting Created
                  </h3>
                  <p>
                    <strong>Topic:</strong> {meetingInfo.topic}
                  </p>
                  <p>
                    <strong>Meeting ID:</strong> {meetingInfo.id}
                  </p>
                  <p>
                    <strong>Passcode:</strong> {meetingInfo.password}
                  </p>
                  {meetingInfo.join_url && (
                    <p>
                      <strong>Join URL:</strong>{" "}
                      <a
                        href={meetingInfo.join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {meetingInfo.join_url}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Meeting Controls - Show when recording */}
          {isRecording && !showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-green-500/20 rounded-lg text-center"
            >
              <h3 className="text-lg font-semibold mb-4">
                Recording in Progress
              </h3>
              <p className="mb-6">
                SyncScribe is now listening to your meeting and generating a
                transcript...
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={stopRecording}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 px-6 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Stopping...
                    </div>
                  ) : (
                    "Stop Recording"
                  )}
                </button>
                <button
                  onClick={endMeeting}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Ending...
                    </div>
                  ) : (
                    "End Meeting"
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Results Section */}
          {/* Results Section */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Results</h2>
                <button
                  onClick={() => setShowResults(false)}
                  className="p-2 hover:bg-gray-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-blue-400">
                    Transcript
                  </h3>
                  <div className="max-h-60 overflow-y-auto p-4 bg-gray-700/50 rounded-lg scrollbar-hide">
                    <p className="text-gray-300 whitespace-pre-line">
                      {results.transcript}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-purple-400">
                    Summary
                  </h3>
                  <p className="text-gray-300">{results.summary}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-pink-400">
                    Insights
                  </h3>
                  {/* Replace the old insights list with our new InsightsComponent */}
                 
{console.log("Insights data:", results.insights)}
                  <InsightsComponent
                    insights={formatInsights(results.insights)}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleDownload}
                    className="w-1/2 mt-6 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-semibold transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    Download Text
                  </button>

                  <button
  onClick={() => generateServerPDF(results, meetingInfo)}
  className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
>
  <Download className="w-5 h-5" />
  Download PDF
</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm"
          >
            <div className="bg-blue-500/20 p-3 rounded-lg w-fit mb-4">
              <Mic className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Transcription</h3>
            <p className="text-gray-400">
              Accurate speech-to-text conversion with speaker diarization and
              timestamps.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm"
          >
            <div className="bg-purple-500/20 p-3 rounded-lg w-fit mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Summary</h3>
            <p className="text-gray-400">
              Get concise summaries powered by Cohere's advanced language model.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm"
          >
            <div className="bg-pink-500/20 p-3 rounded-lg w-fit mb-4">
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Insights</h3>
            <p className="text-gray-400">
              Extract key insights and action items using Gemini Pro AI.
            </p>
          </motion.div>
        </div>

        {/* Documentation Section */}
        <div id="docs" className="max-w-5xl mx-auto mt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Documentation</h2>
            <p className="text-gray-400">
              Everything you need to get started with SyncScribe AI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <a
              href="#"
              className="block p-6 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quick Start Guide
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </h3>
              <p className="text-gray-400">
                Learn how to set up and use SyncScribe AI in minutes.
              </p>
            </a>

            <a
              href="#"
              className="block p-6 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                API Reference
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </h3>
              <p className="text-gray-400">
                Detailed API documentation for developers.
              </p>
            </a>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="max-w-5xl mx-auto mt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400">
              Start for free, upgrade when you need
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 p-8 rounded-xl">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-4xl font-bold mb-6">
                $0<span className="text-lg text-gray-400">/mo</span>
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />5 hours of
                  transcription
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Basic summaries
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Community support
                </li>
              </ul>
              <button className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full transition-colors cursor-pointer">
                Get Started
              </button>
            </div>

            <div className="bg-gradient-to-b from-blue-500/20 to-purple-500/20 p-8 rounded-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-1 rounded-full text-sm font-semibold">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-6">
                $29<span className="text-lg text-gray-400">/mo</span>
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  50 hours of transcription
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Advanced AI summaries
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Custom exports
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 px-6 py-3 rounded-full transition-opacity cursor-pointer">
                Get Started
              </button>
            </div>

            <div className="bg-gray-800/50 p-8 rounded-xl">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <p className="text-4xl font-bold mb-6">Custom</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Unlimited transcription
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Custom AI models
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  24/7 dedicated support
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  SLA guarantee
                </li>
              </ul>
              <button className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full transition-colors cursor-pointer">
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 border-t border-gray-800 pt-16 pb-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                SyncScribe AI
              </h3>
              <p className="text-gray-400">
                Transform your meetings into actionable insights with AI-powered
                analysis.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Legal
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              © 2024 SyncScribe AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
