import React from 'react';

const CustomModal = ({ content, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <p className="text-lg mb-4 text-center">{content}</p>
            <div className="flex justify-center space-x-4">
                {onConfirm && (
                    <button
                        onClick={() => { onConfirm && onConfirm(); onCancel(); }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        Confirm
                    </button>
                )}
                <button
                    onClick={onCancel}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-300"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

export default CustomModal;