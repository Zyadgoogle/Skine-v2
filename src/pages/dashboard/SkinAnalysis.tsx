import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Sparkles, MessageSquare, Send, Smile, Activity,
    Camera, RefreshCw, Loader2, ArrowRight, Upload, ImagePlus
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { FaceCapture } from '../../components/FaceCapture';
import { SkinAnalysisResults } from '../../components/SkinAnalysisResults';
import {
    predictSkin,
    normalizeAnalysisResponse,
    ensureRecommendations,
    recommendationsAreComplete,
    type SkinAnalysisResult,
} from '../../lib/skinAnalysisClient';

const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const AVAILABLE_CONCERNS = [
    { id: 'acne', label: 'Acne / Breakouts', desc: 'Frequent pimples, whiteheads, or blackheads' },
    { id: 'sensit', label: 'Redness / Sensitivity', desc: 'Skin easily irritated or reactive to products' },
    { id: 'dryness', label: 'Dryness / Flakiness', desc: 'Rough patches, tight skin, or peeling' },
    { id: 'pigment', label: 'Dark Spots / Pigmentation', desc: 'Sun spots, post-acne marks, or uneven tone' }
];

const ANALYSIS_STORAGE_KEY = 'skine_skin_analysis_session';

type AnalysisSession = {
    step: 'intro' | 'questionnaire' | 'capture' | 'results';
    result: SkinAnalysisResult;
    selectedConcerns: string[];
    diagnosedDisease: 'yes' | 'no' | null;
};

function loadAnalysisSession(): AnalysisSession | null {
    const readStoredSession = (storage: Storage) => {
        const raw = storage.getItem(ANALYSIS_STORAGE_KEY);
        return raw ? JSON.parse(raw) as AnalysisSession : null;
    };

    try {
        const saved = readStoredSession(localStorage) || readStoredSession(sessionStorage);
        if (saved) {
            localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(saved));
        }
        return saved;
    } catch {
        return null;
    }
}

function saveAnalysisSession(session: AnalysisSession) {
    const payload = JSON.stringify(session);
    localStorage.setItem(ANALYSIS_STORAGE_KEY, payload);
    sessionStorage.setItem(ANALYSIS_STORAGE_KEY, payload);
}

function clearAnalysisSession() {
    localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    sessionStorage.removeItem(ANALYSIS_STORAGE_KEY);
}

export function DashboardSkinAnalysis() {
    const saved = loadAnalysisSession();
    const [step, setStep] = useState<'intro' | 'questionnaire' | 'capture' | 'results'>(
        saved?.step === 'results' ? 'results' : 'intro'
    );
    const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const uploadRef = useRef<HTMLInputElement>(null);

    // Questionnaire states
    const [diagnosedDisease, setDiagnosedDisease] = useState<'yes' | 'no' | null>(saved?.diagnosedDisease ?? null);
    const [selectedConcerns, setSelectedConcerns] = useState<string[]>(saved?.selectedConcerns ?? []);

    const buildConditionFromConcerns = (concernIds: string[]) => {
        if (!concernIds.length) return 'no condition detected';
        return concernIds
            .map((id) => AVAILABLE_CONCERNS.find((c) => c.id === id)?.label || id)
            .join(', ');
    };

    const sessionCondition = saved
        ? buildConditionFromConcerns(saved.selectedConcerns ?? [])
        : 'no condition detected';

    // Analysis Result states (normalized like client.py recs payload)
    const [result, setResult] = useState<SkinAnalysisResult | null>(() => {
        if (!saved?.result) return null;
        const normalized = normalizeAnalysisResponse(
            saved.result as unknown as Record<string, unknown>,
            sessionCondition
        );
        return ensureRecommendations(normalized, sessionCondition);
    });

    // AI Chatbox states
    const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatSending, setIsChatSending] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

    const applyAnalysisResult = (analysisResult: SkinAnalysisResult) => {
        const condition = getConditionString();
        const complete = ensureRecommendations(analysisResult, condition);
        setResult(complete);
        setStep('results');
        saveAnalysisSession({
            step: 'results',
            result: complete,
            selectedConcerns,
            diagnosedDisease,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Upload image handler — mirrors client.py send_to_server()
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setUploadError('');
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const imageData = reader.result as string;
                const analysisResult = await predictSkin(imageData, getConditionString(), backendUrl);
                applyAnalysisResult(analysisResult);
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed. Ensure the Python backend is running.');
        } finally {
            setIsUploading(false);
        }
    };

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTo({
                top: chatScrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [chatMessages]);

    // Handle concern selection toggle
    const toggleConcern = (id: string) => {
        setSelectedConcerns(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Process questionnaire variables into condition string
    const getConditionString = () => {
        if (selectedConcerns.length === 0) return 'no condition detected';
        return selectedConcerns.map(id => {
            const concern = AVAILABLE_CONCERNS.find(c => c.id === id);
            return concern ? concern.label : id;
        }).join(', ');
    };

    const buildChatContext = () => {
        const activeResult = result ?? loadAnalysisSession()?.result ?? saved?.result;
        const savedConcerns = loadAnalysisSession()?.selectedConcerns ?? saved?.selectedConcerns ?? [];
        return {
            skin_type: activeResult?.skin_type || 'Combination',
            confidence: activeResult?.confidence || 'unknown',
            condition: getConditionString() || buildConditionFromConcerns(savedConcerns),
            recommendations: activeResult?.recommendations,
        };
    };

    // Send AI Chat message
    const sendChatMessage = async () => {
        if (!chatInput.trim() || isChatSending) return;
        const msgText = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { sender: 'user', text: msgText }]);
        setIsChatSending(true);

        try {
            const res = await fetch(`${backendUrl}/api/chat-skin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msgText,
                    context: buildChatContext(),
                })
            });
            if (res.ok) {
                const data = await res.json();
                setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
            } else {
                throw new Error("API failed");
            }
        } catch (e) {
            setChatMessages(prev => [...prev, { sender: 'ai', text: "I'm having difficulty connecting. Is the local Python backend active on port 5000?" }]);
        } finally {
            setIsChatSending(false);
        }
    };

    // Repair stale session data (skin type without routines) on mount
    useEffect(() => {
        if (step === 'results' && result && !recommendationsAreComplete(result.recommendations)) {
            const concernIds = saved?.selectedConcerns ?? selectedConcerns;
            const condition = buildConditionFromConcerns(concernIds);
            const repaired = ensureRecommendations(result, condition);
            setResult(repaired);
            saveAnalysisSession({
                step: 'results',
                result: repaired,
                selectedConcerns: concernIds,
                diagnosedDisease: saved?.diagnosedDisease ?? diagnosedDisease,
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

    // Reset everything
    const resetAnalysis = () => {
        clearAnalysisSession();
        setStep('intro');
        setDiagnosedDisease(null);
        setSelectedConcerns([]);
        setResult(null);
        setChatMessages([]);
        setCaptureMode('camera');
        setUploadError('');
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="space-y-8 max-w-4xl mx-auto pb-12"
        >
            {/* Header Block */}
            <div>
                <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">
                    Skincare <span className="text-[#8C7A6E] italic">Dermal Analyzer</span>
                </h2>
                <p className="text-stone-500 font-light text-sm">
                    Clinical-grade PyTorch classification connected directly to your skin concerns.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {/* 1. INTRO STEP */}
                {step === 'intro' && (
                    <motion.div
                        key="intro"
                        variants={cardVariants}
                        className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-8 animate-fade-in"
                    >
                        <div className="w-20 h-20 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <Sparkles className="w-9 h-9 text-[#8C7A6E]" />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-serif text-[#3B302B] dark:text-stone-100">
                                AI-Driven Biotype Diagnosis
                            </h3>
                            <p className="text-sm font-light text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                                Our platform uses an EfficientNet neural network trained on over 20,000 professional clinical dermatological photos. Scan your skin to unlock tailored AI ingredient analyses and morning/evening clinical routines.
                            </p>
                        </div>

                        <div className="p-6 bg-stone-50 dark:bg-stone-800/45 rounded-2xl border border-stone-100 dark:border-stone-800 text-left flex items-start gap-4">
                            <ShieldAlert className="w-5 h-5 text-[#8C7A6E] shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">Clinical Protocol Guard</h4>
                                <p className="text-[11px] font-light text-stone-500 dark:text-stone-400 mt-1">
                                    All scanning, camera uploads, and recommendations abide by standard dermatological guidelines. Serious skin conditions are automatically triaged to human specialists.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('questionnaire')}
                            className="px-10 py-4 bg-[#4A3C31] text-white rounded-full font-bold shadow-lg shadow-stone-800/10 hover:scale-105 transition-transform flex items-center gap-3 mx-auto text-sm cursor-pointer border-none outline-none"
                        >
                            Begin Clinical Scan <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* 2. QUESTIONNAIRE STEP */}
                {step === 'questionnaire' && (
                    <motion.div
                        key="questionnaire"
                        variants={cardVariants}
                        className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm max-w-2xl mx-auto space-y-8"
                    >
                        <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                            <Activity className="w-5 h-5 text-[#8C7A6E]" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Pre-Analysis Triage</h3>
                        </div>

                        {/* Disease Screening */}
                        <div className="space-y-4 text-left">
                            <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block">
                                1. Do you suffer from a diagnosed chronic skin disease (e.g., Eczema, Psoriasis, severe Rosacea)?
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setDiagnosedDisease('yes')}
                                    className={`py-3.5 px-6 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer outline-none ${diagnosedDisease === 'yes'
                                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 border-rose-300'
                                            : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 border-stone-200 dark:border-stone-800'
                                        }`}
                                >
                                    Yes, I Do
                                </button>
                                <button
                                    onClick={() => { setDiagnosedDisease('no'); }}
                                    className={`py-3.5 px-6 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer outline-none ${diagnosedDisease === 'no'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border-emerald-300'
                                            : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 border-stone-200 dark:border-stone-800'
                                        }`}
                                >
                                    No diagnosed chronic disease
                                </button>
                            </div>
                        </div>

                        {/* Redirect Panel for Diagnosed Chronic Diseases */}
                        {diagnosedDisease === 'yes' && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-left space-y-4"
                            >
                                <div className="flex gap-3">
                                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">Dermatologist & Specialist Consultation Required</h4>
                                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-light leading-relaxed">
                                            AI-driven vision scans are optimized for general skin bio-typing (Dry, Oily, Normal, Combination) and lightweight care routines, but they cannot replace a medical professional for active skin pathology or chronic inflammatory diseases.
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        onClick={resetAnalysis}
                                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-600 border-none bg-transparent cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Trigger hash navigation update
                                            window.location.hash = "#clinic";
                                            window.location.reload();
                                        }}
                                        className="px-6 py-2.5 bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-rose-800 transition-colors shadow-sm cursor-pointer border-none"
                                    >
                                        Consult with a Specialist Now
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Concerns Multi-select */}
                        {diagnosedDisease === 'no' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4 text-left pt-2"
                            >
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 block">
                                    2. Identify any local dermal concerns or sensitivities (Select all that apply):
                                </label>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {AVAILABLE_CONCERNS.map(concern => {
                                        const isSelected = selectedConcerns.includes(concern.id);
                                        return (
                                            <button
                                                key={concern.id}
                                                onClick={() => toggleConcern(concern.id)}
                                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer outline-none ${isSelected
                                                        ? 'bg-stone-900 text-white border-transparent dark:bg-stone-850'
                                                        : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/40 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                                                    }`}
                                            >
                                                <div className="font-bold text-xs">{concern.label}</div>
                                                <div className={`text-[10px] mt-1 font-light ${isSelected ? 'text-stone-300' : 'text-stone-400'
                                                    }`}>
                                                    {concern.desc}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="pt-6 flex justify-between gap-4">
                                    <button
                                        onClick={() => setStep('intro')}
                                        className="px-6 py-3 border border-stone-200 dark:border-stone-800 text-stone-500 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer bg-transparent outline-none"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep('capture')}
                                        className="px-8 py-3 bg-[#4A3C31] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-2 shadow-md cursor-pointer border-none outline-none"
                                    >
                                        Proceed to Scan <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* 3. CAPTURE STEP */}
                {step === 'capture' && (
                    <motion.div
                        key="capture"
                        variants={cardVariants}
                        className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm max-w-2xl mx-auto space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Dermal Capture</h3>
                                <p className="text-[11px] font-light text-stone-500">Concerns: <span className="text-[#8C7A6E] font-medium">{getConditionString()}</span></p>
                            </div>
                            <button onClick={() => setStep('questionnaire')} className="text-xs font-bold text-stone-400 hover:text-stone-600 bg-transparent border-none cursor-pointer outline-none">Edit</button>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex gap-3 p-1.5 bg-stone-100 dark:bg-stone-800 rounded-2xl">
                            <button
                                onClick={() => setCaptureMode('camera')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none outline-none ${captureMode === 'camera' ? 'bg-[#4A3C31] text-white shadow-md' : 'text-stone-500 dark:text-stone-400 bg-transparent hover:bg-stone-200 dark:hover:bg-stone-700'
                                    }`}
                            >
                                <Camera className="w-4 h-4" /> Live Camera
                            </button>
                            <button
                                onClick={() => setCaptureMode('upload')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none outline-none ${captureMode === 'upload' ? 'bg-[#4A3C31] text-white shadow-md' : 'text-stone-500 dark:text-stone-400 bg-transparent hover:bg-stone-200 dark:hover:bg-stone-700'
                                    }`}
                            >
                                <ImagePlus className="w-4 h-4" /> Upload Photo
                            </button>
                        </div>

                        {/* Camera Mode */}
                        {captureMode === 'camera' && (
                            <FaceCapture
                                condition={getConditionString()}
                                onComplete={applyAnalysisResult}
                            />
                        )}

                        {/* Upload Mode */}
                        {captureMode === 'upload' && (
                            <div className="text-center space-y-5">
                                <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                <button
                                    onClick={() => uploadRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-[#8C7A6E] rounded-2xl p-10 flex flex-col items-center gap-4 transition-all cursor-pointer bg-stone-50 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800/70 disabled:opacity-60 outline-none"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="w-10 h-10 text-[#8C7A6E] animate-spin" /><p className="text-sm font-medium text-stone-500">Analysing image...</p></>
                                    ) : (
                                        <><Upload className="w-10 h-10 text-stone-400" />
                                            <div>
                                                <p className="text-sm font-bold text-[#3B302B] dark:text-stone-200">Click to upload a face photo</p>
                                                <p className="text-[11px] text-stone-400 mt-1">JPG, PNG or WEBP — same flow as client.py upload mode</p>
                                            </div></>
                                    )}
                                </button>
                                {uploadError && <p className="text-xs text-rose-500 font-medium">{uploadError}</p>}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 4. RESULTS STEP */}
                {step === 'results' && result && (
                    <motion.div
                        key="results"
                        variants={containerVariants}
                        className="space-y-6"
                    >
                        <SkinAnalysisResults result={result} />

                        {/* AI Chat */}
                        <motion.div variants={cardVariants} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-6 shadow-sm flex flex-col h-[320px] overflow-hidden">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#3B302B] dark:text-stone-200 pb-3 border-b border-stone-50 dark:border-stone-800/60 flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-[#8C7A6E]" /> 💬 Ask SkinE AI
                            </h4>
                            <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                                        <Smile className="w-7 h-7 text-stone-300" />
                                        <p className="text-[11px] text-stone-400 font-light">Ask follow-up questions about your skin type, routine, or ingredients.</p>
                                    </div>
                                ) : chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed font-light ${msg.sender === 'user' ? 'bg-[#4A3C31] text-white rounded-br-none' : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-bl-none border border-stone-100 dark:border-stone-700'}`}>{msg.text}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-3 border-t border-stone-50 dark:border-stone-800/60 flex gap-2">
                                <input type="text" placeholder="Can I use vitamin C?..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }} className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8C7A6E] dark:text-stone-300" />
                                <button onClick={sendChatMessage} disabled={isChatSending || !chatInput.trim()} className="w-8 h-8 rounded-xl bg-[#4A3C31] text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer border-none outline-none">
                                    {isChatSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </motion.div>

                        {/* New Analysis */}
                        <motion.button variants={cardVariants} onClick={resetAnalysis} className="w-full py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-[#8C7A6E] hover:bg-stone-50 dark:hover:bg-stone-800/40 rounded-2xl text-xs font-bold uppercase tracking-wider text-[#4A3C31] dark:text-stone-300 transition-all flex items-center justify-center gap-2 cursor-pointer bg-transparent outline-none">
                            <RefreshCw className="w-3.5 h-3.5" /> Perform New Dermal Analysis
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
