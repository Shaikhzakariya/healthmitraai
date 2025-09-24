import React from 'react';

const StatCard = ({ title, value, description, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-full">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-medium text-gray-600">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
    </div>
);

export default StatCard;