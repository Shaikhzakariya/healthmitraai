import React, { useState, useRef, useEffect, useContext } from 'react';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    deleteDoc,
    getDocs
} from 'firebase/firestore';
import AppContext from '../../contexts/AppContext';
import ChatPage from './ChatPage';
import ProfileModal from '../common/ProfileModal';
import HomePage from '../pages/HomePage';
import FeaturesPage from '../pages/FeaturesPage';
import { retryWithExponentialBackoff } from '../../utils/apiUtils';
import { pcmToWav, base64ToArrayBuffer } from '../../utils/audioUtils';
import { allSuggestions, isSpeechRecognitionSupported, SpeechRecognition } from '../../constants/suggestions';
import { Home, Zap, ChefHat, Plus, Trash2, MessageSquare, Loader2, Search } from 'lucide-react';

// ChatHistory Sidebar Component (now toggleable with search)
const ChatHistory = ({ history, activeChatId, onNewChat, onSelectChat, onDeleteChat, isLoading, onToggleHistory, searchQuery, setSearchQuery }) => {
    const filteredHistory = history.filter(chat =>
        (chat.title || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 bg-opacity-90 p-4 border-r border-purple-700/50 flex flex-col transform transition-transform duration-300 ease-in-out z-50 md:static md:w-1/4 md:translate-x-0 md:shadow-none">
            <button
                onClick={onNewChat}
                className="flex items-center justify-center w-full p-2 mb-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-md text-sm"
            >
                <Plus className="w-4 h-4 mr-1" /> New Chat
            </button>
            <div className="mb-2">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full p-2 text-xs text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 pr-8"
                    />
                    <Search className="absolute right-2 top-2 w-4 h-4 text-gray-400" />
                </div>
            </div>
            <h2 className="text-base font-semibold text-purple-300 mb-2 px-1">Chat History</h2>
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="animate-spin text-purple-400 w-6 h-6" />
                    </div>
                )}
                {!isLoading && filteredHistory.length === 0 && (
                    <div className="text-center text-gray-500 mt-4 text-xs px-1">
                        <MessageSquare className="w-6 h-6 mx-auto mb-1" />
                        No matching chats. Start a new one!
                    </div>
                )}
                <ul>
                    {filteredHistory.map(chat => (
                        <li key={chat.id} className={`group flex items-center justify-between p-2 my-1 rounded-lg cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-purple-800' : 'hover:bg-gray-700'}`}>
                            <span onClick={() => onSelectChat(chat.id)} className="truncate flex-grow text-gray-300 text-xs">
                                {chat.title || 'Untitled Chat'}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id);
                                }}
                                className="ml-1 p-1 text-grey-800 text-grey-500 opacity-100 group-hover:opacity-50 transition-opacity"
                                title="Delete Chat"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
         
        </div>
    );
};

function NutriBotApp({ isAuthenticated, userId }) {
    const { db } = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [fact, setFact] = useState(null);
    const [imageUpload, setImageUpload] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [activeChatFeature, setActiveChatFeature] = useState('chat');

    // New state for chat history and toggle
    const [chatHistory, setChatHistory] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesListenerUnsubscribe = useRef(null);

    const messagesEndRef = useRef(null);
    const audioRef = useRef(null);
    const speechRecognitionRef = useRef(null);

    // Set up Speech Recognition
    useEffect(() => {
        if (isSpeechRecognitionSupported) {
            speechRecognitionRef.current = new SpeechRecognition();
            speechRecognitionRef.current.continuous = false;
            speechRecognitionRef.current.interimResults = false;
            speechRecognitionRef.current.lang = 'en-US';

            speechRecognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSendMessage(transcript);
            };

            speechRecognitionRef.current.onend = () => {
                setIsListening(false);
            };

            speechRecognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
        }
    }, []);

    // Scroll to the bottom of the chat when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle audio events
    useEffect(() => {
        if (audioRef.current) {
            const audio = audioRef.current;
            audio.onended = () => setIsPlaying(null);
        }
    }, [isPlaying]);

    // Fetch user profile from Firestore
    useEffect(() => {
        if (!db || !userId || !isAuthenticated) return;
        const fetchProfile = async () => {
            const docRef = doc(db, `users/${userId}/profile/info`);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const profileData = docSnap.data();
                    setUserProfile(profileData);
                } else {
                    setUserProfile(null);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setUserProfile(null);
            }
        };
        fetchProfile();
    }, [db, userId, isAuthenticated]);

    // Fetch chat history from Firestore
    useEffect(() => {
        if (!db || !userId) return;

        setIsHistoryLoading(true);
        const chatsCollectionRef = collection(db, `users/${userId}/chats`);
        const q = query(chatsCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChatHistory(history);
            setIsHistoryLoading(false);
        }, (error) => {
            console.error("Error fetching chat history:", error);
            setIsHistoryLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId]);

    // Listen for messages of the active chat
    useEffect(() => {
        if (messagesListenerUnsubscribe.current) {
            messagesListenerUnsubscribe.current();
        }

        if (db && userId && activeChatId) {
            const messagesCollectionRef = collection(db, `users/${userId}/chats/${activeChatId}/messages`);
            const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

            messagesListenerUnsubscribe.current = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMessages(fetchedMessages);
            }, (error) => {
                console.error("Error fetching messages for chat:", error);
            });
        }

        return () => {
            if (messagesListenerUnsubscribe.current) {
                messagesListenerUnsubscribe.current();
            }
        };
    }, [db, userId, activeChatId]);

    const saveUserProfile = async (profile) => {
        if (!db || !userId || !isAuthenticated) return;

        const docRef = doc(db, `users/${userId}/profile/info`);
        try {
            await setDoc(docRef, profile, { merge: true });
            setUserProfile(profile);
            setShowProfileModal(false);
        } catch (error) {
            console.error("Error saving user profile:", error);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];
                setImageUpload(base64Data);
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImageUpload = () => {
        setImageUpload(null);
        setImagePreview(null);
        setInput('');
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setMessages([]);
        if (messagesListenerUnsubscribe.current) {
            messagesListenerUnsubscribe.current();
            messagesListenerUnsubscribe.current = null;
        }
        setCurrentPage('chat');
        setIsHistoryVisible(false); // Close history after new chat
    };

    const handleSelectChat = (chatId) => {
        setActiveChatId(chatId);
        setCurrentPage('chat');
        setIsHistoryVisible(false); // Close history after selection
    };

    const handleDeleteChat = async (chatId) => {
        if (!db || !userId) return;

        try {
            const messagesCollectionRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
            const messagesSnapshot = await getDocs(messagesCollectionRef);
            const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            const chatDocRef = doc(db, `users/${userId}/chats/${chatId}`);
            await deleteDoc(chatDocRef);

            if (activeChatId === chatId) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    };

    const getBotResponse = async (chatHistory, imageData) => {
        const apiChatHistory = chatHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        if (userProfile && userProfile.name) {
            const profilePrompt = `You are a nutrition expert. The user is named ${userProfile.name}, is ${userProfile.age} years old, has dietary restrictions of ${userProfile.restrictions}, and a health goal of ${userProfile.goal}. Respond to their queries based on this context.`;
            apiChatHistory.unshift({ role: "user", parts: [{ text: profilePrompt }] });
        } else {
            apiChatHistory.unshift({ role: "user", parts: [{ text: "You are a helpful and friendly nutrition expert. Generate responses with rich formatting using markdown-like syntax for bold text (**text**), lists (* list item), and horizontal rules (---) for a better UI." }] });
        }

        let payload;
        if (imageData) {
            const imagePrompt = input?.trim();
            payload = {
                contents: [{
                    role: "user",
                    parts: [
                        { text: imagePrompt },
                        {
                            inlineData: {
                                mimeType: "image/png",
                                data: imageData
                            }
                        }
                    ]
                }],
            };
        } else {
            payload = { contents: apiChatHistory };
        }

      

        try {
            const response = await retryWithExponentialBackoff(async () => {
              const res = await fetch("/.netlify/functions/generateContent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
                if (!res.ok) {
                    const errorBody = await res.json();
                    throw new Error(`API error: ${res.status} ${res.statusText} - ${JSON.stringify(errorBody)}`);
                }
                return res.json();
            });

            if (response.candidates && response.candidates.length > 0 &&
                response.candidates[0].content && response.candidates[0].content.parts &&
                response.candidates[0].content.parts.length > 0) {
                return response.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected API response structure:", response);
                return "I'm sorry, I couldn't get a clear response. Please try again.";
            }
        } catch (error) {
            console.error("Error fetching from Gemini API:", error);
            return "Oops! Something went wrong while trying to get a response. Please check your internet connection or try again later.";
        }
    };

    const fetchNutrientFacts = async () => { /* This function remains the same */ };
    const handleTextToSpeech = async (text, index) => { /* This function remains the same */ };

    const handleSendMessage = async (message = input) => {
        if ((message.trim() === '' && !imageUpload) || !isAuthenticated || !db || !userId) return;

        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(null);
        }

        const newUserMessage = {
            sender: 'user',
            text: message.trim(),
            image: imagePreview,
            timestamp: serverTimestamp()
        };

        const tempMessages = [...messages, { ...newUserMessage, timestamp: new Date().toISOString() }];
        setMessages(tempMessages);

        const currentImageUpload = imageUpload;
        setInput('');
        clearImageUpload();

        setIsLoading(true);
        fetchNutrientFacts();

        let currentChatId = activeChatId;

        try {
            if (!currentChatId) {
                const chatsCollectionRef = collection(db, `users/${userId}/chats`);
                const newChatRef = await addDoc(chatsCollectionRef, {
                    title: message.trim().substring(0, 40),
                    createdAt: serverTimestamp()
                });
                currentChatId = newChatRef.id;
                setActiveChatId(currentChatId);
            }

            const userMessageForDb = { ...newUserMessage };
            delete userMessageForDb.image;
            const messagesCollectionRef = collection(db, `users/${userId}/chats/${currentChatId}/messages`);
            await addDoc(messagesCollectionRef, userMessageForDb);

            const botResponseText = await getBotResponse(tempMessages, currentImageUpload);

            const newBotMessage = {
                sender: 'bot',
                text: botResponseText,
                timestamp: serverTimestamp()
            };
            await addDoc(messagesCollectionRef, newBotMessage);

        } catch (error) {
            console.error("Error sending message and saving to Firestore:", error);
            const errorMessage = { sender: 'bot', text: "Sorry, I couldn't save your message. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setFact(null);
        }
    };

    const toggleSpeechRecognition = () => { /* This function remains the same */ };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSendMessage();
        }
    };

    const renderPage = () => {
        if (!isAuthenticated) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="text-center p-4 rounded-xl bg-gray-700 border border-red-500">
                        <p className="text-base text-red-400 mb-2">Not Logged In</p>
                        <p className="text-gray-300 text-sm">Please log in or register to use the NutriBot AI assistant.</p>
                    </div>
                </div>
            );
        }

        switch (currentPage) {
            case 'home':
                return <HomePage onNavigate={setCurrentPage} />;
            case 'chat':
                return <ChatPage
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    isLoading={isLoading}
                    isListening={isListening}
                    handleSendMessage={handleSendMessage}
                    toggleSpeechRecognition={toggleSpeechRecognition}
                    handleTextToSpeech={handleTextToSpeech}
                    isPlaying={isPlaying}
                    messagesEndRef={messagesEndRef}
                    suggestions={allSuggestions}
                    handleKeyPress={handleKeyPress}
                    fact={fact}
                    handleImageUpload={handleImageUpload}
                    imagePreview={imagePreview}
                    clearImageUpload={clearImageUpload}
                    onFeatureSelect={setActiveChatFeature}
                    activeFeature={activeChatFeature}
                />;
            case 'features':
                return <FeaturesPage onGoBack={() => setCurrentPage('home')} />;
            default:
                return <HomePage onNavigate={setCurrentPage} />;
        }
    };

    return (
        <div className=" bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex justify-center p-2 md:p-4 font-inter text-white">
            <div className="relative w-full max-w-6xl h-[90vh] md:h-[92vh] bg-gray-800 bg-opacity-70 backdrop-filter backdrop-blur-lg  shadow-2xl overflow-hidden border border-purple-700/50 flex flex-col md:flex-row">
                {showProfileModal && <ProfileModal onSubmit={saveUserProfile} onClose={() => setShowProfileModal(false)} userProfile={userProfile} />}

                <div className="absolute inset-0  pointer-events-none border-4 border-transparent animate-pulse-slow"
                    style={{
                        backgroundImage: 'linear-gradient(to right, #8B5CF6, #EC4899, #10B981)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude'
                    }}></div>

                {/* Toggleable Chat History */}
                {isAuthenticated && isHistoryVisible && (
                    <ChatHistory
                        history={chatHistory}
                        activeChatId={activeChatId}
                        onNewChat={handleNewChat}
                        onSelectChat={handleSelectChat}
                        onDeleteChat={handleDeleteChat}
                        isLoading={isHistoryLoading}
                        onToggleHistory={() => setIsHistoryVisible(false)}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                )}

                {/* Overlay for mobile when history is open */}
                {isHistoryVisible && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={() => setIsHistoryVisible(false)}
                    />
                )}

                <div className="flex-grow flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-gray-800 p-2">
                    <div className="p-2 md:p-4 border-b border-purple-700/50 flex items-center justify-between">
                        
                        <div className="flex items-center space-x-2 md:space-x-4">
                            {userId && (
                                <span className="hidden md:inline text-purple-300 text-xs px-2 py-1 bg-gray-700 rounded-full">
                                    ID: {userId}
                                </span>
                            )}
                            <button
                                onClick={() => setCurrentPage('home')}
                                className="text-white p-1 md:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                title="Home"
                            >
                                <Home className="w-4 h-4 md:w-5 h-5 text-gray-300" />
                            </button>
                            <button
                                onClick={() => setCurrentPage('features')}
                                className="text-white p-1 md:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                title="View Features"
                            >
                                <Zap className="w-4 h-4 md:w-5 h-5 text-yellow-300" />
                            </button>
                            {isAuthenticated && (
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="group flex items-center text-purple-300 text-xs md:text-sm p-1 md:p-2 px-2 md:px-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                    <ChefHat className="w-4 h-4 md:w-5 h-5 mr-1 text-purple-400 group-hover:animate-spin-slow" />
                                    {userProfile ? `Hi, ${userProfile.name}` : "Set Profile"}
                                </button>
                            )}
                            {isAuthenticated && (
                                <button
                                    onClick={() => setIsHistoryVisible(true)}
                                    className="text-white p-1 md:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                    title="View Chat History"
                                >
                                    <Search className="w-4 h-4 md:w-5 h-5" />
                                </button>
                            )}
                            <span>Add or Search</span>
                        </div>
                    </div>

                    <div className="flex-grow min-h-0 p-2 md:p-4">
                        {renderPage()}
                    </div>
                </div>

                <audio ref={audioRef} className="hidden"></audio>
            </div>
        </div>
    );
}

export default NutriBotApp;