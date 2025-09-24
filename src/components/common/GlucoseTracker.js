import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import AppContext from '../../contexts/AppContext'; // Assuming AppContext is in a contexts folder
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Glucose Tracker Component: Handles logging, viewing, editing, and deleting blood glucose readings.
const GlucoseTracker = ({ showCustomModal }) => {
    // Access Firebase services and user info from the global context.
    const { db, userId, isAuthenticated } = useContext(AppContext);

    // State for form inputs
    const [glucoseValue, setGlucoseValue] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
    const [notes, setNotes] = useState('');

    // State for managing data and UI
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); // Tracks the ID of the reading being edited

    // useEffect to fetch glucose readings from Firestore in real-time.
    useEffect(() => {
        // Guard clause: Do not run if Firebase isn't ready or user is not logged in.
        if (!db || !userId || !isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        // Define the path to the user's specific glucose readings collection.
        const userGlucosePath = `users/${userId}/glucoseReadings`;

        // Create a Firestore query to get readings, ordered by the most recent timestamp.
        const q = query(collection(db, userGlucosePath), orderBy('timestamp', 'desc'));

        // onSnapshot sets up a real-time listener. It fires once with the initial data,
        // and then again every time the data changes in the database.
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedReadings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReadings(fetchedReadings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching glucose readings:", error);
            showCustomModal("Could not fetch glucose data. Please check your connection.");
            setLoading(false);
        });

        // Cleanup function: This is returned by useEffect and runs when the component unmounts.
        // It's crucial for preventing memory leaks by detaching the Firestore listener.
        return () => unsubscribe();
    }, [db, userId, isAuthenticated, showCustomModal]); // Dependencies array: The effect re-runs if any of these values change.

    // Handles the form submission for adding or updating a reading.
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the default browser form submission behavior.

        // Input validation
        if (!glucoseValue || !date || !time) {
            showCustomModal("Please fill in all required fields.");
            return;
        }
        if (isNaN(parseFloat(glucoseValue)) || parseFloat(glucoseValue) <= 0) {
            showCustomModal("Glucose value must be a positive number.");
            return;
        }

        // Prepare the data object to be saved to Firestore.
        const readingData = {
            value: parseFloat(glucoseValue),
            date,
            time,
            notes,
            timestamp: new Date().toISOString() // ISO string for consistent, sortable timestamps.
        };

        try {
            const userGlucosePath = `users/${userId}/glucoseReadings`;

            if (editingId) {
                // If we are editing, update the existing document.
                await updateDoc(doc(db, userGlucosePath, editingId), readingData);
                showCustomModal("Glucose reading updated successfully!");
                setEditingId(null); // Exit editing mode
            } else {
                // If we are not editing, add a new document.
                await addDoc(collection(db, userGlucosePath), readingData);
                showCustomModal("Glucose reading added successfully!");
            }
            // Reset the form fields after successful submission.
            resetForm();
        } catch (error) {
            console.error("Error adding/updating glucose reading:", error);
            showCustomModal("Failed to save glucose reading. Please try again.");
        }
    };
    
    // Resets all form fields to their default state.
    const resetForm = () => {
        setGlucoseValue('');
        setNotes('');
        setDate(new Date().toISOString().slice(0, 10));
        setTime(new Date().toTimeString().slice(0, 5));
        setEditingId(null);
    };

    // Populates the form with the data of the reading to be edited.
    const handleEdit = (reading) => {
        setEditingId(reading.id);
        setGlucoseValue(reading.value);
        setDate(reading.date);
        setTime(reading.time);
        setNotes(reading.notes || '');
        window.scrollTo(0, 0); // Scroll to the top of the page to see the form.
    };

    // Deletes a reading after user confirmation.
    const handleDelete = (id) => {
        // Use the modal for confirmation before deleting.
        showCustomModal("Are you sure you want to delete this glucose reading?", async () => {
            try {
                const userGlucosePath = `users/${userId}/glucoseReadings`;
                await deleteDoc(doc(db, userGlucosePath, id));
                showCustomModal("Glucose reading deleted successfully!");
            } catch (error) {
                console.error("Error deleting glucose reading:", error);
                showCustomModal("Failed to delete glucose reading. Please try again.");
            }
        });
    };

    // Conditional rendering while data is loading.
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                <p className="ml-2 text-gray-600">Loading glucose readings...</p>
            </div>
        );
    }

    // Main component JSX
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Track Your Blood Glucose</h2>

            {/* Input Form Card */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="glucoseValue" className="block text-sm font-medium text-gray-700">Glucose Value (mg/dL)</label>
                        <input
                            type="number"
                            id="glucoseValue"
                            value={glucoseValue}
                            onChange={(e) => setGlucoseValue(e.target.value)}
                            placeholder="e.g., 120"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="glucoseDate" className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                id="glucoseDate"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="glucoseTime" className="block text-sm font-medium text-gray-700">Time</label>
                            <input
                                type="time"
                                id="glucoseTime"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="glucoseNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea
                            id="glucoseNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            placeholder="e.g., Before breakfast, After meal, Feeling low"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 flex items-center justify-center"
                    >
                        {editingId ? <><Edit className="w-5 h-5 mr-2" /> Update Reading</> : <><PlusCircle className="w-5 h-5 mr-2" /> Add Reading</>}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 mt-2"
                        >
                            Cancel Edit
                        </button>
                    )}
                </form>
            </div>

            {/* Recent Readings List Card */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Recent Glucose Readings</h3>
                {readings.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No glucose readings yet. Add one above!</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {readings.slice(0, 5).map((reading) => (
                            <li key={reading.id} className="py-3 flex justify-between items-center flex-wrap">
                                <div className="flex-grow">
                                    <p className="text-lg font-medium text-gray-900">{reading.value} mg/dL</p>
                                    <p className="text-sm text-gray-500">{reading.date} at {reading.time}</p>
                                    {reading.notes && <p className="text-sm text-gray-600 italic mt-1">Notes: {reading.notes}</p>}
                                </div>
                                <div className="flex space-x-2 mt-2 sm:mt-0">
                                    <button
                                        onClick={() => handleEdit(reading)}
                                        className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(reading.id)}
                                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default GlucoseTracker;
