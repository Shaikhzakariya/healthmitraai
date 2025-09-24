import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, Plus, Edit, Trash2, X, HeartPulse, BookText, Calendar, Clock, Timer } from 'lucide-react';

// To resolve the compilation error, a mock context is defined here.
// In your project, you would use your actual context import: import AppContext from "../../contexts/AppContext";
import AppContext from "../../contexts/AppContext";

// Modal Component for Adding/Editing Exercise Entries
const ExerciseModal = ({ isOpen, onClose, onSubmit, initialData, editingId }) => {
    const [type, setType] = useState('');
    const [duration, setDuration] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (initialData) {
            setType(initialData.type || '');
            setDuration(initialData.duration || '');
            setDate(initialData.date || new Date().toISOString().slice(0, 10));
            setTime(initialData.time || new Date().toTimeString().slice(0, 5));
            setNotes(initialData.notes || '');
        } else {
            // Reset form for a new entry
            setType('');
            setDuration('');
            setDate(new Date().toISOString().slice(0, 10));
            setTime(new Date().toTimeString().slice(0, 5));
            setNotes('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ type, duration, date, time, notes });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{editingId ? 'Edit Exercise Entry' : 'Add Exercise Entry'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Exercise Type</label>
                           <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g., Running" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition" required />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Duration (minutes)</label>
                           <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition" required/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
                            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="e.g., Morning run, felt great..." className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center text-lg">
                        {editingId ? 'Update Entry' : 'Save Entry'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// Main Exercise Tracker Component
const ExerciseTracker = ({ showCustomModal }) => {
    const { db, userId, isAuthenticated } = useContext(AppContext);

    const [exerciseEntries, setExerciseEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    useEffect(() => {
        if (!db || !userId || !isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const userExercisePath = `users/${userId}/exerciseEntries`;
        const q = query(collection(db, userExercisePath), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExerciseEntries(fetchedEntries);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching exercise entries:", error);
            if (showCustomModal) showCustomModal("Could not fetch exercise data. Please try again.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, isAuthenticated, showCustomModal]);

    const handleSubmit = async (data) => {
        if (!data.type || !data.duration || !data.date || !data.time) {
            if (showCustomModal) showCustomModal("Please fill in all required fields.");
            return;
        }
        if (isNaN(parseFloat(data.duration)) || parseFloat(data.duration) <= 0) {
            if (showCustomModal) showCustomModal("Duration must be a positive number.");
            return;
        }
        
        const entryData = {
            type: data.type,
            duration: parseFloat(data.duration),
            date: data.date,
            time: data.time,
            notes: data.notes,
            timestamp: new Date(`${data.date}T${data.time}`).toISOString()
        };

        const userExercisePath = `users/${userId}/exerciseEntries`;
        try {
            if (editingEntry) {
                await updateDoc(doc(db, userExercisePath, editingEntry.id), entryData);
                if (showCustomModal) showCustomModal("Exercise entry updated successfully!");
            } else {
                await addDoc(collection(db, userExercisePath), entryData);
                if (showCustomModal) showCustomModal("Exercise entry added successfully!");
            }
            closeModal();
        } catch (error) {
            console.error("Error adding/updating exercise entry:", error);
            if (showCustomModal) showCustomModal("Failed to save exercise entry. Please try again.");
        }
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (showCustomModal) {
            showCustomModal("Are you sure you want to delete this exercise entry?", async () => {
                try {
                    await deleteDoc(doc(db, `users/${userId}/exerciseEntries`, id));
                    if (showCustomModal) showCustomModal("Exercise entry deleted successfully!");
                } catch (error) {
                    console.error("Error deleting exercise entry:", error);
                    if (showCustomModal) showCustomModal("Failed to delete exercise entry. Please try again.");
                }
            });
        }
    };

    const openModal = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <style>{` body { background-color: #f0f4f8; } `}</style>
            <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
                <div className="max-w-4xl mx-auto">
                    <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <div className="text-center sm:text-left">
                            <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center sm:justify-start"><HeartPulse className="mr-3 text-purple-500"/>Exercise Log</h1>
                            <p className="text-gray-500 mt-1">A log of your physical activities and workouts.</p>
                        </div>
                        <button onClick={openModal} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Exercise
                        </button>
                    </header>

                    {loading && <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}

                    {!loading && exerciseEntries.length === 0 && (
                        <div className="text-center bg-white/70 p-10 rounded-2xl shadow-md">
                            <p className="text-gray-500">No activities logged yet. Tap the button above to add a workout!</p>
                        </div>
                    )}

                    {!loading && exerciseEntries.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {exerciseEntries.map((entry) => (
                                <div key={entry.id} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-md border border-white/20 transform hover:-translate-y-1 transition-transform duration-300">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{entry.type}</h3>
                                            <p className="flex items-center text-purple-600 font-semibold mt-1"><Timer className="w-4 h-4 mr-1.5"/>{entry.duration} minutes</p>
                                        </div>
                                        <div className="flex space-x-2 flex-shrink-0">
                                            <button onClick={() => handleEdit(entry)} className="p-2 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200 transition"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 mt-3 space-x-4">
                                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5"/>{entry.date}</span>
                                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5"/>{entry.time}</span>
                                    </div>
                                    {entry.notes && (
                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <p className="text-gray-600 text-sm flex items-start"><BookText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/> {entry.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <ExerciseModal 
                    isOpen={isModalOpen} 
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    initialData={editingEntry}
                    editingId={editingEntry?.id}
                />
            </div>
        </>
    );
};

export default ExerciseTracker;

