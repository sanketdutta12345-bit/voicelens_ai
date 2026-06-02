/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Trash2,
  Settings2,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SPEEDS = [0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      if (synthRef.current) {
        const availableVoices = synthRef.current.getVoices();
        setVoices(availableVoices);
        // Default to first English voice if available, or just the first voice
        if (availableVoices.length > 0 && !selectedVoiceURI) {
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
          setSelectedVoiceURI(defaultVoice.voiceURI);
        }
      }
    };

    loadVoices();
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [selectedVoiceURI]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setImage(b64);
      setRawImage(b64.split(',')[1]);
      setExtractedText('');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!rawImage) return;

    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: rawImage }),
      });

      if (!response.headers.get('content-type')?.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response. It might be a 404 or maintenance page. Check console for details.`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (!data.text || data.text.trim().length === 0) {
        setExtractedText('No text found in the image.');
      } else {
        setExtractedText(data.text);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSpeak = () => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    if (extractedText) {
      const utterance = new SpeechSynthesisUtterance(extractedText);
      utterance.rate = speed;
      
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      utteranceRef.current = utterance;
      setIsSpeaking(true);
      synthRef.current.speak(utterance);
    }
  };

  const reset = () => {
    setImage(null);
    setRawImage(null);
    setExtractedText('');
    setSpeed(1);
    setError(null);
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a1d] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white pb-20 relative overflow-hidden">
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 md:h-20 border-b border-white/10 bg-white/5 backdrop-blur-md z-50 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h1 className="font-bold text-lg md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">VoiceLens AI</h1>
        </div>
        
        {image && (
          <button 
            onClick={reset}
            className="flex items-center gap-2 text-xs md:text-sm text-white/40 hover:text-red-400 transition-colors bg-white/5 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Reset</span>
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto pt-24 md:pt-32 px-4 sm:px-8 relative z-10">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 md:space-y-12"
            >
              <div 
                onDragOver={onDragOver}
                onDrop={onDrop}
                className="relative h-[280px] sm:h-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl sm:rounded-[2.5rem] flex flex-col items-center justify-center p-6 sm:p-12 transition-all group hover:bg-white/10 hover:border-indigo-500/50 shadow-2xl"
              >
                <input 
                  type="file" 
                  id="imageInput" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <label 
                  htmlFor="imageInput" 
                  className="cursor-pointer flex flex-col items-center w-full h-full justify-center text-center"
                >
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Upload className="w-6 h-6 sm:w-10 sm:h-10 text-indigo-400" />
                  </div>
                  <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 tracking-tight">Import your image</h2>
                  <p className="text-white/40 text-xs sm:text-sm max-w-sm leading-relaxed px-4">
                    Tap to upload or drop an image. Our AI will pull text to read aloud instantly.
                  </p>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:grid-cols-1 lg:gap-8">
                {[
                  { icon: FileText, title: "OCR Engine", desc: "Powered by Gemini AI for high accuracy text extraction.", color: "text-indigo-400" },
                  { icon: Volume2, title: "Neural Audio", desc: "Crystal clear text-to-speech conversion with natural tones.", color: "text-fuchsia-400" },
                  { icon: Settings2, title: "Direct Controls", desc: "Fine-tune your listening experience with precision speed adjustment.", color: "text-cyan-400" }
                ].map((feature, i) => (
                  <div key={i} className="p-6 sm:p-8 bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/10 shadow-sm group hover:bg-white/10 transition-all">
                    <div className={`${feature.color} mb-4 sm:mb-6 bg-white/5 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner`}>
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-medium">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* Left: Image Card (col-span-5) */}
                <div className="lg:col-span-5 flex flex-col gap-3 lg:gap-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                       Source Image
                    </h2>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/5 px-2 py-1 rounded">
                      Processing Ready
                    </span>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-3xl lg:rounded-[2rem] border border-white/10 shadow-2xl lg:sticky lg:top-28">
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black/40 border border-white/5 group shadow-inner">
                      <img 
                        src={image} 
                        className="w-full h-full object-contain p-2" 
                        alt="Uploaded preview" 
                      />
                      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none" />
                      
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 animate-spin" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white animate-pulse">Scanning Image...</span>
                        </div>
                      )}
                    </div>
                    
                    {!extractedText && !isProcessing && (
                      <button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="w-full mt-4 sm:mt-5 h-14 sm:h-16 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-indigo-500 border border-indigo-400/30 shadow-xl shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                        <span>Run OCR Extraction</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Output (col-span-1) */}
                <div className="lg:col-span-7 flex flex-col gap-3 lg:gap-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2 text-white/90">
                      Speech Workbench
                    </h2>
                    <div className="flex gap-2">
                      <span className="text-[10px] sm:text-xs text-white/20">Engine:</span>
                      <span className="text-[10px] sm:text-xs font-bold text-fuchsia-400">Gemini Neural-HD</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:gap-6">
                    {extractedText && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 backdrop-blur-xl p-5 sm:p-8 rounded-3xl lg:rounded-[2rem] border border-white/10 shadow-2xl min-h-[300px] sm:min-h-[400px] flex flex-col gap-6 sm:gap-8"
                      >
                        <div className="flex-grow p-4 sm:p-6 bg-black/40 rounded-xl sm:rounded-2xl border border-white/5 shadow-inner overflow-y-auto max-h-[250px] lg:max-h-full">
                          <p className="text-white/90 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 font-serif italic text-base sm:text-lg pr-2">
                            "{extractedText}"
                          </p>
                        </div>

                        <div className="space-y-5 sm:space-y-6">
                          {/* Voice Selection */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider">Voice Agent</span>
                              <span className="text-[9px] sm:text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/20">Neural Ready</span>
                            </div>
                            <div className="relative group">
                              <select 
                                value={selectedVoiceURI}
                                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 text-white/95 text-xs sm:text-sm rounded-xl px-4 h-12 sm:h-14 outline-none focus:border-indigo-500/50 appearance-none font-medium transition-all group-hover:border-white/20 cursor-pointer"
                              >
                                {voices.map((v, index) => (
                                  <option key={`${v.voiceURI}-${index}`} value={v.voiceURI} className="bg-[#1c1917] text-white">
                                    {v.name} ({v.lang})
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-white/40 transition-colors">
                                <ChevronRight className="w-4 h-4 rotate-90" />
                              </div>
                            </div>
                          </div>

                          {/* Playback Progress Mock Style */}
                          {isSpeaking && (
                            <div className="space-y-1 sm:space-y-2">
                              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: "0%" }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: extractedText.length / (5 * speed), ease: "linear" }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" 
                                />
                              </div>
                            </div>
                          )}

                          {/* Controls Bar */}
                          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">
                            
                            {/* TTS Main Button */}
                            <button
                              onClick={toggleSpeak}
                              className={`w-full md:w-auto px-8 sm:px-10 h-14 sm:h-16 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-600/20 cursor-pointer ${
                                isSpeaking 
                                  ? 'bg-fuchsia-600 text-white' 
                                  : 'bg-white text-indigo-950 shadow-xl'
                              }`}
                            >
                              {isSpeaking ? (
                                <>
                                  <Square className="w-5 h-5 fill-current" />
                                  <span className="text-base sm:text-lg">Stop Playback</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-5 h-5 fill-current" />
                                  <span className="text-base sm:text-lg">Start Reading</span>
                                </>
                              )}
                            </button>

                            {/* Speed Control */}
                            <div className="flex flex-col items-center md:items-end gap-2 flex-grow">
                              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold self-start md:self-end">Playback Velocity</p>
                              
                              {/* Touch Optimized Velocity Bar - Scrollable on very small screens, grid/flex elsewhere */}
                              <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 w-full overflow-x-auto gap-0.5 sm:gap-0 scrollbar-none snap-x justify-start md:justify-end">
                                {SPEEDS.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all min-w-[50px] sm:min-w-0 snap-center flex-shrink-0 cursor-pointer ${
                                      speed === s 
                                        ? 'bg-indigo-500 text-white shadow-lg' 
                                        : 'text-white/40 hover:text-white'
                                    }`}
                                  >
                                    {s === 1 ? '1x' : `${s}x`}
                                  </button>
                                ) )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="p-4 sm:p-5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-3 sm:gap-4 backdrop-blur-md"
                      >
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                        {error}
                      </motion.div>
                    )}

                    {!extractedText && !isProcessing && !error && (
                      <div className="bg-white/5 border border-white/5 backdrop-blur-md p-8 sm:p-10 rounded-[2rem] flex flex-col items-center text-center shadow-inner">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-white/10 shadow-lg">
                          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
                        </div>
                        <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-white/80">Ready for Scan</h3>
                        <p className="text-xs sm:text-sm text-white/30 max-w-xs leading-relaxed font-medium">
                          The workbench is ready. Start the OCR engine to see the speech script here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="relative md:fixed bottom-0 left-0 right-0 h-16 md:h-12 flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 py-3 md:py-0 bg-black/40 md:bg-black/30 backdrop-blur-xl border-t border-white/5 text-[9px] sm:text-[10px] text-white/20 uppercase tracking-[0.1em] sm:tracking-[0.2em] font-bold z-40 mt-12 md:mt-0 gap-2 md:gap-0">
        <div className="flex gap-4 sm:gap-8">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>Accuracy: 99.8%</span>
          <span>Cloud Sync: Active</span>
        </div>
        <div>&copy; 2026 VOXEL LABORATORIES</div>
      </footer>
    </div>
  );

}
