import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import AppContext from '../../contexts/AppContext'; // Assuming AppContext is in a contexts folder
import { Loader2, Camera } from 'lucide-react';

// Image Analysis Component: Allows users to upload a food image and get a nutritional analysis from the AI.
const ImageAnalysis = ({ showCustomModal }) => {
    // Access Firebase services and user info from the global context.
    const { db, userId, isAuthenticated } = useContext(AppContext);

    // State for managing the image, UI, and analysis results.
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [error, setError] = useState(null);

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
            // Reset previous results when a new image is selected.
            setAnalysisResult(null);
            setDisplayedOverallSummary('');
            setDisplayedRecommendations({});
            setError(null);
        }
    };

    // This useEffect triggers the typing animation when a new analysis result is received.
    useEffect(() => {
        if (!analysisResult) return;

        const animate = () => {
            // Animate recommendations for each food item first.
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
                                typeRecommendations(); // Move to the next item
                            }
                        }, TYPING_SPEED_MS);
                    } else {
                        // After all item recommendations are typed, type the overall summary.
                        typeSummary();
                    }
                };
                typeRecommendations();
            } else if (analysisResult.overallSummaryForDiabetics) {
                // If there are no specific items, just type the summary.
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
    }, [analysisResult]); // Dependency: This effect runs only when analysisResult changes.

    // Main function to call the Gemini API and analyze the image.
    const analyzeImage = async () => {
        if (!selectedImage) {
            showCustomModal("Please select an image first.");
            return;
        }

        setLoadingAnalysis(true);
        setAnalysisResult(null);
        setDisplayedOverallSummary('');
        setDisplayedRecommendations({});
        setError(null);

        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onloadend = async () => {
            const base64ImageData = reader.result.split(',')[1];
            const prompt = `Analyze the food item(s) in this image for a diabetic patient. Identify main food items and other recognizable elements. For each food item, provide its common name, Indian name (if applicable), estimated carbohydrates (g), sugars (g), and calories (kcal). Also, assess its suitability for a diabetic (e.g., "Good choice", "Moderate, with portion control", "Avoid or limit") and provide a specific recommendation (e.g., portion size, alternatives). Respond with a JSON object containing "foodItems" (array of objects), "otherItems" (array of strings), and an "overallSummaryForDiabetics" (string).`;
            
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: selectedImage.type, data: base64ImageData } }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "foodItems": { "type": "ARRAY", "items": { "type": "OBJECT", "properties": { "foodItem": { "type": "STRING" }, "indianName": { "type": "STRING" }, "carbohydrates_g": { "type": "NUMBER" }, "sugars_g": { "type": "NUMBER" }, "calories_kcal": { "type": "NUMBER" }, "diabeticSuitability": { "type": "STRING" }, "recommendation": { "type": "STRING" } } } },
                            "otherItems": { "type": "ARRAY", "items": { "type": "STRING" } },
                            "overallSummaryForDiabetics": { "type": "STRING" }
                        }
                    }
                }
            };

            const apiKey = "AIzaSyAqsq-uObIskeq8dk-1yVYgdYLH6fvPbs0"; // Replace with your actual API key if needed, or handle via environment variables.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`API error: ${response.status} ${await response.text()}`);
                
                const result = await response.json();
                const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!jsonString) throw new Error("Empty response from AI.");

                const parsedJson = JSON.parse(jsonString);
                // Add a unique ID to each food item for React keys and state management.
                const foodItemsWithIds = parsedJson.foodItems ? parsedJson.foodItems.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) })) : [];
                const finalResult = { ...parsedJson, foodItems: foodItemsWithIds };
                
                setAnalysisResult(finalResult);

                // Save the result to Firestore for history.
                if (db && userId && isAuthenticated) {
                    await addDoc(collection(db, `users/${userId}/imageAnalysisHistory`), {
                        timestamp: new Date().toISOString(),
                        title: finalResult.foodItems?.[0]?.foodItem || "Food Analysis",
                        ...finalResult
                    });
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
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Analyze Food Image</h2>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col items-center space-y-4">
                    <label htmlFor="imageUpload" className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-md shadow-md flex items-center justify-center transition-colors">
                        <Camera className="w-5 h-5 mr-2" /> Upload Image
                        <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    
                    {imagePreview && <div className="mt-4 w-full max-w-sm border-2 border-gray-200 p-1 rounded-lg overflow-hidden shadow-inner"><img src={imagePreview} alt="Preview" className="w-full h-auto rounded-md" /></div>}
                    
                    <button onClick={analyzeImage} disabled={!selectedImage || loadingAnalysis} className="w-full max-w-sm py-3 px-6 rounded-md shadow-md flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {loadingAnalysis && <Loader2 className="animate-spin w-5 h-5 mr-2" />}
                        {loadingAnalysis ? 'Analyzing...' : 'Analyze Image'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md"><strong>Error:</strong> {error}</div>}

            {analysisResult && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 animate-fade-in">
                    <h3 className="text-2xl font-semibold text-gray-800">Analysis Result</h3>
                    {analysisResult.foodItems?.length > 0 && (
                        <>
                            <h4 className="text-lg font-semibold text-gray-700">Identified Food Items:</h4>
                            <ul className="space-y-3">
                                {analysisResult.foodItems.map(item => (
                                    <li key={item.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="font-bold text-blue-800">{item.foodItem} {item.indianName && `(${item.indianName})`}</p>
                                        <ul className="list-disc list-inside text-sm text-gray-700 ml-4 mt-1 space-y-1">
                                            <li>Carbs: <strong>{item.carbohydrates_g}g</strong>, Sugars: <strong>{item.sugars_g}g</strong>, Calories: <strong>{item.calories_kcal} kcal</strong></li>
                                            <li>Suitability: <strong className="text-blue-700">{item.diabeticSuitability}</strong></li>
                                            <li>Recommendation: <span className="italic">{displayedRecommendations[item.id] || ''}</span></li>
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {analysisResult.otherItems?.length > 0 && <p className="text-gray-700"><strong>Other Items:</strong> {analysisResult.otherItems.join(', ')}</p>}
                    {displayedOverallSummary && <p className="text-gray-700"><strong>Overall Summary:</strong> {displayedOverallSummary}</p>}
                </div>
            )}
        </div>
    );
};

export default ImageAnalysis;
