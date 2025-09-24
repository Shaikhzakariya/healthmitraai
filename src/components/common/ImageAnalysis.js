import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import AppContext from '../../contexts/AppContext'; // Assuming AppContext is in a contexts folder
import { Loader2, Camera, Scale, Utensils, AlertCircle, Info } from 'lucide-react';

// Image Analysis Component: Allows users to upload a food image and get a nutritional analysis from the AI.
const ImageAnalysis = ({ showCustomModal }) => {
    // Access Firebase services and user info from the global context.
    const { db, userId, isAuthenticated } = useContext(AppContext);

    // State for managing the image, UI, and analysis results.
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisDocId, setAnalysisDocId] = useState(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [error, setError] = useState(null);
    const [foodAmounts, setFoodAmounts] = useState({});
    const [instantNutrientMode, setInstantNutrientMode] = useState(false); // State for instant nutrient mode

    // State for the "typing effect" animation on the results.
    const [displayedOverallSummary, setDisplayedOverallSummary] = useState('');
    const [displayedRecommendations, setDisplayedRecommendations] = useState({});
    const TYPING_SPEED_MS = 20; // Speed of the typing animation in milliseconds.

    // Handles the user selecting an image file.
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setAnalysisResult(null);
            setAnalysisDocId(null);
            setDisplayedOverallSummary('');
            setDisplayedRecommendations({});
            setFoodAmounts({});
            setError(null);
        }
    };

    // Handles changes to the amount input for each food item
    const handleAmountChange = (itemId, value) => {
        const amount = parseFloat(value) || 0;
        setFoodAmounts(prev => ({
            ...prev,
            [itemId]: amount >= 0 ? amount : 0
        }));
    };

    // Calculate both calories and carbs based on user-entered amount
    const calculateNutrition = (valuePer100g, amount) => {
        if (!amount || amount <= 0) return valuePer100g;
        return ((valuePer100g * amount) / 100).toFixed(1);
    };

    // Toggle instant nutrient mode
    const toggleInstantNutrientMode = () => {
        setInstantNutrientMode(prev => !prev);
    };

    // This useEffect triggers the typing animation when a new analysis result is received.
    useEffect(() => {
        if (!analysisResult || instantNutrientMode) return; // Skip animation in instant mode

        const animate = () => {
            if (analysisResult.foodItems && analysisResult.foodItems.length > 0) {
                let itemIndex = 0;
                const typeRecommendations = () => {
                    if (itemIndex < analysisResult.foodItems.length) {
                        const item = analysisResult.foodItems[itemIndex];
                        let charIndex = 0;
                        const interval = setInterval(() => {
                            setDisplayedRecommendations(prev => ({ ...prev, [item.id]: item.recommendation.substring(0, charIndex + 1) }));
                            charIndex++;
                            if (charIndex === item.recommendation.length) {
                                clearInterval(interval);
                                itemIndex++;
                                typeRecommendations();
                            }
                        }, TYPING_SPEED_MS);
                    } else {
                        typeSummary();
                    }
                };
                typeRecommendations();
            } else if (analysisResult.overallSummaryForDiabetics) {
                typeSummary();
            }
        };

        const typeSummary = () => {
            let summaryIndex = 0;
            const summaryInterval = setInterval(() => {
                setDisplayedOverallSummary(analysisResult.overallSummaryForDiabetics.substring(0, summaryIndex + 1));
                summaryIndex++;
                if (summaryIndex === analysisResult.overallSummaryForDiabetics.length) {
                    clearInterval(summaryInterval);
                }
            }, TYPING_SPEED_MS);
        };

        animate();
    }, [analysisResult, instantNutrientMode]);

    // Debounced update to Firebase when foodAmounts change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!db || !userId || !analysisDocId || !analysisResult || !analysisResult.foodItems) return;

            const updatedFoodItems = analysisResult.foodItems.map(item => ({
                ...item,
                user_amount: foodAmounts[item.id] || 100,
                calculated_carbs: parseFloat(calculateNutrition(item.carbohydrates_g, foodAmounts[item.id] || 100)),
                calculated_calories: parseFloat(calculateNutrition(item.calories_kcal, foodAmounts[item.id] || 100))
            }));

            setDoc(doc(db, `users/${userId}/imageAnalysisHistory/${analysisDocId}`), { foodItems: updatedFoodItems }, { merge: true })
                .catch(err => console.error("Error updating document:", err));
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [foodAmounts, db, userId, analysisDocId, analysisResult]);

    // Main function to call the Gemini API and analyze the image.
    const analyzeImage = async () => {
        if (!selectedImage) {
            showCustomModal("Please select an image first.");
            return;
        }

        setLoadingAnalysis(true);
        setAnalysisResult(null);
        setAnalysisDocId(null);
        setDisplayedOverallSummary('');
        setDisplayedRecommendations({});
        setFoodAmounts({});
        setError(null);

        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onloadend = async () => {
            const base64ImageData = reader.result.split(',')[1];
            const prompt = `Analyze the food item(s) in this image for a diabetic patient. Identify main food items and other recognizable elements. For each food item, provide its common name, Indian name (if applicable), estimated carbohydrates (g), sugars in (High, Low, Medium) text, and calories (kcal). Also, assess its suitability for a diabetic (e.g., "Good choice", "Moderate, with portion control", "Avoid or limit") and provide a specific recommendation (e.g., portion size, alternatives). Respond with a JSON object containing "foodItems" (array of objects), "otherItems" (array of strings), and an "overallSummaryForDiabetics" (string).`;

            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: selectedImage.type, data: base64ImageData } }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "foodItems": { "type": "ARRAY", "items": { "type": "OBJECT", "properties": { "foodItem": { "type": "STRING" }, "indianName": { "type": "STRING" }, "carbohydrates_g": { "type": "NUMBER" }, "sugars_g": { "type": "STRING" }, "calories_kcal": { "type": "NUMBER" }, "diabeticSuitability": { "type": "STRING" }, "recommendation": { "type": "STRING" } } } },
                            "otherItems": { "type": "ARRAY", "items": { "type": "STRING" } },
                            "overallSummaryForDiabetics": { "type": "STRING" }
                        }
                    }
                }
            };

          

            try {
               const response = await fetch("/.netlify/functions/generateContent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
                if (!response.ok) throw new Error(`API error: ${response.status} ${await response.text()}`);

                const result = await response.json();
                const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!jsonString) throw new Error("Empty response from AI.");

                const parsedJson = JSON.parse(jsonString);
                const foodItemsWithIds = parsedJson.foodItems ? parsedJson.foodItems.map(item => ({ 
                    ...item, 
                    id: Math.random().toString(36).substr(2, 9),
                    user_amount: 100,
                    calculated_carbs: item.carbohydrates_g,
                    calculated_calories: item.calories_kcal
                })) : [];
                const finalResult = { ...parsedJson, foodItems: foodItemsWithIds };

                setAnalysisResult(finalResult);

                const initialAmounts = foodItemsWithIds.reduce((acc, item) => ({
                    ...acc,
                    [item.id]: 100
                }), {});
                setFoodAmounts(initialAmounts);

                if (db && userId && isAuthenticated) {
                    const docRef = await addDoc(collection(db, `users/${userId}/imageAnalysisHistory`), {
                        timestamp: new Date().toISOString(),
                        title: finalResult.foodItems?.[0]?.foodItem || "Food Analysis",
                        ...finalResult
                    });
                    setAnalysisDocId(docRef.id);
                }
            } catch (err) {
                console.error("Error during image analysis:", err);
                setError(`An error occurred: ${err.message}`);
                showCustomModal(`Analysis failed: ${err.message}`);
            } finally {
                setLoadingAnalysis(false);
            }
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col items-center p-4 sm:p-8">
            <div className="w-full max-w-2xl">
                <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
                    <Utensils className="w-8 h-8 text-blue-600" />
                    Food Image Analysis
                </h2>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl">
                    <div className="flex flex-col items-center space-y-6">
                        <label htmlFor="imageUpload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-md flex items-center justify-center gap-2 transition-all duration-300">
                            <Camera className="w-6 h-6" /> Upload Food Image
                            <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>

                        {imagePreview && (
                            <div className="w-full max-w-md border-2 border-gray-200 p-2 rounded-xl overflow-hidden shadow-inner transition-transform duration-300 hover:scale-105">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-lg" />
                            </div>
                        )}

                        <div className="flex justify-center items-center gap-4 w-full max-w-md">
                            <label htmlFor="instantMode" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Info className="w-5 h-5 text-gray-500" />
                                Instant Nutrient Data
                            </label>
                            <input
                                type="checkbox"
                                id="instantMode"
                                checked={instantNutrientMode}
                                onChange={toggleInstantNutrientMode}
                                className="hidden"
                            />
                            <div
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${instantNutrientMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                                onClick={toggleInstantNutrientMode}
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${instantNutrientMode ? 'translate-x-6' : 'translate-x-0'}`}
                                />
                            </div>
                        </div>

                        <button
                            onClick={analyzeImage}
                            disabled={!selectedImage || loadingAnalysis}
                            className="w-full max-w-md py-3 px-8 rounded-full shadow-md flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {loadingAnalysis && <Loader2 className="animate-spin w-6 h-6" />}
                            {loadingAnalysis ? 'Analyzing...' : 'Analyze Image'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        <span><strong>Error:</strong> {error}</span>
                    </div>
                )}

                {analysisResult && (
                    <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-200 space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-blue-600" />
                            Analysis Results
                        </h3>
                        {analysisResult.foodItems?.length > 0 && (
                            <div className="space-y-6">
                                <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">🍽️</span>
                                    Identified Food Items
                                </h4>

                                <ul className="grid gap-6 md:grid-cols-2">
                                    {analysisResult.foodItems.map((item) => (
                                        <li
                                            key={item.id}
                                            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300"
                                        >
                                            {/* Food Title */}
                                            <h5 className="font-bold text-xl text-blue-800 mb-4 flex items-center gap-2">
                                                🥗 {item.foodItem}{" "}
                                                {item.indianName && (
                                                    <span className="text-sm text-gray-500">({item.indianName})</span>
                                                )}
                                            </h5>

                                            {/* Input Section */}
                                            <div className="relative w-28">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={foodAmounts[item.id] || ""}
                                                    onChange={(e) => handleAmountChange(item.id, e.target.value)}
                                                    className="w-full p-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-center cursor-text hover:shadow-md hover:border-blue-400 placeholder-gray-400"
                                                    placeholder="100"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                    ✏️
                                                </span>
                                            </div>

                                            {foodAmounts[item.id] === 0 && (
                                                <p className="text-red-500 text-xs mb-3">
                                                    ⚠️ Please enter a valid amount
                                                </p>
                                            )}

                                            {/* Nutrition Info */}
                                            <div className="space-y-2 text-sm text-gray-700">
                                                <p className="flex items-center gap-2">
                                                    🍞 <span className="font-medium">Carbs:</span>
                                                    <span className="text-gray-800">
                                                        {calculateNutrition(item.carbohydrates_g, foodAmounts[item.id])} g
                                                    </span>
                                                </p>

                                                <p className="flex items-center gap-2">
                                                    🍬 <span className="font-medium">Sugars:</span>
                                                    <span className="text-gray-800">{item.sugars_g}</span>
                                                </p>

                                                <p className="flex items-center gap-2">
                                                    🔥 <span className="font-medium">Calories:</span>
                                                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg font-semibold">
                                                        {calculateNutrition(item.calories_kcal, foodAmounts[item.id])} kcal
                                                    </span>
                                                    {foodAmounts[item.id] !== 100 &&
                                                        `(for ${foodAmounts[item.id]}g)`}
                                                </p>

                                                {!instantNutrientMode && (
                                                    <>
                                                        <p className="flex items-center gap-2">
                                                            ✅ <span className="font-medium">Suitability:</span>
                                                            <span className="text-blue-700 font-semibold">
                                                                {item.diabeticSuitability}
                                                            </span>
                                                        </p>

                                                        {/* Recommendation block */}
                                                        <div className="mt-3">
                                                            <p className="flex items-center gap-2 font-medium">
                                                                💡 Recommendation:
                                                            </p>
                                                            <p className="ml-7 italic text-gray-600 leading-relaxed">
                                                                {displayedRecommendations[item.id] || "—"}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Other Items */}
                        {analysisResult.otherItems?.length > 0 && !instantNutrientMode && (
                            <p className="text-gray-700 mt-6">
                                <strong>Other Items:</strong> {analysisResult.otherItems.join(", ")}
                            </p>
                        )}

                        {/* Overall Summary */}
                        {displayedOverallSummary && !instantNutrientMode && (
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg mt-4">
                                <strong>Overall Summary:</strong> {displayedOverallSummary}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageAnalysis;