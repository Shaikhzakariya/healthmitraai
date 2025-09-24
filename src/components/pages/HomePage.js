import React from 'react';
import { Sparkles, MessageSquare, Crown } from 'lucide-react';

const HomePage = ({ onNavigate }) => (
    <div className="p-8 text-center min-h-[500px] flex flex-col justify-center items-center">
        <Sparkles className="w-20 h-20 text-yellow-300 mb-6 animate-pulse" />
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-wide mb-4">
            Welcome to NutriBot AI
        </h2>
        <p className="text-gray-300 mb-10 max-w-xl">
            Your personal AI-powered nutrition assistant. Get personalized advice, track your goals, and discover a world of healthy eating.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
                onClick={() => onNavigate('chat')}
                className="group bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 rounded-xl font-bold shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
                <MessageSquare className="w-5 h-5 group-hover:animate-pulse" />
                <span>Start Chatting</span>
            </button>
            <button
                onClick={() => onNavigate('features')}
                className="group bg-gray-700 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
                <Crown className="w-5 h-5 group-hover:animate-bounce" />
                <span>View Features</span>
            </button>
        </div>
    </div>
);

export default HomePage;