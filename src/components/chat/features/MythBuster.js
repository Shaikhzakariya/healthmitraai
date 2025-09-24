import React, { useState } from 'react';
import { ChevronLeft, BookOpen, Search, Sparkles, HelpCircle } from 'lucide-react';
import { retryWithExponentialBackoff } from '../../../utils/apiUtils';
import { renderBotMessage } from '../../../utils/messageRenderer';

const MythBuster = ({ onGoBack }) => {
    const [myth, setMyth] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const exampleMyths = ["Is rice bad for weight loss?", "Is ghee unhealthy?", "Does drinking coffee stunt growth?", "Are artificial sweeteners safe?"];

    const handleBustMyth = async (mythToBust = myth) => {
        if (!mythToBust) {
            setError("Please enter a myth or a question.");
            return;
        }
        setMyth(mythToBust);
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const prompt = `The user has a question about a nutrition myth: "${mythToBust}".
Act as a science communicator and nutrition expert. Provide a clear, concise, and science-backed explanation that either debunks or validates the user's question. Use simple language and cite general scientific consensus or well-known studies if applicable (without needing specific links). For example, if asked "Is ghee unhealthy?", explain its composition (saturated fats, vitamins) and the role of moderation. The goal is to provide a trustworthy, easy-to-understand answer. Format the response clearly.`;

            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
      
            const response = await retryWithExponentialBackoff(async () => {
          const response = await fetch("/.netlify/functions/generateContent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                return res.json();
            });

            if (response.candidates && response.candidates.length > 0) {
                const text = response.candidates[0].content.parts[0].text;
                setResult(text);
            } else {
                throw new Error("Failed to get a response from the API.");
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 flex flex-col h-[500px] relative">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-purple-700/50 pb-4 mb-4">
                <button onClick={onGoBack} className="text-gray-400 hover:text-purple-400 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center space-x-2">
                    <BookOpen size={24} className="text-yellow-400" />
                    <span>Nutrition Myth Buster</span>
                </h2>
                <div className="w-6"></div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {!result && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center text-center h-full animate-fade-in">
                        <BookOpen className="w-16 h-16 text-purple-400 animate-pulse mb-4" />
                        <p className="text-gray-300 max-w-sm mb-6">
                            Heard something about nutrition you're not sure about? Let's separate fact from fiction.
                        </p>
                        <div className="w-full max-w-md flex flex-col space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={myth}
                                    onChange={(e) => setMyth(e.target.value)}
                                    placeholder="e.g., 'Is rice bad for weight loss?'"
                                    className="flex-grow p-3 rounded-full bg-gray-700 text-white border border-purple-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                                />
                                <button
                                    onClick={() => handleBustMyth()}
                                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                             <div className="text-gray-400 text-sm">Or investigate one of these:</div>
                            <div className="space-y-3 w-full">
                                {exampleMyths.map(ex => (
                                    <button key={ex} onClick={() => handleBustMyth(ex)} className="w-full text-left bg-gray-700/80 text-gray-200 p-3 rounded-lg hover:bg-gray-600 transition-colors shadow-md flex items-center space-x-3">
                                        <HelpCircle className="text-purple-400 flex-shrink-0" size={20}/>
                                        <span>{ex}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="animate-spin h-10 w-10 text-purple-400">
                            <Sparkles size={40} />
                        </div>
                        <p className="text-gray-300">Consulting the science...</p>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-800 bg-opacity-50 text-red-200 rounded-xl shadow-lg border border-red-700">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                {result && (
                    <div className="animate-fade-in">
                        <div className="w-full text-left p-4 bg-gray-700 bg-opacity-50 rounded-xl shadow-lg border border-purple-600/50">
                            <div className="prose prose-invert max-w-none bot-prose">
                                {renderBotMessage(result)}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => { setResult(null); setMyth(''); }}
                                className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                Ask another question
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MythBuster;