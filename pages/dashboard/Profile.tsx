import { motion } from 'framer-motion';
import { Save, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import React, { useState } from 'react';

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function DashboardProfile() {
    const { user, updateProfile } = useAuth();
    const [saved, setSaved] = useState(false);
    
    // Form states
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileImage, setProfileImage] = useState<string | undefined>(user?.avatar);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile({ name, email, avatar: profileImage } as any, 'Dermal Profile Updated');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-3xl"
        >
            <div className="mb-10">
                <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Personal <span className="text-[#8C7A6E] italic">Profile</span></h2>
                <p className="text-stone-500 font-light">Manage your network identity and clinical preferences.</p>
            </div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-10 shadow-sm">

                {/* Profile Picture Header */}
                <div className="flex items-center gap-8 mb-12 pb-10 border-b border-stone-100 dark:border-stone-800">
                    <div className="relative">
                        <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800 rounded-3xl flex items-center justify-center text-4xl font-serif text-[#3B302B] dark:text-stone-300 shadow-inner overflow-hidden">
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#4A3C31] text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#3B302B] dark:text-stone-200">{user?.name}</h3>
                        <p className="text-sm text-stone-500 uppercase tracking-widest font-bold text-[10px] mt-1">{user?.role} Access Level</p>
                    </div>
                </div>

                <form className="space-y-8" onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200 text-stone-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Password (Password)</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Leave blank to keep current"
                                className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200"
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        {saved ? (
                            <span className="text-sm font-bold text-emerald-600 block transition-all">Profile changes synchronized.</span>
                        ) : (
                            <span className="text-sm text-transparent select-none">Buffer</span>
                        )}

                        <button
                            type="submit"
                            className="px-10 py-4 bg-[#4A3C31] hover:bg-[#3B302B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#4A3C31]/20 transition-all flex items-center gap-3"
                        >
                            <Save className="w-4 h-4" /> Save Configuration
                        </button>
                    </div>
                </form>

            </motion.div>
        </motion.div>
    );
}
