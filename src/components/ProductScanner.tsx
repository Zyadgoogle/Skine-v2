import { Camera, Loader2, Search, ShoppingBag, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductScannerProps {
    onComplete: (result: any) => void;
    className?: string;
}

export function ProductScanner({ onComplete, className = "" }: ProductScannerProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'scanning' | 'results' | 'error'>('idle');
    const [message, setMessage] = useState("Awaiting Input");
    const [scanResults, setScanResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isBackgroundScanning, setIsBackgroundScanning] = useState(false);

    // Use VITE_BACKEND_URL if available, otherwise fallback to current host:5000
    // This allows it to work on Vercel if the user provides the backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<number | null>(null);
    const isScanningRef = useRef(false);

    const stopCamera = useCallback(() => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    useEffect(() => {
        if (status === 'active' && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            // Explicitly call play() to start video — required on many browsers
            videoRef.current.play().catch(e => console.warn('Video play() failed:', e));
        }
    }, [status]);

    const performScan = useCallback(async (customImageData?: string, isAuto = false) => {
        if (!customImageData && (!videoRef.current || !canvasRef.current)) return;
        if (isScanningRef.current) return;
        
        isScanningRef.current = true;
        
        // Don't interrupt manual scanning with auto-scanning
        if (!isAuto) {
            setStatus('scanning');
            setMessage("Analyzing skincare ingredients...");
        } else {
            setIsBackgroundScanning(true);
        }

        let imageData = customImageData;

        if (!imageData && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video.readyState < 4) return;
            
            // Use native video resolution to preserve aspect ratio (barcode-safe)
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            imageData = canvas.toDataURL('image/jpeg', 0.92);
        }

        if (!imageData) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(`${backendUrl}/api/scan-product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Scan failed (Status: ${response.status})`);
            }

            const result = await response.json();
            if (result.success && result.detected && result.detected.length > 0) {
                setScanResults(result.detected);
                setStatus('results');
                stopCamera();
            } else if (!isAuto) {
                setStatus('error');
                setError(
                    "Product not detected. Tips: " +
                    "(1) Point camera directly at the barcode and hold still. " +
                    "(2) Keep 15–25 cm distance from the barcode. " +
                    "(3) Use good lighting — avoid shadows and glare. " +
                    "(4) Try Upload Photo and select an image of the ingredients panel."
                );
            }
        } catch (err: any) {
            console.error('Scan error:', err);
            if (!isAuto) {
                setStatus('error');
                if (err.message?.includes('Failed to fetch') || err.name === 'AbortError') {
                    setError(err.name === 'AbortError' ? 'Scan timed out. Please try again with better connection.' : `Backend offline. Make sure Python backend_app.py is running on port 5000.`);
                } else {
                    setError(err.message || 'Unknown error');
                }
            }
        } finally {
            isScanningRef.current = false;
            setIsBackgroundScanning(false);
        }
    }, [backendUrl, stopCamera]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target?.result as string;
            performScan(imageData);
        };
        reader.readAsDataURL(file);
    };

    const startScanner = async () => {
        setStatus('loading');
        setError(null);

        // Try progressively simpler constraints if the ideal ones fail
        const constraintSets = [
            // 1st try: rear camera at ideal resolution (phones)
            { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
            // 2nd try: any camera at ideal resolution (desktops)
            { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
            // 3rd try: any camera, no resolution constraints
            { video: true },
        ];

        let stream: MediaStream | null = null;
        let lastErr: any = null;

        for (const constraints of constraintSets) {
            try {
                stream = await Promise.race([
                    navigator.mediaDevices.getUserMedia(constraints),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Camera took too long to start. Try a simpler setup.')), 15000)
                    )
                ]);
                break; // success — stop trying
            } catch (err: any) {
                lastErr = err;
                console.warn('Camera constraint attempt failed:', constraints, err.message);
            }
        }

        if (!stream) {
            setStatus('error');
            const msg = lastErr?.message || '';
            if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
                setError('Camera access denied. Please allow camera permission in your browser settings and try again.');
            } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('devicenotfound')) {
                setError('No camera found on this device. Use "Upload Photo" instead to scan a barcode image.');
            } else if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('took too long')) {
                setError('Camera timed out. Your camera may be busy or blocked. Try closing other apps using the camera, or use "Upload Photo".');
            } else {
                setError(`Camera error: ${msg || 'Unknown error'}. Try using "Upload Photo" instead.`);
            }
            return;
        }

        streamRef.current = stream;
        setStatus('active');
        setMessage('Point at a barcode and press Analyze Now');

        // Auto-scan every 3 seconds in the background
        scanIntervalRef.current = window.setInterval(() => performScan(undefined, true), 3000);
    };

    return (
        <div className={`relative flex flex-col items-center w-full max-w-2xl mx-auto ${className}`}>
            <input 
                type="file" 
                id="product-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
            />
            
            <div className="relative w-full aspect-square md:aspect-[4/3] bg-stone-100 dark:bg-stone-900 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col items-center justify-center border border-stone-200 dark:border-stone-800 shadow-inner">
                
                {/* SCAN LINE ANIMATION */}
                {(status === 'active' || status === 'scanning') && (
                    <motion.div 
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20 pointer-events-none"
                    />
                )}

                {/* IDLE STATE */}
                {status === 'idle' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 flex flex-col items-center relative z-10 w-full px-6">
                        <div className="w-24 h-24 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Search className="w-10 h-10 text-[#4A3C31] dark:text-stone-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-serif text-[#3B302B] dark:text-stone-100">Product Scanner</h3>
                            <p className="text-stone-500 dark:text-stone-400 font-light text-sm">Scan a barcode or upload a photo of the ingredients list.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-8">
                            <button
                                onClick={startScanner}
                                className="px-8 py-5 bg-[#4A3C31] text-white rounded-full font-bold shadow-xl hover:bg-[#3B302B] transition-all flex items-center justify-center gap-3"
                            >
                                <Camera className="w-5 h-5" /> Live Scan
                            </button>
                            <button
                                onClick={() => document.getElementById('product-upload')?.click()}
                                className="px-8 py-5 bg-white dark:bg-stone-800 text-[#4A3C31] dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-full font-bold shadow-xl hover:bg-stone-50 transition-all flex items-center justify-center gap-3"
                            >
                                <ShoppingBag className="w-5 h-5" /> Upload Photo
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* SCANNING STATE */}
                {status === 'scanning' && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="w-8 h-8 text-emerald-500 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2 px-8">
                            <p className="text-lg font-serif italic text-[#3B302B] dark:text-stone-100 animate-pulse">Scanning & analyzing ingredients...</p>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Running AI Vision Engine</p>
                        </div>
                    </div>
                )}

                {/* LOADING STATE */}
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-[#4A3C31] animate-spin" />
                        <p className="text-sm font-bold text-stone-500">Initializing AI Models...</p>
                    </div>
                )}

                {/* ACTIVE STATE */}
                {status === 'active' && (
                    <>
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            playsInline
                            muted
                            autoPlay
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-40 border-2 border-dashed border-white/50 rounded-2xl relative">
                                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 px-6">
                            <button
                                onClick={() => performScan()}
                                className="pointer-events-auto bg-black/60 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-full font-bold text-sm shadow-2xl hover:bg-black/80 transition-all flex items-center gap-2"
                            >
                                <Search className="w-5 h-5" /> Analyze Now
                            </button>
                            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">Point at barcode or ingredients</p>
                        </div>
                    </>
                )}

                {/* RESULTS STATE */}
                {status === 'results' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-white/95 dark:bg-stone-900/95 flex flex-col items-center p-8 z-30 overflow-y-auto">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shrink-0">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        
                        <div className="w-full space-y-6">
                            {scanResults.map((res, i) => (
                                <div key={i} className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-serif text-[#3B302B] dark:text-stone-100 mb-1">
                                            {res.product?.name || "Product Detected"}
                                        </h3>
                                        {res.product?.brand && (
                                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{res.product.brand}</p>
                                        )}
                                        <p className="text-[10px] font-mono text-stone-400 mt-1">{res.data} ({res.type})</p>
                                    </div>

                                    {res.product?.ingredients ? (
                                        <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-[2rem] border border-stone-100 dark:border-stone-700">
                                            <h4 className="text-[10px] font-bold text-[#4A3C31] dark:text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Clinical Ingredients
                                            </h4>
                                            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed font-light">
                                                {res.product.ingredients}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-[2rem] border border-stone-100 dark:border-stone-700 text-center">
                                            <p className="text-sm text-stone-400 italic">No ingredient data found for this barcode.</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 w-full mt-8 shrink-0">
                            <button 
                                onClick={() => setStatus('idle')}
                                className="flex-1 py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-2xl font-bold text-sm hover:bg-stone-200 transition-all"
                            >
                                Done
                            </button>
                            <button 
                                onClick={startScanner}
                                className="flex-1 py-4 bg-[#4A3C31] text-white rounded-2xl font-bold text-sm hover:bg-[#3B302B] shadow-lg shadow-[#4A3C31]/20 transition-all"
                            >
                                Scan Another
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ERROR STATE */}
                {status === 'error' && (
                    <div className="flex flex-col items-center px-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                            <X className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#3B302B] dark:text-stone-200 mb-2">Scanner Error</h3>
                            <p className="text-sm font-medium text-rose-500 mb-4">{error}</p>
                        </div>
                        <button
                            onClick={() => setStatus('idle')}
                            className="px-8 py-3 bg-[#4A3C31] text-white rounded-full font-bold text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* MESSAGE BAR */}
            {status === 'active' && (
                <div className="mt-6 w-full bg-white dark:bg-stone-900 shadow-xl rounded-2xl p-4 border border-stone-100 dark:border-stone-800 text-center">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 flex items-center justify-center gap-2">
                        {isBackgroundScanning ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {isBackgroundScanning ? "AI Engine Analyzing..." : message}
                    </p>
                </div>
            )}
        </div>
    );
}
