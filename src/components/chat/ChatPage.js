import React from 'react';
import { 
    MessageSquare, Utensils, Database, Cloudy, Globe, HeartPulse, 
    BookOpen, ShoppingCart, Search, Send, Mic, X, ImageIcon as Image,
    Menu, Sparkles, Crown
} from 'lucide-react';
import CityFoodSuggestionsComponent from './features/CityFoodSuggestionsComponent';
import FoodLookupPage from './features/FoodLookupPage';
import WeatherFoodSuggestions from './features/WeatherFoodSuggestions';
import CulturalFoodExplorer from './features/CulturalFoodExplorer';
import SymptomRecommender from './features/SymptomRecommender';
import MythBuster from './features/MythBuster';
import SmartGroceryList from './features/SmartGroceryList';
import AnalyzingLoader from './AnalyzingLoader';
import NutrientFacts from './NutrientFacts';
import { renderBotMessage } from '../../utils/messageRenderer';
import { Bot, Play, Pause } from 'lucide-react';

const ChatPage = ({ messages, input, setInput, isLoading, isListening, handleSendMessage, toggleSpeechRecognition, handleTextToSpeech, isPlaying, messagesEndRef, suggestions, handleKeyPress, fact, handleImageUpload, imagePreview, clearImageUpload, onFeatureSelect, activeFeature }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const features = [
        { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-6 h-6" /> },
        { id: 'food-guide', label: 'Food Guide', icon: <Utensils className="w-6 h-6" /> },
        { id: 'food-lookup', label: 'Food Lookup', icon: <Database className="w-6 h-6" /> },
        { id: 'weather-food', label: 'Weather Food', icon: <Cloudy className="w-6 h-6" /> },
        { id: 'cultural-explorer', label: 'Explorer', icon: <Globe className="w-6 h-6" /> },
        { id: 'symptom-recommender', label: 'Symptom Helper', icon: <HeartPulse className="w-6 h-6" /> },
        { id: 'myth-buster', label: 'Myth Buster', icon: <BookOpen className="w-6 h-6" /> },
        { id: 'grocery-list', label: 'Grocery & Prep', icon: <ShoppingCart className="w-6 h-6" /> },
    ];

    // Determine which content to show based on the active feature
    const renderChatContent = () => {
        // Wrap feature components in a div that ensures they fill the available space.
        const featureWrapper = (Component) => (
            <div className="flex flex-col flex-1 min-h-0 h-full">
                {Component}
            </div>
        );

        if (activeFeature === 'food-guide') {
            return featureWrapper(<CityFoodSuggestionsComponent onGoBack={() => onFeatureSelect('chat')} />);
        }
        if (activeFeature === 'food-lookup') {
            return featureWrapper(<FoodLookupPage onGoBack={() => onFeatureSelect('chat')} />);
        }
        if (activeFeature === 'weather-food') {
            return featureWrapper(<WeatherFoodSuggestions onGoBack={() => onFeatureSelect('chat')} />);
        }
        if (activeFeature === 'cultural-explorer') {
            return featureWrapper(<CulturalFoodExplorer onGoBack={() => onFeatureSelect('chat')} />);
        }
        if (activeFeature === 'symptom-recommender') {
            return featureWrapper(<SymptomRecommender onGoBack={() => onFeatureSelect('chat')} />);
        }
        if (activeFeature === 'myth-buster') {
            return featureWrapper(<MythBuster onGoBack={() => onFeatureSelect('chat')} />);
        }
        if (activeFeature === 'grocery-list') {
            return featureWrapper(<SmartGroceryList onGoBack={() => onFeatureSelect('chat')} />);
        }
        
        // This is the default chat content
        return (
            // This wrapper ensures the layout is contained and flex properties work correctly.
            <div className="flex flex-col flex-1 min-h-0 self-stretch">
                {/* The main message display area */}
                <div className="p-4 sm:p-6 flex-grow overflow-y-auto custom-scrollbar">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center animate-fade-in flex flex-col h-full justify-center items-center px-4">
                            <Sparkles className="w-12 h-12 text-yellow-400 mb-4" />
                            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Welcome to</h1>
                            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">NutriBot AI</h1>
                            <p className="text-base sm:text-lg text-gray-300 max-w-md mb-8">Your personal AI-powered nutrition assistant. Get personalized advice, track your goals, and discover a world of healthy eating.</p>
                            <button 
                                className="bg-purple-600 text-white px-6 sm:px-8 py-3 rounded-full shadow-lg hover:bg-purple-700 mb-4 transition-all duration-300 transform hover:scale-105"
                                onClick={() => document.querySelector('input[type="text"]')?.focus()}
                            >
                                <MessageSquare className="w-5 h-5 inline mr-2" />
                                Start Chatting
                            </button>
                            <button 
                                className="bg-gray-700 text-white px-6 sm:px-8 py-3 rounded-full shadow-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                                onClick={() => setIsMenuOpen(true)}
                            >
                                <Crown className="w-5 h-5 inline mr-2" />
                                View Features
                            </button>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id || index} // Use message ID from firestore if available
                            className={`flex mb-4 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start'}`}
                        >
                            {msg.sender === 'bot' && (
                                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2 shadow-md">
                                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-4 rounded-2xl shadow-lg relative ${
                                    msg.sender === 'user'
                                        ? 'bg-purple-700 bg-opacity-80 text-white rounded-br-none'
                                        : 'bg-indigo-900 bg-opacity-70 text-white rounded-bl-none border border-blue-700'
                                }`}
                            >
                                {/* Display uploaded image if it exists in the message */}
                                {msg.image && (
                                    <div className="mb-4">
                                        <img
                                            src={msg.image}
                                            alt="Uploaded ingredients"
                                            className="max-w-full h-auto rounded-lg shadow-md"
                                        />
                                    </div>
                                )}
                                {msg.sender === 'bot' ? (
                                    <>
                                        <div className="prose prose-invert max-w-none bot-prose text-sm sm:text-base">
                                            {renderBotMessage(msg.text)}
                                        </div>
                                        <button
                                            onClick={() => handleTextToSpeech(msg.text, index)}
                                            className="absolute bottom-1 right-2 p-1 rounded-full text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            title={isPlaying === index ? "Pause" : "Play"}
                                        >
                                            {isPlaying === index ? (
                                                <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                                            ) : (
                                                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-sm sm:text-base leading-relaxed text-gray-200">{msg.text}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <>
                            <AnalyzingLoader isImage={!!imagePreview}/>
                            <NutrientFacts fact={fact} />
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
        
                {/* "Quick Questions" section - uncommented and made responsive */}
                <div className="flex-shrink-0 px-4 sm:px-6  border-t border-purple-700/50">
                    <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2">Quick Questions</h3>
                    <div className="flex overflow-x-auto space-x-4 pb-2 custom-scrollbar-horizontal">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSendMessage(suggestion)}
                                className="flex-shrink-0 bg-gray-700 bg-opacity-70 border border-purple-600/50 text-gray-300 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full shadow-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>

                {/* The main input area */}
                <div className="flex-shrink-0 p-2 sm:p-6 border-t border-purple-700/50">
                    {imagePreview && (
                        <div className="relative mb-4">
                            <img src={imagePreview} alt="Preview" className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl border border-purple-600/50 shadow-lg" />
                            <button
                                onClick={clearImageUpload}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                                title="Remove image"
                            >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about nutrients..."
                            className="flex-grow p-2 sm:p-3 rounded-full bg-gray-700 bg-opacity-80 border border-purple-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 shadow-inner text-sm sm:text-base"
                            disabled={isLoading || isListening}
                        />
                        
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <label htmlFor="image-upload" className={`p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${isLoading ? 'bg-gray-500' : 'bg-gray-700'}`}>
                            <Image className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </label>

                      
                        <button
                            onClick={() => handleSendMessage()}
                            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-2 sm:p-3 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || (input.trim() === '' && !imagePreview) || isListening}
                        >
                            <Send className="w-4 h-4 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
       <div className="flex flex-col h-full w-full bg-gradient-to-br from-purple-900 to-indigo-900 overflow-hidden"> {/* Updated background to match image gradient, removed opacity for full coverage */}
            {/* Header with menu button */}
            <div className="flex-shrink-0 flex items-center justify-between px-4  border-b border-purple-700/50 bg-gray-800 bg-opacity-70">
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="p-2 rounded-full hover:bg-gray-700 transition-all duration-300"
                >
                    <Menu className="w-6 h-6 text-white" />
                </button>
                <span className="text-white font-semibold text-base sm:text-lg">
                    {features.find(f => f.id === activeFeature)?.label || 'NutriBot AI'}
                </span>
                {/* Placeholder for potential other icons, like settings */}
                <div className="w-6 h-6" /> {/* Balance layout */}
            </div>

            {/* Sidebar Menu */}
            {isMenuOpen && (
                <div className="fixed top-0 left-0 h-full w-64 bg-gray-800 transform translate-x-0 transition-transform duration-300 ease-in-out z-50 shadow-2xl">
                    <div className="flex justify-between items-center p-4 border-b border-purple-700/50">
                        <span className="text-white font-bold text-lg">Features</span>
                        <button 
                            onClick={() => setIsMenuOpen(false)} 
                            className="p-2 rounded-full hover:bg-gray-700"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                    <div className="flex flex-col space-y-2 p-4 overflow-y-auto custom-scrollbar">
                        {features.map(({ id, label, icon }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    onFeatureSelect(id);
                                    setIsMenuOpen(false);
                                }}
                                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                                    activeFeature === id
                                        ? 'bg-purple-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                {icon}
                                <span className="text-base">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay for mobile when menu open */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {renderChatContent()}
        </div>
    );
};

export default ChatPage;