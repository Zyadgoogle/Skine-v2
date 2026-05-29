import { motion } from 'framer-motion';
import { Search, MoreVertical, Edit2, Ban, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function AdminUsers() {
    const { users, deleteUser, updateUserRole } = useAuth();
    const [search, setSearch] = useState('');

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">User <span className="text-[#8C7A6E] italic">Directory</span></h2>
                    <p className="text-stone-500 font-light">Manage client profiles and network access levels.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search network..."
                        className="w-full px-6 py-3 pl-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-sm transition-all"
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                                <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest pl-10">Client Identity</th>
                                <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Network Entry Date</th>
                                <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Vault Detail (Pass)</th>
                                <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Status / Designation</th>
                                <th className="p-6 text-xs font-bold text-stone-400 uppercase tracking-widest text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                                    <td className="p-6 pl-10">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#3B302B] dark:text-stone-300 text-sm">{user.name}</span>
                                            <span className="text-xs text-stone-500">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-sm text-stone-600 dark:text-stone-400">
                                        {user.date}
                                    </td>
                                    <td className="p-6 text-lg text-stone-400 font-bold tracking-widest cursor-help" title="Securely Hashed by Supabase">
                                        ••••••••
                                    </td>
                                    <td className="p-6 text-sm">
                                        <span className={`px-3 py-1 rounded-full font-medium text-xs border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400' :
                                                user.status === 'Partner' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400' :
                                                    'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right pr-10">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                                className={`p-2 transition-colors ${user.role === 'admin' ? 'text-amber-500 hover:text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
                                                title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button 
                                                onClick={() => { if(confirm('Terminate access for this node?')) deleteUser(user.id); }}
                                                className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}
