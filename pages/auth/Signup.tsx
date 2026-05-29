import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export function Signup({ onNavigate }: { onNavigate: (page: string) => void }) {
    const { signup } = useAuth();

    const [error, setError] = useState<string | null>(null);
    const [isEstablishing, setIsEstablishing] = useState(false);

    const [avatar, setAvatar] = useState<'male' | 'female'>('female');

    const validateStrongPassword = (password: string) => {
        if (password.length < 10) return 'Password must be at least 10 characters.';
        if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
        if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
        if (!/[0-9]/.test(password)) return 'Password must include a number.';
        if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a special character.';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsEstablishing(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;
        const rawPhone = formData.get('phone') as string;
        const countryCode = formData.get('countryCode') as string;
        const phone = `${countryCode} ${rawPhone}`;
        const gender = formData.get('gender') as 'male' | 'female';
        const dob = formData.get('dob') as string;
        const passwordError = validateStrongPassword(password);

        if (passwordError) {
            setError(passwordError);
            setIsEstablishing(false);
            return;
        }

        try {
            await signup(email, password, name, { phone, gender, dob, avatar });
            onNavigate('dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsEstablishing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
            className="max-w-2xl mx-auto py-10"
        >
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-10 shadow-2xl">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[#4A3C31] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                        <UserPlus className="w-8 h-8 text-stone-100" />
                    </div>
                    <h2 className="text-3xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Join the <span className="text-[#8C7A6E] italic">Network</span></h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 font-light">
                        Establish your permanent dermal profile ID.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2 px-2">Clinical Identity</p>

                            <div className="space-y-2">
                                <label htmlFor="name" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Full Name</label>
                                <input type="text" id="name" name="name" required placeholder="Jane Doe" className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Email</label>
                                <input type="email" id="email" name="email" required placeholder="clinical@example.com" className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Password</label>
                                <input type="password" id="password" name="password" required minLength={10} placeholder="10+ chars, upper, lower, number, symbol" className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                                <p className="text-[10px] text-stone-400 font-light px-2">
                                    Use at least 10 characters with uppercase, lowercase, number, and symbol.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2 px-2">Biometric Data</p>

                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Contact Number</label>
                                <div className="flex gap-2">
                                    <select name="countryCode" defaultValue="+1" className="px-4 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200 appearance-none w-24">
                                        <option value="+1">+1 (US)</option>
                                        <option value="+20">+20 (EG)</option>
                                        <option value="+44">+44 (UK)</option>
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+971">+971 (AE)</option>
                                    </select>
                                    <input type="tel" id="phone" name="phone" required pattern="[0-9]*" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }} placeholder="5550000000" className="flex-1 px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="gender" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Gender</label>
                                    <select id="gender" name="gender" required className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200 appearance-none">
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="dob" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Birth Date</label>
                                    <input type="date" id="dob" name="dob" required className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none dark:text-stone-200" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-2">Visual Representation</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAvatar('female')}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${avatar === 'female' ? 'bg-[#4A3C31] text-white border-[#4A3C31]' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">♀</div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Female</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAvatar('male')}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${avatar === 'male' ? 'bg-[#4A3C31] text-white border-[#4A3C31]' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">♂</div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Male</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isEstablishing}
                        className="w-full py-5 bg-[#4A3C31] hover:bg-[#3B302B] text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#4A3C31]/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {isEstablishing ? 'Establishing Profile...' : 'Establish Clinical Profile'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800 text-center">
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        Already registered?{' '}
                        <button
                            onClick={() => onNavigate('login')}
                            className="font-bold text-[#4A3C31] dark:text-stone-300 hover:text-[#8C7A6E] transition-colors"
                        >
                            Authenticate Here
                        </button>
                    </p>
                </div>

                <button
                    onClick={() => onNavigate('home')}
                    className="mt-8 flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-[#3B302B] mx-auto transition-colors"
                >
                    <ArrowLeft className="w-3 h-3" /> Return to Platform
                </button>
            </div>
        </motion.div>
    );
}
