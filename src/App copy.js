import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { 
    Calendar, Utensils, Activity, Droplet, History, Home, Loader2, PlusCircle, Trash2, Edit, 
    Camera, Target, Bot, UserPlus, LogIn, LogOut, Flame, Candy 
} from 'lucide-react';

// Import Firebase configuration
import { auth, db } from './firebase/config';

// Import contexts
import AppContext from './contexts/AppContext';
// import './App.css';

// Import components
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import CustomModal from './components/common/CustomModal';
import NavItem from './components/common/NavItem';
import StatCard from './components/common/StatCard';
import ActivityItem from './components/common/ActivityItem';
import NutriBotApp from './components/chat/NutriBotApp';
import GlucoseTracker from './components/common/GlucoseTracker';
import FoodTracker from './components/common/FoodTracker';
import ExerciseTracker from './components/common/ExerciseTracker';
import HistoryPage from './components/common/HistoryPage';
import ImageAnalysis from './components/common/ImageAnalysis';
import ImageAnalysisHistory from './components/common/ImageAnalysisHistory';
import GoalsPage from './components/common/GoalsPage';
import Dashboard from './components/pages/Dashboard';

const App = () => {
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('login');
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [modalAction, setModalAction] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authView, setAuthView] = useState('login');

    // Initialize Firebase and handle authentication
    useEffect(() => {        
        try {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setIsAuthenticated(true);
                    setUserId(user.uid);
                    setCurrentPage('dashboard');
                    // Check if a user profile exists on login, if not, create one
                    await checkOrCreateUserProfile(db, user);
                } else {
                    setIsAuthenticated(false);
                    setUserId(null);
                    setCurrentPage('login');
                }
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Failed to initialize Firebase app:", error);
            setLoading(false);
        }
    }, []);

    // Function to check and create a user profile document in Firestore
    const checkOrCreateUserProfile = async (firestore, user) => {
        const userDocRef = doc(firestore, `users/${user.uid}`);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || null,
                provider: user.providerData[0].providerId,
                createdAt: serverTimestamp(),
            });
            console.log("User profile created in Firestore.");
        }
    };

    // Authentication handlers
    const handleLogin = async (email, password) => {
        if (!auth) throw new Error("Authentication service is not available.");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                 throw { code: 'auth/email-not-verified', message: 'Email not verified.' };
            }
        } catch (error) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                throw new Error('Invalid email or password.');
            }
            if (error.code === 'auth/email-not-verified') {
                throw error;
            }
            throw new Error(error.message || 'An unknown error occurred during login.');
        }
    };
    
    // Function to resend the verification email
    const handleResendVerification = async (email) => {
        if (!auth) throw new Error("Authentication service is not available.");
        try {
            const actionCodeSettings = {
                url: window.location.href,
                handleCodeInApp: true,
            };
            const userCredential = await signInWithEmailAndPassword(auth, email, 'temp-password');
            if (userCredential.user) {
                await sendEmailVerification(userCredential.user);
                await signOut(auth);
                alert("Verification email resent! Please check your inbox.");
            }
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                alert("Please log in with the correct password first to resend the email.");
            } else {
                console.error("Error resending email:", error);
                alert("Failed to resend verification email. Please try again.");
            }
        }
    };

    const handleRegister = async (email, password) => {
        if (!auth) throw new Error("Authentication service is not available.");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
    };

    const handleGoogleLogin = async () => {
        if (!auth) throw new Error("Authentication service is not available.");
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const handleLogout = async () => {
        if (!auth) throw new Error("Authentication service is not available.");
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
                <p className="ml-3 text-lg text-gray-700">Loading application...</p>
            </div>
        );
    }

    const renderPage = () => {
        if (!isAuthenticated) {
            if (currentPage === 'register') {
                return <RegisterPage onNavigate={setCurrentPage} onRegister={handleRegister} onGoogleLogin={handleGoogleLogin} />;
            }
            return <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} onResendVerification={handleResendVerification} />;
        }
        
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'glucose':
                return <GlucoseTracker showCustomModal={showCustomModal} />;
            case 'food':
                return <FoodTracker showCustomModal={showCustomModal} />;
            case 'exercise':
                return <ExerciseTracker showCustomModal={showCustomModal} />;
            case 'history':
                return <HistoryPage showCustomModal={showCustomModal} />;
            case 'imageAnalysis':
                return <ImageAnalysis showCustomModal={showCustomModal} />;
            case 'imageAnalysisHistory':
                return <ImageAnalysisHistory showCustomModal={showCustomModal} />;
            case 'goals':
                return <GoalsPage showCustomModal={showCustomModal} />;
            case 'chatbot':
                return <NutriBotApp isAuthenticated={isAuthenticated} userId={userId} />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <AppContext.Provider value={{ db, auth, userId, showCustomModal, isAuthenticated }}>
            <div className="min-h-screen bg-gray-50 font-inter text-gray-800 flex flex-col">
                <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
                    <div className="container mx-auto flex justify-between items-center">
                        <h1 className="text-3xl font-bold rounded-md px-2 py-1 bg-white bg-opacity-20">Diabetes Mitra</h1>
                        {userId && (
                            <div className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center">
                                <span className="mr-2">User ID:</span>
                                <span className="font-mono text-xs truncate">{userId}</span>
                            </div>
                        )}
                        {isAuthenticated && (
                            <button onClick={handleLogout} className="p-2 rounded-full text-white bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors">
                                <LogOut className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-grow container mx-auto p-4 md:p-6 mb-20 md:mb-0">
                    {renderPage()}
                </main>

                <nav className="bg-white shadow-lg p-3 fixed bottom-0 left-0 right-0 z-40 md:relative md:p-0 md:shadow-none">
                    <div className="container mx-auto flex justify-around items-center flex-wrap">
                        {isAuthenticated && (
                            <>
                                <NavItem icon={<Home className="w-6 h-6" />} label="Dashboard" onClick={() => setCurrentPage('dashboard')} active={currentPage === 'dashboard'} />
                                <NavItem icon={<Droplet className="w-6 h-6" />} label="Glucose" onClick={() => setCurrentPage('glucose')} active={currentPage === 'glucose'} />
                                <NavItem icon={<Utensils className="w-6 h-6" />} label="Food" onClick={() => setCurrentPage('food')} active={currentPage === 'food'} />
                                <NavItem icon={<Activity className="w-6 h-6" />} label="Exercise" onClick={() => setCurrentPage('exercise')} active={currentPage === 'exercise'} />
                                <NavItem icon={<Target className="w-6 h-6" />} label="Goals" onClick={() => setCurrentPage('goals')} active={currentPage === 'goals'} />
                                <NavItem icon={<Camera className="w-6 h-6" />} label="Analyze Food" onClick={() => setCurrentPage('imageAnalysis')} active={currentPage === 'imageAnalysis'} />
                                <NavItem icon={<History className="w-6 h-6" />} label="History" onClick={() => setCurrentPage('history')} active={currentPage === 'history'} />
                                <NavItem icon={<Camera className="w-6 h-6" />} label="Image History" 
                                onClick={() => setCurrentPage('imageAnalysisHistory')} active={currentPage === 'imageAnalysisHistory'} />
                                <NavItem icon={<Bot className="w-6 h-6" />} label="AI Assistant" onClick={() => setCurrentPage('chatbot')} active={currentPage === 'chatbot'} />
                            </>
                        )}
                        {!isAuthenticated && (
                            <>
                                <NavItem icon={<LogIn className="w-6 h-6" />} label="Login" onClick={() => { setCurrentPage('login'); setAuthView('login'); }} active={currentPage === 'login'} />
                                <NavItem icon={<UserPlus className="w-6 h-6" />} label="Register" onClick={() => { setCurrentPage('register'); setAuthView('register'); }} active={currentPage === 'register'} />
                            </>
                        )}
                    </div>
                </nav>

                {showModal && (
                    <CustomModal
                        content={modalContent}
                        onConfirm={modalAction}
                        onCancel={closeCustomModal}
                    />
                )}
            </div>
        </AppContext.Provider>
    );
};

// Dashboard Component (simplified for demo - you'd need to implement all the other components)

// Placeholder components (you would implement these based on the original code)
// const GlucoseTracker = ({ showCustomModal }) => <div>Glucose Tracker - To be implemented</div>;
// const FoodTracker = ({ showCustomModal }) => <div>Food Tracker - To be implemented</div>;
// const ExerciseTracker = ({ showCustomModal }) => <div>Exercise Tracker - To be implemented</div>;
// const HistoryPage = ({ showCustomModal }) => <div>History Page - To be implemented</div>;
// const ImageAnalysis = ({ showCustomModal }) => <div>Image Analysis - To be implemented</div>;
// const ImageAnalysisHistory = ({ showCustomModal }) => <div>Image Analysis History - To be implemented</div>;
// const GoalsPage = ({ showCustomModal }) => <div>Goals Page - To be implemented</div>;

export default App;