import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useState } from 'react';

export function ForgotPassword({ onNavigate }: { onNavigate: (page: string) => void }) {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
            className="max-w-md mx-auto py-20"
        >
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-10 shadow-2xl">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[#4A3C31] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                        <Mail className="w-8 h-8 text-stone-100" />
                    </div>
                    <h2 className="text-3xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Reset Access</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 font-light">
                        Regain control of your clinical profile
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Associated Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                placeholder="clinical@example.com"
                                className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#4A3C31] hover:bg-[#3B302B] text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#4A3C31]/20 box-border text-center"
                        >
                            Send Reset Link
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl"
                    >
                        <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2">Check Your Inbox</h3>
                        <p className="text-sm text-emerald-600 dark:text-emerald-500/80">
                            We've dispatched a recovery protocol to your email.
                        </p>
                    </motion.div>
                )}

                <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800 text-center">
                    <button
                        onClick={() => onNavigate('login')}
                        className="font-bold text-[#4A3C31] dark:text-stone-300 hover:text-[#8C7A6E] transition-colors"
                    >
                        Return to Authentication
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
