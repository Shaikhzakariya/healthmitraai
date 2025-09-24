import React, { useState, useEffect } from 'react';
import { ChevronLeft, Database, Search, Sparkles, Flame, Beef, Wind, Zap, Droplet, Wheat } from 'lucide-react';
import { retryWithExponentialBackoff } from '../../../utils/apiUtils';

const FoodLookupPage = ({ onGoBack }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [foodData, setFoodData] = useState(null);
    const [initialItems, setInitialItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState(null);

    const foodDatabase = [
        "Apple", "Avocado", "Almonds", "Asparagus", "Banana", "Broccoli", "Blueberries", "Beef", "Beans", "Bread",
        "Chicken Breast", "Carrot", "Cauliflower", "Cheese", "Chia Seeds", "Cucumber", "Dates", "Duck", "Egg", "Edamame",
        "Fish (Salmon)", "Flax Seeds", "Grapes", "Greek Yogurt", "Green Beans", "Honey", "Hummus", "Kale", "Kiwi", "Lamb",
        "Lentils", "Lettuce", "Mango", "Milk", "Mushrooms", "Oats", "Olive Oil", "Onion", "Orange", "Pasta", "Peanut Butter",
        "Pear", "Peas", "Pineapple", "Pork", "Potato", "Quinoa", "Raspberries", "Rice", "Spinach", "Strawberries",
        "Sweet Potato", "Tomato", "Tuna", "Turkey", "Walnuts", "Watermelon", "Yogurt", "Zucchini"
    ];

    const getNutritionalInfo = async (foodItem) => {
        const prompt = `Provide a detailed nutritional breakdown for 100g of "${foodItem}". Include values for Calories, Protein, Carbohydrates, Sugar, Fat, and Fiber.`;
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];

        const responseSchema = {
            type: "OBJECT",
            properties: {
                "foodName": { "type": "STRING" },
                "servingSize": { "type": "STRING", "description": "e.g., 100g" },
                "calories": { "type": "STRING" },
                "protein": { "type": "STRING" },
                "carbohydrates": { "type": "STRING" },
                "sugar": { "type": "STRING" },
                "fat": { "type": "STRING" },
                "fiber": { "type": "STRING" },
            },
            required: ["foodName", "servingSize", "calories", "protein", "carbohydrates", "fat"]
        };

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        };

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
            const jsonText = response.candidates[0].content.parts[0].text;
            return JSON.parse(jsonText);
        } else {
            throw new Error(`No nutritional data found for ${foodItem}.`);
        }
    };
    
    useEffect(() => {
        const fetchInitialItems = async () => {
            setIsInitialLoading(true);
            const defaultFoods = ["Apple", "Avocado", "Chicken Breast", "Broccoli"];
            try {
                const promises = defaultFoods.map(food => getNutritionalInfo(food));
                const results = await Promise.all(promises);
                setInitialItems(results);
            } catch (err) {
                console.error("Failed to fetch initial food items:", err);
                setError("Could not load initial food data. Please check your connection.");
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchInitialItems();
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        if (value.length > 1) {
            const filteredSuggestions = foodDatabase.filter(food =>
                food.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const fetchAndSetSingleFood = async (foodItem) => {
        setIsLoading(true);
        setError(null);
        setFoodData(null);
        try {
            const data = await getNutritionalInfo(foodItem);
            setFoodData(data);
        } catch (err) {
            setError(err.message || `Could not fetch data for ${foodItem}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        setSuggestions([]);
        fetchAndSetSingleFood(suggestion);
    };

    const handleSearch = () => {
        if (!query) return;
        setSuggestions([]);
        fetchAndSetSingleFood(query);
    };

    const NutrientCard = ({ icon, label, value, color }) => (
        <div className="bg-gray-700 bg-opacity-70 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg border border-purple-600/30">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${color}`}>
                {icon}
            </div>
            <p className="text-sm text-gray-300">{label}</p>
            <p className="text-xl font-bold text-white">{value || 'N/A'}</p>
        </div>
    );
    
    const InitialFoodItemCard = ({ item, onClick }) => (
        <button onClick={onClick} className="bg-gray-700 bg-opacity-50 p-4 rounded-2xl shadow-lg border border-purple-600/30 w-full animate-fade-in text-left hover:bg-gray-700 transition-colors">
            <h4 className="text-lg font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-3">{item.foodName}</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-xs text-gray-400">Calories</p>
                    <p className="font-semibold text-white">{item.calories.split(' ')[0]}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Protein</p>
                    <p className="font-semibold text-white">{item.protein}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Carbs</p>
                    <p className="font-semibold text-white">{item.carbohydrates}</p>
                </div>
            </div>
        </button>
    );

    return (
        <div className="p-6 flex flex-col h-[500px]">
            <div className="flex items-center justify-between border-b border-purple-700/50 pb-4 mb-4">
                <button onClick={onGoBack} className="text-gray-400 hover:text-purple-400 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center space-x-2">
                    <Database size={24} className="text-teal-400" />
                    <span>Food Lookup</span>
                </h2>
                <div className="w-6"></div>
            </div>

            <div className="relative mb-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="E.g., 'Apple' or 'Chicken Breast'"
                        className="flex-grow p-3 rounded-full bg-gray-700 bg-opacity-80 border border-purple-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 shadow-inner"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        <Search className="w-6 h-6" />
                    </button>
                </div>
                {suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-gray-800 border border-purple-600/50 rounded-xl mt-2 shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                        {suggestions.map((s, i) => (
                            <li
                                key={i}
                                onClick={() => handleSuggestionClick(s)}
                                className="p-3 hover:bg-purple-700/50 cursor-pointer text-gray-200"
                            >
                                {s}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {isLoading || isInitialLoading ? (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="animate-spin h-10 w-10 text-purple-400">
                            <Sparkles size={40} />
                        </div>
                        <p className="text-gray-300 mt-4">
                            {isLoading ? `Fetching data for ${query}...` : 'Loading popular foods...'}
                        </p>
                    </div>
                ) : error ? (
                     <div className="p-4 bg-red-800 bg-opacity-50 text-red-200 rounded-xl shadow-lg border border-red-700 text-center">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                ) : foodData ? (
                    <div className="animate-fade-in space-y-4">
                        <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                            {foodData.foodName} ({foodData.servingSize})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <NutrientCard icon={<Flame size={24} className="text-white"/>} label="Calories" value={foodData.calories} color="bg-red-500" />
                            <NutrientCard icon={<Beef size={24} className="text-white"/>} label="Protein" value={foodData.protein} color="bg-blue-500" />
                            <NutrientCard icon={<Wind size={24} className="text-white"/>} label="Carbs" value={foodData.carbohydrates} color="bg-yellow-500" />
                            <NutrientCard icon={<Zap size={24} className="text-white"/>} label="Sugar" value={foodData.sugar} color="bg-pink-500" />
                            <NutrientCard icon={<Droplet size={24} className="text-white"/>} label="Fat" value={foodData.fat} color="bg-orange-500" />
                            <NutrientCard icon={<Wheat size={24} className="text-white"/>} label="Fiber" value={foodData.fiber} color="bg-green-500" />
                        </div>
                        <div className="text-center mt-4">
                             <button
                                onClick={() => { setFoodData(null); setQuery(''); }}
                                className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                Search Another Food
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {initialItems.map((item, index) => (
                            <InitialFoodItemCard key={index} item={item} onClick={() => fetchAndSetSingleFood(item.foodName)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FoodLookupPage;