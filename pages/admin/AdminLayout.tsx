import { motion, AnimatePresence } from 'framer-motion';
import { Users, BarChart3, Database, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout({
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

    const menuItems = [
        { id: 'admin', label: 'System Overview', icon: <Database className="w-5 h-5" /> },
        { id: 'admin/users', label: 'User Directory', icon: <Users className="w-5 h-5" /> },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto px-6 lg:px-12 py-16">
            {/* Admin Sidebar */}
            <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.5 } }}
                className="w-full md:w-72 shrink-0 space-y-8"
            >
                <div className="bg-[#1A1817] border border-stone-800 rounded-[2rem] p-6 shadow-2xl sticky top-32 text-stone-300">
                    {/* Admin Tag */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold tracking-widest uppercase mb-8 w-fit mx-auto">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Admin Terminal Node
                    </div>

                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-stone-800">
                        <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center text-xl font-serif text-white">
                            {user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                            <div className="font-bold text-white">{user?.name || 'Administrator'}</div>
                            <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Level 5 Access</div>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = currentPath === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-300 ${isActive
                                            ? 'bg-stone-800 text-white shadow-lg border border-stone-700'
                                            : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                                        }`}
                                >
                                    <div className={`${isActive ? 'text-amber-500' : 'text-stone-500'}`}>
                                        {item.icon}
                                    </div>
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-stone-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-medium text-sm text-rose-500 hover:bg-rose-950/30 transition-all border border-transparent hover:border-rose-900/50"
                        >
                            <LogOut className="w-5 h-5" /> Terminate Session
                        </button>
                    </div>
                </div>
            </motion.aside>

            <main className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    {children}
                </AnimatePresence>
            </main>
        </div>
    );
}
