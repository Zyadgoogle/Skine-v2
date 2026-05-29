import { motion } from 'framer-motion';
import { Save, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import React, { useState } from 'react';

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function DoctorProfile() {
    const { user, updateProfile } = useAuth();
    const [saved, setSaved] = useState(false);
    
    // Form states
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [profileImage, setProfileImage] = useState<string | undefined>((user as any)?.avatar);
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
        updateProfile({ name, email, phone, bio, avatar: profileImage as any } as any, 'Doctor Profile Updated');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (user?.role !== 'doctor') {
        return <div className="p-8 text-center bg-white dark:bg-stone-900 mx-auto max-w-xl mt-12 rounded-3xl shadow-sm">Unauthorized access. Doctors only.</div>;
    }

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-3xl mx-auto pb-24"
        >
            <div className="mb-10 text-center">
                <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Doctor <span className="text-[#8C7A6E] italic">Profile</span></h2>
                <p className="text-stone-500 font-light">Manage your clinical identity.</p>
            </div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-10 shadow-sm">

                {/* Profile Picture Header */}
                <div className="flex items-center gap-8 mb-12 pb-10 border-b border-stone-100 dark:border-stone-800">
                    <div className="relative">
                        <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800 rounded-3xl flex items-center justify-center text-4xl font-serif text-[#3B302B] dark:text-stone-300 shadow-inner overflow-hidden">
                            {profileImage && profileImage.length > 10 ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.[0]?.toUpperCase() || 'P'
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
                        <p className="text-sm text-emerald-600 uppercase tracking-widest font-bold text-[10px] mt-1">Clinical Doctor</p>
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
                            <label htmlFor="email" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Gmail / Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled
                                className="w-full px-6 py-4 bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm dark:text-stone-400 text-stone-400 cursor-not-allowed"
                                title="Primary endpoint locked for clinical accounts."
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label htmlFor="bio" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Bio</label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200 resize-none"
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
