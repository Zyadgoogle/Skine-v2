import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, User, Activity, MessageSquare, Send, CheckCircle2,
    ChevronRight, Eye, ShieldCheck, Clock, Loader2, Sparkles, Filter, X, CornerDownLeft, AlertCircle, EyeOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { consultationsStorage, Message, Consultation } from '../../lib/consultationsStorage';

export function DoctorDashboard() {
    const { user, addActivity } = useAuth();

    // Consultation states
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'answered'>('all');
    const [queueFilter, setQueueFilter] = useState<'my' | 'open' | 'all'>('open');
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);

    // UI Panel Toggles for spacious layout comfort
    const [showDossier, setShowDossier] = useState(true);

    // Selected Patient details (loaded automatically)
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [loadingPatient, setLoadingPatient] = useState(false);

    // Reply & Chat state
    const [chatInput, setChatInput] = useState('');
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

    // Search bar state
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'doctor') return;
        fetchConsultations();
    }, [user]);

    // Real-time subscription for selected consultation updates in Supabase
    useEffect(() => {
        if (!selectedConsultation || selectedConsultation.id.startsWith('local_')) return;

        const channel = supabase
            .channel(`doctor_chat_${selectedConsultation.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'consultations',
                filter: `id=eq.${selectedConsultation.id}`
            }, (payload) => {
                supabase
                    .from('consultations')
                    .select(`
                        *,
                        profiles:user_id ( id, name, email, bio, dob )
                    `)
                    .eq('id', selectedConsultation.id)
                    .single()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Error fetching real-time update:', error);
                        } else if (data) {
                            setSelectedConsultation(data as any);
                            setConsultations(prev => prev.map(c => c.id === data.id ? (data as any) : c));
                        }
                    });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConsultation?.id]);

    // Listen to changes in consultations table globally in Supabase
    useEffect(() => {
        if (!user || user.role !== 'doctor') return;
        const channel = supabase
            .channel('doctor_global_consultations')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'consultations'
            }, () => {
                fetchConsultations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Local Storage sync listener for local fallback sync across tabs in real-time
    useEffect(() => {
        const handleStorageSync = (e: StorageEvent) => {
            if (e.key === 'skine_local_consultations') {
                console.log('Doctor LocalStorage change detected, syncing list...');
                const localList = consultationsStorage.getAll();
                setConsultations(localList);
                if (selectedConsultation) {
                    const fresh = localList.find(c => c.id === selectedConsultation.id);
                    if (fresh) setSelectedConsultation(fresh);
                }
            }
        };
        window.addEventListener('storage', handleStorageSync);
        return () => window.removeEventListener('storage', handleStorageSync);
    }, [selectedConsultation?.id]);

    // Auto scroll chat
    useEffect(() => {
        chatScrollRef.current?.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [selectedConsultation?.messages]);

    // Fetch patient biography & skin scan logs automatically when inquiry is selected
    useEffect(() => {
        if (!selectedConsultation) return;
        fetchPatientData(selectedConsultation.user_id);
    }, [selectedConsultation?.id]);

    const fetchConsultations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('consultations')
                .select(`
                    *,
                    profiles:user_id ( id, name, email, bio, dob )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setConsultations(data as any[]);
                // Refresh selected consultation object
                if (selectedConsultation) {
                    const fresh = data.find(c => c.id === selectedConsultation.id);
                    if (fresh) setSelectedConsultation(fresh as any);
                }
            }
        } catch (err: any) {
            console.warn('Supabase fetch failed for doctor, loading from local sync:', err);
            setDbError('local_mode');
            const localList = consultationsStorage.getAll();
            setConsultations(localList);
            if (selectedConsultation) {
                const fresh = localList.find(c => c.id === selectedConsultation.id);
                if (fresh) setSelectedConsultation(fresh);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientData = async (patientId: string) => {
        setLoadingPatient(true);
        try {
            const { data: histData } = await supabase
                .from('analysis_history')
                .select('*')
                .eq('user_id', patientId)
                .order('date', { ascending: false });

            if (histData) setPatientHistory(histData);
        } catch (err) {
            console.error('Fetch Patient Data Error:', err);
        } finally {
            setLoadingPatient(false);
        }
    };

    // Send reply & append to messages
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !selectedConsultation || !user) return;

        setSending(true);
        const newMsg: Message = {
            sender: 'doctor',
            text: chatInput.trim(),
            created_at: new Date().toISOString()
        };

        const updatedMessages = [...(selectedConsultation.messages || []), newMsg];
        const answerText = chatInput.trim();
        const currentInput = chatInput;
        setChatInput('');

        // Try Supabase first, fallback to Local Storage
        try {
            if (selectedConsultation.id.startsWith('local_')) {
                throw new Error('Local consultation active');
            }

            const { error } = await supabase
                .from('consultations')
                .update({
                    doctor_id: user.id, // Explicitly assign to current responding doctor
                    answer: answerText, // Maintain backward compatibility
                    status: 'answered',
                    answered_at: new Date().toISOString(),
                    messages: updatedMessages
                })
                .eq('id', selectedConsultation.id);

            if (error) throw error;

            // Log activity for audit
            addActivity({
                type: 'admin',
                title: 'Clinical Inquiry Answered',
                description: `Doctor ${user.name} messaged User ${selectedConsultation.profiles?.name || selectedConsultation.user_id}`,
                icon: 'MessageSquare'
            });

            // Update locally
            const nextVal = {
                ...selectedConsultation,
                doctor_id: user.id,
                answer: answerText,
                status: 'answered' as const,
                answered_at: new Date().toISOString(),
                messages: updatedMessages
            };
            setSelectedConsultation(nextVal);
            setConsultations(prev => prev.map(c => c.id === selectedConsultation.id ? nextVal : c));
        } catch (err: any) {
            console.log('clinical reply failed on Supabase, writing to local sync:', err);
            setDbError('local_mode');

            const updatedItem = consultationsStorage.update(selectedConsultation.id, {
                doctor_id: user.id,
                answer: answerText,
                status: 'answered',
                messages: updatedMessages
            });

            if (updatedItem) {
                setSelectedConsultation(updatedItem);
                setConsultations(consultationsStorage.getAll());

                // Trigger a storage event so user tab updates instantly!
                localStorage.setItem('skine_local_consultations', JSON.stringify(consultationsStorage.getAll()));
            }
        } finally {
            setSending(false);
        }
    };

    // Filter consultations based on queue type, status, and search query
    const filteredConsultations = consultations.filter(c => {
        // 1. Queue Filter
        const matchesQueue =
            queueFilter === 'all' ||
            (queueFilter === 'my' && c.doctor_id === user?.id) ||
            (queueFilter === 'open' && c.doctor_id === null);

        // 2. Status Filter
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'pending' && c.status === 'pending') ||
            (filterStatus === 'answered' && c.status === 'answered');

        // 3. Search query
        const name = c.profiles?.name?.toLowerCase() || '';
        const email = c.profiles?.email?.toLowerCase() || '';
        const question = c.question.toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch =
            name.includes(query) ||
            email.includes(query) ||
            question.includes(query);

        return matchesQueue && matchesStatus && matchesSearch;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-[#4A3C31] rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-3xl font-serif text-[#3B302B] dark:text-stone-100">
                        Clinical <span className="text-[#8C7A6E] italic">Workspace</span>
                    </h2>
                    <p className="text-sm font-light text-stone-500">Doctor Diagnostic Chat & Dermal Dossiers</p>
                </div>
            </div>



            {/* main clinical grid */}
            <div className="grid lg:grid-cols-4 gap-8 min-h-[640px]">

                {/* 1. LEFT SIDEBAR: ACTIVE INQUIRIES LIST & CLINICAL FILTERS */}
                <div className="lg:col-span-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-6 shadow-sm flex flex-col max-h-[760px] overflow-hidden">
                    <div className="space-y-3 mb-4">
                        <h3 className="font-bold text-stone-700 dark:text-stone-300 text-[10px] uppercase tracking-widest pb-1.5 border-b border-stone-100 dark:border-stone-800">
                            Active Inquiries
                        </h3>

                        {/* Search Patient */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search client name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-8 pr-3 py-1.5 text-[10px] focus:outline-none focus:border-[#8C7A6E] dark:text-stone-200"
                            />
                            <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-stone-400" />
                        </div>

                        {/* Queue Filter Stack - Vertical & Compact */}
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Assigned Queue</span>
                            <div className="space-y-0.5">
                                {['my', 'open', 'all'].map((q) => {
                                    const label = q === 'my' ? 'My Queue' : q === 'open' ? 'Open Inquiries' : 'All Consultations';
                                    const isActive = queueFilter === q;
                                    const count = consultations.filter(c => {
                                        if (q === 'my') return c.doctor_id === user?.id;
                                        if (q === 'open') return c.doctor_id === null;
                                        return true;
                                    }).length;

                                    return (
                                        <button
                                            key={q}
                                            onClick={() => setQueueFilter(q as any)}
                                            className={`w-full py-1 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer border ${isActive
                                                ? 'bg-[#4A3C31] dark:bg-[#5C4D42] text-white border-transparent shadow-sm'
                                                : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-300'
                                                }`}
                                        >
                                            <span>{label}</span>
                                            <span className={`px-1 py-0.2 rounded-full text-[8px] font-bold ${isActive ? 'bg-white text-[#4A3C31]' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                                                }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status Filter Stack - Vertical & Compact */}
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Inquiry Status</span>
                            <div className="space-y-0.5">
                                {['all', 'pending', 'answered'].map((status) => {
                                    const label = status === 'all' ? 'All Inquiries' : status === 'pending' ? 'Pending Reply' : 'Answered Cases';
                                    const isActive = filterStatus === status;
                                    const count = consultations.filter(c => {
                                        const matchesQueue =
                                            queueFilter === 'all' ||
                                            (queueFilter === 'my' && c.doctor_id === user?.id) ||
                                            (queueFilter === 'open' && c.doctor_id === null);
                                        const matchesStatus = status === 'all' || c.status === status;
                                        return matchesQueue && matchesStatus;
                                    }).length;

                                    return (
                                        <button
                                            key={status}
                                            onClick={() => setFilterStatus(status as any)}
                                            className={`w-full py-1 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer border ${isActive
                                                ? 'bg-[#8C7A6E] dark:bg-[#9B897D] text-white border-transparent shadow-sm'
                                                : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-300'
                                                }`}
                                        >
                                            <span>{label}</span>
                                            <span className={`px-1 py-0.2 rounded-full text-[8px] font-bold ${isActive ? 'bg-white text-[#8C7A6E]' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                                                }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin border-t border-stone-100 dark:border-stone-800 pt-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                <Loader2 className="w-6 h-6 text-[#4A3C31] animate-spin" />
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Loading Patient Stream...</span>
                            </div>
                        ) : filteredConsultations.length === 0 ? (
                            <div className="text-center py-16 text-stone-400 text-xs font-light bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-stone-100 dark:border-stone-800">
                                No consultations found matching current filters.
                            </div>
                        ) : (
                            filteredConsultations.map(c => {
                                const isSelected = selectedConsultation?.id === c.id;
                                const lastMsg = c.messages?.[c.messages.length - 1];
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedConsultation(c)}
                                        className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-start gap-3 cursor-pointer ${isSelected
                                            ? 'bg-[#4A3C31] text-stone-50 border-transparent shadow-lg shadow-stone-900/10'
                                            : 'bg-stone-50 dark:bg-stone-800/30 border-stone-150 dark:border-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs uppercase ${isSelected ? 'bg-white/10 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                                            }`}>
                                            {c.profiles?.name?.charAt(0) || 'U'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-1 mb-0.5">
                                                <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-white' : 'text-stone-800 dark:text-stone-200'
                                                    }`}>
                                                    {c.profiles?.name || 'Unknown Patient'}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider shrink-0 ${c.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-850 border border-amber-200'
                                                    : 'bg-emerald-100 text-emerald-850 border border-emerald-250'
                                                    }`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                            <p className={`text-[10px] truncate ${isSelected ? 'text-stone-300' : 'text-stone-500 font-light'
                                                }`}>
                                                {lastMsg ? lastMsg.text : c.question}
                                            </p>
                                            <div className={`text-[8px] mt-1 font-medium ${isSelected ? 'text-stone-400' : 'text-stone-400'
                                                }`}>
                                                {new Date(c.created_at).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. RIGHT CLINICAL WORKBENCH */}
                <div className="lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden max-h-[760px] min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {selectedConsultation ? (
                            <motion.div
                                key={selectedConsultation.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col h-full overflow-hidden flex-1"
                            >
                                {/* Workspace Header */}
                                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50 gap-4 flex-wrap">
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-[#3B302B] dark:text-stone-200 flex items-center gap-2 truncate">
                                            <span>Diagnostic Thread: {selectedConsultation.profiles?.name || 'Unknown Patient'}</span>
                                            {selectedConsultation.image_url && <Eye className="w-4 h-4 text-indigo-500 animate-pulse" />}
                                        </h3>
                                        <p className="text-xs text-stone-500 mt-0.5 truncate">{selectedConsultation.profiles?.email}</p>
                                    </div>

                                    {/* Workspace Layout Drawer Toggles */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setShowDossier(!showDossier)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${showDossier
                                                ? 'bg-[#4A3C31] text-white border-transparent shadow-sm'
                                                : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-300 hover:bg-stone-100'
                                                }`}
                                        >
                                            {showDossier ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            <span>{showDossier ? 'Hide Dossier' : 'Dossier'}</span>
                                        </button>

                                        <button
                                            onClick={() => setSelectedConsultation(null)}
                                            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400 transition-colors lg:hidden"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 grid md:grid-cols-5 overflow-hidden">

                                    {/* Panel A: Dermal Dossier & Bio Details (Left) */}
                                    {showDossier && (
                                        <div className="md:col-span-2 border-r border-stone-100 dark:border-stone-800 p-6 space-y-6 overflow-y-auto max-h-[500px] md:max-h-full scrollbar-thin transition-all duration-300">

                                            {/* Skin Attachment Inspection */}
                                            {selectedConsultation.image_url ? (
                                                <div className="space-y-3">
                                                    <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Diagnostic Attachment</h4>
                                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-stone-250 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 group relative shadow-sm">
                                                        <img
                                                            src={selectedConsultation.image_url}
                                                            alt="Dermal problem sample"
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                        <a
                                                            href={selectedConsultation.image_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                                        >
                                                            Inspect Dermal Sample
                                                        </a>
                                                    </div>
                                                    <p className="text-[9px] text-stone-400 italic text-center font-light">visual skin area uploaded by patient</p>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl text-[11px] text-amber-700 dark:text-amber-400">
                                                    Patient did not upload any skin photo.
                                                </div>
                                            )}

                                            {/* Patient Biography */}
                                            <div className="space-y-3">
                                                <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Patient Profile Biography</h4>
                                                <div className="p-5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl space-y-4 border border-stone-100 dark:border-stone-800 text-xs">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Biography Context</span>
                                                        <span className="text-stone-600 dark:text-stone-300 font-light block mt-1 leading-relaxed">
                                                            {selectedConsultation.profiles?.bio || 'No profile biography provided.'}
                                                        </span>
                                                    </div>
                                                    {selectedConsultation.profiles?.dob && (
                                                        <div>
                                                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Calculated Patient Age</span>
                                                            <span className="text-stone-700 dark:text-stone-200 font-semibold block mt-0.5">
                                                                {Math.floor((new Date().getTime() - new Date(selectedConsultation.profiles.dob).getTime()) / 31536000000)} Years
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Skin Analysis History */}
                                            <div className="space-y-3">
                                                <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">AI Dermal Diagnostic History</h4>
                                                <div className="space-y-2.5">
                                                    {loadingPatient ? (
                                                        <div className="flex justify-center py-4">
                                                            <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
                                                        </div>
                                                    ) : patientHistory.length === 0 ? (
                                                        <p className="text-[11px] text-stone-400 italic font-light">No analysis records on file.</p>
                                                    ) : (
                                                        patientHistory.slice(0, 3).map(h => (
                                                            <div key={h.id} className="p-3.5 bg-stone-50 dark:bg-stone-800/30 rounded-xl border border-stone-100 dark:border-stone-800 flex justify-between items-center text-xs">
                                                                <div>
                                                                    <div className="font-bold text-[#3B302B] dark:text-stone-200">{h.type}</div>
                                                                    <div className="text-[10px] text-stone-400 font-light mt-0.5">{h.result}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-[#8C7A6E]">{h.score}%</div>
                                                                    <div className="text-[9px] text-stone-400">{new Date(h.date).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Panel B: Message Chat Stream & Input (Right) */}
                                    <div className={`flex flex-col overflow-hidden h-[460px] md:h-full transition-all duration-300 ${showDossier ? 'md:col-span-3' : 'md:col-span-5'
                                        }`}>
                                        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-stone-50/20 dark:bg-stone-900/20">
                                            {/* Render initial question as a user chat bubble */}
                                            <div className="flex flex-col items-start">
                                                <span className="text-[8px] text-stone-400 font-bold uppercase tracking-widest px-1 mb-1">
                                                    Initial Patient Inquiry
                                                </span>
                                                <div className="max-w-[85%] p-4 rounded-[1.5rem] rounded-tl-none text-sm leading-relaxed bg-indigo-50/30 border border-indigo-100 dark:bg-stone-800 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-sm">
                                                    {selectedConsultation.question}
                                                </div>
                                                <span className="text-[9px] text-stone-400 font-medium tracking-wide mt-1.5 px-1 uppercase">
                                                    {new Date(selectedConsultation.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Sub-messages inside JSON array */}
                                            {selectedConsultation.messages?.map((msg, i) => {
                                                const isSelf = msg.sender === 'doctor';
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                                                    >
                                                        <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${isSelf
                                                            ? 'bg-[#4A3C31] dark:bg-[#5C4D42] text-white rounded-tr-none'
                                                            : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-tl-none border border-stone-100 dark:border-stone-800'
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

                                        {/* Doctor Reply box */}
                                        <form onSubmit={handleSendReply} className="p-4 border-t border-stone-100 dark:border-stone-800 flex gap-2 items-center bg-white dark:bg-stone-900">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder={selectedConsultation.doctor_id ? "Provide detailed clinical advice or response..." : "Answering will automatically assign this case to your queue..."}
                                                className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-5 py-3 text-sm focus:outline-none dark:text-stone-200 focus:border-[#8C7A6E] transition-colors"
                                            />
                                            <button
                                                type="submit"
                                                disabled={sending || !chatInput.trim()}
                                                className="w-12 h-12 bg-[#4A3C31] text-white rounded-2xl flex items-center justify-center shadow-md hover:bg-[#3B302B] disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                                            >
                                                {sending ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="workspace-empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-12 flex flex-col items-center justify-center text-center flex-1 h-full"
                            >
                                <div className="w-14 h-14 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center border border-stone-100 dark:border-stone-700 shadow-sm mb-6">
                                    <MessageSquare className="w-6 h-6 text-[#8C7A6E]" />
                                </div>
                                <h3 className="text-xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Clinical Workspace Chat</h3>
                                <p className="text-sm font-light text-stone-500 max-w-sm leading-relaxed">
                                    Select an active patient inquiry from the left sidebar to access their biometric dossier, examine skin photos, and begin clinical consultation.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
