import React from 'react';

const ActivityItem = ({ type, value, date, icon }) => (
    <div className="flex items-start p-4 bg-gray-50 rounded-lg shadow-sm">
        <div className="mr-3 mt-1 flex-shrink-0">{React.cloneElement(icon, { className: `${icon.props.className} w-5 h-5` })}</div>
        <div className="flex-grow">
            <p className="font-semibold text-gray-800">{type}: {value}</p>
            <p className="text-sm text-gray-500">{date}</p>
        </div>
    </div>
);

export default ActivityItem;