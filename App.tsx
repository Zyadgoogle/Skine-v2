import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
//import stethoscope from './assets/stethoscope.svg';
//import scanUI from './assets/scan_ui.svg';

// Pharmacy Logos (Please Ensure these files are placed in src/assets/)
// import attarLogo from './assets/attar.jpg';
// import kobtanLogo from './assets/kobtan.jpg';
// Note: For now we'll just use the src paths as strings to avoid compile errors if they don't exist yet.
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardOverview } from './pages/dashboard/Overview';
//import { DashboardHistory } from './pages/dashboard/History';
import { DashboardSkinAnalysis } from './pages/dashboard/SkinAnalysis';
import { DashboardProfile } from './pages/dashboard/Profile';
import { DashboardSettings } from './pages/dashboard/Settings';
import { DashboardChat } from './pages/dashboard/Chat';
import { FaceCapture } from './components/FaceCapture';
import { ProductScanner } from './components/ProductScanner';
import { ClinicMap } from './components/ClinicMap';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import {
  Camera,
  Sparkles,
  Activity,
  MessageSquare,
  Phone,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Clock,
  ShieldCheck,
  Sun,
  Moon,
  Droplet,
  Info,
  Send,
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  Plus,
  BarChart3,
  Cpu,
  Headphones,
  Stethoscope,
  Fingerprint,
  Heart,
  Menu,
  X
} from 'lucide-react';

import auroraSerum from './assets/aurora_serum.png';


// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const, staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.5 } }
};

const legalPages = {
  'privacy-policy': {
    title: 'Privacy Policy',
    intro: 'SkinE protects skin analysis, profile, and consultation data with a privacy-first clinical workflow.',
    sections: [
      {
        heading: 'Data We Collect',
        body: 'We collect account details, scan images you choose to submit, skin analysis outputs, product scan results, consultation messages, and settings needed to run the service.'
      },
      {
        heading: 'How We Use Data',
        body: 'Your data is used to provide skin analysis, generate routines, improve app reliability, support consultations, and protect accounts from misuse.'
      },
      {
        heading: 'Your Control',
        body: 'You can update profile information, avoid optional uploads, request support, and choose what skin or product information you share with specialists.'
      }
    ]
  },
  'terms-of-service': {
    title: 'Terms of Service',
    intro: 'SkinE provides skincare guidance and product information, but it is not a replacement for a licensed dermatologist or emergency care.',
    sections: [
      {
        heading: 'Use of SkinE',
        body: 'Use the platform for personal skincare education, routine planning, product review, and Doctor or specialist consultation workflows.'
      },
      {
        heading: 'Medical Disclaimer',
        body: 'AI results are general guidance. Seek professional care for severe, painful, spreading, bleeding, infected, chronic, or rapidly changing skin symptoms.'
      },
      {
        heading: 'User Responsibility',
        body: 'You are responsible for the accuracy of information you submit, patch-testing new products, and following local medical advice when needed.'
      }
    ]
  },
  'data-ethics': {
    title: 'Data Ethics',
    intro: 'SkinE is designed around consent, transparency, and careful handling of sensitive skin and health-adjacent information.',
    sections: [
      {
        heading: 'Consent First',
        body: 'Skin images and consultation details should only be uploaded when you choose to share them for analysis or specialist review.'
      },
      {
        heading: 'Human Oversight',
        body: 'AI recommendations are paired with clinical guardrails and escalation to professionals for concerns that need human review.'
      },
      {
        heading: 'Responsible AI',
        body: 'SkinE avoids claiming medical diagnosis from AI scans and keeps recommendations focused on safe, general skincare support.'
      }
    ]
  }
};



export function App() {
  const { isAuthenticated, isAdmin, user, history } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('morning');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 🛒 E-Commerce Skincare Storefront States
  const isAdminOrDoctor = isAdmin || user?.role === 'doctor';
  // Initialize state by checking local storage safely
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem('clinic_products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        // SAFETY CHECK: Only load memory if it actually has products inside it!
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Storage read error", e);
    }

    // Fallback default list if storage is empty or missing (Added mainIngredient to each)
    return [
      {
        id: '1',
        name: 'Clinical Retinoid 0.5% Complex',
        description: 'Encapsulated retinaldehyde for accelerated cellular turnover, structural elasticity, and dark spot treatment.',
        price: 450,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80',
        mainIngredient: 'Retinol' // 💡 Added ingredient
      },
      {
        id: '2',
        name: 'Ceramide Barrier Restoring Balm',
        description: 'Deep lipid correction system engineered to restore highly reactive or flakey skin tissues post-cleansing.',
        price: 380,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80',
        mainIngredient: 'Ceramides' // 💡 Added ingredient
      }
    ];
  });

  // Product Addition Panel States
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImg, setNewProdImg] = useState('');

  // 🔥 NEW STATES: For handling active catalog filters & form options
  const [selectedIngredientFilter, setSelectedIngredientFilter] = useState('All');
  const [newProdIngredient, setNewProdIngredient] = useState('Retinol');

  // Local Checkout States
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] = useState<any | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'cod' | 'vodafone' | 'instapay' | null>(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;
    // 🗑️ Delete Product Handler
    // 🗑️ KEEP THIS: Your existing delete function
    const handleDeleteProduct = (productId: string) => {
      // 1. Filter out the deleted product from the current list
      const updatedProductsList = products.filter(item => item.id !== productId);

      // 2. Update React screen state
      setProducts(updatedProductsList);

      // 3. Update localStorage memory permanently
      localStorage.setItem('clinic_products', JSON.stringify(updatedProductsList));
    }; // <-- This closes the delete function cleanly.

    // 🚫 ADD THIS RIGHT BELOW IT: Your new out-of-stock toggle function
    const handleToggleStock = (productId: string) => {
      const updated = products.map((item) => {
        if (item.id === productId) {
          return { ...item, isOutOfStock: !item.isOutOfStock };
        }
        return item;
      });
      setProducts(updated);
      localStorage.setItem('clinic_products', JSON.stringify(updated));
    };
    const newFormulation = {
      id: Math.random().toString(36).substring(2, 9),
      name: newProdName,
      description: newProdDesc || 'No medical summary available.',
      price: parseFloat(newProdPrice),
      image: newProdImg || 'https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=300&q=80',
      mainIngredient: newProdIngredient // 🔥 Added here so your custom additions save their group!
    };

    const updatedProductsList = [newFormulation, ...products];
    setProducts(updatedProductsList);
    localStorage.setItem('clinic_products', JSON.stringify(updatedProductsList)); // Saves it to memory

    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice('');
    setNewProdImg('');
    setNewProdIngredient('Retinol'); // Reset to default form state
    setShowAddProductForm(false);
  };
  // 🗑️ THIS IS THE WIRE YOU ARE MISSING: Delete Product Handler
  const handleDeleteProduct = (productId: string) => {
    // 1. Remove the product with this id from the array
    const updatedProductsList = products.filter(item => item.id !== productId);

    // 2. Set the state to re-render the screen
    setProducts(updatedProductsList);

    // 3. Save the new list back to memory permanently
    localStorage.setItem('clinic_products', JSON.stringify(updatedProductsList));
  };
  const handleToggleStock = (productId: string) => {
    const updated = products.map((item) => {
      if (item.id === productId) {
        return { ...item, isOutOfStock: !item.isOutOfStock };
      }
      return item;
    });
    setProducts(updated);
    localStorage.setItem('clinic_products', JSON.stringify(updated));
  }; // <--- Stock toggle finishes her
  // 📝 NEW STATES FOR EDITING PRODUCTS
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImg, setEditImg] = useState('');
  const [editIngredient, setEditIngredient] = useState('Retinol');

  // Function to pre-fill the form fields when clicking Edit
  const startEditingProduct = (item: any) => {
    setEditingProduct(item);
    setEditName(item.name);
    setEditDesc(item.description);
    setEditPrice(item.price.toString());
    setEditImg(item.image);
    setEditIngredient(item.mainIngredient || 'Retinol');
  };

  // 💾 Update Existing Product Handler
  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName || !editPrice) return;

    // Map through products and replace the data for the one matching the editing ID
    const updatedProductsList = products.map((item) => {
      if (item.id === editingProduct.id) {
        return {
          ...item,
          name: editName,
          description: editDesc,
          price: parseFloat(editPrice),
          image: editImg,
          mainIngredient: editIngredient
        };
      }
      return item;
    });

    setProducts(updatedProductsList);
    localStorage.setItem('clinic_products', JSON.stringify(updatedProductsList));
    setEditingProduct(null); // Close the modal popup cleanly!
  };
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Basic Routing Logic
  useEffect(() => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    const validPages = ['home', 'dashboard', 'dashboard/analysis', 'dashboard/chat', 'dashboard/profile', 'dashboard/settings', 'Doctor', 'Doctor/profile', 'admin', 'admin/users', 'login', 'signup', 'forgot-password', 'products', 'scan', 'scanner', 'clinic', 'recommendations', 'support', 'results', 'privacy-policy', 'terms-of-service', 'data-ethics'];
    const matchedPage = validPages.find(p => p.toLowerCase() === path);
    if (matchedPage) {
      setCurrentPage(matchedPage);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navigate = (page: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(page);
    setIsMenuOpen(false);
  };



  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    if (!name || !email || !message) {
      setFormStatus('error');
      return;
    }

    setFormStatus('success');
    e.currentTarget.reset();
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F0D0C] text-[#4D4039] dark:text-stone-300 font-sans selection:bg-[#DECFC0] dark:selection:bg-[#4A3C31] selection:text-[#3B302B] dark:selection:text-white overflow-x-hidden relative transition-colors duration-500">




      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-white/95 dark:bg-[#0F0D0C]/95 border-b border-stone-200 dark:border-stone-800" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4 cursor-pointer"
              onClick={() => navigate('home')}
            >
              <div className="w-12 h-12 bg-[#4A3C31] rounded-2xl flex items-center justify-center shadow-lg shadow-stone-900/10 rotate-3">
                <Sparkles className="w-6 h-6 text-stone-100" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-3xl font-serif font-bold text-[#3B302B] dark:text-stone-100 tracking-tight block leading-none">
                  skinE
                </span>
                <span className="text-[10px] tracking-[0.2em] font-medium text-stone-400 dark:text-stone-500 uppercase mt-1">Clinical Elite</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1 bg-stone-100/50 dark:bg-stone-900/50 p-1.5 rounded-full border border-stone-200/50 dark:border-stone-800/50">
              {['Home', !isAuthenticated ? 'Login' : (isAdmin ? 'Admin' : (user?.role === 'doctor' ? 'Doctor Workspace' : 'Dashboard')), 'Skin Analysis', 'Products', 'Scanner', 'Clinic'].map((item) => {
                const pageId = item === 'Skin Analysis' ? 'scan' : item === 'Login' ? 'login' : item === 'Doctor Workspace' ? 'Doctor' : item.toLowerCase();
                const isActive = currentPage === pageId || (currentPage === 'results' && pageId === 'scan');
                return (
                  <button
                    key={pageId}
                    onClick={() => navigate(pageId)}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-500 relative ${isActive
                      ? 'text-[#3B302B]'
                      : 'text-stone-500 hover:text-[#3B302B]'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-bg"
                        className="absolute inset-0 bg-white dark:bg-stone-800 rounded-full shadow-sm border border-stone-200/60 dark:border-stone-700/60"
                      />
                    )}
                    <span className="relative z-10">{item}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm text-stone-600 dark:text-stone-300 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                title="Toggle Dark Mode"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-stone-600 dark:text-stone-400" />}
              </button>

              <button
                onClick={() => navigate('scan')}
                className="hidden sm:flex items-center gap-3 bg-[#4A3C31] dark:bg-stone-800 hover:bg-[#3B302B] dark:hover:bg-stone-700 text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-all shadow-xl shadow-[#4A3C31]/20 hover:scale-105 active:scale-95"
              >
                Analyze Now
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm text-stone-600 dark:text-stone-400"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-[#3B302B]/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-[#0F0D0C] z-[70] shadow-2xl lg:hidden flex flex-col p-8 border-l border-stone-100 dark:border-stone-800"
            >
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#4A3C31] rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-stone-100" />
                  </div>
                  <span className="text-2xl font-serif font-bold text-[#3B302B] dark:text-stone-100">skinE</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {['Home', !isAuthenticated ? 'Login' : (isAdmin ? 'Admin' : (user?.role === 'doctor' ? 'Doctor Workspace' : 'Dashboard')), 'Skin Analysis', 'Products', 'Scanner', 'Clinic', 'Support'].map((item) => {
                  const pageId = item === 'Skin Analysis' ? 'scan' : item === 'Login' ? 'login' : item === 'Doctor Workspace' ? 'Doctor' : item.toLowerCase();
                  const isActive = currentPage === pageId || (currentPage === 'results' && pageId === 'scan');
                  return (
                    <button
                      key={pageId}
                      onClick={() => navigate(pageId)}
                      className={`flex items-center justify-between px-6 py-4 rounded-2xl font-medium text-lg transition-all ${isActive
                        ? 'bg-[#4A3C31] text-white shadow-lg shadow-[#4A3C31]/20'
                        : 'text-stone-500 hover:text-[#3B302B] dark:text-stone-400 dark:hover:text-stone-200'
                        }`}
                    >
                      <span>{item}</span>
                      <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'translate-x-1' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto">
                <button
                  onClick={() => navigate('scan')}
                  className="w-full flex items-center justify-center gap-3 bg-[#4A3C31] text-white py-5 rounded-3xl font-bold shadow-xl shadow-[#4A3C31]/20"
                >
                  <Camera className="w-5 h-5" /> Analyze Now
                </button>
                <p className="text-center text-[10px] text-stone-400 uppercase tracking-widest mt-8 font-medium">Clinical Elite v1.2</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16 relative z-10">
        <AnimatePresence mode="wait">

          {/* ================= AUTH PAGES ================= */}
          {currentPage === 'login' && <Login key="login" onNavigate={navigate} />}
          {currentPage === 'signup' && <Signup key="signup" onNavigate={navigate} />}
          {currentPage === 'forgot-password' && <ForgotPassword key="forgot-password" onNavigate={navigate} />}

          {/* ================= DASHBOARD PAGES ================= */}
          {currentPage.startsWith('dashboard') && (
            <DashboardLayout key="dashboard-layout" currentPath={currentPage} onNavigate={navigate}>
              {currentPage === 'dashboard' && <DashboardOverview onNavigate={navigate} />}
              {currentPage === 'dashboard/analysis' && <DashboardSkinAnalysis />}
              {currentPage === 'dashboard/chat' && <DashboardChat />}
              {currentPage === 'dashboard/profile' && <DashboardProfile />}
              {currentPage === 'dashboard/settings' && <DashboardSettings onNavigate={navigate} />}
            </DashboardLayout>
          )}

          {/* ================= Doctor PAGES ================= */}
          {currentPage.startsWith('Doctor') && (
            <DashboardLayout key="Doctor-layout" currentPath={currentPage} onNavigate={navigate}>
              {currentPage === 'Doctor' && <DoctorDashboard />}
              {currentPage === 'Doctor/profile' && <DoctorProfile />}
            </DashboardLayout>
          )}

          {/* ================= ADMIN PAGES ================= */}
          {currentPage.startsWith('admin') && (
            <AdminLayout key="admin-layout" currentPath={currentPage} onNavigate={navigate}>
              {currentPage === 'admin' && <AdminOverview />}
              {currentPage === 'admin/users' && <AdminUsers />}
            </AdminLayout>
          )}

          {/* ================= HOME PAGE ================= */}
          {currentPage === 'home' && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-24 md:space-y-40">
              {/* Hero Section */}
              <section className="relative pt-12 text-center md:text-left">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-12">


                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif text-[#3B302B] dark:text-stone-100 leading-[0.95] tracking-tight">
                      Elevate Your <br />
                      <span className="text-[#8C7A6E] dark:text-[#C2B29F] italic font-light">Dermal Profile.</span>
                    </h1>

                    <p className="text-xl text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed font-light">
                      Experience the next generation of precision skincare. Our clinical-grade AI analyzes your topography to craft a routine as unique as your DNA.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <button
                        onClick={() => navigate('scan')}
                        className="w-full sm:w-auto px-10 py-5 bg-[#4A3C31] hover:bg-[#3B302B] text-white rounded-full font-bold text-sm transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#4A3C31]/30 group"
                      >
                        <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Start Free Analysis
                      </button>
                      <button
                        onClick={() => navigate('dashboard/analysis')}
                        className="group flex items-center gap-4 text-sm font-bold text-[#3B302B] dark:text-stone-200 hover:text-[#8C7A6E] transition-colors"
                      >
                        Explore Protocol Demo
                        <div className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center group-hover:border-[#3B302B] dark:group-hover:border-stone-200 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    </div>


                  </div>

                  <div className="relative px-8"
                  >
                    <div className="relative z-10 rounded-[3rem] overflow-hidden border-[12px] border-white dark:border-stone-900 shadow-2xl">
                      <div className="aspect-[4/5] bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                        <img src={auroraSerum} alt="Aurora Radiance Serum - Revitalizing & Hydrating" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute -top-12 -right-4 w-40 h-40 bg-[#C2B29F]/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-12 -left-4 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl" />
                  </div>
                </div>
              </section>

              {/* Service Description Cards */}
              <section className="space-y-16">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl md:text-5xl font-serif text-[#3B302B] dark:text-stone-100">
                    Our <span className="text-[#8C7A6E] dark:text-[#C2B29F] italic">Services</span>
                  </h2>
                  <p className="text-stone-500 dark:text-stone-400 font-light max-w-2xl mx-auto leading-relaxed">
                    Explore our comprehensive suite of clinical-grade skincare services designed to elevate your dermal health.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { icon: <Camera className="w-7 h-7" />, title: "Scan", page: "scan", desc: "AI-powered dermal topology analysis. Our neural network maps moisture density, texture, and structural elasticity with clinical precision.", color: "from-emerald-500/10 to-emerald-500/5", prominent: true },
                    { icon: <ShoppingBag className="w-7 h-7" />, title: "Scanner", page: "scanner", desc: "Clinical barcode recognition engine. Scan pharmaceutical products for instant chemical synthesis analysis.", color: "from-amber-500/10 to-amber-500/5" },
                    { icon: <ShoppingBag className="w-7 h-7" />, title: "Products", page: "products", desc: "Browse and order pharmaceutical-grade skincare formulations curated specifically by clinical experts for active skin types.", color: "from-indigo-500/10 to-indigo-500/5" },
                    { icon: <Stethoscope className="w-7 h-7" />, title: "Clinic", page: "clinic", desc: "Access our global network of certified partner clinics and compounding labs for professional dermal consultations.", color: "from-violet-500/10 to-violet-500/5" },
                    { icon: <Headphones className="w-7 h-7" />, title: "Support", page: "support", desc: "Our clinical support team of licensed professionals is available 24/7 for order tracking, tech support, and protocol guidance.", color: "from-teal-500/10 to-teal-500/5" }
                  ].map((service, i) => (
                    <div key={i}
                      onClick={() => {
                        if ((service as any).isNewTab) {
                          navigate('product');
                        } else {
                          navigate(service.page);
                        }
                      }}
                      className={`relative p-10 rounded-[2.5rem] bg-white dark:bg-stone-900 border shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.12)] dark:hover:bg-stone-800/50 transition-all cursor-pointer group overflow-hidden ${(service as any).prominent
                        ? 'border-stone-300 dark:border-stone-700 shadow-lg shadow-stone-900/5'
                        : 'border-stone-100 dark:border-stone-800'
                        }`}
                    >
                      {/* Gradient background glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-stone-50 dark:bg-stone-800 text-[#4A3C31] dark:text-stone-300 rounded-2xl flex items-center justify-center mb-6 border border-stone-100 dark:border-stone-700 group-hover:scale-110 group-hover:bg-[#4A3C31] group-hover:text-white transition-all duration-300">
                          {service.icon}
                        </div>
                        <h3 className="text-xl font-serif text-[#3B302B] dark:text-stone-100 mb-4">{service.title}</h3>
                        <p className="text-stone-500 dark:text-stone-400 font-light leading-relaxed text-sm mb-6">{service.desc}</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#8C7A6E] dark:text-[#C2B29F] uppercase tracking-widest group-hover:text-[#4A3C31] dark:group-hover:text-stone-200 transition-colors">
                          Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ================= SCAN PAGE ================= */}
          {currentPage === 'scan' && (
            <motion.div key="scan" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-serif text-[#3B302B] mb-6">
                  Dermal Topology <span className="text-[#8C7A6E] italic">Analysis</span>
                </h2>
                <p className="text-stone-500 font-light max-w-xl mx-auto leading-relaxed">
                  Our neural network is ready to map your skin profile. Please ensure you are in a well-lit environment for optimal depth calibration.
                </p>
              </div>

              <div className="relative w-full max-w-2xl mx-auto">
                <FaceCapture
                  onComplete={(analysisResult) => {
                    sessionStorage.setItem(
                      'skine_skin_analysis_session',
                      JSON.stringify({
                        step: 'results',
                        result: analysisResult,
                        selectedConcerns: [],
                        diagnosedDisease: 'no',
                      })
                    );
                    navigate(isAuthenticated ? 'dashboard/analysis' : 'results');
                  }}
                />
              </div>

              <div className="mt-20 grid sm:grid-cols-3 gap-8">
                {[
                  { icon: <ShieldCheck className="w-5 h-5" />, title: "HIPAA Compliant", desc: "Your clinical data is encrypted and discarded post-analysis." },
                  { icon: <Info className="w-5 h-5" />, title: "Optimal Lighting", desc: "Front-facing natural light provides the best topological depth." },
                  { icon: <ShieldCheck className="w-5 h-5" />, title: "Verified AI", desc: "Trained on millions of clinically-labeled skin datasets." }
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white border border-stone-100">
                    <div className="text-[#8C7A6E] shrink-0 mt-1">{tip.icon}</div>
                    <div>
                      <h4 className="text-sm font-bold text-[#3B302B] mb-2">{tip.title}</h4>
                      <p className="text-xs text-stone-500 font-light leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ================= RESULTS PAGE ================= */}
          {currentPage === 'results' && (() => {
            const latestScan = history && history.length > 0 ? history[0] : null;
            let savedAnalysis: { result?: { skin_type?: string; confidence?: string; recommendations?: any } } | null = null;
            try {
              const raw = sessionStorage.getItem('skine_skin_analysis_session');
              if (raw) savedAnalysis = JSON.parse(raw);
            } catch { /* ignore */ }
            const analysisPayload = savedAnalysis?.result;
            const skinType = analysisPayload?.skin_type || latestScan?.type || "Combination";
            const summaryText = analysisPayload?.recommendations?.summary || latestScan?.result || "Focus on targeted hydration and structural barrier support.";
            const morningSteps: string[] = analysisPayload?.recommendations?.daily_routine?.morning
              || (latestScan as any)?.routine?.morning?.map((s: any) => (s.name ? `${s.name} ${s.desc || ''}` : s))
              || [];
            const eveningSteps: string[] = analysisPayload?.recommendations?.daily_routine?.evening
              || (latestScan as any)?.routine?.evening?.map((s: any) => (s.name ? `${s.name} ${s.desc || ''}` : s))
              || [];

            return (
              <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-24 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                  <div className="space-y-6 max-w-xl">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold tracking-widest uppercase">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Analysis Verified: Phase-1 Complete
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif text-[#3B302B] leading-tight">
                      Diagnostic <span className="text-[#8C7A6E] italic">Summary</span>
                    </h2>
                    <p className="text-lg text-stone-500 font-light leading-relaxed">
                      Based on your dermal topography, your detected skin type is <span className="text-[#4A3C31] font-bold">{skinType} Skin</span>
                      {analysisPayload?.confidence ? ` (${analysisPayload.confidence} confidence)` : ''}. {summaryText}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={() => navigate('dashboard/analysis')}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-20 h-20 rounded-[2rem] bg-[#4A3C31] text-white flex items-center justify-center shadow-xl shadow-[#4A3C31]/20 group-hover:scale-110 group-hover:bg-[#3B302B] transition-all">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <span className="text-[10px] font-bold tracking-[0.2em] text-stone-400 group-hover:text-[#3B302B] transition-colors uppercase mt-2">Full Analysis</span>
                    </button>
                  </div>
                </div>

                {/* Summary Grid */}
                <div className="grid md:grid-cols-2 gap-12">
                  {/* Skin Type Summary */}
                  <div className="p-12 rounded-[3rem] bg-stone-100 border border-stone-200 space-y-8">
                    <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">Skin Profile Summary</h3>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Detected Type</div>
                      <div className="text-5xl font-serif text-[#3B302B] font-bold">{skinType}</div>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-stone-200">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">AI Analysis Result</div>
                      <p className="text-sm text-stone-600 font-light leading-relaxed">{summaryText}</p>
                    </div>
                    {latestScan && (
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Last Scan</div>
                        <div className="text-sm font-medium text-[#4A3C31]">{latestScan.date}</div>
                      </div>
                    )}
                  </div>

                  {/* Protocol Cards — Morning + Evening side by side */}
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Morning */}
                      <div className="p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">🌅 Morning Protocol</h3>
                        </div>
                        <ul className="space-y-2">
                          {morningSteps.length > 0 ? morningSteps.slice(0, 5).map((step, i) => (
                            <li key={i} className="flex gap-3 items-start text-xs text-stone-600 font-light leading-relaxed">
                              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          )) : <li className="text-xs text-stone-400 font-light">Complete a skin scan to unlock your morning protocol.</li>}
                        </ul>
                      </div>

                      {/* Evening */}
                      <div className="p-8 rounded-[2.5rem] bg-stone-900 text-white border border-stone-800 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                          <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">🌙 Evening Protocol</h3>
                        </div>
                        <ul className="space-y-2">
                          {eveningSteps.length > 0 ? eveningSteps.slice(0, 5).map((step, i) => (
                            <li key={i} className="flex gap-3 items-start text-xs text-stone-300 font-light leading-relaxed">
                              <span className="w-4 h-4 rounded-full bg-indigo-900/60 text-indigo-300 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          )) : <li className="text-xs text-stone-500 font-light">Complete a skin scan to unlock your evening protocol.</li>}
                        </ul>
                      </div>
                    </div>


                  </div>
                </div>
              </motion.div>
            );
          })()}


          {/* ================= CLINIC & MAP PAGE ================= */}
          {currentPage === 'clinic' && (
            <motion.div key="clinic" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-32">
              {/* Fulfillment Section */}
              <div className="pt-24 border-t border-stone-200 grid lg:grid-cols-2 gap-24 items-center">
                <div className="space-y-10">
                  <h3 className="text-4xl font-serif text-[#3B302B]">Scientific <br /> <span className="text-[#8C7A6E] italic">Fulfillment Network</span></h3>
                  <p className="text-stone-500 font-light leading-relaxed">
                    We integrate with high-standard compounding pharmacies to ensure your routine  and clinically potent. Select a certified partner for delivery.
                  </p>
                  <div className="space-y-6">
                    {[
                      {
                        name: "Mahmoud Al-Attar Pharmacy",
                        rating: "5.0", dist: "0.8 km", status: "Certified Partner",
                        actionHref: "https://wa.me/201282997923", actionText: "WhatsApp: +20 12 82997923",
                        logo: "/mahmoud.jpg"
                      },
                      {
                        name: "alkobtan",
                        rating: "4.8", dist: "2.5 km", status: "Priority Lab",
                        actionHref: "tel:5923332-03", actionText: "Call: 5923332-03",
                        logo: "/alkobtan.jpg"
                      }
                    ].map((p, i) => (
                      <a key={i} href={p.actionHref} target={p.actionHref.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="block">
                        <div className="flex justify-between items-center p-8 rounded-[2rem] bg-stone-50 border border-stone-200/50 hover:bg-white hover:shadow-xl hover:shadow-stone-900/5 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#4A3C31] shadow-sm overflow-hidden group-hover:bg-white transition-all">
                              {p.logo ? (
                                <img src={p.logo} alt={p.name} className="w-full h-full object-cover p-2" />
                              ) : (
                                <MapPin className="w-6 h-6 group-hover:text-white transition-all" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#3B302B] mb-1">{p.name}</div>
                              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{p.status} • {p.dist}</div>
                              <div className="text-[11px] font-bold text-[#8C7A6E] mt-2 group-hover:text-[#4A3C31] transition-colors">{p.actionText}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#4A3C31]">{p.rating}</div>
                            <div className="text-[10px] text-stone-300 font-bold uppercase tracking-widest mt-1">Rating</div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="relative p-12 bg-[#4A3C31] rounded-[4rem] text-white space-y-10 overflow-hidden shadow-2xl shadow-stone-900/40">
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-3xl font-serif">Consultation</h3>
                    <p className="text-stone-300 font-light leading-relaxed text-sm">
                      Standard off-the-shelf products often fail to meet biological precision. Our partners specialize in custom concentrations tailored to your scan diagnostics.
                    </p>
                    <button
                      onClick={() => setShowConsultModal(true)}
                      className="w-full flex items-center justify-center gap-4 bg-white text-[#4A3C31] py-5 rounded-3xl font-bold text-sm hover:bg-stone-100 transition-all shadow-xl shadow-stone-900/20"
                    >
                      <MessageSquare className="w-5 h-5" /> Book Dermal Consultation
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Map Wrapper */}
              <ClinicMap />

              {/* Verified Dermatologists Section */}
              <div className="space-y-16">
                <div className="text-center space-y-6">
                  <h3 className="text-4xl font-serif text-[#3B302B]">Featured <span className="text-[#8C7A6E] italic">Dermatologists</span></h3>
                  <p className="text-stone-500 font-light max-w-xl mx-auto leading-relaxed">
                    Connect with our board-certified clinical partners for personalized consultations.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { name: 'Dr. Rahma Ahmed', specialization: 'Dermatology', number: '+20 12 24176366', availability: 'Available Today' },
                    { name: 'Dr. Shahd Zaitoon', specialization: 'Dermatology', number: '+20 11 55188190', availability: 'Available Tomorrow' }
                  ].map((doc, i) => (
                    <div key={i}
                      className="p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-sm space-y-8 hover:shadow-xl transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-[#4A3C31]">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{doc.availability}</span>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-1">{doc.specialization}</div>
                        <div className="text-2xl font-serif text-[#3B302B]">{doc.name}</div>
                      </div>
                      <div className="pt-4 border-t border-stone-50 flex flex-col gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8C7A6E]">Contact Number</div>
                        <a href={`tel:${doc.number.replace(/\s+/g, '')}`} className="text-[#4A3C31] font-medium flex items-center gap-2 hover:text-[#8C7A6E] transition-colors">
                          <Phone className="w-4 h-4 text-stone-400" />
                          {doc.number}
                        </a>
                      </div>
                      <div className="pt-4 pb-2">
                        <button className="w-full py-3 bg-stone-50 hover:bg-stone-100 text-[#4A3C31] rounded-2xl text-xs font-bold transition-all border border-stone-200">
                          Book Consultation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}



          {/* ================= SUPPORT PAGE ================= */}
          {currentPage === 'support' && (
            <motion.div key="support" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto py-12">
              <div className="grid lg:grid-cols-2 gap-24 items-start">
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h2 className="text-5xl md:text-6xl font-serif text-[#3B302B]">How can we <br /><span className="text-[#8C7A6E] italic">assist you?</span></h2>
                    <p className="text-lg text-stone-500 font-light leading-relaxed">
                      Our clinical support team is composed of licensed professionals ready to help with order tracking, tech support, or protocol clarifying.
                    </p>
                  </div>

                  <div className="space-y-8">
                    {[
                      { icon: <MessageSquare className="w-5 h-5" />, label: "Live Clinical Chat", val: "Available 24/7" },
                      { icon: <Phone className="w-5 h-5" />, label: "Phone Consultation", val: "01278962472" },
                      { icon: <Send className="w-5 h-5" />, label: "Email Support", val: "radwaalyan11@gmail.com" }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-6 items-center group cursor-pointer">
                        <div className="w-14 h-14 rounded-2xl bg-stone-100 text-[#4A3C31] flex items-center justify-center border border-stone-200 group-hover:bg-[#4A3C31] group-hover:text-white transition-all shadow-sm">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{item.label}</div>
                          <div className="text-sm font-bold text-[#3B302B]">{item.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-12 rounded-[4rem] bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-2xl shadow-stone-900/5">
                  {formStatus === 'success' && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-3xl text-sm font-medium border border-emerald-200 dark:border-emerald-800 text-center">
                      Your message has been sent successfully! We will get back to you shortly.
                    </div>
                  )}
                  {formStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-3xl text-sm font-medium border border-red-200 dark:border-red-800 text-center">
                      Please fill in all the required fields.
                    </div>
                  )}
                  <form className="space-y-8" onSubmit={handleContactSubmit}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                      <input name="name" type="text" className="w-full px-6 py-5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl focus:outline-none focus:border-[#4A3C31] dark:focus:border-stone-500 transition-all font-light text-sm dark:text-stone-200" placeholder="Alexander Dermal" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                      <input name="email" type="email" className="w-full px-6 py-5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl focus:outline-none focus:border-[#4A3C31] dark:focus:border-stone-500 transition-all font-light text-sm dark:text-stone-200" placeholder="alex@domain.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-2">Your Message</label>
                      <textarea name="message" rows={4} className="w-full px-6 py-5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl focus:outline-none focus:border-[#4A3C31] dark:focus:border-stone-500 transition-all font-light text-sm resize-none dark:text-stone-200" placeholder="How can our clinical team help?"></textarea>
                    </div>
                    <button type="submit" className="w-full py-5 bg-[#4A3C31] hover:bg-[#3B302B] dark:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-4 shadow-xl shadow-[#4A3C31]/20 group">
                      Submit request <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= PRODUCTS & STOREFRONT PAGE ================= */}
          {currentPage === 'products' && (
            <motion.div
              key="products"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-6xl mx-auto space-y-12 py-6 px-4 min-h-[60vh]"
            >

              {/* Header Context Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <h2 className="text-3xl font-serif italic text-[#3B302B] dark:text-stone-200">Product Catalog</h2>
                  <p className="text-xs text-stone-400 font-light mt-1">Order from our products directly to your address.</p>
                </div>

                {/* Secure Workspace Authentication Toggle */}
                {isAdminOrDoctor && (
                  <button
                    type="button"
                    onClick={() => setShowAddProductForm(!showAddProductForm)}
                    className="px-5 py-2.5 bg-[#4A3C31] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-[#3B302B] transition-all cursor-pointer border-none shadow-sm"
                  >
                    {showAddProductForm ? 'Hide Creator Form' : '➕ Add Skincare Product'}
                  </button>
                )}
              </div>

              {/* Admin & Doctor Creator Board Panel */}
              <AnimatePresence>
                {showAddProductForm && isAdminOrDoctor && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddNewProductSubmit}
                    className="p-6 rounded-[2rem] bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 space-y-4 max-w-2xl mx-auto text-xs overflow-hidden"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B302B] dark:text-stone-300">Authorized Product Registry Panel</h4>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Product Name</label>
                        <input type="text" required placeholder="e.g., Niacinamide Serum 10%" value={newProdName} onChange={e => setNewProdName(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Retail Price (EGP)</label>
                        <input type="number" required placeholder="Price in Egyptian Pounds" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Product Image URL</label>
                      <input type="url" placeholder="Paste hotlink from unsplash or product image hosting" value={newProdImg} onChange={e => setNewProdImg(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Product Description & Structural Action</label>
                      <textarea rows={3} required placeholder="Describe active compounds, skin-type alignments, and daytime guidelines..." value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200 resize-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Main Active Ingredient Group</label>
                      <select
                        value={newProdIngredient}
                        onChange={e => setNewProdIngredient(e.target.value)}
                        className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200 cursor-pointer"
                      >
                        <option value="Retinol">Retinol</option>
                        <option value="Ceramides">Ceramides</option>
                        <option value="Hyaluronic Acid">Hyaluronic Acid</option>
                        <option value="Vitamin C">Vitamin C</option>
                        <option value="Salicylic Acid">Salicylic Acid</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-[#4A3C31] text-white font-bold rounded-xl hover:bg-[#3B302B] transition-colors border-none cursor-pointer text-xs uppercase tracking-wider">
                      Publish Product Listing To Catalog
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              {/* 📝 NEW: Edit Existing Product Modal Panel */}
              <AnimatePresence>
                {editingProduct && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleUpdateProductSubmit}
                    className="mb-8 p-6 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4 overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-[#4A3C31] dark:text-stone-300 uppercase tracking-wider">
                        Edit Product Details
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="text-xs text-stone-400 hover:text-stone-600 bg-none border-none cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Product Formula Name</label>
                        <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Price (EGP)</label>
                        <input type="number" required value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Product Image URL</label>
                        <input type="url" value={editImg} onChange={e => setEditImg(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Main Active Ingredient Group</label>
                        <select value={editIngredient} onChange={e => setEditIngredient(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200 cursor-pointer">
                          <option value="Retinol">Retinol</option>
                          <option value="Ceramides">Ceramides</option>
                          <option value="Hyaluronic Acid">Hyaluronic Acid</option>
                          <option value="Vitamin C">Vitamin C</option>
                          <option value="Salicylic Acid">Salicylic Acid</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">Product Description</label>
                      <textarea rows={3} required value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none dark:text-stone-200 resize-none" />
                    </div>

                    <button type="submit" className="w-full py-3 bg-[#4A3C31] text-white font-bold rounded-xl hover:bg-[#3B302B] transition-colors border-none cursor-pointer text-xs uppercase tracking-wider">
                      Save Changes & Update Catalog
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              {/* Storefront Products Display Grid */}
              <div className="flex flex-wrap gap-2 mb-8 mt-2">
                {['All', 'Retinol', 'Ceramides', 'Hyaluronic Acid', 'Vitamin C', 'Salicylic Acid'].map((ingredient) => (
                  <button
                    key={ingredient}
                    type="button"
                    onClick={() => setSelectedIngredientFilter(ingredient)}
                    className={`px-4 py-2 text-xs font-medium rounded-full transition-all border border-none cursor-pointer ${selectedIngredientFilter === ingredient
                      ? 'bg-[#4A3C31] text-white shadow-md'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                  >
                    {ingredient}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products
                  .filter(item => selectedIngredientFilter === 'All' || item.mainIngredient === selectedIngredientFilter)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-stone-900 border border-[#4A3C31]/20 hover:border-[#4A3C31]/40 dark:border-stone-800 rounded-[2rem] p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl bg-stone-100 h-48 w-full relative">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#3B302B] dark:text-stone-200 leading-snug">{item.name}</h3>
                          <p className="text-[11px] text-stone-400 font-light leading-relaxed mt-2 line-clamp-3">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-stone-100 dark:border-stone-800">
                        <span className="text-sm font-serif font-bold text-[#4A3C31] dark:text-stone-300">{item.price} EGP</span>
                        {/* 🚨 Red Out of Stock Status Alert (Isolated cleanly above the action row) */}
                        {item.isOutOfStock && (
                          <div className="mx-1 mt-3 px-3 py-1.5 bg-rose-500/10 dark:bg-rose-500/20 rounded-xl border border-rose-500/20">
                            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tracking-wide text-left flex items-center gap-1">
                              <span>⚠️</span> out of stock.
                            </p>
                          </div>
                        )}

                        {/* 💵 Clean Bottom Action Row */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-stone-100 dark:border-stone-800">
                          <span className="text-sm font-serif font-bold text-[#4A3C31] dark:text-stone-300">

                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* 🔒 Safe Check: Show management tools ONLY if user is Admin or Doctor */}
                            {isAdminOrDoctor && (
                              <>
                                {/* 🚫 Toggle Stock Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleStock(item.id)}
                                  className={`p-1.5 rounded-xl transition-colors cursor-pointer border-none flex items-center justify-center ${item.isOutOfStock
                                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                                    }`}
                                  title={item.isOutOfStock ? "Mark as In Stock" : "Mark as Out of Stock"}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                  </svg>
                                </button>

                                {/* 📝 Edit Product Button */}
                                <button
                                  type="button"
                                  onClick={() => startEditingProduct(item)}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/60 rounded-xl transition-colors cursor-pointer border-none flex items-center justify-center"
                                  title="Edit Product"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                                  </svg>
                                </button>

                                {/* 🗑️ Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                                      handleDeleteProduct(item.id);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 rounded-xl transition-colors cursor-pointer border-none flex items-center justify-center group/del"
                                  title="Delete Product"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                                  </svg>
                                </button>
                              </>
                            )}

                            {/* Main Purchase Button */}
                            <button
                              type="button"
                              disabled={item.isOutOfStock}
                              onClick={() => {
                                setSelectedCheckoutProduct(item);
                                setPaymentGateway(null);
                                setIsOrderPlaced(false);
                              }}
                              className={`px-4 py-1.5 text-[11px] font-bold rounded-xl transition-colors border-none ${item.isOutOfStock
                                ? 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed'
                                : 'bg-[#4A3C31] hover:bg-[#3B302B] text-white cursor-pointer'
                                }`}
                            >
                              {item.isOutOfStock ? 'Unavailable' : 'Purchase'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Integrated Checkout Overlay Drawer */}
              {selectedCheckoutProduct && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-6 max-w-sm w-full border border-stone-100 dark:border-stone-800 shadow-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B302B] dark:text-stone-200">Secure Order Gateway</h4>
                      <button type="button" onClick={() => setSelectedCheckoutProduct(null)} className="text-stone-400 hover:text-stone-600 bg-transparent border-none text-xs font-bold cursor-pointer">✕</button>
                    </div>

                    {!isOrderPlaced ? (
                      <>
                        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl flex gap-3 items-center border border-stone-100/50 dark:border-stone-800">
                          <img src={selectedCheckoutProduct.image} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          <div>
                            <h5 className="text-[11px] font-bold text-stone-700 dark:text-stone-300 leading-tight">{selectedCheckoutProduct.name}</h5>
                            <p className="text-xs font-bold font-serif text-[#4A3C31] dark:text-stone-400 mt-1">{selectedCheckoutProduct.price} EGP</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Choose Payment Type</p>

                          <button type="button" onClick={() => setPaymentGateway('cod')} className={`w-full p-3 text-left rounded-xl border flex items-center justify-between text-xs cursor-pointer bg-transparent transition-all ${paymentGateway === 'cod' ? 'border-[#8C7A6E] bg-stone-50/60 dark:bg-stone-800/40 text-[#4A3C31] dark:text-stone-200 font-bold' : 'border-stone-100 dark:border-stone-800 text-stone-500'}`}>
                            <span>📦 Cash on Delivery (COD)</span>
                          </button>

                          <button type="button" onClick={() => setPaymentGateway('vodafone')} className={`w-full p-3 text-left rounded-xl border flex items-center justify-between text-xs cursor-pointer bg-transparent transition-all ${paymentGateway === 'vodafone' ? 'border-[#8C7A6E] bg-stone-50/60 dark:bg-stone-800/40 text-[#4A3C31] dark:text-stone-200 font-bold' : 'border-stone-100 dark:border-stone-800 text-stone-500'}`}>
                            <span>🔴 Vodafone Cash Digital Transfer</span>
                          </button>

                          <button type="button" onClick={() => setPaymentGateway('instapay')} className={`w-full p-3 text-left rounded-xl border flex items-center justify-between text-xs cursor-pointer bg-transparent transition-all ${paymentGateway === 'instapay' ? 'border-[#8C7A6E] bg-stone-50/60 dark:bg-stone-800/40 text-[#4A3C31] dark:text-stone-200 font-bold' : 'border-stone-100 dark:border-stone-800 text-stone-500'}`}>
                            <span>⚡ Instapay Instant Network</span>
                          </button>
                        </div>

                        {paymentGateway && paymentGateway !== 'cod' && (
                          <div className="p-3 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-light">
                            📌 Please complete the transfer to our agent terminal at 01004427740 and capture your transfer success receipt screen to verify with logistics well call you on your Number.
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsOrderPlaced(true)}
                          disabled={!paymentGateway}
                          className="w-full py-3 bg-[#4A3C31] hover:bg-[#3B302B] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors border-none cursor-pointer uppercase tracking-wider mt-2"
                        >
                          Confirm Shipping Request
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-6 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-sm font-bold">✓</div>
                        <div>
                          <h4 className="text-xs font-bold text-[#3B302B] dark:text-stone-200 uppercase tracking-wider">Order Received!</h4>
                          <p className="text-[11px] text-stone-400 font-light mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                            Your compound formulation is queued for processing. Our confirmation desk will contact you via WhatsApp shortly.
                          </p>
                        </div>
                        <button type="button" onClick={() => setSelectedCheckoutProduct(null)} className="mt-4 px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold text-[10px] rounded-xl transition-colors border-none cursor-pointer">
                          Close Window
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
          {/* ================= SCANNER PAGE ================= */}
          {currentPage === 'scanner' && (
            <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-serif text-[#3B302B] dark:text-stone-100 mb-6">
                  Product <span className="text-[#8C7A6E] dark:text-[#C2B29F] italic">Scanner</span>
                </h2>
                <p className="text-stone-500 dark:text-stone-400 font-light max-w-xl mx-auto leading-relaxed">
                  Identify pharmaceutical compounds instantly. Point your camera at any product barcode for a deep-dive clinical analysis.
                </p>
              </div>

              <div className="relative w-full max-w-2xl mx-auto">
                <ProductScanner onComplete={() => { }} />
              </div>

              <div className="mt-20 grid sm:grid-cols-3 gap-8">
                {[
                  { icon: <Fingerprint className="w-5 h-5" />, title: "Precision Scan", desc: "Deciphers EAN-13, QR, and clinical pharmaceutical identifiers." },
                  { icon: <Heart className="w-5 h-5" />, title: "Health Check", desc: "Instantly flags allergens and contraindications for your biotype." },
                  { icon: <ShieldCheck className="w-5 h-5" />, title: "Verified Data", desc: "Cross-referenced with global pharmaceutical databases." }
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm">
                    <div className="text-[#8C7A6E] shrink-0 mt-1">{tip.icon}</div>
                    <div>
                      <h4 className="text-sm font-bold text-[#3B302B] dark:text-stone-100 mb-2">{tip.title}</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-light leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentPage in legalPages && (
            <motion.div key={currentPage} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto py-12">
              <div className="space-y-10">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[#8C7A6E] text-[10px] font-bold uppercase tracking-[0.2em]">
                    <ShieldCheck className="w-4 h-4" />
                    SkinE Governance
                  </div>
                  <h2 className="text-5xl md:text-6xl font-serif text-[#3B302B] dark:text-stone-100">
                    {legalPages[currentPage as keyof typeof legalPages].title}
                  </h2>
                  <p className="text-lg text-stone-500 dark:text-stone-400 font-light leading-relaxed">
                    {legalPages[currentPage as keyof typeof legalPages].intro}
                  </p>
                </div>

                <div className="space-y-5">
                  {legalPages[currentPage as keyof typeof legalPages].sections.map((section) => (
                    <section key={section.heading} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2rem] p-7 shadow-sm">
                      <h3 className="text-sm font-bold text-[#3B302B] dark:text-stone-100 uppercase tracking-[0.18em] mb-3">
                        {section.heading}
                      </h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 font-light leading-relaxed">
                        {section.body}
                      </p>
                    </section>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main >

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 mt-32 bg-[#0F0D0C] text-stone-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid md:grid-cols-3 gap-16">
            {/* Brand Column */}
            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-bold text-indigo-400 tracking-[0.15em] uppercase">SKINE</h3>
              <p className="text-stone-400 font-light leading-relaxed text-sm">
                Advanced clinical AI combining dermatological precision with expert Doctor follow-up.
              </p>
            </div>

            {/* Services Column */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Services</h4>
              <ul className="space-y-3">
                {[
                  { label: 'AI Skin Analysis', page: 'scan' },
                  { label: 'Custom Routines', page: 'dashboard/analysis' },
                  { label: 'Partner Pharmacies', page: 'clinic' },
                  { label: 'Doctor Consultation', page: 'dashboard/analysis' }
                ].map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => navigate(item.page)}
                      className="text-stone-400 hover:text-white transition-colors text-sm font-light"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Support</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Contact Us', page: 'support' },
                  { label: 'Privacy Policy', page: 'privacy-policy' },
                  { label: 'Terms of Service', page: 'terms-of-service' },
                  { label: 'Data Ethics', page: 'data-ethics' }
                ].map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => navigate(item.page)}
                      className="text-stone-400 hover:text-white transition-colors text-sm font-light"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Gradient Divider */}
          <div className="mt-16 pt-8 border-t border-stone-800">
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 opacity-40" />
            <p className="text-center text-xs text-stone-600 mt-6 font-light">
              © 2026 SkinE Clinical Elite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ================= Doctor MODAL ================= */}
      <AnimatePresence>
        {
          showConsultModal && (
            <motion.div initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-[#3B302B]/80" onClick={() => setShowConsultModal(false)} />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden border border-white/20"
              >
                <div className="p-12 pb-6 flex justify-between items-center text-[#3B302B]">
                  <h3 className="text-3xl font-serif italic">Clinical Consultation</h3>
                  <button onClick={() => setShowConsultModal(false)} className="w-12 h-12 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
                    <Activity className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="p-12 pt-0 space-y-8">
                  <p className="text-stone-500 font-light text-sm leading-relaxed mb-10">
                    Select a clinical advisor for a personalized dermal session.
                  </p>

                  {[
                    { name: "Dr. Rahma Ahmed", role: "Active Formulation Specialist", exp: "12 Yrs Exp", rating: "5.0", available: true, phone: "+201224176366" },
                    { name: "Dr. Shahd Zaitoon", role: "Clinical Doctor", exp: "14 Yrs Exp", rating: "4.9", available: true, phone: "+201155188190" }
                  ].map((doc, i) => (
                    <div key={i} className="group p-8 rounded-[2.5rem] bg-stone-50 border border-stone-100 flex items-center gap-8 hover:bg-white hover:border-[#4A3C31]/20 hover:shadow-xl hover:shadow-stone-900/5 transition-all">
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-3xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center border border-white dark:border-stone-700 shadow-sm overflow-hidden">
                          <Stethoscope className="w-8 h-8 text-stone-400" />
                        </div>
                        {doc.available && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-stone-900 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-4xl font-serif text-[#3B302B] mb-6">Product</h3>
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-4 italic">{doc.role}</p>
                        <div className="flex gap-6 text-[10px] font-bold text-[#8C7A6E] uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> {doc.rating}</span>
                          <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {doc.exp}</span>
                        </div>
                      </div>
                      {doc.available ? (
                        <a href={`https://wa.me/${doc.phone.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl transition-all bg-[#4A3C31] text-white hover:bg-[#3B302B] shadow-lg shadow-[#4A3C31]/20">
                          <ChevronRight className="w-6 h-6" />
                        </a>
                      ) : (
                        <button disabled className="p-4 rounded-2xl transition-all bg-stone-200 text-stone-400 cursor-not-allowed">
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  ))}


                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

    </div >
  );
}

export default App;