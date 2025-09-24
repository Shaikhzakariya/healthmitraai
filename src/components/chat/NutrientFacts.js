import React from 'react';

const NutrientFacts = ({ fact }) => {
    return (
        <div className="w-full max-w-[85%] mt-4 p-4 rounded-2xl bg-gray-800 bg-opacity-70 border border-purple-600/50 shadow-lg flex flex-col space-y-4 animate-fade-in self-start ml-12">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 text-center">
                Did You Know...?
            </h2>
            {!fact ? (
                <div className="text-center text-gray-400">
                    <p>Fetching an amazing fact...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div
                        className="p-3 rounded-xl bg-gray-700/50 border border-teal-500/30 shadow-sm text-gray-200 text-sm leading-relaxed animate-fade-in"
                    >
                        <p>{fact.fact}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutrientFacts;