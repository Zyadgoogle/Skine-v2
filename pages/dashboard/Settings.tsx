import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Shield, Bell, Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function DashboardSettings({ onNavigate }: { onNavigate: (page: string) => void }) {
    const { user, logout, updateProfile, loading: authLoading } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form states
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [gender, setGender] = useState(user?.gender || 'female');
    const [dob, setDob] = useState(user?.dob || '');
    const [avatar, setAvatar] = useState(user?.avatar || 'female');

    // Notification states
    const [notifications, setNotifications] = useState(user?.notifications || {
        scanReminders: true,
        protocolNotifications: true,
        productUpdates: true
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile({ name, bio, phone, gender, dob, avatar, notifications }, 'Platform Configuration Synchronized');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (key: keyof typeof notifications) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);
        // Persist immediately on toggle as per specific requirement
        await updateProfile({ notifications: updated }, `Preference Updated: ${key}`);
    };

    const handleAvatarChange = async (newAvatar: 'male' | 'female') => {
        setAvatar(newAvatar);
        await updateProfile({ avatar: newAvatar }, 'Avatar representation updated');
    };

    const handleTerminate = async () => {
        await logout();
        onNavigate('home');
    };

    const sections = [
        { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
        { id: 'account', label: 'Account Security', icon: <Shield className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        { id: 'privacy', label: 'Privacy', icon: <Eye className="w-4 h-4" /> },
    ];

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-stone-200 border-t-[#4A3C31] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">System <span className="text-[#8C7A6E] italic">Settings</span></h2>
                    <p className="text-stone-500 font-light">Configure your clinical environment and account preferences.</p>
                </div>
                
                {/* User Info (Hiding Last Active as per request for non-admins) */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl font-serif text-[#3B302B] dark:text-stone-300 overflow-hidden">
                            {avatar === 'female' ? '♀' : '♂'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-[#3B302B] dark:text-stone-200">{user?.name}</div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                            Clinical Profile ID: SKN-{user?.id?.slice(0, 4)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-2">
                    {/* Sidebar Buttons connected to Dashboard Routes */}
                    <div className="mb-6 space-y-1">
                        <p className="px-6 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Clinical Console</p>
                        <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-4 px-6 py-3 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-left">
                           Dashboard
                        </button>
                        <button onClick={() => onNavigate('dashboard/analysis')} className="w-full flex items-center gap-4 px-6 py-3 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-left">
                           Skin Analysis
                        </button>
                    </div>

                    <p className="px-6 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2">Configuration</p>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                                activeSection === section.id
                                    ? 'bg-[#4A3C31] text-white shadow-lg shadow-stone-900/10'
                                    : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }`}
                        >
                            {section.icon}
                            {section.label}
                        </button>
                    ))}
                    <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
                        <button 
                            onClick={handleTerminate}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Terminate Session
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            variants={itemVariants}
                            initial="initial"
                            animate="animate"
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-10 shadow-sm"
                        >
                        <form className="space-y-8" onSubmit={handleSave}>
                            {activeSection === 'profile' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Gender</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAvatarChange('female')}
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${avatar === 'female' ? 'bg-[#4A3C31] text-white' : 'bg-stone-50 dark:bg-stone-800'}`}
                                                >
                                                    <span className="text-xl">♀</span>
                                                    <span className="text-[10px] font-bold uppercase">Female</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAvatarChange('male')}
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${avatar === 'male' ? 'bg-[#4A3C31] text-white' : 'bg-stone-50 dark:bg-stone-800'}`}
                                                >
                                                    <span className="text-xl">♂</span>
                                                    <span className="text-[10px] font-bold uppercase">Male</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Contact Endpoint</label>
                                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" placeholder="+1 (555) 000-0000" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Display Name</label>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Birth Date</label>
                                                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Clinical Bio</label>
                                        <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200 resize-none" placeholder="Describe your skin history or concerns..." />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'account' && (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Email</label>
                                        <input type="email" readOnly defaultValue={user?.email} className="w-full px-6 py-4 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm text-stone-400 cursor-not-allowed" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">New Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Confirm Key</label>
                                            <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-4 text-amber-700 dark:text-amber-400 text-sm">
                                        <Shield className="w-5 h-5 shrink-0" />
                                        <p>Two-factor authentication is recommended for clinical-grade data protection.</p>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'notifications' && (
                                <div className="space-y-6">
                                    {[
                                        { id: 'scanReminders' as const, label: 'Dermal Scan Reminders', desc: 'Alerts for scheduled topography analysis.' },
                                        { id: 'protocolNotifications' as const, label: 'Protocol Notifications', desc: 'Reminders for AM/PM skincare routines.' },
                                        { id: 'productUpdates' as const, label: 'Product Synthesis Updates', desc: 'New formula and product recommendations.' }
                                    ].map((pref) => (
                                        <div key={pref.id} className="flex items-center justify-between p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700">
                                            <div className="space-y-1">
                                                <div className="font-bold text-[#3B302B] dark:text-stone-200">{pref.label}</div>
                                                <div className="text-xs text-stone-400">{pref.desc}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(pref.id)}
                                                className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${notifications[pref.id] ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                                            >
                                                <motion.div 
                                                    animate={{ x: notifications[pref.id] ? 24 : 4 }}
                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeSection === 'privacy' && (
                                <div className="space-y-8">
                                    <div className="p-8 rounded-[2rem] bg-stone-900 text-white space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <Eye className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <h4 className="text-xl font-serif">Anonymized Training</h4>
                                        </div>
                                        <p className="text-sm text-stone-400 leading-relaxed font-light">
                                            Contribute your anonymized dermal models to improve our global diagnostic accuracy. We never share personally identifiable information.
                                        </p>
                                        <button type="button" className="text-xs font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors">Toggle Participation</button>
                                    </div>
                                    <div className="space-y-4">
                                        <button type="button" className="w-full px-6 py-4 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm font-bold text-[#3B302B] dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-left font-sans">
                                            Download Data Archive (.json)
                                        </button>
                                        <button type="button" className="w-full px-6 py-4 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left font-sans">
                                            Request Account Termination
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                                {saved ? (
                                    <span className="text-sm font-bold text-emerald-600 block transition-all">Configuration synchronized.</span>
                                ) : (
                                    <span className="text-sm text-transparent select-none">Buffer</span>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-10 py-4 bg-[#4A3C31] hover:bg-[#3B302B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-stone-900/10 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Commit Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

import { Loader2 } from 'lucide-react';
