"use client"
import React from 'react';
import { X } from 'lucide-react';

const ZoomIframeEmbed = ({ meetingNumber, password, onClose }) => {
  // Ensure meetingNumber is a string and then format it
  const formattedMeetingId = String(meetingNumber || '').replace(/\s+/g, '').replace(/-/g, '');
  
  // Create iframe URL
  const iframeUrl = `https://zoom.us/wc/${formattedMeetingId}/join?pwd=${encodeURIComponent(password || '')}`;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] rounded-lg overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <iframe 
          src={iframeUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          width="100%"
          height="100%"
          style={{ border: 'none', borderRadius: '8px' }}
          title="Zoom Meeting"
        />
      </div>
    </div>
  );
};

export default ZoomIframeEmbed;