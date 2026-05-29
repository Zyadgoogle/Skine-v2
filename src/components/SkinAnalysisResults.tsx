import { motion } from 'framer-motion';
import {
    ShieldAlert,
    Clock,
    ShoppingBag,
    AlertCircle,
    Heart,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import type { SkinAnalysisResult } from '../lib/skinAnalysisClient';

const cardVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

function BulletList({
    items,
    emptyLabel,
    renderItem,
}: {
    items: string[];
    emptyLabel: string;
    renderItem: (item: string, index: number) => React.ReactNode;
}) {
    if (!items.length) {
        return <p className="text-xs text-stone-400 font-light italic">{emptyLabel}</p>;
    }
    return <ul className="space-y-3">{items.map((item, i) => renderItem(item, i))}</ul>;
}

/** Results panel — same sections as client.py send_to_server() print output */
export function SkinAnalysisResults({ result }: { result: SkinAnalysisResult }) {
    const recs = result.recommendations;

    return (
        <motion.div className="space-y-6 text-left" initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}>
            <motion.div
                variants={cardVariants}
                className="bg-[#4A3C31] text-white rounded-[2.5rem] p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-bl-3xl flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> AI Analysis Complete
                </div>
                <div>
                    <motion.div className="text-[10px] font-bold uppercase tracking-widest text-stone-100/50 mb-1">
                        🧬 Predicted Skin Type
                    </motion.div>
                    <div className="text-4xl font-serif">{result.skin_type}</div>
                </div>
                <div className="sm:text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-100/50 mb-1">
                        AI Confidence
                    </div>
                    <div className="text-4xl font-serif text-emerald-300">{result.confidence}</div>
                </div>
            </motion.div>

            <motion.div
                variants={cardVariants}
                className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-7 shadow-sm"
            >
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8C7A6E] flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4" /> 📝 Summary
                </h3>
                <p className="text-sm font-light text-stone-600 dark:text-stone-400 leading-relaxed">
                    {recs.summary}
                </p>
            </motion.div>

            <motion.div
                variants={cardVariants}
                className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-7 shadow-sm space-y-6"
            >
                <div className="pb-3 border-b border-stone-100 dark:border-stone-800">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#8C7A6E]" /> Daily Routines — {result.skin_type} skin
                    </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#3B302B] dark:text-stone-200 mb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 🌅 Morning Routine
                        </h4>
                        <BulletList
                            items={recs.daily_routine.morning}
                            emptyLabel="No morning steps returned — ensure backend is running."
                            renderItem={(step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                        {i + 1}
                                    </span>
                                    <span className="text-xs text-stone-600 dark:text-stone-400 font-light leading-relaxed">
                                        {step}
                                    </span>
                                </li>
                            )}
                        />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#3B302B] dark:text-stone-200 mb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> 🌙 Evening Routine
                        </h4>
                        <BulletList
                            items={recs.daily_routine.evening}
                            emptyLabel="No evening steps returned — ensure backend is running."
                            renderItem={(step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                        {i + 1}
                                    </span>
                                    <span className="text-xs text-stone-600 dark:text-stone-400 font-light leading-relaxed">
                                        {step}
                                    </span>
                                </li>
                            )}
                        />
                    </div>
                </div>
            </motion.div>

            <motion.div
                variants={cardVariants}
                className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-7 shadow-sm space-y-5"
            >
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                    <ShoppingBag className="w-4 h-4 text-[#8C7A6E]" /> Product Recommendations
                </h3>
                <motion.div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full">
                            🛒 Affordable (Drugstore / Budget)
                        </span>
                        <BulletList
                            items={recs.products.affordable}
                            emptyLabel="No affordable products listed."
                            renderItem={(prod, i) => (
                                <li
                                    key={i}
                                    className="flex gap-2 items-start text-xs text-stone-600 dark:text-stone-400 font-light leading-relaxed"
                                >
                                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    {prod}
                                </li>
                            )}
                        />
                    </div>
                    <div className="space-y-3">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#8C7A6E] bg-stone-50 dark:bg-stone-800 px-3 py-1 rounded-full">
                            💎 High-End (Luxury / Premium)
                        </span>
                        <BulletList
                            items={recs.products.high_end}
                            emptyLabel="No luxury products listed."
                            renderItem={(prod, i) => (
                                <li
                                    key={i}
                                    className="flex gap-2 items-start text-xs text-stone-600 dark:text-stone-400 font-light leading-relaxed"
                                >
                                    <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6E] shrink-0 mt-0.5" />
                                    {prod}
                                </li>
                            )}
                        />
                    </div>
                </motion.div>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recs.ingredients.look_for.length > 0 && (
                    <motion.div
                        variants={cardVariants}
                        className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-6 shadow-sm space-y-3"
                    >
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 shrink-0" /> Ingredients to Look For
                        </h4>
                        <ul className="space-y-2">
                            {recs.ingredients.look_for.map((ing, i) => (
                                <li
                                    key={i}
                                    className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/50 text-[11px] text-stone-600 dark:text-stone-400 font-light"
                                >
                                    {ing}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                <motion.div
                    variants={cardVariants}
                    className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-6 shadow-sm space-y-3"
                >
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> ⚠️ Ingredients to Avoid
                    </h4>
                    <BulletList
                        items={recs.ingredients.avoid}
                        emptyLabel="No specific avoid list — patch-test new products."
                        renderItem={(ing, i) => (
                            <li
                                key={i}
                                className="p-3 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100/50 text-[11px] text-stone-600 dark:text-stone-400 font-light leading-relaxed"
                            >
                                {ing}
                            </li>
                        )}
                    />
                </motion.div>

                <motion.div
                    variants={cardVariants}
                    className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] p-6 shadow-sm space-y-3"
                >
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-2">
                        <Heart className="w-4 h-4 shrink-0 text-[#8C7A6E]" /> 💡 Lifestyle Tips
                    </h4>
                    <BulletList
                        items={recs.lifestyle_tips}
                        emptyLabel="No lifestyle tips returned."
                        renderItem={(tip, i) => (
                            <li
                                key={i}
                                className="flex gap-2.5 items-start text-[11px] text-stone-600 dark:text-stone-400 font-light leading-relaxed"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7A6E] shrink-0 mt-1.5" />
                                {tip}
                            </li>
                        )}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
}
