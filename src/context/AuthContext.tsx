import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'doctor';
    bio?: string;
    date?: string;
    lastActive?: string;
    count?: number;
    status?: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    dob?: string;
    avatar?: 'male' | 'female';
    notifications?: {
        scanReminders: boolean;
        protocolNotifications: boolean;
        productUpdates: boolean;
    };
}

interface ScanResult {
    id: string;
    date: string;
    type: string;
    result: string;
    score: number;
}

export interface Activity {
    id: string;
    type: 'scan' | 'profile' | 'security' | 'admin';
    title: string;
    description: string;
    date: string;
    icon: 'Activity' | 'User' | 'Shield' | 'Settings';
}

interface AuthContextType {
    user: User | null;
    users: User[];
    history: ScanResult[];
    activities: Activity[];
    loading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    signup: (email: string, password?: string, name?: string, metadata?: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (newData: Partial<User>, activityTitle?: string) => void;
    updateUserRole: (userId: string, newRole: 'user' | 'admin' | 'doctor') => Promise<void>;
    deleteUser: (userId: string) => void;
    addAnalysisResult: (result: Omit<ScanResult, 'id' | 'date'>) => void;
    addActivity: (activity: Omit<Activity, 'id' | 'date'>) => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_USERS: User[] = [
    { id: 'usr_892', name: 'Eleanor Vance', email: 'eleanor.v@example.com', role: 'user', bio: 'Chronic dry skin protocol.', date: 'Oct 12, 2025', count: 14, status: 'Active' },
    { id: 'usr_104', name: 'Marcus Sterling', email: 'm.sterling@example.com', role: 'user', date: 'Jan 05, 2026', count: 3, status: 'Active' },
    { id: 'usr_302', name: 'Admin Node', email: 'admin@skine.com', role: 'admin', date: 'Feb 01, 2026', count: 0, status: 'Admin' }
];

const INITIAL_HISTORY: ScanResult[] = [
    { id: '1', date: 'Mar 10, 2026', type: 'Combination', result: 'Optimal - Barrier Intact', score: 88 },
    { id: '2', date: 'Feb 24, 2026', type: 'Combination', result: 'Moderate - Dermal Moisture Support Required', score: 72 }
];

const INITIAL_ACTIVITIES: Activity[] = [
    { id: 'a1', type: 'scan', title: 'Clinical Scan Complete', description: 'Metabolic topology mapped with high precision.', date: 'Mar 10, 2026', icon: 'Activity' },
    { id: 'a2', type: 'security', title: 'Security Protocol Updated', description: 'Two-factor authentication handshake verified.', date: 'Mar 05, 2026', icon: 'Shield' },
    { id: 'a3', type: 'profile', title: 'Dermal Profile Initialized', description: 'Clinical biotype established as Resilient Mixed.', date: 'Feb 01, 2026', icon: 'User' }
];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('auth_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>(() => {
        const saved = localStorage.getItem('auth_users');
        return saved ? JSON.parse(saved) : INITIAL_USERS;
    });
    const [history, setHistory] = useState<ScanResult[]>(() => {
        const saved = localStorage.getItem('auth_history');
        return saved ? JSON.parse(saved) : INITIAL_HISTORY;
    });
    const [activities, setActivities] = useState<Activity[]>(() => {
        const saved = localStorage.getItem('auth_activities');
        return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    });

    useEffect(() => {
        const fetchPersistentData = async (userId: string, role: string) => {
            try {
                // 1. Fetch History
                const { data: historyData } = await supabase
                    .from('analysis_history')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false });

                if (historyData) setHistory(historyData);

                // 2. Fetch Activity Logs
                const { data: activityData } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (activityData) setActivities(activityData);

                // 3. Admin: Fetch All Users
                if (role === 'admin') {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('*');
                    if (profilesData) {
                        setUsers(profilesData.map(p => ({
                            id: p.id,
                            name: p.name,
                            email: p.email || '',
                            role: p.role,
                            bio: p.bio,
                            date: new Date(p.created_at).toLocaleDateString(),
                            lastActive: p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleString() : 'Never',
                            status: 'Active'
                        })));
                    }
                }
            } catch (err) {
                console.warn('Persistence fetch failed. Operating in hybrid mode.', err);
            }
        };

        const setupAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const role = session.user.email?.includes('admin') ? 'admin' : session.user.email?.endsWith('@clinical.com') ? 'doctor' : 'user';
                mapSupabaseUser(session.user);
                fetchPersistentData(session.user.id, role);
            } else {
                const savedUser = localStorage.getItem('auth_user');
                if (savedUser) setUser(JSON.parse(savedUser));
            }
            setLoading(false);
        };

        setupAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                const role = session.user.email?.includes('admin') ? 'admin' : session.user.email?.endsWith('@clinical.com') ? 'doctor' : 'user';
                mapSupabaseUser(session.user);
                fetchPersistentData(session.user.id, role);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('auth_user');
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const mapSupabaseUser = (sbUser: SupabaseUser) => {
        const role = sbUser.email?.includes('admin') ? 'admin' : sbUser.email?.endsWith('@clinical.com') ? 'doctor' : 'user';
        const mappedUser: User = {
            id: sbUser.id,
            email: sbUser.email || '',
            name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Clinical User',
            role: (sbUser.user_metadata?.role as any) || role,
            date: new Date(sbUser.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            lastActive: sbUser.last_sign_in_at || new Date().toISOString(),
            count: 0,
            status: 'Active',
            phone: sbUser.user_metadata?.phone,
            gender: sbUser.user_metadata?.gender,
            dob: sbUser.user_metadata?.dob,
            avatar: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.avatar || 'female',
            notifications: sbUser.user_metadata?.notifications || {
                scanReminders: true,
                protocolNotifications: true,
                productUpdates: true
            }
        };
        setUser(mappedUser);
        localStorage.setItem('auth_user', JSON.stringify(mappedUser));
        setUsers(prev => {
            const exists = prev.some(u => u.id === mappedUser.id || u.email === mappedUser.email);
            return exists
                ? prev.map(u => (u.id === mappedUser.id || u.email === mappedUser.email) ? { ...u, ...mappedUser } : u)
                : [mappedUser, ...prev];
        });

        // Sync to profiles table
        supabase.from('profiles').upsert({
            id: sbUser.id,
            name: mappedUser.name,
            email: mappedUser.email,
            role: mappedUser.role,
            last_sign_in_at: new Date().toISOString(),
            notifications: mappedUser.notifications,
            phone: mappedUser.phone,
            gender: mappedUser.gender,
            dob: mappedUser.dob,
            avatar_url: mappedUser.avatar
        }).then(({ error }) => {
            if (error) console.warn('Profile sync failed:', error.message);
        });
    };

    // Keep localStorage as a local cache/fallback
    useEffect(() => {
        localStorage.setItem('auth_users', JSON.stringify(users));
        localStorage.setItem('auth_history', JSON.stringify(history));
        localStorage.setItem('auth_activities', JSON.stringify(activities));
    }, [users, history, activities]);

    const login = async (email: string, password?: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: password || 'clinical123',
            });

            if (error) {
                if (email === 'admin@skine.com' && password === 'clinical1234') {
                    const adminUser: User = {
                        id: `usr_admin_${Math.floor(Math.random() * 1000)}`,
                        name: 'Admin Node',
                        email: 'admin@skine.com',
                        role: 'admin',
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                        count: 0,
                        status: 'Admin'
                    };
                    setUser(adminUser);
                    localStorage.setItem('auth_user', JSON.stringify(adminUser));
                    setUsers(prev => {
                        const exists = prev.some(u => u.email === adminUser.email);
                        return exists ? prev.map(u => u.email === adminUser.email ? adminUser : u) : [adminUser, ...prev];
                    });
                    return;
                }

                const existingUser = users.find(u => u.email === email);
                if (existingUser || email.includes('@example.com') || email.includes('@skine.com')) {
                    const newUser = existingUser || {
                        id: `usr_${Math.floor(Math.random() * 1000)}`,
                        name: email.split('@')[0],
                        email,
                        role: email.includes('admin') ? 'admin' : email.endsWith('@clinical.com') ? 'doctor' : 'user',
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                        count: 0,
                        status: 'Active'
                    };
                    setUser(newUser);
                    localStorage.setItem('auth_user', JSON.stringify(newUser));
                    if (!existingUser) setUsers(prev => [newUser, ...prev]);
                } else {
                    throw error;
                }
            } else if (data.user) {
                mapSupabaseUser(data.user);
            }
        } catch (err) {
            console.error('Login error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        const redirectTo = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
            },
        });

        if (error) {
            throw error;
        }
    };

    const signup = async (email: string, password?: string, name?: string, metadata?: Partial<User>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: password || 'clinical123',
                options: {
                    data: {
                        full_name: name,
                        role: email.endsWith('@clinical.com') ? 'doctor' : 'user',
                        phone: metadata?.phone,
                        gender: metadata?.gender,
                        dob: metadata?.dob,
                        avatar_url: metadata?.avatar || 'female'
                    }
                }
            });

            if (error) {
                const newUser: User = {
                    id: `usr_${Math.floor(Math.random() * 1000)}`,
                    email,
                    name: name || email.split('@')[0],
                    role: email.endsWith('@clinical.com') ? 'doctor' : 'user',
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                    count: 0,
                    status: 'Active',
                    ...metadata
                };
                setUsers(prev => [...prev, newUser]);
                setUser(newUser);
                localStorage.setItem('auth_user', JSON.stringify(newUser));
            } else if (data.user) {
                mapSupabaseUser(data.user);
                if (email.endsWith('@clinical.com')) {
                    await supabase.from('activities').insert({
                        user_id: data.user.id,
                        type: 'admin',
                        title: 'Doctor Registered',
                        description: `New Clinical Doctor Profile Activated: ${email}`,
                        icon: 'Shield'
                    });
                }
            }
        } catch (err) {
            console.error('Signup error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('auth_user');
    };

    const updateProfile = async (newData: Partial<User>, activityTitle?: string) => {
        if (!user) return;

        if (!user.id.startsWith('usr_')) {
            try {
                // Update Auth metadata
                await supabase.auth.updateUser({
                    data: {
                        full_name: newData.name || user.name,
                        bio: newData.bio || user.bio,
                        notifications: newData.notifications || user.notifications,
                        phone: newData.phone || user.phone,
                        gender: newData.gender || user.gender,
                        dob: newData.dob || user.dob,
                        avatar_url: newData.avatar || user.avatar
                    }
                });
                // Update Profiles table
                await supabase.from('profiles').update({
                    name: newData.name || user.name,
                    bio: newData.bio || user.bio,
                    notifications: newData.notifications || user.notifications,
                    phone: newData.phone || user.phone,
                    gender: newData.gender || user.gender,
                    dob: newData.dob || user.dob,
                    avatar_url: newData.avatar || user.avatar
                }).eq('id', user.id);
            } catch (err) {
                console.error('Persistence update failed:', err);
            }
        }

        const updated = { ...user, ...newData };
        setUser(updated);
        setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
        if (activityTitle) addActivity({ type: 'profile', title: activityTitle, description: 'Synchronized.', icon: 'User' });
    };

    const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'doctor') => {
        try {
            await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            addActivity({
                type: 'admin',
                title: 'Access Level Modified',
                description: `Node ${userId} recalculated as ${newRole.toUpperCase()}.`,
                icon: 'Settings'
            });
        } catch (err) {
            console.error('Role update failed:', err);
        }
    };

    const deleteUser = async (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        addActivity({ type: 'admin', title: 'Termination', description: `ID: ${userId}`, icon: 'Shield' });

        // Remove from profiles table
        await supabase.from('profiles').delete().eq('id', userId);
    };

    const addActivity = async (activity: Omit<Activity, 'id' | 'date'>) => {
        const newActivity: Activity = {
            ...activity,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
        setActivities(prev => [newActivity, ...prev]);

        if (user && !user.id.startsWith('usr_')) {
            await supabase.from('activities').insert({
                user_id: user.id,
                type: activity.type,
                title: activity.title,
                description: activity.description,
                icon: activity.icon
            });
        }
    };

    const addAnalysisResult = async (result: Omit<ScanResult, 'id' | 'date'>) => {
        const newResult: ScanResult = {
            ...result,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
        setHistory(prev => [newResult, ...prev]);
        addActivity({
            type: 'scan',
            title: 'Scan Complete',
            description: `Precision: ${result.score}%`,
            icon: 'Activity'
        });

        if (user && !user.id.startsWith('usr_')) {
            await supabase.from('analysis_history').insert({
                user_id: user.id,
                type: result.type,
                result: result.result,
                score: result.score
            });
        }
    };

    return (
        <AuthContext.Provider value={{
            user, users, history, activities, loading, login, signup, logout,
            loginWithGoogle,
            updateProfile, updateUserRole, deleteUser, addAnalysisResult, addActivity,
            isAuthenticated: !!user, isAdmin: user?.role === 'admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
