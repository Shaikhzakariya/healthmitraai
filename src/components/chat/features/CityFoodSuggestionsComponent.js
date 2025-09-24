import React, { useState } from 'react';
import { ChevronLeft, Utensils, MapPin, Sparkles } from 'lucide-react';
import { retryWithExponentialBackoff } from '../../../utils/apiUtils';
import { renderBotMessage } from '../../../utils/messageRenderer';

const CityFoodSuggestionsComponent = ({ onGoBack }) => {
    const [selectedCity, setSelectedCity] = useState('');
    const [suggestions, setSuggestions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const indianCities = [
        "Agra", "Ahmedabad", "Amritsar", "Bengaluru (Bangalore)", "Chennai", "Delhi",
        "Goa", "Hyderabad", "Jaipur", "Kolkata", "Lucknow", "Mumbai", "Pune", "Varanasi"
    ];

    const featuredCities = ["Mumbai", "Delhi", "Bengaluru", "Kolkata"];

    const getSuggestions = async (city) => {
        if (!city) {
            setError("Please select a city first.");
            return;
        }
        setSelectedCity(city);
        setIsLoading(true);
        setError(null);
        setSuggestions(null);

        try {
            const generatedSuggestions = await generateFoodSuggestions(city);
            setSuggestions(generatedSuggestions);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generateFoodSuggestions = async (city) => {
        const prompt = `Act as a travel and food blogger. Provide a detailed summary of the best dishes, popular street foods, and famous restaurants or food experiences in and around ${city}, India. Also include a brief note on the unique culinary style of the region. Please use clear headings and bullet points to format the response.`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
      

        const makeApiCall = async () => {
            const response = await fetch("/.netlify/functions/generateContent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`API failed with status: ${response.status}`);
            }
            return await response.json();
        };

        const responseData = await retryWithExponentialBackoff(makeApiCall);

        if (responseData && responseData.candidates && responseData.candidates.length > 0 &&
            responseData.candidates[0].content && responseData.candidates[0].content.parts &&
            responseData.candidates[0].content.parts.length > 0) {
            const text = responseData.candidates[0].content.parts[0].text;
            return text;
        } else {
            throw new Error("Failed to get a valid response from the API.");
        }
    };

    return (
        <div className="p-6 flex flex-col h-[500px] relative">
            <div className="flex items-center justify-between border-b border-purple-700/50 pb-4 mb-4">
                <button onClick={onGoBack} className="text-gray-400 hover:text-purple-400 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center space-x-2">
                    <Utensils size={24} className="text-yellow-400" />
                    <span>Indian City Food Guide</span>
                </h2>
                <div className="w-6"></div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar mb-4 flex flex-col items-center justify-center text-center">
                {!suggestions && !isLoading && !error && (
                    <div className="flex flex-col items-center space-y-6 animate-fade-in">
                        <MapPin className="w-16 h-16 text-purple-400 animate-pulse" />
                        <p className="text-gray-300 max-w-sm">
                            Select an Indian city to get food recommendations and a guide to its culinary scene.
                        </p>
                        <div className="w-full max-w-xs flex flex-col space-y-4">
                            <select
                                value={selectedCity}
                                onChange={(e) => getSuggestions(e.target.value)}
                                className="w-full p-3 rounded-full bg-gray-700 text-white border border-purple-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                            >
                                <option value="" disabled>Select a City</option>
                                {indianCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full max-w-xs">
                            <p className="text-gray-400 text-sm mb-2">Or try a featured city:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {featuredCities.map(city => (
                                    <button key={city} onClick={() => getSuggestions(city)} className="bg-gray-700/80 text-gray-200 px-4 py-2 rounded-full hover:bg-gray-600 transition-colors shadow-md">
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin h-10 w-10 text-purple-400">
                            <Sparkles size={40} />
                        </div>
                        <p className="text-gray-300">Searching for food and restaurant recommendations...</p>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-800 bg-opacity-50 text-red-200 rounded-xl shadow-lg border border-red-700">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                {suggestions && (
                    <div className="w-full text-left animate-fade-in p-4 bg-gray-700 bg-opacity-50 rounded-xl shadow-lg border border-purple-600/50">
                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
                            A Culinary Guide to {selectedCity}
                        </h3>
                        <div className="prose prose-invert max-w-none bot-prose">
                            {renderBotMessage(suggestions)}
                        </div>
                    </div>
                )}
            </div>
            {suggestions && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => { setSuggestions(null); setSelectedCity(''); }}
                        className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Choose another city
                    </button>
                </div>
            )}
        </div>
    );
};

export default CityFoodSuggestionsComponent;