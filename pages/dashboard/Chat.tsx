import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, Send, Camera, Upload, Trash2, ShieldCheck, 
    Clock, CheckCircle2, User, Loader2, Sparkles, AlertCircle, X, ChevronRight, CornerDownLeft, EyeOff, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { consultationsStorage, Message, Consultation } from '../../lib/consultationsStorage';

export function DashboardChat() {
    const { user } = useAuth();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);

    // Doctor list and selected doctor state
    const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('any');

    // UI Panel visibility toggles for comfort
    const [showDossier, setShowDossier] = useState(true);

    // New consultation form states
    const [isCreating, setIsCreating] = useState(false);
    const [question, setQuestion] = useState('');
    const [imageType, setImageType] = useState<'upload' | 'camera' | null>(null);
    const [attachedImage, setAttachedImage] = useState<string | null>(null); // Base64 string
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    // Video streaming references
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Live chat message state
    const [chatInput, setChatInput] = useState('');
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const canViewAllConsultations = user?.role === 'admin' || user?.role === 'doctor';
    const canCreateConsultation = user?.role === 'user';

    // Fetch consultations
    const fetchConsultations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from('consultations')
                .select(`
                    *,
                    doctor:doctor_id ( name ),
                    profiles:user_id ( id, name, email, bio, dob )
                `);

            if (!canViewAllConsultations) {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setConsultations(data as any[]);
                // Keep active consultation in sync
                if (activeConsultation) {
                    const updatedActive = data.find(c => c.id === activeConsultation.id);
                    if (updatedActive) setActiveConsultation(updatedActive as any);
                }
            }
        } catch (err: any) {
            console.warn('Fetch Consultations Supabase error, engaging Local Sync Fallback:', err);
            setDbError('local_mode');
            const localList = canViewAllConsultations
                ? consultationsStorage.getAll()
                : consultationsStorage.getByUser(user.id);
            setConsultations(localList);
            if (activeConsultation) {
                const updatedActive = localList.find(c => c.id === activeConsultation.id);
                if (updatedActive) setActiveConsultation(updatedActive);
            }
        } finally {
            setLoading(false);
        }
    }, [user, activeConsultation?.id, canViewAllConsultations]);

    useEffect(() => {
        fetchConsultations();
    }, [user]);

    // Fetch doctors/doctors when initiating consultation
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('role', 'doctor');
                if (error) throw error;
                if (data) setDoctors(data as any[]);
            } catch (err) {
                console.warn('Failed to load specialists:', err);
            }
        };
        if (isCreating) {
            fetchDoctors();
        }
    }, [isCreating]);

    // Real-time subscription to active consultation updates in Supabase
    useEffect(() => {
        if (!activeConsultation || activeConsultation.id.startsWith('local_')) return;

        const channel = supabase
            .channel(`consultation_chat_${activeConsultation.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'consultations',
                filter: `id=eq.${activeConsultation.id}`
            }, (payload) => {
                supabase
                    .from('consultations')
                    .select(`
                        *,
                        doctor:doctor_id ( name )
                    `)
                    .eq('id', activeConsultation.id)
                    .single()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Error syncing real-time:', error);
                        } else if (data) {
                            setActiveConsultation(data as any);
                            setConsultations(prev => prev.map(c => c.id === data.id ? (data as any) : c));
                        }
                    });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeConsultation?.id]);

    // Listen to changes in consultations table list in Supabase
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel(canViewAllConsultations ? 'all_consultations_list' : `user_consultations_list_${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'consultations',
                ...(canViewAllConsultations ? {} : { filter: `user_id=eq.${user.id}` })
            }, () => {
                fetchConsultations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchConsultations, canViewAllConsultations]);

    // Local Storage Listener for real-time tab updates in Local sync mode
    useEffect(() => {
        const handleStorageSync = (e: StorageEvent) => {
            if (e.key === 'skine_local_consultations' && user) {
                console.log('LocalStorage changed, syncing consultation state...');
                const localList = canViewAllConsultations
                    ? consultationsStorage.getAll()
                    : consultationsStorage.getByUser(user.id);
                setConsultations(localList);
                if (activeConsultation) {
                    const fresh = localList.find(c => c.id === activeConsultation.id);
                    if (fresh) setActiveConsultation(fresh);
                }
            }
        };
        window.addEventListener('storage', handleStorageSync);
        return () => window.removeEventListener('storage', handleStorageSync);
    }, [user, activeConsultation?.id, canViewAllConsultations]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatScrollRef.current?.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [activeConsultation?.messages]);

    // Camera Handlers
    const startCamera = async () => {
        setCameraLoading(true);
        setCameraError(null);
        setCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error('Camera Access Error:', err);
            setCameraError(err.message || 'Could not access device camera.');
            setCameraActive(false);
        } finally {
            setCameraLoading(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Downscale slightly to keep base64 payload highly optimal (less than 100KB)
        canvas.width = 500;
        canvas.height = (video.videoHeight / video.videoWidth) * 500 || 375;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror check
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setAttachedImage(dataUrl);
        stopCamera();
    };

    // Device upload handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            
            // Optimal Compression Fallback via Canvas
            const img = new Image();
            img.src = result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max_dim = 600;
                let w = img.width;
                let h = img.height;
                if (w > max_dim || h > max_dim) {
                    if (w > h) {
                        h = Math.round((h * max_dim) / w);
                        w = max_dim;
                    } else {
                        w = Math.round((w * max_dim) / h);
                        h = max_dim;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, w, h);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                setAttachedImage(compressedBase64);
            };
        };
        reader.readAsDataURL(file);
    };

    // Form Submission
    const handleCreateConsultation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !attachedImage || !user || !canCreateConsultation) return;

        setSending(true);
        
        // Initial message
        const initialMsg: Message = {
            sender: 'user',
            text: question,
            created_at: new Date().toISOString()
        };

        // Try Supabase first, fallback to Local Storage if unmigrated
        try {
            const { data, error } = await supabase
                .from('consultations')
                .insert({
                    user_id: user.id,
                    question: question,
                    image_url: attachedImage,
                    status: 'pending',
                    doctor_id: selectedDoctorId === 'any' ? null : selectedDoctorId,
                    messages: [initialMsg]
                })
                .select()
                .single();

            if (error) throw error;
            
            setQuestion('');
            setAttachedImage(null);
            setImageType(null);
            setIsCreating(false);
            setDbError(null);
            
            await fetchConsultations();
            if (data) {
                setActiveConsultation(data as any);
            }
        } catch (err: any) {
            console.warn('Supabase insert failed, creating consultation locally:', err);
            setDbError('local_mode');
            
            const localItem = consultationsStorage.create(
                user.id,
                question,
                attachedImage,
                selectedDoctorId,
                user
            );

            setQuestion('');
            setAttachedImage(null);
            setImageType(null);
            setIsCreating(false);
            
            const localList = consultationsStorage.getByUser(user.id);
            setConsultations(localList);
            setActiveConsultation(localItem);
        } finally {
            setSending(false);
        }
    };

    // Send a message in active chat
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !activeConsultation || !user) return;

        const newMsg: Message = {
            sender: canViewAllConsultations ? 'doctor' : 'user',
            text: chatInput.trim(),
            created_at: new Date().toISOString()
        };

        const updatedMessages = [...(activeConsultation.messages || []), newMsg];
        const currentInput = chatInput;
        setChatInput('');

        // Try Supabase first, fallback to Local Storage
        try {
            if (activeConsultation.id.startsWith('local_')) {
                throw new Error('Local consultation active');
            }

            const { error } = await supabase
                .from('consultations')
                .update({
                    messages: updatedMessages,
                    ...(canViewAllConsultations
                        ? {
                            doctor_id: activeConsultation.doctor_id || user.id,
                            status: 'answered',
                            answer: chatInput.trim(),
                            answered_at: new Date().toISOString(),
                        }
                        : { status: 'pending' })
                })
                .eq('id', activeConsultation.id);

            if (error) throw error;
            
            const updatedStatus = canViewAllConsultations ? 'answered' : 'pending';
            const updatedItem = {
                ...activeConsultation,
                messages: updatedMessages,
                status: updatedStatus as 'pending' | 'answered',
                doctor_id: canViewAllConsultations ? (activeConsultation.doctor_id || user.id) : activeConsultation.doctor_id,
                answer: canViewAllConsultations ? chatInput.trim() : activeConsultation.answer,
                answered_at: canViewAllConsultations ? new Date().toISOString() : activeConsultation.answered_at,
            };
            setActiveConsultation(updatedItem);
            setConsultations(prev => prev.map(c => c.id === activeConsultation.id ? updatedItem : c));
            setDbError(null);
        } catch (err: any) {
            console.log('Sending message to local storage fallback...', err);
            setDbError('local_mode');

            const updatedItem = consultationsStorage.update(activeConsultation.id, {
                messages: updatedMessages,
                status: canViewAllConsultations ? 'answered' : 'pending',
                doctor_id: canViewAllConsultations ? (activeConsultation.doctor_id || user.id) : activeConsultation.doctor_id,
                answer: canViewAllConsultations ? newMsg.text : activeConsultation.answer,
            });

            if (updatedItem) {
                setActiveConsultation(updatedItem);
                setConsultations(canViewAllConsultations ? consultationsStorage.getAll() : consultationsStorage.getByUser(user.id));
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-6xl mx-auto space-y-8 pb-16"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif text-[#3B302B] dark:text-stone-100 flex items-center gap-3">
                        Live <span className="text-[#8C7A6E] italic">Consultations</span>
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                    </h2>
                    <p className="text-sm font-light text-stone-500 mt-1">Direct, secure chat with board-certified clinical specialists.</p>
                </div>
                {!isCreating && canCreateConsultation && (
                    <button
                        onClick={() => {
                            setIsCreating(true);
                            setActiveConsultation(null);
                        }}
                        className="px-6 py-3.5 bg-[#4A3C31] text-stone-50 hover:bg-[#3B302B] rounded-2xl font-bold text-sm transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Initiate Dermal Consultation
                    </button>
                )}
            </div>

            {/* main layout grid */}
            <div className="grid lg:grid-cols-3 gap-8 min-h-[580px]">
                
                {/* LEFT PANEL: CONSULTATIONS LIST & CREATOR */}
                <div className="lg:col-span-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-6 shadow-sm flex flex-col overflow-hidden max-h-[700px]">
                    <h3 className="font-bold text-stone-700 dark:text-stone-300 text-xs uppercase tracking-widest mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
                        {canViewAllConsultations ? 'Clinical Inquiries' : 'My Chats'}
                    </h3>

                    {/* Navigation inside inquiries panel */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                <Loader2 className="w-8 h-8 text-[#4A3C31] animate-spin" />
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Accessing Chat Stream...</p>
                            </div>
                        ) : consultations.length === 0 ? (
                            <div className="p-8 text-center bg-stone-50 dark:bg-stone-800/40 rounded-3xl border border-dashed border-stone-200 dark:border-stone-700">
                                <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-stone-500">No consultations on file.</p>
                                <p className="text-[11px] text-stone-400 font-light mt-1">
                                    {canCreateConsultation ? 'Start one above to speak with a doctor.' : 'No patient inquiries are available yet.'}
                                </p>
                            </div>
                        ) : (
                            consultations.map(c => {
                                const isActive = activeConsultation?.id === c.id;
                                const lastMsg = c.messages?.[c.messages.length - 1];
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setActiveConsultation(c);
                                            setIsCreating(false);
                                        }}
                                        className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 flex items-start gap-4 ${
                                            isActive
                                                ? 'bg-[#4A3C31] text-white border-transparent shadow-lg shadow-stone-900/10'
                                                : 'bg-stone-50 dark:bg-stone-800/30 border-stone-150 dark:border-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            isActive ? 'bg-white/10 text-white' : 'bg-white dark:bg-stone-800 text-[#4A3C31] border border-stone-200 dark:border-stone-700 shadow-sm'
                                        }`}>
                                            {c.image_url ? (
                                                <img src={c.image_url} alt="Skin attachment" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <MessageSquare className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    isActive ? 'text-white/60' : 'text-stone-400'
                                                }`}>
                                                    {new Date(c.created_at).toLocaleDateString()}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 ${
                                                    c.status === 'pending'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                            <h4 className={`text-sm font-medium truncate ${
                                                isActive ? 'text-white font-semibold' : 'text-stone-800 dark:text-stone-200'
                                            }`}>
                                                {c.question}
                                            </h4>
                                            <p className={`text-[11px] truncate mt-1 leading-relaxed ${
                                                isActive ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400 font-light'
                                            }`}>
                                                {lastMsg ? `${lastMsg.sender === 'user' ? 'You: ' : 'Pharm: '}${lastMsg.text}` : 'No messages'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: CHAT WINDOW OR NEW FORM */}
                <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden max-h-[700px]">
                    


                    <AnimatePresence mode="wait">
                        
                        {/* 1. INITIAL FORM CREATION */}
                        {isCreating && canCreateConsultation && (
                            <motion.div
                                key="create-consultation"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-8 flex flex-col h-full overflow-y-auto"
                            >
                                <div className="flex justify-between items-center pb-6 border-b border-stone-100 dark:border-stone-800 mb-6">
                                    <div>
                                        <h3 className="text-xl font-serif text-[#3B302B] dark:text-stone-100">Initiate Dermal Consultation</h3>
                                        <p className="text-xs text-stone-500 mt-1">Please formulate your inquiry, select your specialist, and attach your skin photo.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsCreating(false)}
                                        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateConsultation} className="space-y-6 flex-1 flex flex-col">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Question / Symptoms</label>
                                        <textarea
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            required
                                            rows={4}
                                            className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-5 text-sm focus:outline-none focus:border-[#8C7A6E] dark:text-stone-200"
                                            placeholder="Please describe your skin symptoms, any products recently applied, when the condition started, and your overall concern..."
                                        />
                                    </div>

                                    {/* DOCTOR / DOCTOR SPECIALIST SELECTOR */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest block">Choose Dermal Specialist / Doctor</label>
                                        <div className="relative">
                                            <select
                                                value={selectedDoctorId}
                                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 text-sm focus:outline-none focus:border-[#8C7A6E] dark:text-stone-200 transition-all appearance-none cursor-pointer font-medium"
                                            >
                                                <option value="any">Any Available Specialist (Recommended - Fastest Response)</option>
                                                {doctors.map((ph) => (
                                                    <option key={ph.id} value={ph.id}>
                                                        Dr. {ph.name || 'Clinical Specialist'} (Specialist)
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-400">
                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* CRUCIAL ENFORCED SKIN PHOTO COMPONENT */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                                <span>Skin Photo (Enforced Requirement)</span>
                                                <span className="text-rose-500 text-sm">*</span>
                                            </label>
                                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                                                Specialist Diagnosis Enabled
                                            </span>
                                        </div>

                                        {!attachedImage && !cameraActive ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={startCamera}
                                                    className="p-8 border border-dashed border-stone-200 dark:border-stone-700 hover:border-[#8C7A6E] rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-all group cursor-pointer"
                                                >
                                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                        <Camera className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#3B302B] dark:text-stone-300">Live Camera</span>
                                                    <span className="text-[10px] text-stone-400 font-light text-center">Capture skin area instantly</span>
                                                </button>

                                                <label className="p-8 border border-dashed border-stone-200 dark:border-stone-700 hover:border-[#8C7A6E] rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-all cursor-pointer group">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                    />
                                                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                                        <Upload className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#3B302B] dark:text-stone-300">Device Upload</span>
                                                    <span className="text-[10px] text-stone-400 font-light text-center">Select photo from files</span>
                                                </label>
                                            </div>
                                        ) : cameraActive ? (
                                            /* Camera Interface */
                                            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden flex items-center justify-center">
                                                {cameraLoading ? (
                                                    <div className="text-center text-white space-y-3">
                                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400" />
                                                        <p className="text-xs">Initializing Dermal Scope...</p>
                                                    </div>
                                                ) : cameraError ? (
                                                    <div className="text-center text-white px-6 space-y-3">
                                                        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                                                        <p className="text-sm font-bold">{cameraError}</p>
                                                        <button 
                                                            type="button" 
                                                            onClick={startCamera} 
                                                            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs rounded-xl font-bold"
                                                        >
                                                            Retry Scope
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <video
                                                            ref={videoRef}
                                                            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                                                            playsInline
                                                            muted
                                                            autoPlay
                                                        />
                                                        <div className="absolute inset-0 border-[3px] border-indigo-500/30 rounded-2xl m-4 pointer-events-none" />
                                                        
                                                        {/* Capturing overlays */}
                                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-6">
                                                            <button
                                                                type="button"
                                                                onClick={capturePhoto}
                                                                className="px-6 py-3 bg-white text-[#4A3C31] hover:scale-105 active:scale-95 transition-all rounded-2xl text-xs font-bold shadow-xl flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Camera className="w-4 h-4" /> Capture Area
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={stopCamera}
                                                                className="px-6 py-3 bg-black/60 backdrop-blur-md text-stone-300 hover:text-white rounded-2xl text-xs font-bold shadow-xl cursor-pointer"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                                <canvas ref={canvasRef} className="hidden" />
                                            </div>
                                        ) : (
                                            /* Image Preview State */
                                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 flex items-center justify-center">
                                                <img 
                                                    src={attachedImage!} 
                                                    alt="Attached Skin Diagnostic Preview" 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-6 justify-between">
                                                    <span className="text-xs text-white font-medium drop-shadow-md">Attached Skin Profile Photo</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAttachedImage(null)}
                                                        className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
                                                        title="Remove Attachment"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Warnings / Guidance */}
                                    <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-start gap-3 border border-stone-200 dark:border-stone-850">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-light">
                                            Your skin photo is securely uploaded and stored with clinical encryption. It will only be visible to verified specialists to conduct visual evaluations.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 mt-auto flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="flex-1 py-4 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-2xl text-sm font-bold transition-all cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={sending || !question.trim() || !attachedImage}
                                            className="flex-1 py-4 bg-[#4A3C31] text-white rounded-2xl shadow-xl hover:bg-[#3B302B] disabled:opacity-50 transition-all flex items-center justify-center gap-3 font-bold text-sm cursor-pointer"
                                        >
                                            {sending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Transmitting Request...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    <span>Transmit Request</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* 2. CHAT DETAILS SECTION */}
                        {activeConsultation && !isCreating && (
                            <motion.div
                                key="active-chat"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col h-full overflow-hidden"
                            >
                                {/* Chat Header */}
                                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50 gap-4 flex-wrap">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-[#DECFC0] dark:bg-stone-700 flex items-center justify-center text-[#4A3C31] dark:text-stone-300 font-serif font-bold shrink-0">
                                            {activeConsultation.doctor?.name?.charAt(0) || 'P'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-[#3B302B] dark:text-stone-200 truncate">
                                                {activeConsultation.doctor ? `Specialist: Dr. ${activeConsultation.doctor.name}` : 'Certified Specialist'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                                    Opened {new Date(activeConsultation.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* UI Layout Toggles for Comfort & Spacious View */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowDossier(!showDossier)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                                                showDossier 
                                                    ? 'bg-[#4A3C31] text-white border-transparent shadow-sm' 
                                                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-300 hover:bg-stone-100'
                                            }`}
                                        >
                                            {showDossier ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            <span>{showDossier ? 'Hide Dossier' : 'Dossier'}</span>
                                        </button>
                                        
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${
                                            activeConsultation.status === 'pending'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {activeConsultation.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Grid: Dossier + Messages */}
                                <div className="flex-1 grid md:grid-cols-5 overflow-hidden">
                                    
                                    {/* Left Sidebar inside Chat: Dermal Dossier */}
                                    {showDossier && (
                                        <div className="md:col-span-2 border-r border-stone-100 dark:border-stone-800 p-6 space-y-6 overflow-y-auto max-h-[460px] md:max-h-full scrollbar-thin">
                                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dermal Dossier</h4>

                                            {activeConsultation.image_url ? (
                                                <div className="space-y-3">
                                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-stone-250 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 group relative">
                                                        <img 
                                                            src={activeConsultation.image_url} 
                                                            alt="Patient Skin Sample" 
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350" 
                                                        />
                                                        <a 
                                                            href={activeConsultation.image_url} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                                                        >
                                                            Inspect Full Screen
                                                        </a>
                                                    </div>
                                                    <p className="text-[10px] text-stone-400 italic text-center font-light">Attached Skin Analysis Sample</p>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl text-[11px] text-amber-700 dark:text-amber-400">
                                                    No skin photo attached to this inquiry.
                                                </div>
                                            )}

                                            <div className="p-5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl space-y-4 border border-stone-100 dark:border-stone-800">
                                                <div>
                                                    <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Client Name</div>
                                                    <div className="text-xs font-bold text-[#3B302B] dark:text-stone-200 mt-0.5">
                                                        {activeConsultation.profiles?.name || user?.name || 'Test Client'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Initial Request</div>
                                                    <div className="text-xs text-stone-600 dark:text-stone-300 font-light mt-1 italic leading-relaxed">
                                                        "{activeConsultation.question}"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Right Content inside Chat: Real-time Messages Stream */}
                                    <div className={`flex flex-col overflow-hidden h-[460px] md:h-full transition-all duration-300 ${
                                        showDossier ? 'md:col-span-3' : 'md:col-span-5'
                                    }`}>
                                        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-stone-50/20 dark:bg-stone-900/20">
                                            {activeConsultation.messages?.map((msg, i) => {
                                                const isSelf = msg.sender === 'user';
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                                                    >
                                                        <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                                                            isSelf 
                                                                ? 'bg-[#4A3C31] dark:bg-[#5C4D42] text-white rounded-tr-none' 
                                                                : 'bg-white dark:bg-stone-800 text-stone-850 dark:text-stone-200 rounded-tl-none border border-stone-100 dark:border-stone-800'
                                                        }`}>
                                                            {msg.text}
                                                        </div>
                                                        <span className="text-[9px] text-stone-400 font-medium tracking-wide mt-1.5 px-1 uppercase">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Message Input Box */}
                                        <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-100 dark:border-stone-800 flex gap-2 items-center bg-white dark:bg-stone-900">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder={activeConsultation.status === 'answered' ? 'Write a follow-up response...' : 'Type clinical message...'}
                                                className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-5 py-3 text-sm focus:outline-none dark:text-stone-200 focus:border-[#8C7A6E] transition-colors"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!chatInput.trim()}
                                                className="w-12 h-12 bg-[#4A3C31] text-white rounded-2xl flex items-center justify-center shadow-md hover:bg-[#3B302B] disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 3. DEFAULT PLACEHOLDER STATE */}
                        {!activeConsultation && !isCreating && (
                            <motion.div
                                key="default-empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-12 flex flex-col items-center justify-center text-center h-full flex-1"
                            >
                                <div className="w-14 h-14 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center border border-stone-100 dark:border-stone-700 shadow-sm mb-6">
                                    <MessageSquare className="w-6 h-6 text-[#8C7A6E]" />
                                </div>
                                <h3 className="text-xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Dermal Clinical Chat</h3>
                                <p className="text-sm font-light text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed mb-6">
                                    Select an ongoing consultation thread from the sidebar list, or create a new one to communicate with our active doctor staff.
                                </p>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="px-8 py-3.5 bg-stone-100 dark:bg-stone-800 hover:bg-[#DECFC0] dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-[#4A3C31] dark:text-stone-200 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    Start New Inquiry
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
