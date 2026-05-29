import { Camera, Loader2, Maximize, ScanFace } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { predictSkin, type SkinAnalysisResult } from '../lib/skinAnalysisClient';

// PURE HTML5 CAMERA + PYTHON OPENCV INTEGRATION
// Replicates face_detected.ipynb logic:
//   1. Detect face via cv2.CascadeClassifier(haarcascade_frontalface_default.xml)
//   2. Check if face_center_x is within CENTER_TOLERANCE of frame_center_x
//   3. If centered for CAPTURE_DELAY seconds → auto capture
//   4. Save to skin_training_data/

interface FaceCaptureProps {
    onComplete: (result: SkinAnalysisResult) => void;
    condition?: string;
    className?: string;
}

// Exact values from face_detected.ipynb
const CENTER_TOLERANCE = 50;
const CAPTURE_DELAY = 2; // seconds

const mapSteps = (steps: string[] | undefined, isMorning: boolean) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) return [];
    return steps.map((stepStr, index) => {
        let name = "Custom Step";
        let desc = stepStr;
        let type = isMorning ? "AM Therapy" : "PM Recovery";

        const splitIndex = stepStr.indexOf(':');
        const hyphenIndex = stepStr.indexOf('-');
        
        let splitChar = '';
        if (splitIndex !== -1 && (hyphenIndex === -1 || splitIndex < hyphenIndex)) {
            splitChar = ':';
        } else if (hyphenIndex !== -1) {
            splitChar = '-';
        }

        if (splitChar) {
            const parts = stepStr.split(splitChar);
            let rawName = parts[0].trim();
            rawName = rawName.replace(/^(?:step\s+\d+\s*)/i, '').trim();
            if (rawName.length > 2) {
                name = rawName;
                desc = parts.slice(1).join(splitChar).trim();
            }
        } else {
            const words = stepStr.split(' ');
            if (words.length > 4) {
                name = words.slice(0, 4).join(' ');
                desc = words.slice(4).join(' ');
            }
        }

        if (index === 0) {
            type = isMorning ? "Equilibrium" : "Purification";
        } else if (index === 1) {
            type = "Correction";
        } else {
            type = isMorning ? "Protection" : "Recovery";
        }

        let data = isMorning ? "Antioxidants + Barrier Protection" : "Cellular Turnover + Hydration";
        let price = 24 + (index * 12) + (stepStr.length % 15);

        return {
            step: `0${index + 1}`,
            type,
            name,
            desc,
            data,
            price
        };
    });
};

export function FaceCapture({ onComplete, condition = "no condition detected", className = "" }: FaceCaptureProps) {
    const { addAnalysisResult } = useAuth();
    const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'uploading' | 'error'>('idle');
    const [message, setMessage] = useState("Awaiting Input");
    const [messageColor, setMessageColor] = useState("text-stone-400");
    const [boundingBox, setBoundingBox] = useState<{ x: number, y: number, w: number, h: number, frameW: number, frameH: number } | null>(null);

    // Dynamic backend URL to support mobile testing on the same network
    // Use VITE_BACKEND_URL if available, otherwise fallback to current host:5000
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const loopRef = useRef<number | null>(null);
    const goodStartRef = useRef<number | null>(null);
    const isCapturingRef = useRef(false);
    const statusRef = useRef(status); // Track status via ref to avoid stale closures

    // Keep statusRef in sync
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const stopCamera = useCallback(() => {
        if (loopRef.current) {
            clearTimeout(loopRef.current);
            loopRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    // Attach stream to video element when status becomes active
    useEffect(() => {
        if (status === 'active' && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [status]);

    const captureHighResAndUpload = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        isCapturingRef.current = true;
        setStatus('uploading');
        setMessage("Uploading...");
        setBoundingBox(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror the image just like cv2.flip(frame, 1)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.95);

        stopCamera();

        try {
            // Same API flow as client.py send_to_server()
            const analysisResult = await predictSkin(imageData, condition, backendUrl);
            console.log('Skin Analysis Complete:', analysisResult.skin_type);

            // Map dynamic AM/PM steps
            const morningRoutine = mapSteps(analysisResult.recommendations?.daily_routine?.morning, true);
            const eveningRoutine = mapSteps(analysisResult.recommendations?.daily_routine?.evening, false);

            // Record to the local React authentication context history log
            addAnalysisResult({
                type: analysisResult.skin_type,
                result: analysisResult.recommendations?.summary || 'Analysis Complete',
                score: parseInt(analysisResult.confidence) || 85,
                routine: {
                    morning: morningRoutine,
                    evening: eveningRoutine
                }
            } as any);

            setTimeout(() => {
                onComplete(analysisResult);
            }, 1000);
        } catch (err: any) {
            console.error('Upload error:', err);
            setStatus('error');
            if (err.message.includes('Failed to fetch')) {
                setMessage(`⚠ Failed to reach backend at ${backendUrl}. Ensure Python backend is running.`);
            } else {
                setMessage(`Upload failed: ${err.message}`);
            }
            setMessageColor("text-rose-500");
        }
    }, [onComplete, stopCamera, backendUrl, addAnalysisResult, condition]);

    // The main detection loop — mirrors face_detected.ipynb logic exactly
    const detectLoop = useCallback(async () => {
        // Use ref to check current status (avoids stale closure)
        if (statusRef.current !== 'active' || isCapturingRef.current) return;
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Wait for video to be ready
        if (video.readyState < 4) {
            loopRef.current = window.setTimeout(detectLoop, 300);
            return;
        }

        // Draw a small frame to send to Python (320x240 for speed)
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror like cv2.flip(frame, 1)
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const imageData = canvas.toDataURL('image/jpeg', 0.5);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(`${backendUrl}/api/detect-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!res.ok) throw new Error('Backend error');

            const data = await res.json();

            // === EXACT face_detected.ipynb logic ===
            if (data.faces && data.faces.length > 0) {
                const face = data.faces[0];
                setBoundingBox({
                    x: face.x, y: face.y, w: face.w, h: face.h,
                    frameW: data.frame_width, frameH: data.frame_height
                });

                // face_center_x = x + w // 2
                const face_center_x = face.x + Math.floor(face.w / 2);
                // frame_center_x = frame.shape[1] // 2
                const frame_center_x = Math.floor(data.frame_width / 2);

                // if abs(face_center_x - frame_center_x) < CENTER_TOLERANCE:
                if (Math.abs(face_center_x - frame_center_x) < CENTER_TOLERANCE) {
                    setMessageColor("text-emerald-500");

                    // if good_start is None: good_start = time.time()
                    if (goodStartRef.current === null) {
                        goodStartRef.current = Date.now();
                        setMessage("Good! Face Forward");
                    } else {
                        // elapsed = time.time() - good_start
                        const elapsed = (Date.now() - goodStartRef.current) / 1000;
                        // countdown = CAPTURE_DELAY - int(elapsed)
                        const countdown = Math.ceil(CAPTURE_DELAY - elapsed);

                        // if elapsed > CAPTURE_DELAY: → capture
                        if (elapsed >= CAPTURE_DELAY) {
                            setMessage("Capturing...");
                            isCapturingRef.current = true;
                            captureHighResAndUpload();
                            return; // Stop the loop
                        } else {
                            setMessage(`Capturing in ${countdown}s...`);
                        }
                    }
                } else {
                    // else: message = "Please Look Forward"; good_start = None
                    setMessage("Please Look Forward");
                    setMessageColor("text-rose-500");
                    goodStartRef.current = null;
                }
            } else {
                // No face: good_start = None
                setMessage("No Face Detected");
                setMessageColor("text-rose-500");
                goodStartRef.current = null;
                setBoundingBox(null);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setMessage("⚠ Python backend not responding");
                setMessageColor("text-amber-500");
            }
        }

        // Schedule next detection (5 fps = every 200ms)
        if (statusRef.current === 'active' && !isCapturingRef.current) {
            loopRef.current = window.setTimeout(detectLoop, 200);
        }
    }, [captureHighResAndUpload]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const imageData = reader.result as string;
            
            setStatus('uploading');
            setMessage("Analyzing Image...");
            setBoundingBox(null);
            
            try {
                const analysisResult = await predictSkin(imageData, condition, backendUrl);
                console.log('Skin Analysis Complete:', analysisResult.skin_type);

                const morningRoutine = mapSteps(analysisResult.recommendations?.daily_routine?.morning, true);
                const eveningRoutine = mapSteps(analysisResult.recommendations?.daily_routine?.evening, false);

                addAnalysisResult({
                    type: analysisResult.skin_type,
                    result: analysisResult.recommendations?.summary || 'Analysis Complete',
                    score: parseInt(analysisResult.confidence) || 85,
                    routine: {
                        morning: morningRoutine,
                        evening: eveningRoutine
                    }
                } as any);

                setTimeout(() => {
                    onComplete(analysisResult);
                }, 1000);
            } catch (err: any) {
                console.error('Upload error:', err);
                setStatus('error');
                if (err.message.includes('Failed to fetch')) {
                    setMessage(`⚠ Failed to reach backend at ${backendUrl}. Ensure Python backend is running.`);
                } else {
                    setMessage(`Analysis failed: ${err.message}`);
                }
                setMessageColor("text-rose-500");
            }
        };
        reader.readAsDataURL(file);
    };

    const startScanner = async () => {
        setStatus('loading');
        setMessage("Requesting Camera...");
        setMessageColor("text-stone-400");

        try {
            const stream = await Promise.race([
                navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
                }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Camera took too long to start. Please check permissions or restart your browser.')), 15000)
                )
            ]);

            streamRef.current = stream;
            isCapturingRef.current = false;
            goodStartRef.current = null;

            setStatus('active');
            setMessage("Camera Active — Look Forward");
            setMessageColor("text-amber-500");

            // Give the video element time to mount, then start the detection loop
            setTimeout(() => detectLoop(), 800);
        } catch (err: any) {
            console.error("Camera error:", err);
            setStatus('error');
            setMessage(`Camera Error: ${err.message || 'Permission denied'}`);
            setMessageColor("text-rose-500");
        }
    };

    return (
        <div className={`relative flex flex-col items-center w-full max-w-2xl mx-auto ${className}`}>
            <div className="relative w-full aspect-square md:aspect-[4/3] bg-stone-100 dark:bg-stone-900 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col items-center justify-center border border-stone-200 dark:border-stone-800 shadow-inner">

                {/* IDLE STATE */}
                {status === 'idle' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 flex flex-col items-center relative z-10 w-full px-6">
                        <div className="w-24 h-24 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Camera className="w-10 h-10 text-[#4A3C31] dark:text-stone-400" />
                        </div>
                        <p className="text-[#3B302B] dark:text-stone-300 font-medium">Ready to analyze your skin.</p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-2">
                            <button
                                onClick={startScanner}
                                className="px-10 py-4 bg-[#4A3C31] text-white rounded-full font-bold shadow-xl shadow-[#4A3C31]/20 hover:scale-105 transition-transform w-full md:w-auto whitespace-nowrap"
                            >
                                Open Camera
                            </button>
                            <label className="px-10 py-4 bg-white dark:bg-stone-800 text-[#4A3C31] dark:text-white border-2 border-[#4A3C31] dark:border-stone-700 rounded-full font-bold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors w-full md:w-auto cursor-pointer flex items-center justify-center whitespace-nowrap">
                                Upload Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                    </motion.div>
                )}

                {/* LOADING STATE */}
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4 text-center p-6">
                        <Loader2 className="w-12 h-12 text-[#4A3C31] animate-spin" />
                        <p className="text-sm font-bold text-stone-500">{message}</p>
                    </div>
                )}

                {/* ACTIVE STATE — Camera + Face Detection */}
                {status === 'active' && (
                    <>
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                            playsInline
                            muted
                            autoPlay
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Bounding box overlay */}
                        {boundingBox && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div
                                    className="absolute border-[3px] rounded-lg transition-all ease-linear duration-150"
                                    style={{
                                        left: `${(boundingBox.x / boundingBox.frameW) * 100}%`,
                                        top: `${(boundingBox.y / boundingBox.frameH) * 100}%`,
                                        width: `${(boundingBox.w / boundingBox.frameW) * 100}%`,
                                        height: `${(boundingBox.h / boundingBox.frameH) * 100}%`,
                                        borderColor: message.includes("Good") || message.includes("Capturing") ? '#10b981' : '#f43f5e',
                                        boxShadow: `0 0 15px ${message.includes("Good") || message.includes("Capturing") ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`
                                    }}
                                />
                            </div>
                        )}

                        {/* HUD overlay */}
                        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex gap-3 items-center text-white text-xs font-bold font-mono shadow-lg">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    {message.includes("Capturing") ? "LOCKING..." : "REC"}
                                </div>
                                <div className="bg-black/60 backdrop-blur-md w-10 h-10 flex items-center justify-center rounded-full text-emerald-400/80">
                                    <ScanFace className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="w-full flex flex-col items-center pb-4">
                                <button
                                    onClick={captureHighResAndUpload}
                                    className="pointer-events-auto bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-full font-bold text-sm shadow-xl transition-all"
                                >
                                    Force Capture Now
                                </button>
                            </div>
                        </div>

                        {/* Guide frame */}
                        <div className="absolute inset-0 pointer-events-none border-[2px] rounded-[2rem] m-6 opacity-30 border-white/50" />
                    </>
                )}

                {/* UPLOADING STATE */}
                {status === 'uploading' && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md flex flex-col items-center justify-center z-20 space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-stone-200 border-t-[#4A3C31] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Maximize className="w-8 h-8 text-[#4A3C31] animate-pulse" />
                            </div>
                        </div>
                        <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#3B302B] dark:text-stone-300">
                            Saving to skin_training_data...
                        </p>
                    </div>
                )}

                {/* ERROR STATE */}
                {status === 'error' && (
                    <div className="flex flex-col items-center px-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                            <Camera className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#3B302B] dark:text-stone-200 mb-2">Scanner Offline</h3>
                            <p className="text-sm font-medium text-rose-500 mb-4">{message}</p>
                            <p className="text-xs text-stone-500 max-w-sm mb-6">
                                Make sure Python backend_app.py is running on port 5000.
                            </p>
                        </div>
                        <button
                            onClick={() => { setStatus('idle'); isCapturingRef.current = false; }}
                            className="px-8 py-3 bg-stone-200 dark:bg-stone-800 text-[#4A3C31] dark:text-stone-300 rounded-full font-bold text-sm hover:bg-stone-300 transition-colors"
                        >
                            Reset & Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* Status bar below camera */}
            {status !== 'error' && status !== 'idle' && (
                <div className="h-20 mt-6 w-full text-center flex flex-col items-center justify-center bg-white dark:bg-[#1A1817] shadow-lg rounded-2xl p-4 border border-stone-100 dark:border-stone-800">
                    <h3 className={`font-bold transition-all duration-300 ${messageColor} text-lg md:text-xl`}>
                        {message}
                    </h3>
                    {status === 'active' && (
                        <p className="text-[10px] md:text-xs font-bold text-stone-400 tracking-widest uppercase mt-2">
                            Python OpenCV Engine Active
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
