import React from 'react';
import { Sparkles, Crown, Camera, BarChart2, Scan, Database, TrendingUp, Lightbulb, Droplet, NotebookPen, Calculator, Beef, Repeat, Utensils, Cloudy, ShoppingCart, Globe, HeartPulse, BookOpen, ChevronRight, ArrowLeft, DollarSign, Tally3, ClipboardList, ImageIcon, Wind, HelpCircle as HelpCircuit } from 'lucide-react';

const FeaturesPage = ({ onGoBack }) => {
    const FeatureExample = ({ example }) => (
        <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-purple-600/30">
            <p className="text-xs text-purple-300 font-semibold mb-1">Example:</p>
            <p className="text-xs text-gray-300">
                <span className="font-bold text-pink-400">User asks:</span> "{example.prompt}"
            </p>
            <p className="text-xs text-gray-300 mt-1">
                <span className="font-bold text-teal-400">AI explains:</span> "{example.response}"
            </p>
        </div>
    );

    const featureCards = [
        {
            title: "Free Features",
            icon: Sparkles,
            color: "text-purple-400",
            borderColor: "border-purple-600/50",
            bgColor: "bg-gray-800",
            features: [
                { name: "Basic AI-powered food tracking", description: "The app uses AI to recognize food from a photo, though the accuracy may be limited.", icon: Camera },
                { name: "Basic nutritional breakdown", description: "Provides some calorie and macronutrient information for meals.", icon: Tally3 },
                { name: "Lifestyle questions", description: "The app may ask for some information to build a basic plan.", icon: ClipboardList },
            ]
        },
        {
            title: "Premium Features",
            icon: Crown,
            color: "text-yellow-400",
            borderColor: "border-yellow-600/50",
            bgColor: "bg-gray-800",
            features: [
                { name: "AI Recipe from Image", description: "Upload a photo of your ingredients and get personalized recipe suggestions.", icon: ImageIcon },
                { name: "Advanced AI-powered food tracking", description: "More accurate and reliable AI recognition of meals, including complex dishes.", icon: Camera },
                { name: "Comprehensive nutritional analysis", description: "Detailed breakdowns of calories, protein, carbs, and fat.", icon: BarChart2 },
                { name: "Barcode scanner", description: "Scan barcodes on packaged foods for instant nutritional information.", icon: Scan },
                { name: "Food database", description: "Access to an extensive database of over 1 million foods.", icon: Database },
                { name: "Progress tracking", description: "Monitor weight, body measurements, and nutrition goals over time.", icon: TrendingUp },
                { name: "AI suggestions", description: "Personalized recommendations to help users stay on track.", icon: Lightbulb },
                { name: "Water and exercise tracking", description: "Log water intake and daily exercise.", icon: Droplet },
                { name: "Food memory", description: "The app remembers frequently logged meals for easy re-logging.", icon: NotebookPen },
                { name: "Calorie deficit calculator", description: "A tool to help users manage their calorie deficit for weight loss.", icon: Calculator },
                { name: "Macros and protein tracker", description: "Dedicated tools for monitoring and optimizing macronutrient intake.", icon: Beef },
                { name: "Rollover calories", description: "Roll over unused calories from one day to the next for flexibility.", icon: Repeat },
                { name: "Indian City Food Suggestions", description: "Select a city to get recommendations on popular local dishes and foods.", icon: Utensils },
                { name: "Weather-Based Food Suggestions", description: "Get food and drink ideas based on your local weather.", icon: Cloudy },
                { 
                    name: "Smart Grocery List & Meal Prep", 
                    description: "Auto-generate grocery lists from meal plans and optimize your shopping and prep time.", 
                    icon: ShoppingCart,
                    example: { prompt: "Create a 3-day low-carb meal plan.", response: "AI generates a plan and a categorized grocery list, noting ingredients you already have..." }
                },
                { 
                    name: "Cultural Food Explorer", 
                    description: "Translate and adapt international dishes to your local, healthy preferences.", 
                    icon: Globe,
                    example: { prompt: "Convert Japanese bento to an Indian diabetic-friendly lunch.", response: "AI explains the bento concept and provides a recipe for a balanced Indian thali with similar principles..." }
                },
                { 
                    name: "Symptom-Based Food Recommendations", 
                    description: "Get suggestions on what to eat based on your health symptoms or mood.", 
                    icon: HeartPulse,
                    example: { prompt: "I have a headache and feel bloated.", response: "AI suggests hydrating foods like cucumber and ginger tea, explaining why they help..." }
                },
                { 
                    name: "Nutrition Myth Buster", 
                    description: "Get science-backed answers to common nutrition myths and questions.", 
                    icon: BookOpen,
                    example: { prompt: "Is ghee unhealthy?", response: "Actually, in moderation, ghee provides Conjugated Linoleic Acid (CLA) and is a source of fat-soluble vitamins..." }
                },
            ],
            isPremium: true
        }
    ];

    const pricingTiers = [
        { name: "Basic", price: "Free", description: "All core features.", features: ["Basic Food Tracking", "Nutritional Breakdown", "Lifestyle Questions"] },
        { name: "Premium", price: "$9.99/mo", description: "Unlocks all features.", features: ["Everything in Basic", "AI Recipe from Image", "Advanced Tracking", "Barcode Scanner", "Food Database", "Progress Tracking", "AI Suggestions", "And much more!"] },
    ];

    return (
        <div className="p-4 md:p-8 text-center min-h-[500px] flex flex-col justify-start items-center overflow-y-auto custom-scrollbar">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-wide mb-4">
                Our Features
            </h2>
            <p className="text-gray-300 mb-10 max-w-xl">
                Discover the power of NutriBot AI. Upgrade to premium for an even more personalized and comprehensive experience.
            </p>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-6xl">
                {featureCards.map((card, index) => (
                    <div key={index} className={`p-6 md:p-8 rounded-3xl shadow-xl border ${card.borderColor} ${card.bgColor} transition-all duration-300 hover:scale-105 flex flex-col`}>
                        <div className="flex items-center justify-center space-x-4 mb-6">
                            <card.icon className={`w-10 h-10 ${card.color}`} />
                            <h3 className={`text-3xl font-bold ${card.color}`}>{card.title}</h3>
                        </div>
                        <ul className="space-y-6">
                            {card.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start text-left">
                                    <feature.icon className={`w-6 h-6 flex-shrink-0 ${card.color} mt-1 mr-4`} />
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-200">{feature.name}</h4>
                                        <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                                        {feature.example && <FeatureExample example={feature.example} />}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <h3 className="text-3xl font-bold text-white mt-12 mb-6">Pricing Plans</h3>
            <div className="grid sm:grid-cols-2 gap-8 w-full max-w-2xl">
                {pricingTiers.map((tier, index) => (
                    <div key={index} className="p-6 rounded-2xl border border-gray-700 bg-gray-800 shadow-lg">
                        <div className="flex items-center space-x-2 mb-4">
                            <DollarSign className="w-8 h-8 text-green-400" />
                            <h4 className="text-2xl font-bold text-gray-100">{tier.name}</h4>
                        </div>
                        <p className="text-4xl font-extrabold text-white mb-2">{tier.price}</p>
                        <p className="text-sm text-gray-400 mb-6">{tier.description}</p>
                        <ul className="space-y-2 text-left">
                            {tier.features.map((feat, idx) => (
                                <li key={idx} className="flex items-center text-gray-200">
                                    <ChevronRight className="w-4 h-4 mr-2 text-pink-400" />
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <button
                onClick={onGoBack}
                className="mt-12 text-gray-400 hover:text-purple-400 transition-colors flex items-center space-x-2"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
            </button>
        </div>
    );
};

export default FeaturesPage;