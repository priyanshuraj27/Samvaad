import React, { useState, useCallback } from 'react';
import { UploadCloud, ArrowLeft, Loader, CheckCircle, XCircle, FileText, Award } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

// --- Constants for Debate Formats ---
const DEBATE_FORMATS = {
  'Asian Parliamentary': {
    government: { name: 'Government', speakers: ['Prime Minister', 'Deputy Prime Minister', 'Government Whip'] },
    opposition: { name: 'Opposition', speakers: ['Leader of Opposition', 'Deputy Leader of Opposition', 'Opposition Whip'] },
  },
  'British Parliamentary': {
    openingGovernment: { name: 'Opening Government', speakers: ['Prime Minister', 'Deputy Prime Minister'] },
    openingOpposition: { name: 'Opening Opposition', speakers: ['Leader of Opposition', 'Deputy Leader of Opposition'] },
    closingGovernment: { name: 'Closing Government', speakers: ['Member for Government', 'Government Whip'] },
    closingOpposition: { name: 'Closing Opposition', speakers: ['Member for Opposition', 'Opposition Whip'] },
  },
  'World Schools': {
    proposition: { name: 'Proposition', speakers: ['1st Speaker', '2nd Speaker', '3rd Speaker', 'Reply Speaker'] },
    opposition: { name: 'Opposition', speakers: ['1st Speaker', '2nd Speaker', '3rd Speaker', 'Reply Speaker'] },
  },
};

// --- Custom Adjudicator Component ---
const CustomAdjudicator = () => {
  // --- State Management ---
  const [formatName, setFormatName] = useState('Asian Parliamentary');
  const [motion, setMotion] = useState('');
  const [transcript, setTranscript] = useState(null);
  const [teams, setTeams] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // --- Event Handlers ---
  const handleTeamInputChange = (team, speakerIndex, value) => {
    setTeams(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [speakerIndex]: value,
      },
    }));
  };
  
  const validateFile = (file) => {
    // Validate file size
    if (file.size === 0) {
      setError("The selected file appears to be empty. Please select a valid file with content.");
      return false;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError("Please select a PDF or TXT file.");
      return false;
    }

    return true;
  };
  
  const handleFileChange = (e) => {
    e.preventDefault();
    const file = e.target.files && e.target.files[0];
    console.log('File selected:', file);
    
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      // Always set the file first, then validate
      setTranscript(file);
      setError(null);
      setResult(null);
      
      // Validate the file
      if (!validateFile(file)) {
        return; // Error is already set by validateFile
      }
      
      // For text files, read content to verify it's not empty
      if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const content = e.target.result;
          console.log('File content preview:', content.substring(0, 100) + '...');
          if (!content || content.trim().length === 0) {
            setError("The selected text file appears to be empty. Please select a file with content.");
            setTranscript(null); // Clear the file if it's empty
          }
        };
        reader.onerror = function() {
          setError("Failed to read the text file. Please try again.");
          setTranscript(null);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    console.log('File dropped:', file);
    
    if (file) {
      console.log('Dropped file details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      // Always set the file first, then validate
      setTranscript(file);
      setError(null);
      setResult(null);
      
      // Validate the file
      if (!validateFile(file)) {
        return; 
      }
      
      // For text files, read content to verify it's not empty
      if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const content = e.target.result;
          console.log('File content preview:', content.substring(0, 100) + '...');
          if (!content || content.trim().length === 0) {
            setError("The dropped text file appears to be empty. Please select a file with content.");
            setTranscript(null); // Clear the file if it's empty
          }
        };
        reader.onerror = function() {
          setError("Failed to read the text file. Please try again.");
          setTranscript(null);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transcript) {
      setError("Please select a transcript file to upload.");
      return;
    }

    // Additional validation before submission
    if (transcript.size === 0) {
      setError("The selected file is empty. Please choose a file with content.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    
    console.log('File to upload:', {
      name: transcript.name,
      size: transcript.size,
      type: transcript.type,
      lastModified: transcript.lastModified
    });
    
    // Append the file with the exact field name expected by backend
    formData.append('transcript', transcript, transcript.name);
    formData.append('formatName', formatName);
    
    if (motion.trim()) {
      formData.append('motion', motion);
    }

    // --- Transform teams state into the required JSON string format ---
    const apiTeams = {};
    const currentFormat = DEBATE_FORMATS[formatName];
    for (const teamKey in currentFormat) {
        const teamName = currentFormat[teamKey].name;
        const speakerNames = currentFormat[teamKey].speakers.map(
            (_, index) => teams[teamKey]?.[index] || ''
        );
        apiTeams[teamName.toLowerCase().replace(/ /g, '')] = speakerNames;
    }
    
    // Only append teams if there's any data
    const hasTeamData = Object.values(apiTeams).some(speakers => 
      speakers.some(speaker => speaker.trim() !== '')
    );
    if (hasTeamData) {
      formData.append('teams', JSON.stringify(apiTeams));
    }

    // Debug: Log the formData contents
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
      if (value instanceof File) {
        console.log(`  File details: name=${value.name}, size=${value.size}, type=${value.type}`);
      }
    }

    try {
      const response = await axiosInstance.post('/adjudications/upload', formData, {
        timeout: 120000, // 2 minutes timeout for file upload and AI processing
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });
      
      console.log('Response:', response.data);
      
      if (response.data && response.data.data) {
        setResult(response.data.data);
      } else {
        setResult(response.data);
      }
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string' && err.response.data.includes('<!DOCTYPE html>')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(err.response.data, 'text/html');
          const errorText = doc.querySelector('pre')?.textContent || doc.querySelector('body')?.textContent;
          if (errorText) {
            errorMessage = errorText.substring(0, 200) + '...';
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. The file might be too large or the server is taking too long to process.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFormatTeams = DEBATE_FORMATS[formatName];

  return (
    <div className="bg-gray-900 min-h-screen w-full font-sans">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-white">
        {/* --- Back Button --- */}
        <a href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors mb-6">
          <ArrowLeft size={16} />
          Back to Dashboard
        </a>

        <div className="max-w-4xl mx-auto">
          {/* --- Header --- */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Adjudication Engine</h1>
            <p className="mt-2 text-lg text-gray-400">Upload a transcript to receive an instant, AI-powered adjudication.</p>
          </div>

          {/* --- Main Form --- */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- Step 1: Upload Transcript --- */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                <span className="bg-indigo-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">1</span> 
                Upload Transcript
              </h2>
              <label 
                htmlFor="file-upload" 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500 bg-gray-800'}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className={`w-10 h-10 mb-3 ${dragActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                  {transcript ? (
                    <div className="flex items-center gap-2 text-center">
                      <FileText size={20} className="text-green-400"/>
                      <p className="font-semibold text-green-400">{transcript.name}</p>
                      <p className="text-sm text-gray-400">({Math.round(transcript.size / 1024)} KB)</p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF or TXT files (max 10MB)</p>
                    </>
                  )}
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept=".pdf,.txt" 
                />
              </label>
            </div>

            {/* --- Step 2: Debate Details --- */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <span className="bg-indigo-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">2</span> 
                Provide Details
              </h2>
              
              {/* --- Debate Format --- */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Debate Format</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(DEBATE_FORMATS).map(format => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => { setFormatName(format); setTeams({}); }}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${formatName === format ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* --- Motion --- */}
              <div className="mt-6">
                <label htmlFor="motion" className="block text-sm font-medium text-gray-300 mb-2">Motion (Optional)</label>
                <input
                  id="motion"
                  type="text"
                  value={motion}
                  onChange={(e) => setMotion(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  placeholder="Please enter the motion"
                />
              </div>

              {/* --- Teams (Dynamic) --- */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Teams & Speakers (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {Object.entries(currentFormatTeams).map(([teamKey, teamData]) => (
                    <div key={teamKey} className="space-y-3 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                      <h3 className="font-semibold text-indigo-400">{teamData.name}</h3>
                      {teamData.speakers.map((speakerRole, index) => (
                        <div key={index}>
                          <label htmlFor={`${teamKey}-${index}`} className="sr-only">{speakerRole}</label>
                          <input
                            id={`${teamKey}-${index}`}
                            type="text"
                            placeholder={speakerRole}
                            onChange={(e) => handleTeamInputChange(teamKey, index, e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* --- Submission & Feedback --- */}
            <div>
              {/* --- Error Message --- */}
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
                  <XCircle size={20} />
                  <span>{error}</span>
                </div>
              )}
              
              {/* --- Submit Button --- */}
              <button
                type="submit"
                disabled={isLoading || !transcript}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader size={24} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Generate Adjudication"
                )}
              </button>
            </div>
          </form>

          {/* --- Result Display --- */}
          {result && (
            <div className="mt-8 bg-gray-800 border border-green-500/30 rounded-2xl p-6 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-green-300">
                <CheckCircle /> Adjudication Complete
              </h2>
              <div className="bg-gray-900/70 p-6 rounded-lg space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-indigo-900/50 to-gray-900 rounded-lg border border-indigo-700">
                      <div>
                          <p className="text-sm text-indigo-300 font-semibold">Overall Winner</p>
                          <p className="text-3xl font-bold text-white flex items-center gap-2">
                              <Award className="text-yellow-400" />
                              {result.overallWinner}
                          </p>
                      </div>
                      <a 
                        href={`/adjudication/${result._id}`} 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                          View Full Feedback
                      </a>
                  </div>
                  <div className="pt-4">
                      <h4 className="font-semibold text-gray-300 mb-2">Details</h4>
                      <ul className="text-sm text-gray-400 space-y-2 border-t border-gray-700 pt-3">
                          <li className="flex justify-between">
                            <span>Format:</span> 
                            <span className="font-mono bg-gray-700 px-2 py-0.5 rounded">{result.formatName}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>File:</span> 
                            <span className="font-mono bg-gray-700 px-2 py-0.5 rounded">{result.originalFileName}</span>
                          </li>
                           <li className="flex flex-col">
                              <span className="mb-1">Motion:</span> 
                              <span className="font-mono bg-gray-700 p-2 rounded text-gray-300 text-xs sm:text-sm">{result.motion}</span>
                          </li>
                      </ul>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomAdjudicator;
