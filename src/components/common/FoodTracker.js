import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, Plus, Edit, Trash2, X, Utensils, Zap, BarChart, BookText, Calendar, Clock, Flame } from 'lucide-react';

// To resolve the compilation error, a mock context is defined here.
// In your project, you would use your actual context import: import AppContext from "../../contexts/AppContext";
import AppContext from "../../contexts/AppContext";


// Modal Component for Adding/Editing Food Entries
const FoodModal = ({ isOpen, onClose, onSubmit, initialData, editingId }) => {
    const [item, setItem] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [calories, setCalories] = useState('');
    const [sugars, setSugars] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (initialData) {
            setItem(initialData.item || '');
            setCarbohydrates(initialData.carbohydrates || '');
            setCalories(initialData.calories || '');
            setSugars(initialData.sugars || '');
            setDate(initialData.date || new Date().toISOString().slice(0, 10));
            setTime(initialData.time || new Date().toTimeString().slice(0, 5));
            setNotes(initialData.notes || '');
        } else {
            // Reset form for a new entry
            setItem('');
            setCarbohydrates('');
            setCalories('');
            setSugars('');
            setDate(new Date().toISOString().slice(0, 10));
            setTime(new Date().toTimeString().slice(0, 5));
            setNotes('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ item, carbohydrates, calories, sugars, date, time, notes });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">{editingId ? 'Edit Food Entry' : 'Add Food Entry'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Food Item</label>
                        <input type="text" value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g., Apple, Salad" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Carbs (g)</label>
                           <input type="number" value={carbohydrates} onChange={(e) => setCarbohydrates(e.target.value)} placeholder="30" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition" required />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Calories (kcal)</label>
                           <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="150" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Sugars (g)</label>
                           <input type="number" value={sugars} onChange={(e) => setSugars(e.target.value)} placeholder="15" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
                            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="e.g., Post-workout snack..." className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center text-lg">
                        {editingId ? 'Update Entry' : 'Save Entry'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Main Food Tracker Component
const FoodTracker = ({ showCustomModal }) => {
    const { db, userId, isAuthenticated } = useContext(AppContext);

    const [foodEntries, setFoodEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    useEffect(() => {
        if (!db || !userId || !isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const userFoodPath = `users/${userId}/foodEntries`;
        const q = query(collection(db, userFoodPath), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFoodEntries(fetchedEntries);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching food entries:", error);
            if(showCustomModal) showCustomModal("Could not fetch food data. Please try again.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, isAuthenticated, showCustomModal]);

    const handleSubmit = async (data) => {
        if (!data.item || !data.carbohydrates || !data.date || !data.time) {
            if(showCustomModal) showCustomModal("Please fill in the food item, carbohydrates, date, and time.");
            return;
        }
        if (isNaN(parseFloat(data.carbohydrates)) || parseFloat(data.carbohydrates) < 0) {
            if(showCustomModal) showCustomModal("Carbohydrates must be a non-negative number.");
            return;
        }
        
        const entryData = {
            item: data.item,
            carbohydrates: parseFloat(data.carbohydrates),
            calories: data.calories ? parseFloat(data.calories) : 0,
            sugars: data.sugars ? parseFloat(data.sugars) : 0,
            date: data.date,
            time: data.time,
            notes: data.notes,
            timestamp: new Date(`${data.date}T${data.time}`).toISOString()
        };

        const userFoodPath = `users/${userId}/foodEntries`;
        try {
            if (editingEntry) {
                await updateDoc(doc(db, userFoodPath, editingEntry.id), entryData);
                if(showCustomModal) showCustomModal("Food entry updated successfully!");
            } else {
                await addDoc(collection(db, userFoodPath), entryData);
                if(showCustomModal) showCustomModal("Food entry added successfully!");
            }
            closeModal();
        } catch (error) {
            console.error("Error adding/updating food entry:", error);
            if(showCustomModal) showCustomModal("Failed to save food entry. Please try again.");
        }
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if(showCustomModal){
            showCustomModal("Are you sure you want to delete this food entry?", async () => {
                try {
                    await deleteDoc(doc(db, `users/${userId}/foodEntries`, id));
                    showCustomModal("Food entry deleted successfully!");
                } catch (error) {
                    console.error("Error deleting food entry:", error);
                    showCustomModal("Failed to delete food entry. Please try again.");
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
                            <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center sm:justify-start"><Utensils className="mr-3 text-orange-500"/>Food Log</h1>
                            <p className="text-gray-500 mt-1">A detailed log of your daily food intake.</p>
                        </div>
                        <button onClick={openModal} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Food Entry
                        </button>
                    </header>

                    {loading && <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}

                    {!loading && foodEntries.length === 0 && (
                        <div className="text-center bg-white/70 p-10 rounded-2xl shadow-md">
                            <p className="text-gray-500">No food entries yet. Tap the button above to add your first meal!</p>
                        </div>
                    )}

                    {!loading && foodEntries.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {foodEntries.map((entry) => (
                                <div key={entry.id} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-md border border-white/20 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-gray-800 break-words pr-2">{entry.item}</h3>
                                            <div className="flex space-x-2 flex-shrink-0">
                                                <button onClick={() => handleEdit(entry)} className="p-2 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200 transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5"/>{entry.date}</span>
                                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5"/>{entry.time}</span>
                                        </div>
                                        <div className="mt-4 space-y-2 text-sm">
                                            <p className="flex justify-between items-center text-gray-700"><span><BarChart className="inline w-4 h-4 mr-2 text-blue-500"/>Carbs</span> <span className="font-semibold">{entry.carbohydrates} g</span></p>
                                            <p className="flex justify-between items-center text-gray-700"><span><Flame className="inline w-4 h-4 mr-2 text-red-500"/>Calories</span> <span className="font-semibold">{entry.calories || 0} kcal</span></p>
                                            <p className="flex justify-between items-center text-gray-700"><span><Zap className="inline w-4 h-4 mr-2 text-yellow-500"/>Sugars</span> <span className="font-semibold">{entry.sugars || 0} g</span></p>
                                        </div>
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

                <FoodModal 
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

export default FoodTracker;

