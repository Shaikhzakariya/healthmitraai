import React, { useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import AppContext from '../../contexts/AppContext'; // Assuming AppContext is in a contexts folder
import { Loader2, Trash2, Target } from 'lucide-react';

// Goals Page Component: Allows users to set and track various health-related goals.
const GoalsPage = ({ showCustomModal }) => {
    // Access Firebase services and user info from the global context.
    const { db, userId, isAuthenticated } = useContext(AppContext);

    // State for managing goals, user data, and UI.
    const [goals, setGoals] = useState([]);
    const [data, setData] = useState({ glucose: [], food: [], exercise: [] });
    const [loading, setLoading] = useState(true);

    // State for the "Set New Goal" form.
    const [newGoalType, setNewGoalType] = useState('avgGlucose');
    const [newGoalTarget, setNewGoalTarget] = useState('');

    // A map defining the properties of each available goal type.
    const goalTypes = {
        avgGlucose: { title: '7-Day Average Glucose', unit: 'mg/dL', lowerIsBetter: true },
        dailyCarbs: { title: 'Daily Carbohydrate Intake', unit: 'g', lowerIsBetter: true },
        dailyCalories: { title: 'Daily Calorie Intake', unit: 'kcal', lowerIsBetter: true },
        dailySugars: { title: 'Daily Sugar Intake', unit: 'g', lowerIsBetter: true },
        weeklyExercise: { title: 'Weekly Exercise Duration', unit: 'min', lowerIsBetter: false },
    };

    // useEffect to fetch all necessary data streams (goals, glucose, food, exercise) from Firestore.
    useEffect(() => {
        if (!db || !userId || !isAuthenticated) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const paths = {
            goals: `users/${userId}/goals`,
            glucose: `users/${userId}/glucoseReadings`,
            food: `users/${userId}/foodEntries`,
            exercise: `users/${userId}/exerciseEntries`,
        };

        // Set up real-time listeners for all required collections.
        const unsubscribers = [
            onSnapshot(collection(db, paths.goals), snapshot => setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))),
            onSnapshot(collection(db, paths.glucose), snapshot => setData(prev => ({ ...prev, glucose: snapshot.docs.map(doc => doc.data()) }))),
            onSnapshot(collection(db, paths.food), snapshot => setData(prev => ({ ...prev, food: snapshot.docs.map(doc => doc.data()) }))),
            onSnapshot(collection(db, paths.exercise), snapshot => setData(prev => ({ ...prev, exercise: snapshot.docs.map(doc => doc.data()) }))),
        ];
        
        // This is a simple way to wait for the initial fetch. A more robust solution might use Promise.all.
        setLoading(false); 

        // Cleanup function to detach all listeners on component unmount.
        return () => unsubscribers.forEach(unsub => unsub());
    }, [db, userId, isAuthenticated]);

    // Calculates the user's current value for a given goal.
    const calculateCurrentValue = (goal) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const today = new Date().toISOString().slice(0, 10);

        switch (goal.type) {
            case 'avgGlucose':
                const recentReadings = data.glucose.filter(r => new Date(r.date) >= sevenDaysAgo);
                if (recentReadings.length === 0) return 0;
                const sum = recentReadings.reduce((acc, curr) => acc + parseFloat(curr.value), 0);
                return sum / recentReadings.length;
            case 'dailyCarbs':
                const todayFoodCarbs = data.food.filter(e => e.date === today);
                return todayFoodCarbs.reduce((acc, curr) => acc + parseFloat(curr.carbohydrates || 0), 0);
            case 'dailyCalories':
                const todayFoodCalories = data.food.filter(e => e.date === today);
                return todayFoodCalories.reduce((acc, curr) => acc + parseFloat(curr.calories || 0), 0);
            case 'dailySugars':
                const todayFoodSugars = data.food.filter(e => e.date === today);
                return todayFoodSugars.reduce((acc, curr) => acc + parseFloat(curr.sugars || 0), 0);
            case 'weeklyExercise':
                const recentExercise = data.exercise.filter(e => new Date(e.date) >= sevenDaysAgo);
                return recentExercise.reduce((acc, curr) => acc + parseFloat(curr.duration || 0), 0);
            default:
                return 0;
        }
    };

    // Handles the form submission for setting a new goal.
    const handleSetGoal = async (e) => {
        e.preventDefault();
        if (!newGoalTarget || isNaN(parseFloat(newGoalTarget)) || parseFloat(newGoalTarget) <= 0) {
            showCustomModal("Please enter a valid, positive target value.");
            return;
        }

        const goalsCollectionRef = collection(db, `users/${userId}/goals`);
        
        // Check if a goal of the same type already exists to prevent duplicates.
        const q = query(goalsCollectionRef, where("type", "==", newGoalType));
        const existingGoals = await getDocs(q);
        if (!existingGoals.empty) {
            showCustomModal(`A goal for "${goalTypes[newGoalType].title}" already exists. Please delete the old one first.`);
            return;
        }

        const newGoal = {
            type: newGoalType,
            title: goalTypes[newGoalType].title,
            targetValue: parseFloat(newGoalTarget),
            unit: goalTypes[newGoalType].unit,
            lowerIsBetter: goalTypes[newGoalType].lowerIsBetter,
            createdAt: new Date().toISOString(),
        };

        try {
            await addDoc(goalsCollectionRef, newGoal);
            showCustomModal("Goal set successfully!");
            setNewGoalTarget('');
        } catch (error) {
            console.error("Error setting goal:", error);
            showCustomModal("Failed to set goal. Please try again.");
        }
    };

    // Deletes a goal after user confirmation.
    const handleDeleteGoal = (id) => {
        showCustomModal("Are you sure you want to delete this goal?", async () => {
            try {
                await deleteDoc(doc(db, `users/${userId}/goals`, id));
                showCustomModal("Goal deleted successfully!");
            } catch (error) {
                console.error("Error deleting goal:", error);
                showCustomModal("Failed to delete goal. Please try again.");
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Set & Track Your Goals</h2>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Set a New Goal</h3>
                <form onSubmit={handleSetGoal} className="space-y-4">
                    <div>
                        <label htmlFor="goalType" className="block text-sm font-medium text-gray-700">Goal Type</label>
                        <select
                            id="goalType"
                            value={newGoalType}
                            onChange={(e) => setNewGoalType(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {Object.entries(goalTypes).map(([key, { title }]) => (
                                <option key={key} value={key}>{title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="goalTarget" className="block text-sm font-medium text-gray-700">Target Value ({goalTypes[newGoalType].unit})</label>
                        <input
                            type="number"
                            id="goalTarget"
                            value={newGoalTarget}
                            onChange={(e) => setNewGoalTarget(e.target.value)}
                            placeholder={`e.g., ${newGoalType === 'avgGlucose' ? 140 : (newGoalType === 'dailyCarbs' ? 150 : 150)}`}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md flex items-center justify-center">
                        <Target className="w-5 h-5 mr-2" /> Set Goal
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your Active Goals</h3>
                {goals.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No goals set yet. Add one above to get started!</p>
                ) : (
                    <div className="space-y-6">
                        {goals.map(goal => {
                            const currentValue = calculateCurrentValue(goal);
                            const progress = goal.targetValue > 0 ? (currentValue / goal.targetValue) * 100 : 0;
                            const isExceeded = goal.lowerIsBetter && currentValue > goal.targetValue;
                            
                            let progressColor = 'bg-blue-500';
                            if (isExceeded) {
                                progressColor = 'bg-red-500';
                            } else if ((!goal.lowerIsBetter && progress >= 100) || (goal.lowerIsBetter && progress <= 100 && currentValue > 0)) {
                                progressColor = 'bg-green-500';
                            }

                            return (
                                <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-lg font-bold text-gray-800">{goal.title}</h4>
                                        <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">Target: {goal.lowerIsBetter ? '< ' : ''}{goal.targetValue} {goal.unit}</p>
                                    
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-medium text-gray-700">Current: {currentValue.toFixed(1)} {goal.unit}</span>
                                        <span className="font-semibold">{Math.min(progress, 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div
                                            className={`${progressColor} h-4 rounded-full transition-all duration-500 flex items-center justify-center text-white text-xs font-bold`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        >
                                            {currentValue.toFixed(1)}
                                        </div>
                                    </div>
                                    {isExceeded && <p className="text-xs text-red-600 mt-1 text-right">Target exceeded!</p>}
                                    {!isExceeded && progress >= 100 && !goal.lowerIsBetter && <p className="text-xs text-green-600 mt-1 text-right">Goal achieved!</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoalsPage;
