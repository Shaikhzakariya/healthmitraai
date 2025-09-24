import React, { useState } from 'react';
import { ChevronLeft, HeartPulse, Search, Sparkles, BrainCircuit, Wind, Zap, HelpCircle } from 'lucide-react';
import { retryWithExponentialBackoff } from '../../../utils/apiUtils';
import { renderBotMessage } from '../../../utils/messageRenderer';

const SymptomRecommender = ({ onGoBack }) => {
    const [symptom, setSymptom] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const exampleSymptoms = [
        { label: "Headache", icon: <BrainCircuit size={20} /> },
        { label: "Feeling Bloated", icon: <Wind size={20} /> },
        { label: "Low Energy", icon: <Zap size={20} className="text-yellow-400" /> },
        { label: "Constipation", icon: <HelpCircle size={20} /> }
    ];

    const handleRecommendation = async (symptomToRecommend = symptom) => {
        if (!symptomToRecommend) {
            setError("Please enter a symptom or mood.");
            return;
        }
        setSymptom(symptomToRecommend);
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const prompt = `The user is experiencing: "${symptomToRecommend}". 
Please act as a nutritional expert. Suggest specific foods and drinks that could help alleviate this symptom or improve their mood. Explain why each food is beneficial. For example, for "constipation," you might suggest fiber-rich foods and explain how fiber helps. For "feeling bloated," you might suggest foods with high water content. Provide the information in a clear, easy-to-read format using headings and bullet points.`;

            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
          

            const response = await retryWithExponentialBackoff(async () => {
                const res = await fetch("/.netlify/functions/generateContent", {
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
                    <HeartPulse size={24} className="text-red-400" />
                    <span>Symptom Food Recommender</span>
                </h2>
                <div className="w-6"></div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {!result && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center text-center h-full animate-fade-in">
                        <HeartPulse className="w-16 h-16 text-purple-400 animate-pulse mb-4" />
                        <p className="text-gray-300 max-w-sm mb-6">
                            Enter a symptom or mood to get food recommendations that might help.
                        </p>
                        <div className="w-full max-w-md flex flex-col space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={symptom}
                                    onChange={(e) => setSymptom(e.target.value)}
                                    placeholder="e.g., 'Headache' or 'Feeling tired'"
                                    className="flex-grow p-3 rounded-full bg-gray-700 text-white border border-purple-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                                />
                                <button
                                    onClick={() => handleRecommendation()}
                                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
                                >
                                    <Search size={20}/>
                                </button>
                            </div>
                             <div className="text-gray-400 text-sm">Or try one of these common concerns:</div>
                            <div className="grid grid-cols-2 gap-3">
                                {exampleSymptoms.map(ex => (
                                    <button key={ex.label} onClick={() => handleRecommendation(ex.label)} className="bg-gray-700/80 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors shadow-md flex items-center justify-center space-x-2">
                                        {ex.icon}
                                        <span>{ex.label}</span>
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
                        <p className="text-gray-300">Finding food-based solutions...</p>
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
                                onClick={() => { setResult(null); setSymptom(''); }}
                                className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                Check another symptom
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SymptomRecommender;