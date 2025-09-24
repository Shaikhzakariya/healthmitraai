import React, { useState } from 'react';
import { ChevronLeft, ShoppingCart, Sparkles, ClipboardList } from 'lucide-react';
import { retryWithExponentialBackoff } from '../../../utils/apiUtils';

const SmartGroceryList = ({ onGoBack }) => {
    const [planRequest, setPlanRequest] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const exampleRequests = [
        "A 3-day low-carb meal plan for one person.",
        "A vegetarian meal plan for a family of 4 for a week.",
        "A high-protein meal plan for muscle gain.",
        "A simple 2-day meal plan for weight loss."
    ];

    const generateMealPlan = async () => {
        if (!planRequest.trim()) {
            setError("Please describe your meal plan request.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedPlan(null);

        try {
            const prompt = `Generate a detailed meal plan and a categorized grocery list based on the following request: "${planRequest}".
            
            The meal plan should include:
            - Day (e.g., Day 1)
            - Meal Type (e.g., Breakfast, Lunch, Dinner, Snack)
            - Dish Name
            - Ingredients for each dish
            - Simple instructions for each dish

            The grocery list should be categorized (e.g., Produce, Dairy, Grains, Proteins, Pantry Staples).
            
            Provide the response in a JSON object with two main keys: "mealPlan" (an array of daily meal objects) and "groceryList" (an array of categorized grocery items).
            
            Example JSON Structure:
            {
              "mealPlan": [
                {
                  "day": "Day 1",
                  "meals": [
                    {
                      "mealType": "Breakfast",
                      "dishName": "Oatmeal with Berries",
                      "ingredients": ["1/2 cup rolled oats", "1 cup water", "1/2 cup mixed berries", "1 tbsp honey"],
                      "instructions": "Combine oats and water, cook until creamy. Stir in berries and honey."
                    }
                  ]
                }
              ],
              "groceryList": [
                {
                  "category": "Produce",
                  "items": ["Mixed berries", "Spinach"]
                },
                {
                  "category": "Grains",
                  "items": ["Rolled oats"]
                }
              ]
            }`;

            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            
            const responseSchema = {
                type: "OBJECT",
                properties: {
                    "mealPlan": {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "day": { "type": "STRING" },
                                "meals": {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            "mealType": { "type": "STRING" },
                                            "dishName": { "type": "STRING" },
                                            "ingredients": {
                                                type: "ARRAY",
                                                items: { "type": "STRING" }
                                            },
                                            "instructions": { "type": "STRING" }
                                        },
                                        required: ["mealType", "dishName", "ingredients", "instructions"]
                                    }
                                }
                            },
                            required: ["day", "meals"]
                        }
                    },
                    "groceryList": {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "category": { "type": "STRING" },
                                "items": {
                                    type: "ARRAY",
                                    items: { "type": "STRING" }
                                }
                            },
                            required: ["category", "items"]
                        }
                    }
                },
                required: ["mealPlan", "groceryList"]
            };

            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            };

                
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
                const jsonText = response.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonText);
                setGeneratedPlan(parsedJson);
            } else {
                throw new Error("Failed to get a valid response from the API.");
            }

        } catch (err) {
            console.error("Error generating meal plan:", err);
            setError(err.message || "Failed to generate meal plan. Please try again.");
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
                    <ShoppingCart size={24} className="text-green-400" />
                    <span>Smart Grocery List & Meal Prep</span>
                </h2>
                <div className="w-6"></div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {!generatedPlan && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center text-center h-full animate-fade-in">
                        <ShoppingCart className="w-16 h-16 text-purple-400 animate-pulse mb-4" />
                        <p className="text-gray-300 max-w-sm mb-6">
                            Describe your desired meal plan (e.g., "a 3-day low-carb plan") and get a full meal plan with a grocery list!
                        </p>
                        <div className="w-full max-w-md flex flex-col space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={planRequest}
                                    onChange={(e) => setPlanRequest(e.target.value)}
                                    placeholder="e.g., '5-day high-protein plan for weight loss'"
                                    className="flex-grow p-3 rounded-full bg-gray-700 text-white border border-purple-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                                />
                                <button
                                    onClick={generateMealPlan}
                                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
                                >
                                    <Sparkles size={20} />
                                </button>
                            </div>
                            <div className="text-gray-400 text-sm">Or try one of these examples:</div>
                            <div className="space-y-3 w-full">
                                {exampleRequests.map(req => (
                                    <button key={req} onClick={() => setPlanRequest(req)} className="w-full text-left bg-gray-700/80 text-gray-200 p-3 rounded-lg hover:bg-gray-600 transition-colors shadow-md flex items-center space-x-3">
                                        <ClipboardList className="text-green-400 flex-shrink-0" size={20}/>
                                        <span>{req}</span>
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
                        <p className="text-gray-300">Generating your personalized meal plan and grocery list...</p>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-800 bg-opacity-50 text-red-200 rounded-xl shadow-lg border border-red-700">
                        <p className="font-bold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                {generatedPlan && (
                    <div className="animate-fade-in space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4">
                                Your Meal Plan
                            </h3>
                            {generatedPlan.mealPlan.map((dayPlan, dayIndex) => (
                                <div key={dayIndex} className="mb-6 p-4 bg-gray-700 bg-opacity-50 rounded-xl shadow-lg border border-purple-600/50">
                                    <h4 className="text-xl font-semibold text-purple-300 mb-3">{dayPlan.day}</h4>
                                    <div className="space-y-4">
                                        {dayPlan.meals.map((meal, mealIndex) => (
                                            <div key={mealIndex} className="bg-gray-800 p-4 rounded-lg shadow-inner border border-gray-600">
                                                <p className="font-bold text-lg text-white mb-1">{meal.mealType}: {meal.dishName}</p>
                                                <p className="text-gray-300 text-sm">
                                                    <span className="font-semibold text-pink-300">Ingredients:</span> {meal.ingredients.join(', ')}
                                                </p>
                                                <p className="text-gray-300 text-sm mt-2">
                                                    <span className="font-semibold text-teal-300">Instructions:</span> {meal.instructions}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4">
                                Your Grocery List
                            </h3>
                            <div className="space-y-4">
                                {generatedPlan.groceryList.map((category, catIndex) => (
                                    <div key={catIndex} className="p-4 bg-gray-700 bg-opacity-50 rounded-xl shadow-lg border border-purple-600/50">
                                        <h4 className="text-xl font-semibold text-purple-300 mb-3">{category.category}</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-200">
                                            {category.items.map((item, itemIndex) => (
                                                <li key={itemIndex}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={() => { setGeneratedPlan(null); setPlanRequest(''); }}
                                className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                Generate Another Plan
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartGroceryList;