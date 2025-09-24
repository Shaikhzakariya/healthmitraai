import React, { useState } from 'react';
import { ChevronLeft, Globe, Search, Sparkles } from 'lucide-react';
import { retryWithExponentialBackoff } from '../../../utils/apiUtils';
import { renderBotMessage } from '../../../utils/messageRenderer';

const CulturalFoodExplorer = ({ onGoBack }) => {
    const [dish, setDish] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const exampleDishes = ["Japanese Bento", "Tom Yum Soup", "Italian Pasta Carbonara", "Mexican Tacos"];

    const handleExplore = async (dishToExplore = dish) => {
        if (!dishToExplore) {
            setError("Please enter a dish name.");
            return;
        }
        setDish(dishToExplore);
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const prompt = `The user is interested in the dish "${dishToExplore}". 
1.  **Cultural Background**: Briefly explain the cultural background and origin of this dish.
2.  **Healthy Indian Adaptation**: Suggest a similar, healthy version of this dish using locally available Indian ingredients. If the dish is already healthy, mention that. If it's for a specific condition like diabetes, adapt it accordingly.
3.  **Recipe**: Provide a simple recipe for the Indian version.
4.  **Nutrient Info**: Give an approximate nutritional breakdown (calories, protein, carbs, fat) for the Indian version.
5.  **Language Translation**: Translate the ingredient names and cooking steps into Hindi (in latin script, e.g., 'Namak' for salt).

Format the response with clear headings and bullet points.`;

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
                    <Globe size={24} className="text-cyan-400" />
                    <span>Cultural Food Explorer</span>
                </h2>
                <div className="w-6"></div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {!result && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center text-center h-full animate-fade-in">
                        <Globe className="w-16 h-16 text-purple-400 animate-pulse mb-4" />
                        <p className="text-gray-300 max-w-sm mb-6">
                            Enter any international dish to learn about it and get a healthy Indian version.
                        </p>
                        <div className="w-full max-w-sm flex flex-col space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={dish}
                                    onChange={(e) => setDish(e.target.value)}
                                    placeholder="Enter a dish name..."
                                    className="flex-grow p-3 rounded-full bg-gray-700 text-white border border-purple-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                                />
                                <button
                                    onClick={() => handleExplore()}
                                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
                                >
                                    <Search size={20}/>
                                </button>
                            </div>
                            <div className="text-gray-400 text-sm">Or try one of these:</div>
                            <div className="grid grid-cols-2 gap-3">
                                {exampleDishes.map(ex => (
                                    <button key={ex} onClick={() => handleExplore(ex)} className="bg-gray-700/80 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors shadow-md flex items-center justify-center space-x-2">
                                        <Globe size={16} />
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
                        <p className="text-gray-300">Exploring culinary worlds...</p>
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
                                onClick={() => { setResult(null); setDish(''); }}
                                className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                Explore another dish
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CulturalFoodExplorer;