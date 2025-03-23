"use client"
import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader } from 'lucide-react';

const ZoomMeetingEmbed = ({ 
  meetingNumber, 
  passWord, 
  userName = "SyncScribe User", 
  userEmail = "", 
  onMeetingStatusChange, 
  leaveUrl = window.location.origin
}) => {
  const [isZoomLoaded, setIsZoomLoaded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [meetingStatus, setMeetingStatus] = useState('idle'); // idle, joining, joined, ended, error

  // Create refs for container and signature
  const zoomContainer = useRef(null);
  const zoomSignature = useRef(null);

  // Zoom SDK configuration
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY;
  const sdkSecret = process.env.NEXT_PUBLIC_ZOOM_SDK_SECRET;
  // Note: For production, generating a signature should be done server-side
  // This is just for demo purposes

  // Function to initialize Zoom SDK after script loads
  const initializeZoomSDK = () => {
    if (!window.ZoomMtg) {
      console.error("Zoom Meeting SDK not loaded yet");
      return;
    }

    // Initialize the Zoom Meeting SDK
    window.ZoomMtg.setZoomJSLib('https://source.zoom.us/2.13.0/lib', '/av');
    window.ZoomMtg.preLoadWasm();
    window.ZoomMtg.prepareWebSDK();

    // Set the language
    window.ZoomMtg.i18n.load('en-US');
    window.ZoomMtg.i18n.reload('en-US');

    setIsZoomLoaded(true);
  };

  // Function to join the meeting
  const joinMeeting = async () => {
    if (!meetingNumber || !passWord) {
      setError("Meeting ID and password are required");
      setMeetingStatus('error');
      return;
    }

    try {
      setIsJoining(true);
      setMeetingStatus('joining');

      // Get a signature from your server
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zoom/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingNumber,
          role: 0, // attendee
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get meeting signature');
      }
      
      const data = await res.json();
      const signature = data.signature;
      zoomSignature.current = signature;

      // Join the meeting
      window.ZoomMtg.join({
        signature: signature,
        meetingNumber: meetingNumber,
        userName: userName,
        sdkKey: sdkKey,
        userEmail: userEmail,
        passWord: passWord,
        success: (success) => {
          console.log('Meeting joined successfully:', success);
          setMeetingStatus('joined');
          if (onMeetingStatusChange) onMeetingStatusChange('joined');
          setIsJoining(false);
        },
        error: (error) => {
          console.error('Failed to join meeting:', error);
          setError(`Failed to join meeting: ${error.errorMessage || 'Unknown error'}`);
          setMeetingStatus('error');
          if (onMeetingStatusChange) onMeetingStatusChange('error', error);
          setIsJoining(false);
        }
      });
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError(err.message || 'Failed to join meeting');
      setMeetingStatus('error');
      if (onMeetingStatusChange) onMeetingStatusChange('error', err);
      setIsJoining(false);
    }
  };

  // Function to leave the meeting
  const leaveMeeting = () => {
    window.ZoomMtg.leaveMeeting({
      success: () => {
        console.log('Left meeting successfully');
        setMeetingStatus('ended');
        if (onMeetingStatusChange) onMeetingStatusChange('ended');
      },
      error: (error) => {
        console.error('Failed to leave meeting:', error);
      }
    });
  };

  // Set up event listeners for the meeting
  useEffect(() => {
    const setupEventListeners = () => {
      if (window.ZoomMtg) {
        // Meeting status changed
        window.ZoomMtg.inMeetingServiceListener('onMeetingStatus', function (data) {
          console.log('Meeting status changed:', data);
          if (data.meetingStatus === 3) { // Meeting ended
            setMeetingStatus('ended');
            if (onMeetingStatusChange) onMeetingStatusChange('ended');
          }
        });

        // User joined meeting
        window.ZoomMtg.inMeetingServiceListener('onUserJoin', function (data) {
          console.log('User joined:', data);
        });

        // User left meeting
        window.ZoomMtg.inMeetingServiceListener('onUserLeave', function (data) {
          console.log('User left:', data);
        });

        // Meeting has started
        window.ZoomMtg.inMeetingServiceListener('onMeetingIsStarting', function () {
          console.log('Meeting is starting');
        });
      }
    };

    if (isZoomLoaded) {
      setupEventListeners();
      joinMeeting();
    }

    // Cleanup when the component unmounts
    return () => {
      if (window.ZoomMtg && meetingStatus === 'joined') {
        window.ZoomMtg.leaveMeeting({});
      }
    };
  }, [isZoomLoaded]);

  return (
    <div className="zoom-meeting-container">
      {/* Load Zoom Meeting SDK JS */}
      <Script
        src="https://source.zoom.us/2.13.0/lib/vendor/react.min.js"
        strategy="beforeInteractive"
        onLoad={() => console.log('React loaded for Zoom')}
      />
      <Script
        src="https://source.zoom.us/2.13.0/lib/vendor/react-dom.min.js"
        strategy="beforeInteractive"
        onLoad={() => console.log('ReactDOM loaded for Zoom')}
      />
      <Script
        src="https://source.zoom.us/2.13.0/lib/vendor/redux.min.js"
        strategy="beforeInteractive"
        onLoad={() => console.log('Redux loaded for Zoom')}
      />
      <Script
        src="https://source.zoom.us/2.13.0/lib/vendor/redux-thunk.min.js"
        strategy="beforeInteractive"
        onLoad={() => console.log('Redux-Thunk loaded for Zoom')}
      />
      <Script
        src="https://source.zoom.us/zoom-meeting-2.13.0.min.js"
        strategy="afterInteractive"
        onLoad={initializeZoomSDK}
      />

      {/* Zoom UI Container */}
      <div ref={zoomContainer} id="zmmtg-root" className="w-full h-full"></div>

      {/* Loading and Error States */}
      {!isZoomLoaded && (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-800 rounded-lg">
          <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-white">Loading Zoom Meeting SDK...</p>
        </div>
      )}

      {isZoomLoaded && isJoining && (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-800 rounded-lg">
          <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-white">Joining meeting...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 rounded-lg text-red-300 text-center">
          <p>Error: {error}</p>
          <button 
            onClick={() => joinMeeting()} 
            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Meeting Controls */}
      {meetingStatus === 'joined' && (
        <div className="absolute bottom-4 right-4 z-50">
          <button 
            onClick={leaveMeeting} 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg"
          >
            Leave Meeting
          </button>
        </div>
      )}
    </div>
  );
};

export default ZoomMeetingEmbed;