// High-fidelity fallback storage manager for consultations
// Used when Supabase consultations table is missing or unmigrated in schema cache

export interface Message {
    sender: 'user' | 'doctor';
    text: string;
    created_at: string;
}

export interface Consultation {
    id: string;
    user_id: string;
    doctor_id: string | null;
    question: string;
    answer: string | null;
    status: 'pending' | 'answered';
    image_url: string | null;
    messages: Message[];
    created_at: string;
    answered_at: string | null;
    profiles?: {
        id: string;
        name: string;
        email: string;
        bio?: string;
        dob?: string;
    } | null;
    doctor?: {
        name: string;
    } | null;
}

const STORAGE_KEY = 'skine_local_consultations';

// Mock clinical user/doctor profiles to simulate database links
const MOCK_PROFILES: Record<string, { name: string; email: string; bio?: string; dob?: string }> = {
    'user': {
        name: 'Test Client',
        email: 'testuser@skine.com',
        bio: 'Dry skin with occasional redness in the nasal area. Prefers gentle, hydrating routines.',
        dob: '1998-05-15'
    },
    'doctor': {
        name: 'Dr. Alex Mercer',
        email: 'alex@clinical.com'
    }
};

export const consultationsStorage = {
    // 1. Fetch all local consultations
    getAll: (): Consultation[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data);
        } catch (err) {
            console.error('Error reading local consultations:', err);
            return [];
        }
    },

    // 2. Fetch consultations for a specific user
    getByUser: (userId: string): Consultation[] => {
        const list = consultationsStorage.getAll();
        return list.filter(c => c.user_id === userId);
    },

    // 3. Create a new local consultation
    create: (
        userId: string, 
        question: string, 
        imageUrl: string | null, 
        doctorId: string | null,
        userProfile: any
    ): Consultation => {
        const initialMsg: Message = {
            sender: 'user',
            text: question,
            created_at: new Date().toISOString()
        };

        const newConsultation: Consultation = {
            id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            doctor_id: doctorId === 'any' ? null : doctorId,
            question: question,
            answer: null,
            status: 'pending',
            image_url: imageUrl,
            messages: [initialMsg],
            created_at: new Date().toISOString(),
            answered_at: null,
            profiles: userProfile ? {
                id: userId,
                name: userProfile.name || 'Test Client',
                email: userProfile.email || 'testuser@skine.com',
                bio: userProfile.bio || MOCK_PROFILES['user'].bio,
                dob: userProfile.dob || MOCK_PROFILES['user'].dob
            } : null,
            doctor: doctorId && doctorId !== 'any' ? { name: 'Dr. Alex Mercer' } : null
        };

        const list = consultationsStorage.getAll();
        list.unshift(newConsultation);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return newConsultation;
    },

    // 4. Update an existing consultation
    update: (id: string, updates: Partial<Consultation>): Consultation | null => {
        const list = consultationsStorage.getAll();
        const index = list.findIndex(c => c.id === id);
        if (index === -1) return null;

        const updated = {
            ...list[index],
            ...updates,
            // If answered, auto calculate answered timestamp
            answered_at: updates.status === 'answered' ? new Date().toISOString() : list[index].answered_at
        };

        list[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return updated;
    }
};
