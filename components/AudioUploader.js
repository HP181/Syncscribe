"use client"
import React, { useState } from 'react';
import { Upload, Loader, AlertCircle } from 'lucide-react';

const AudioUploader = ({ onUploadComplete, API_BASE_URL }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

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
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (file) => {
    // Reset any previous errors
    setUploadError('');
    
    // Check if a file was selected
    if (!file) return;
    
    // Check file type
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid audio file (WAV, MP3, M4A, or OGG)');
      return;
    }
    
    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size exceeds 50MB limit');
      return;
    }
    
    // Set the file if validation passes
    setFile(file);
  };

  const uploadFile = async () => {
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError('');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Create custom fetch with upload progress
      const xhr = new XMLHttpRequest();
      
      // Set up progress monitoring
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // Set up promise to handle the XHR request
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open('POST', `${API_BASE_URL}/audio/upload`);
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };
        
        xhr.send(formData);
      });
      
      // Await the upload result
      const result = await uploadPromise;
      
      // Success! Pass the results to the parent component
      onUploadComplete(result);
      
      // Reset file after successful upload
      setFile(null);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="audio-uploader">
      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-400/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && document.getElementById('audio-file-upload').click()}
      >
        <input
          type="file"
          accept=".wav,.mp3,.ogg,.m4a"
          onChange={handleFileChange}
          className="hidden"
          id="audio-file-upload"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <p className="text-lg mb-2">Uploading audio file...</p>
            <div className="w-full max-w-xs bg-gray-700 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-500 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400">{uploadProgress}% Complete</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">
              {file ? file.name : 'Drop your audio file here or click to upload'}
            </p>
            <p className="text-sm text-gray-400">
              Supports WAV, MP3, M4A and OGG audio files
            </p>
          </>
        )}
      </div>
      
      {/* Error Message */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-500/20 text-red-300 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{uploadError}</p>
        </div>
      )}
      
      {/* Upload Button */}
      {file && !isUploading && (
        <button
          onClick={uploadFile}
          className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          Process Audio
        </button>
      )}
    </div>
  );
};

export default AudioUploader;