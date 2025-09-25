import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import AppContext from "../../contexts/AppContext";
import {
  Loader2,
  Camera,
  Trash2,
  ChevronDown,
  Clock,
  Flame,
  Candy,
  Utensils,
  Info,
  Lightbulb
} from "lucide-react";
import { format } from "date-fns";

// Recharts for visualizations
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFF"];

const ImageAnalysisHistory = ({ showCustomModal }) => {
  const { db, userId, isAuthenticated } = useContext(AppContext);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    if (!db || !userId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, `users/${userId}/imageAnalysisHistory`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAnalysisHistory(history);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching history:", error);
        let message = "Could not fetch analysis history. Please try again.";
        if (error.code === "permission-denied") {
          message = "You don't have permission to view this history.";
        } else if (error.code === "unavailable") {
          message = "Network error. Please check your connection.";
        }
        showCustomModal(message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, isAuthenticated, showCustomModal]);

  // preserved original aggregated values + added chart data / maps for visualizations
  const {
    totalCalories,
    totalCarbs,
    caltotalCalories,
    caltotalCarbs,
    totalSugars,
    user_amountdata,
    numItems,
    barData,
    lineData,
    barDatacarbs,
    lineDatacarbs
  } = useMemo(() => {
    const accumulator = {
      totalCalories: 0,
      totalCarbs: 0,
      caltotalCalories: 0,
      caltotalCarbs: 0,
      totalSugars: 0,
      user_amountdata: 0,
      numItems: 0,
      foodMap: {}, // for bar chart (calories per food)
      dayMap: {}, // for line chart (calories per day)
      foodMapcarbs: {}, // for bar chart (carbs per food)
      dayMapcarbs: {} // for line chart (carbs per day)
    };

    analysisHistory.forEach((entry) => {
      // accumulate per-entry food items
      entry.foodItems?.forEach((item) => {
        accumulator.totalCalories += item.calories_kcal || 0;
        accumulator.totalCarbs += item.carbohydrates_g || 0;
        accumulator.caltotalCalories += item.calculated_calories || 0;
        accumulator.caltotalCarbs += item.calculated_carbs || 0;
        accumulator.totalSugars += item.sugars_g || 0;
        accumulator.user_amountdata += item.user_amount || 0;
        accumulator.numItems += 1;

        const name = item.foodItem || "Unknown";
        accumulator.foodMap[name] = (accumulator.foodMap[name] || 0) + (item.calculated_calories || 0);
        accumulator.foodMapcarbs[name] = (accumulator.foodMapcarbs[name] || 0) + (item.calculated_carbs || 0);
      });

      // accumulate per day for trend
      const dateKey = format(new Date(entry.timestamp), "yyyy-MM-dd");
      const entryCalories =
        (entry.foodItems?.reduce((s, f) => s + (f.calculated_calories || 0), 0)) || 0;
      accumulator.dayMap[dateKey] = (accumulator.dayMap[dateKey] || 0) + entryCalories;
      const entryCarbs =
        (entry.foodItems?.reduce((s, f) => s + (f.calculated_carbs || 0), 0)) || 0;
      accumulator.dayMapcarbs[dateKey] = (accumulator.dayMapcarbs[dateKey] || 0) + entryCarbs;
    });

    // Use calculated values if available, otherwise fall back to per-100g totals
    const finalCalories = accumulator.caltotalCalories > 0 ? accumulator.caltotalCalories : accumulator.totalCalories;
    const finalCarbs = accumulator.caltotalCarbs > 0 ? accumulator.caltotalCarbs : accumulator.totalCarbs;
    const finalSugar = accumulator.totalSugars;




    const barData = Object.keys(accumulator.foodMap).map((k) => ({
      name: k,
      calories: accumulator.foodMap[k]
    }));

    const lineData = Object.keys(accumulator.dayMap)
      .sort()
      .map((k) => ({ date: k, calories: accumulator.dayMap[k] }));

    const barDatacarbs = Object.keys(accumulator.foodMapcarbs).map((k) => ({
      name: k,
      carbs: accumulator.foodMapcarbs[k]
    }));

    const lineDatacarbs = Object.keys(accumulator.dayMapcarbs)
      .sort()
      .map((k) => ({ date: k, carbs: accumulator.dayMapcarbs[k] }));

    return {
      totalCalories: accumulator.totalCalories,
      totalCarbs: accumulator.totalCarbs,
      caltotalCalories: accumulator.caltotalCalories,
      caltotalCarbs: accumulator.caltotalCarbs,
      totalSugars: accumulator.totalSugars,
      user_amountdata: accumulator.user_amountdata,
      numItems: accumulator.numItems,
      barData,
      lineData,
      barDatacarbs,
      lineDatacarbs
    };
  }, [analysisHistory]);

  const averageSugar = numItems > 0 ? totalSugars / numItems : 0;
  const sugarLevel = averageSugar > 20 ? "High" : averageSugar > 10 ? "Medium" : "Low";

  // AI / heuristic-based recommendations (overall)
  const overallRecommendation = useMemo(() => {
    if (caltotalCalories > 3000) {
      return "⚠️ You've logged a very high calorie intake today. Consider lighter meals or a walk.";
    }
    if (sugarLevel === "High") {
      return "🍭 Sugar is high today — prefer fruits, plain yogurt or unsweetened options next.";
    }
    if (caltotalCarbs > 350) {
      return "🥖 Carbs look high — balance with protein and fiber-rich vegetables.";
    }
    if (caltotalCalories > 2200) {
      return "🔎 Calories above typical maintenance — consider portion control for next meal.";
    }
    return "✅ Your logged intake looks balanced. Keep variety and hydration in mind.";
  }, [caltotalCalories, caltotalCarbs, totalSugars, sugarLevel]);

  // AI / heuristic-based per-item recommendation
  const getItemRecommendation = (item) => {
    const recs = [];
    const sugars = Number(item.sugars_g || 0);
    const itemCals = Number(item.calculated_calories || item.calories_kcal || 0);
    const carbs = Number(item.calculated_carbs || item.carbohydrates_g || 0);

    if (sugars > 15) {
      recs.push("High sugar — consider a smaller portion or swap for lower sugar alternative (berries, plain yogurt).");
    }
    if (itemCals > 500) {
      recs.push("High calorie — pair with salad/vegetables or reduce portion.");
    }
    if (carbs > 50) {
      recs.push("High carbs — add protein to improve balance (eggs, chicken, tofu).");
    }
    if (recs.length === 0) recs.push("Looks balanced for this portion.");
    return recs.join(" ");
  };

  const handleDelete = (id) => {
    showCustomModal("Are you sure you want to delete this analysis?", async () => {
      try {
        await deleteDoc(doc(db, `users/${userId}/imageAnalysisHistory`, id));
        showCustomModal("Analysis deleted successfully!");
      } catch (error) {
        console.error("Error deleting analysis:", error);
        showCustomModal("Failed to delete analysis.");
      }
    });
  };

  const toggleCardExpansion = (id) => {
    setExpandedCard((prevId) => (prevId === id ? null : id));
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border">
        <p className="text-lg font-medium text-gray-600">Please log in to view your analysis history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        <p className="ml-2 text-gray-600">Loading analysis history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center tracking-tight">
        🍽️ Your Food Analysis History
      </h2>

      {/* --- Original: Nutrition Summary Dashboard For Your Amount (kept intact) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Summary (100g Reference)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Calories */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 shadow hover:shadow-md transition-all duration-300">
            <Flame className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-sm text-gray-600">Total Calories</p>
            <p className="text-2xl font-bold text-orange-800">{totalCalories} kcal</p>
          </div>

          {/* Carbs */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-green-50 to-green-100 shadow hover:shadow-md transition-all duration-300">
            <Info className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Total Carbs</p>
            <p className="text-2xl font-bold text-green-800">{totalCarbs} g</p>
          </div>

          {/* Sugar */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 shadow hover:shadow-md transition-all duration-300">
            <Candy className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600">Overall Sugar Level</p>
            <p className="text-2xl font-bold text-purple-800">{sugarLevel}</p>
          </div>
        </div>
      </div>


      {/* --- Original: Nutrition Summary Dashboard (kept intact) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Summary For Your Amount</h3>

        {/* new AI overall recommendation shown in the same summary block */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">Smart Recommendation</p>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-blue-700">{overallRecommendation}</p>
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Calories */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 shadow hover:shadow-md transition-all duration-300">
            <Flame className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Total Calories</p>
            <p className="text-2xl font-bold text-blue-900">{caltotalCalories} kcal</p>
          </div>

          {/* Carbs */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-cyan-50 to-cyan-100 shadow hover:shadow-md transition-all duration-300">
            <Info className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-sm text-gray-600">Total Carbs</p>
            <p className="text-2xl font-bold text-teal-900">{caltotalCarbs} g</p>
          </div>

          {/* Sugar */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-pink-50 to-pink-100 shadow hover:shadow-md transition-all duration-300">
            <Candy className="w-8 h-8 text-pink-600 mb-2" />
            <p className="text-sm text-gray-600">Overall Sugar Level</p>
            <p className="text-2xl font-bold text-pink-900">{sugarLevel}</p>
          </div>
        </div>





        {/* <-- New: Add bar + line charts here for calories per food and trend --> */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Calories per Food Item</h4>
            <div style={{ width: "100%", height: 240 }}>
              {barData && barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <ReTooltip />
                    <Bar dataKey="calories" fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No per-item calorie data available.</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Carbs per Food Item</h4>
            <div style={{ width: "100%", height: 240 }}>
              {barDatacarbs && barDatacarbs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDatacarbs} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <ReTooltip />
                    <Bar dataKey="carbs" fill={COLORS[3]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No per-item carbs data available.</p>
              )}
            </div>
          </div>
        </div>
        {/* <-- New: Add bar + line charts here for carbs per food and trend --> */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <div>
            <h4 className="text-sm font-medium mb-2">Calories Trend (by day)</h4>
            <div style={{ width: "100%", height: 240 }}>
              {lineData && lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "MM/dd")} />
                    <YAxis />
                    <ReTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calories" stroke={COLORS[1]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No trend data available.</p>
              )}
            </div>
          </div>


          <div>
            <h4 className="text-sm font-medium mb-2">Carbs Trend (by day)</h4>
            <div style={{ width: "100%", height: 240 }}>
              {lineDatacarbs && lineDatacarbs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineDatacarbs} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "MM/dd")} />
                    <YAxis />
                    <ReTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="carbs" stroke={COLORS[7]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No trend data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Add chart components here if integrating libraries like Recharts */}
      </div>

      {analysisHistory.length === 0 ? (
        <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border">
          <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600">No analyses yet</p>
          <p className="text-sm text-gray-500 mt-1">Start with "Analyze Food" tab</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {analysisHistory.map((entry) => (
            <div
              key={entry.id}
              className="relative bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-xl transition-all p-6 rounded-2xl border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-blue-600" />
                    {entry.title || "Food Analysis"}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {format(new Date(entry.timestamp), "PPp")}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                  title="Delete"
                  aria-label="Delete analysis"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <p className="mt-4 text-gray-700 italic border-l-4 border-blue-200 pl-3">
                "{entry.overallSummaryForDiabetics || "No summary available."}"
              </p>

              <button
                onClick={() => toggleCardExpansion(entry.id)}
                className="mt-5 w-full flex justify-between items-center py-2 px-3 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-all"
                aria-expanded={expandedCard === entry.id}
                aria-controls={`details-${entry.id}`}
              >
                <span>{expandedCard === entry.id ? "Hide Details" : "Show Details"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedCard === entry.id ? "rotate-180" : ""
                    }`}
                />
              </button>

              {expandedCard === entry.id && (
                <div id={`details-${entry.id}`} className="mt-4 space-y-4 animate-fade-in">
                  {Array.isArray(entry.foodItems) &&
                    entry.foodItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl"
                      >
                        {/* Food Item Header */}
                        <p className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                          <Utensils className="w-4 h-4 text-blue-500" />
                          {item.foodItem}
                        </p>

                        {/* For Your Amount Section */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            For Your Amount: <span className="text-blue-700">{item.user_amount}g</span>
                          </p>
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Flame className="w-4 h-4 text-orange-500" />
                              {item.calculated_calories} kcal
                            </span>
                            <span className="flex items-center gap-1">
                              <Candy className="w-4 h-4 text-pink-500" />
                              {item.sugars_g} sugar
                            </span>
                            <span className="flex items-center gap-1">
                              <Info className="w-4 h-4 text-green-600" />
                              {item.calculated_carbs}g carbs
                            </span>
                          </div>
                        </div>

                        {/* For 100 grams Section */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">For 100 grams</p>
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Flame className="w-4 h-4 text-orange-500" />
                              {item.calories_kcal} kcal
                            </span>
                            <span className="flex items-center gap-1">
                              <Candy className="w-4 h-4 text-pink-500" />
                              {item.sugars_g} sugar
                            </span>
                            <span className="flex items-center gap-1">
                              <Info className="w-4 h-4 text-green-600" />
                              {item.carbohydrates_g}g carbs
                            </span>
                          </div>
                        </div>

                        {/* Recommendation */}
                        {item.recommendation && (
                          <p className="text-xs text-blue-700 italic mt-3">
                            💡 {item.recommendation}
                          </p>
                        )}

                        {/* <-- New: AI per-item recommendation (non-destructive, additional) --> */}
                        <p className="text-xs text-gray-600 mt-2">
                          <strong>AI suggestion:</strong> {getItemRecommendation(item)}
                        </p>
                      </div>
                    ))}
                  {Array.isArray(entry.otherItems) && entry.otherItems.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <strong>Also seen:</strong> {entry.otherItems.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageAnalysisHistory;
