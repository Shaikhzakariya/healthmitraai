import React, { useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import AppContext from '../../contexts/AppContext'; // Assuming AppContext is in a contexts folder
import { Loader2, Trash2, Droplet, Utensils, Activity, ChevronDown } from 'lucide-react';

// History Page Component: Displays a combined, chronological view of all user data and provides charts for trend analysis.
const HistoryPage = ({ showCustomModal }) => {
    // Access Firebase services and user info from the global context.
    const { db, userId, isAuthenticated } = useContext(AppContext);

    // State for managing data and UI
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedChart, setExpandedChart] = useState(null); // Tracks which chart is currently open

    // useEffect to fetch all user data streams from Firestore in real-time.
    useEffect(() => {
        // Guard clause: Do not run if Firebase isn't ready or user is not logged in.
        if (!db || !userId || !isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        // Define paths to the different data collections for the current user.
        const glucosePath = `users/${userId}/glucoseReadings`;
        const foodPath = `users/${userId}/foodEntries`;
        const exercisePath = `users/${userId}/exerciseEntries`;

        // Local arrays to hold data from each stream before combining.
        let glucoseReadings = [];
        let foodEntries = [];
        let exerciseEntries = [];

        // Function to combine, sort, and update the main state.
        const updateAllEntries = () => {
            // Add a 'type' property to each object to identify its origin.
            const combined = [
                ...glucoseReadings.map(entry => ({ ...entry, type: 'glucose' })),
                ...foodEntries.map(entry => ({ ...entry, type: 'food' })),
                ...exerciseEntries.map(entry => ({ ...entry, type: 'exercise' }))
            ];
            // Sort the combined array chronologically by timestamp, newest first.
            combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setAllEntries(combined);
            setLoading(false);
        };

        // Set up real-time listeners for all three collections.
        const unsubGlucose = onSnapshot(query(collection(db, glucosePath)), (snapshot) => {
            glucoseReadings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateAllEntries();
        });

        const unsubFood = onSnapshot(query(collection(db, foodPath)), (snapshot) => {
            foodEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateAllEntries();
        });

        const unsubExercise = onSnapshot(query(collection(db, exercisePath)), (snapshot) => {
            exerciseEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateAllEntries();
        });

        // Cleanup function: Detach all listeners when the component unmounts to prevent memory leaks.
        return () => {
            unsubGlucose();
            unsubFood();
            unsubExercise();
        };
    }, [db, userId, isAuthenticated]); // Effect dependencies

    // Deletes an entry from its specific collection after user confirmation.
    const handleDelete = async (entry) => {
        showCustomModal(`Are you sure you want to delete this ${entry.type} entry?`, async () => {
            try {
                let collectionPath;
                switch (entry.type) {
                    case 'glucose': collectionPath = `users/${userId}/glucoseReadings`; break;
                    case 'food': collectionPath = `users/${userId}/foodEntries`; break;
                    case 'exercise': collectionPath = `users/${userId}/exerciseEntries`; break;
                    default: throw new Error("Invalid entry type");
                }
                await deleteDoc(doc(db, collectionPath, entry.id));
                showCustomModal(`${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} entry deleted successfully!`);
            } catch (error) {
                console.error(`Error deleting ${entry.type} entry:`, error);
                showCustomModal(`Failed to delete ${entry.type} entry. Please try again.`);
            }
        });
    };

    // --- Data processing functions for charts ---

    const getGlucoseChartData = () => {
        const dailyAverages = {};
        allEntries.filter(entry => entry.type === 'glucose').forEach(reading => {
            const date = reading.date;
            if (!dailyAverages[date]) dailyAverages[date] = { sum: 0, count: 0 };
            dailyAverages[date].sum += parseFloat(reading.value);
            dailyAverages[date].count++;
        });
        const chartData = Object.keys(dailyAverages).map(date => ({
            date: date.slice(5), // Format date as MM-DD
            value: parseFloat((dailyAverages[date].sum / dailyAverages[date].count).toFixed(2))
        }));
        return chartData.sort((a, b) => new Date(`2000-${a.date}`) - new Date(`2000-${b.date}`));
    };

    const getFoodChartData = (key) => {
        const dailyTotals = {};
        allEntries.filter(entry => entry.type === 'food').forEach(food => {
            const date = food.date;
            if (!dailyTotals[date]) dailyTotals[date] = 0;
            dailyTotals[date] += parseFloat(food[key] || 0);
        });
        const chartData = Object.keys(dailyTotals).map(date => ({
            date: date.slice(5),
            [key]: parseFloat(dailyTotals[date].toFixed(1))
        }));
        return chartData.sort((a, b) => new Date(`2000-${a.date}`) - new Date(`2000-${b.date}`));
    };

    const getExerciseChartData = () => {
        const dailyDuration = {};
        allEntries.filter(entry => entry.type === 'exercise').forEach(exercise => {
            const date = exercise.date;
            if (!dailyDuration[date]) dailyDuration[date] = 0;
            dailyDuration[date] += parseFloat(exercise.duration || 0);
        });
        const chartData = Object.keys(dailyDuration).map(date => ({
            date: date.slice(5),
            duration: parseFloat(dailyDuration[date].toFixed(0))
        }));
        return chartData.sort((a, b) => new Date(`2000-${a.date}`) - new Date(`2000-${b.date}`));
    };
    
    // --- Render logic ---

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                <p className="ml-2 text-gray-600">Loading history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Activity History</h2>

            {/* Collapsible Chart Sections */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                <button onClick={() => setExpandedChart(e => e === 'glucose' ? null : 'glucose')} className="w-full flex justify-between items-center py-2 text-lg font-semibold text-gray-700">Glucose History <ChevronDown className={`transition-transform ${expandedChart === 'glucose' ? 'rotate-180' : ''}`} /></button>
                {expandedChart === 'glucose' && (getGlucoseChartData().length > 0 ? <ResponsiveContainer width="100%" height={250}><LineChart data={getGlucoseChartData()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="value" stroke="#3b82f6" name="Avg. Glucose (mg/dL)" /></LineChart></ResponsiveContainer> : <p className="text-center py-4 text-gray-500">No glucose data to display.</p>)}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <button onClick={() => setExpandedChart(e => e === 'carbs' ? null : 'carbs')} className="w-full flex justify-between items-center py-2 text-lg font-semibold text-gray-700">Carbohydrate History <ChevronDown className={`transition-transform ${expandedChart === 'carbs' ? 'rotate-180' : ''}`} /></button>
                {expandedChart === 'carbs' && (getFoodChartData('carbohydrates').length > 0 ? <ResponsiveContainer width="100%" height={250}><BarChart data={getFoodChartData('carbohydrates')}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="carbohydrates" fill="#f97316" name="Total Carbs (g)" /></BarChart></ResponsiveContainer> : <p className="text-center py-4 text-gray-500">No carbohydrate data to display.</p>)}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <button onClick={() => setExpandedChart(e => e === 'exercise' ? null : 'exercise')} className="w-full flex justify-between items-center py-2 text-lg font-semibold text-gray-700">Exercise History <ChevronDown className={`transition-transform ${expandedChart === 'exercise' ? 'rotate-180' : ''}`} /></button>
                {expandedChart === 'exercise' && (getExerciseChartData().length > 0 ? <ResponsiveContainer width="100%" height={250}><LineChart data={getExerciseChartData()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="duration" stroke="#8b5cf6" name="Duration (min)" /></LineChart></ResponsiveContainer> : <p className="text-center py-4 text-gray-500">No exercise data to display.</p>)}
            </div>

            {/* Combined List of All Entries */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">All Entries</h3>
                {allEntries.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No history to display. Start logging your activities!</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {allEntries.map((entry) => (
                            <li key={entry.id} className="py-4 flex justify-between items-start">
                                <div className="flex items-start space-x-4">
                                    {entry.type === 'glucose' && <Droplet className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />}
                                    {entry.type === 'food' && <Utensils className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />}
                                    {entry.type === 'exercise' && <Activity className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />}
                                    <div>
                                        {entry.type === 'glucose' && <p className="font-semibold text-gray-800">Glucose: <strong>{entry.value} mg/dL</strong></p>}
                                        {entry.type === 'food' && <p className="font-semibold text-gray-800">Food: <strong>{entry.item}</strong> ({entry.carbohydrates}g Carbs)</p>}
                                        {entry.type === 'exercise' && <p className="font-semibold text-gray-800">Exercise: <strong>{entry.type}</strong> ({entry.duration} min)</p>}
                                        <p className="text-sm text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                                        {entry.notes && <p className="text-sm text-gray-600 italic mt-1">Notes: {entry.notes}</p>}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(entry)} className="p-2 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0 ml-2"><Trash2 className="w-5 h-5" /></button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
