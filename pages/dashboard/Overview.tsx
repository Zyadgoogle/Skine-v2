import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Activity as ActivityIcon, Clock, ShieldCheck, User, Shield, Settings, MessageSquare, Send, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function DashboardOverview({ onNavigate }: { onNavigate: (page: string) => void }) {
    const { history, activities, user } = useAuth();
    const latestScan = history[0];
    const [question, setQuestion] = useState('');
    const [consultations, setConsultations] = useState<any[]>([]);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchConsultations();
    }, [user]);

    const fetchConsultations = async () => {
        const { data, error } = await supabase
            .from('consultations')
            .select(`
                *,
                doctor:doctor_id ( name )
            `)
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });
        if (data) setConsultations(data);
    };

    const handleAskSpecialist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !user) return;

        const { error } = await supabase
            .from('consultations')
            .insert({
                user_id: user.id,
                question: question
            });

        if (!error) {
            setQuestion('');
            setIsSuccess(true);
            fetchConsultations();
            setTimeout(() => setIsSuccess(false), 3000);
        }
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <div className="mb-10">
                <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Clinical <span className="text-[#8C7A6E] italic">Overview</span></h2>
                <p className="text-stone-500 font-light">Your dermal biometrics and clinical history at a glance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
                    <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center text-[#4A3C31] dark:text-stone-300 mb-6 shadow-sm">
                        <ActivityIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-1">Latest Scan</div>
                    <div className="text-2xl font-serif text-[#3B302B] dark:text-stone-100">{latestScan?.type || 'No Data'}</div>
                </motion.div>

                <motion.div variants={itemVariants} className="p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
                    <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center text-[#4A3C31] dark:text-stone-300 mb-6 shadow-sm">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-1">Total Analyses</div>
                    <div className="text-2xl font-serif text-[#3B302B] dark:text-stone-100">{history.length}</div>
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="p-10 rounded-[2.5rem] bg-[#4A3C31] text-white shadow-2xl shadow-stone-900/20 mt-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-stone-100/40 mb-2">Priority Action</h3>
                        <div className="text-2xl font-serif text-stone-50 mb-2">Initiate New Scan</div>
                        <p className="text-sm text-stone-300 font-light max-w-sm">Keep your protocol updated with a new dermal analysis.</p>
                    </div>
                    <button
                        onClick={() => onNavigate('dashboard/analysis')}
                        className="px-8 py-4 bg-white text-[#4A3C31] rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        Start Analysis
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-100/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            </motion.div>

            {/* Ask a Specialist Section */}
            <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-stone-800/60 border border-indigo-100 dark:border-stone-800 mt-8 relative shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-900 flex items-center justify-center border border-indigo-200 dark:border-stone-700 text-indigo-600 dark:text-stone-300 shadow-sm shrink-0">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#3B302B] dark:text-stone-200 text-lg">Live Specialist <span className="italic text-indigo-600 dark:text-indigo-400">Consultation</span></h3>
                            <p className="text-xs text-stone-500 font-light max-w-lg mt-1">
                                Get direct, real-time diagnostic help from certified doctors. The system will guide you to capture a live photo of the skin area or upload an image to allow accurate visual examination.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('dashboard/chat')}
                        className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 active:scale-98"
                    >
                        <span>Start Live Consultation</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm mt-8 relative">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center border border-stone-100 dark:border-stone-700">
                            <ActivityIcon className="w-5 h-5 text-[#8C7A6E]" />
                        </div>
                        <h3 className="font-bold text-[#3B302B] dark:text-stone-200 text-lg">System <span className="text-[#8C7A6E] italic">Activity Log</span></h3>
                    </div>
                    {/* English Version (Technical Prompt) requirement: Filtered by user_id is handled in AuthContext */}
                </div>

                <div className="space-y-4">
                    {useAuth().loading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="w-8 h-8 border-4 border-stone-200 border-t-[#4A3C31] rounded-full animate-spin"></div>
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Fetching Synchronized Logs...</span>
                        </div>
                    ) : activities.length > 0 ? (
                        activities.slice(0, 10).map((item, i) => {
                            const Icon = item.icon === 'User' ? User :
                                        item.icon === 'Shield' ? Shield :
                                        item.icon === 'Settings' ? Settings : ActivityIcon;
                            
                            return (
                                <motion.div 
                                    key={item.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-6 py-5 border-b border-stone-100 dark:border-stone-800 last:border-0 last:pb-0 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-[#4A3C31] group-hover:text-white transition-all shadow-sm">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-sm font-bold text-[#3B302B] dark:text-stone-200">{item.title}</h4>
                                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest bg-stone-50 dark:bg-stone-800 px-3 py-1 rounded-full border border-stone-100 dark:border-stone-700">
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 font-light">{item.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-sm text-stone-400 italic font-light">No activity logs synchronized in this clinical session.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
