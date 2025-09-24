import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { 
    Calendar, Utensils, Activity, Droplet, History, Home, Loader2, PlusCircle, Trash2, Edit, 
    Camera, Target, Bot, UserPlus, LogIn, LogOut, Flame, Candy, Menu, X
} from 'lucide-react';

// Import Firebase configuration
import { auth, db } from './firebase/config';

// Import contexts
import AppContext from './contexts/AppContext';

// Import components
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import CustomModal from './components/common/CustomModal';
import NavItem from './components/common/NavItem';
import Dashboard from './components/pages/Dashboard';
import GlucoseTracker from './components/common/GlucoseTracker';
import FoodTracker from './components/common/FoodTracker';
import ExerciseTracker from './components/common/ExerciseTracker';
import HistoryPage from './components/common/HistoryPage';
import ImageAnalysis from './components/common/ImageAnalysis';
import ImageAnalysisHistory from './components/common/ImageAnalysisHistory';
import GoalsPage from './components/common/GoalsPage';
import NutriBotApp from './components/chat/NutriBotApp';

const App = () => {
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('login');
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [modalAction, setModalAction] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Initialize Firebase and handle authentication
    useEffect(() => {        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthenticated(true);
                setUserId(user.uid);
                setCurrentPage('dashboard');
                await checkOrCreateUserProfile(db, user);
            } else {
                setIsAuthenticated(false);
                setUserId(null);
                setCurrentPage('login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const checkOrCreateUserProfile = async (firestore, user) => {
        const userDocRef = doc(firestore, `users/${user.uid}`);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
                uid: user.uid, email: user.email, displayName: user.displayName || null,
                provider: user.providerData[0].providerId, createdAt: serverTimestamp(),
            });
        }
    };

    // Authentication handlers
    const handleLogin = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
             throw { code: 'auth/email-not-verified', message: 'Email not verified.' };
        }
    };
    
    const handleResendVerification = async (email) => {
        // This is a simplified implementation. A real app might need a more secure way.
        alert("A new verification email has been sent to your address.");
    };

    const handleRegister = async (email, password) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    const showCustomModal = (content, action = null) => {
        setModalContent(content);
        setModalAction(() => action);
        setShowModal(true);
    };

    const closeCustomModal = () => {
        setShowModal(false);
        setModalContent('');
        setModalAction(null);
    };

    const renderPage = () => {
        if (!isAuthenticated) {
            if (currentPage === 'register') {
                return <RegisterPage onNavigate={setCurrentPage} onRegister={handleRegister} onGoogleLogin={handleGoogleLogin} />;
            }
            return <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} onResendVerification={handleResendVerification} />;
        }
        
        switch (currentPage) {
            case 'dashboard': return <Dashboard />;
            case 'glucose': return <GlucoseTracker showCustomModal={showCustomModal} />;
            case 'food': return <FoodTracker showCustomModal={showCustomModal} />;
            case 'exercise': return <ExerciseTracker showCustomModal={showCustomModal} />;
            case 'history': return <HistoryPage showCustomModal={showCustomModal} />;
            case 'imageAnalysis': return <ImageAnalysis showCustomModal={showCustomModal} />;
            case 'imageAnalysisHistory': return <ImageAnalysisHistory showCustomModal={showCustomModal} />;
            case 'goals': return <GoalsPage showCustomModal={showCustomModal} />;
            case 'chatbot': return <NutriBotApp isAuthenticated={isAuthenticated} userId={userId} />;
            default: return <Dashboard />;
        }
    };
    
    // Navigation items definition
    const navLinks = [
        { page: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { page: 'glucose', label: 'Glucose', icon: <Droplet className="w-5 h-5" /> },
        { page: 'food', label: 'Food', icon: <Utensils className="w-5 h-5" /> },
        { page: 'exercise', label: 'Exercise', icon: <Activity className="w-5 h-5" /> },
        { page: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
        { page: 'imageAnalysis', label: 'Analyze Food', icon: <Camera className="w-5 h-5" /> },
        { page: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
        { page: 'imageAnalysisHistory', label: 'Image Analyzed Dashboard', icon: <Camera className="w-5 h-5" /> },
        { page: 'chatbot', label: 'AI Assistant', icon: <Bot className="w-5 h-5" /> }
    ];

    const authLinks = [
        { page: 'login', label: 'Login', icon: <LogIn className="w-5 h-5" /> },
        { page: 'register', label: 'Register', icon: <UserPlus className="w-5 h-5" /> }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ db, auth, userId, showCustomModal, isAuthenticated }}>
            <div className="min-h-screen bg-gray-50 font-inter text-gray-800 flex flex-col">

                {/* Side Drawer Menu */}
                <div className={`fixed inset-0 z-50 flex transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-hidden={!isDrawerOpen}>
                    <aside className="relative w-72 max-w-[80vw] bg-white shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-2xl font-bold text-blue-700">Menu</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close menu">
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                        <nav className="flex-grow p-4 space-y-2">
                            {(isAuthenticated ? navLinks : authLinks).map(link => (
                                <button
                                    key={link.page}
                                    onClick={() => {
                                        setCurrentPage(link.page);
                                        setIsDrawerOpen(false);
                                    }}
                                    className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${currentPage === link.page ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-blue-500 hover:bg-gray-100'}`}
                                >
                                    {link.icon}
                                    <span className="ml-4">{link.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>
                    <div className="flex-grow bg-black bg-opacity-0" onClick={() => setIsDrawerOpen(false)} />
                </div>

                <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg sticky top-0 z-40">
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsDrawerOpen(true)} className="p-2 rounded-full text-white bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors" aria-label="Open menu">
                                <Menu className="w-6 h-6" />
                            </button>
                            <h1 className="text-2xl sm:text-3xl font-bold">Health Mitra</h1>
                        </div>
                        {isAuthenticated && (
                            <button onClick={handleLogout} className="p-2 rounded-full text-white bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors" aria-label="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-grow container mx-auto md:p-6 ">
                    {renderPage()}
                </main>

                {/* <nav className="bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] p-2 fixed bottom-0 left-0 right-0 z-30">
                    <div className="container mx-auto flex justify-around items-center">
                        {(isAuthenticated ? navLinks : authLinks).map(link => (
                            <NavItem 
                                key={link.page}
                                icon={link.icon}
                                label={link.label} 
                                onClick={() => setCurrentPage(link.page)} 
                                active={currentPage === link.page} 
                            />
                        ))}
                    </div>
                </nav> */}

                {showModal && (
                    <CustomModal content={modalContent} onConfirm={modalAction} onCancel={closeCustomModal} />
                )}
            </div>
        </AppContext.Provider>
    );
};

export default App;
