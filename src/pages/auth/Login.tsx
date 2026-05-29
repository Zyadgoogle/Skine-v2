import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export function Login({ onNavigate }: { onNavigate: (page: string) => void }) {
    const { login, loginWithGoogle } = useAuth();

    const [error, setError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

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
        setIsAuthenticating(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const passwordError = validateStrongPassword(password);
        if (passwordError) {
            setError(passwordError);
            setIsAuthenticating(false);
            return;
        }

        try {
            await login(email, password);
            const role = email.toLowerCase().includes('admin') ? 'admin' : email.toLowerCase().endsWith('@clinical.com') ? 'doctor' : 'dashboard';
            onNavigate(role);
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsAuthenticating(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Google authentication failed.');
            setIsAuthenticating(false);
        }
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
                        <ShieldCheck className="w-8 h-8 text-stone-100" />
                    </div>
                    <h2 className="text-3xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Welcome Back</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 font-light">
                        Access your clinical dermal profile
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Client Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="clinical@example.com"
                            className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center pl-2">
                            <label htmlFor="password" className="text-xs font-bold text-stone-400 uppercase tracking-widest">Password</label>
                            <button
                                type="button"
                                onClick={() => onNavigate('forgot-password')}
                                className="text-xs text-[#8C7A6E] font-medium hover:text-[#4A3C31] transition-colors"
                            >
                                Reset Access
                            </button>
                        </div>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            placeholder="Enter your secure key"
                            className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C7A6E]/50 focus:border-[#8C7A6E] transition-all dark:text-stone-200"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full py-4 bg-[#4A3C31] hover:bg-[#3B302B] text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#4A3C31]/20 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAuthenticating ? 'Authenticating...' : 'Authenticate'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-6">
                    <button
    type="button"
    onClick={handleGoogleLogin}
    disabled={isAuthenticating}
    className="w-full py-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-[#3B302B] dark:text-stone-100 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
>
    <svg className="w-5 h-5 mr-2" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M533.5 278.4c0-18.9-1.6-37-4.6-54.7H272v103.3h147.5c-6.4 34.5-25.8 63.8-55 83.4v68.5h88.9c52-48 81.1-118.9 81.1-200.5"/>
        <path fill="#34A853" d="M272 544.3c73.5 0 135.4-24.4 180.5-66.2l-88.9-68.5c-24.4 16.4-55.4 26-91.6 26-70.5 0-130.4-47.6-151.9-111.6h-90.5v70.2c45.1 89.5 138.5 150.1 242.4 150.1"/>
        <path fill="#FBBC05" d="M120.1 324.1c-10.5-31.1-10.5-64.6 0-95.7v-70.2h-90.5c-37.3 71.6-37.3 156.3 0 227.9l90.5-62"/>
        <path fill="#EA4335" d="M272 107.9c39.9-.6 78.5 15.1 107.2 43.3l80.1-80.1C418.3 24.1 346.8-1.5 272 0 168.1 0 74.7 60.6 29.6 150.1l90.5 62c21.4-64 81.4-111.6 151.9-111.6"/>
    </svg>
    Continue with Google
</button>
                    
                </div>

                <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800 text-center">
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        New to our clinical network?{' '}
                        <button
                            onClick={() => onNavigate('signup')}
                            className="font-bold text-[#4A3C31] dark:text-stone-300 hover:text-[#8C7A6E] transition-colors"
                        >
                            Request Access
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
