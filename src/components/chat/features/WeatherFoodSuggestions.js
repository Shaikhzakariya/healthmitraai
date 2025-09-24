import React, { useState } from 'react';
import { ChevronLeft, Cloudy, Sparkles, Sun, CloudRain, Snowflake } from 'lucide-react';
import { retryWithExponentialBackoff } from '../../../utils/apiUtils';
import { renderBotMessage } from '../../../utils/messageRenderer';

const WeatherFoodSuggestions = ({ onGoBack }) => {
    const [location, setLocation] = useState('');
    const [weather, setWeather] = useState(null);
    const [suggestions, setSuggestions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getMockWeather = (condition) => {
        const conditions = {
            "Hot Day": { temp: 32, condition: "Sunny", icon: "☀️" },
            "Rainy Day": { temp: 15, condition: "Rainy", icon: "🌧️" },
            "Cold Day": { temp: 8, condition: "Snowy", icon: "❄️" },
        };
        return conditions[condition] || conditions["Hot Day"];
    };
    
    const getSuggestions = async (loc, cond) => {
        if (!loc) {
            setError("Please enter a location.");
            return;
        }
        setLocation(loc);
        setIsLoading(true);
        setError(null);
        setSuggestions(null);

        try {
            const weatherData = getMockWeather(cond);
            setWeather(weatherData);

            const prompt = `The weather in ${loc} is a ${weatherData.condition} with a temperature around ${weatherData.temp}°C. Based on this, suggest some healthy and delicious food and drink ideas. Include breakfast, lunch, dinner, and a snack. Format the response with clear headings and bullet points.`;

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
                setSuggestions(text);
            } else {
                throw new Error("Failed to get suggestions from the API.");
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
            <div className="flex items-center justify-between border-b border-purple-700/50 pb-4 mb-4">
                <button onClick={onGoBack} className="text-gray-400 hover:text-purple-400 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center space-x-2">
                    <Cloudy size={24} className="text-cyan-400" />
                    <span>Weather-Based Food Ideas</span>
                </h2>
                <div className="w-6"></div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar mb-4 flex flex-col items-center justify-center text-center">
                {!suggestions && !isLoading && !error && (
                    <div className="flex flex-col items-center space-y-6 animate-fade-in">
                        <Cloudy className="w-16 h-16 text-purple-400 animate-pulse" />
                        <p className="text-gray-300 max-w-sm">
                            Get food ideas tailored to the weather. Enter your city and click a weather type below.
                        </p>
                        <div className="w-full max-w-xs flex flex-col space-y-4">
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter your city..."
                                className="w-full p-3 rounded-full bg-gray-700 text-white border border-purple-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                            />
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <button onClick={() => getSuggestions(location, "Hot Day")} className="flex items-center justify-center space-x-2 bg-yellow-500/80 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition-colors shadow-md">
                                    <Sun size={20}/> <span>Hot Day</span>
                                </button>
                                <button onClick={() => getSuggestions(location, "Rainy Day")} className="flex items-center justify-center space-x-2 bg-blue-500/80 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors shadow-md">
                                    <CloudRain size={20}/> <span>Rainy Day</span>
                                </button>
                                <button onClick={() => getSuggestions(location, "Cold Day")} className="flex items-center justify-center space-x-2 bg-cyan-500/80 text-white px-4 py-2 rounded-full hover:bg-cyan-600 transition-colors shadow-md">
                                    <Snowflake size={20}/> <span>Cold Day</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin h-10 w-10 text-purple-400">
                            <Sparkles size={40} />
                        </div>
                        <p className="text-gray-300">Checking the weather and brewing up ideas...</p>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-800 bg-opacity-50 text-red-200 rounded-xl shadow-lg border border-red-700">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                {suggestions && weather && (
                    <div className="w-full text-left animate-fade-in p-4 bg-gray-700 bg-opacity-50 rounded-xl shadow-lg border border-purple-600/50">
                        <div className="text-center mb-4 p-3 bg-gray-800/50 rounded-lg">
                            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                Ideas for a {weather.condition} Day in {location} {weather.icon}
                            </h3>
                        </div>
                        <div className="prose prose-invert max-w-none bot-prose">
                            {renderBotMessage(suggestions)}
                        </div>
                    </div>
                )}
            </div>
             {suggestions && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => { setSuggestions(null); setWeather(null); setLocation(''); }}
                        className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Check another location
                    </button>
                </div>
            )}
        </div>
    );
};

export default WeatherFoodSuggestions;