import { motion } from 'framer-motion';
import { LayoutDashboard, Activity, Clock, User, Settings, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function DashboardLayout({
    currentPath,
    onNavigate,
    children
}: {
    currentPath: string;
    onNavigate: (page: string) => void;
    children: React.ReactNode;
}) {
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        onNavigate('home');
    };

    const menuItems = user?.role === 'doctor' ? [
        { id: 'doctor', label: 'Workspace', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'doctor/profile', label: 'Doctor', icon: <User className="w-5 h-5" /> },
    ] : [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'dashboard/analysis', label: 'Result', icon: <Activity className="w-5 h-5" /> },
        { id: 'dashboard/chat', label: 'Consultations', icon: <MessageSquare className="w-5 h-5" /> },
        { id: 'dashboard/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
        { id: 'dashboard/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.5 } }}
                className="w-full md:w-72 shrink-0 space-y-8"
            >
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] p-6 shadow-xl sticky top-32">
                    {/* User Preview */}
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-stone-100 dark:border-stone-800">
                        <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl font-serif text-[#3B302B] dark:text-stone-300">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div className="font-bold text-[#3B302B] dark:text-stone-200">{user?.name || 'User'}</div>
                            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{user?.role || 'Client'} Profile</div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = currentPath === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-300 ${isActive
                                            ? 'bg-[#4A3C31] text-white shadow-lg shadow-[#4A3C31]/20'
                                            : 'text-stone-500 hover:text-[#3B302B] dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                                        }`}
                                >
                                    <div className={`${isActive ? 'text-white' : 'text-stone-400'}`}>
                                        {item.icon}
                                    </div>
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-medium text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        >
                            <LogOut className="w-5 h-5" /> Logout
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    {children}
                </AnimatePresence>
            </main>
        </div>
    );
}

// Temporary AnimatePresence fallback if not imported in Parent
import { AnimatePresence } from 'framer-motion';
