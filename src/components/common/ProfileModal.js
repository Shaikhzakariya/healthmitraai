import React, { useState } from 'react';
import { ChefHat } from 'lucide-react';

const ProfileModal = ({ onSubmit, onClose, userProfile }) => {
    const [name, setName] = useState(userProfile?.name || '');
    const [age, setAge] = useState(userProfile?.age || '');
    const [restrictions, setRestrictions] = useState(userProfile?.restrictions || '');
    const [goal, setGoal] = useState(userProfile?.goal || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, age, restrictions, goal });
    };

    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 bg-opacity-90 p-2 rounded-3xl shadow-2xl w-full max-w-md border border-purple-700/50">
                <div className="flex items-center justify-center mb-4 space-x-2">
                    <ChefHat className="w-8 h-8 text-purple-400" />
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        Tell us about yourself
                    </h2>
                </div>
                <p className="text-gray-300 mb-6 text-sm text-center">
                    This information helps NutriBot give you personalized advice. All data is stored securely.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-700 border border-purple-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="age">Age</label>
                        <input
                            type="number"
                            id="age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-700 border border-purple-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="restrictions">Dietary Restrictions (e.g., vegan, gluten-free)</label>
                        <input
                            type="text"
                            id="restrictions"
                            value={restrictions}
                            onChange={(e) => setRestrictions(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-700 border border-purple-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="goal">Health Goal (e.g., lose weight, build muscle)</label>
                        <input
                            type="text"
                            id="goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-700 border border-purple-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        />
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-600 text-white p-3 rounded-xl shadow-lg hover:bg-gray-700 transition-all duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-xl shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                            Save Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;