import { motion } from 'framer-motion';

const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function AdminAnalytics() {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <div className="mb-10">
                <h2 className="text-4xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">Metrics & <span className="text-[#8C7A6E] italic">Analytics</span></h2>
                <p className="text-stone-500 font-light">In-depth breakdown of network biotypes and clinical throughput.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="p-8 rounded-[2rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm min-h-[400px]">
                    <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-stone-400 mb-8">Detected Biotype Distribution</h3>

                    <div className="space-y-8 flex flex-col justify-center h-[280px]">
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-bold text-[#3B302B] dark:text-stone-300">
                                <span>Resilient Mixed (Combination)</span>
                                <span>42%</span>
                            </div>
                            <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#4A3C31] dark:bg-stone-400 w-[42%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-bold text-[#3B302B] dark:text-stone-300">
                                <span>Sebum Dominant (Oily)</span>
                                <span>28%</span>
                            </div>
                            <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#8C7A6E] w-[28%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-bold text-[#3B302B] dark:text-stone-300">
                                <span>Lipid Deficient (Dry)</span>
                                <span>21%</span>
                            </div>
                            <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-700/60 w-[21%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-bold text-[#3B302B] dark:text-stone-300">
                                <span>Balanced Prime (Normal)</span>
                                <span>9%</span>
                            </div>
                            <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-700/60 w-[9%]"></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full border-[12px] border-[#4A3C31] border-r-stone-200 dark:border-r-stone-700 mb-8" />
                    <div className="text-5xl font-serif text-[#3B302B] dark:text-stone-100 mb-2">99.8%</div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">API Uptime</div>
                    <p className="text-stone-500 font-light text-sm max-w-sm">Dermal computation array functioning smoothly. All server nodes are passing health checks.</p>
                </motion.div>
            </div>
        </motion.div>
    );
}
