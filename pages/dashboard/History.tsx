import { useState } from 'react';
import { Camera, Calendar, Activity, Shield, User, Settings as SettingsIcon } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function DashboardHistory() {
    const { history, activities } = useAuth();
    const [activeTab, setActiveTab] = useState<'scans' | 'activities'>('scans');

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Clinical <span className="text-[#8C7A6E] italic">Vault</span></h2>
                    <p className="text-stone-500 font-light">Comprehensive record of your dermal evolution and platform interactions.</p>
                </div>
                
                <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700">
                    <button 
                        onClick={() => setActiveTab('scans')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'scans' ? 'bg-white dark:bg-stone-700 text-[#4A3C31] dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Clinical Scans
                    </button>
                    <button 
                        onClick={() => setActiveTab('activities')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'activities' ? 'bg-white dark:bg-stone-700 text-[#4A3C31] dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Audit Trail
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] overflow-hidden shadow-sm"
                >
                    <div className="overflow-x-auto">
                        {activeTab === 'scans' ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest pl-10">Scan Preview</th>
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest"><Calendar className="w-4 h-4 inline mr-2" /> Date</th>
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Detected Biotype</th>
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Clinical Result</th>
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length > 0 ? history.map((entry) => (
                                        <tr key={entry.id} className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                                            <td className="p-6 pl-10">
                                                <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center border border-stone-200 dark:border-stone-700">
                                                    <Camera className="w-6 h-6 text-stone-400" />
                                                </div>
                                            </td>
                                            <td className="p-6 text-sm font-bold text-[#3B302B] dark:text-stone-300">
                                                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </td>
                                            <td className="p-6 text-sm text-stone-600 dark:text-stone-400">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full font-medium text-xs border border-emerald-100 dark:border-emerald-800/30 uppercase tracking-widest">
                                                    {entry.type}
                                                </span>
                                            </td>
                                            <td className="p-6 text-sm text-stone-600 dark:text-stone-400">
                                                <div className="flex items-center gap-2">
                                                    <Activity className={`w-4 h-4 ${entry.result.includes('Optimal') ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                    {entry.result}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#4A3C31]" style={{ width: `${entry.score}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-stone-500">{entry.score}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center text-stone-400 italic font-light">No clinical scans recorded in this session.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest pl-10">Action Type</th>
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Operational Detail</th>
                                        <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest"><Calendar className="w-4 h-4 inline mr-2" /> Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.length > 0 ? activities.map((entry) => {
                                        const Icon = entry.icon === 'User' ? User :
                                                    entry.icon === 'Shield' ? Shield :
                                                    entry.icon === 'Settings' ? SettingsIcon : Activity;
                                        return (
                                            <tr key={entry.id} className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                                                <td className="p-6 pl-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 border border-stone-100 dark:border-stone-700">
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-sm font-bold text-[#3B302B] dark:text-stone-300">{entry.title}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm text-stone-600 dark:text-stone-400 font-light truncate max-w-md">
                                                    {entry.description}
                                                </td>
                                                <td className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={3} className="p-20 text-center text-stone-400 italic font-light">No operational activities recorded in this session.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

import { AnimatePresence } from 'framer-motion';
