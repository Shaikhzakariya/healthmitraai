import React from 'react';

const NavItem = ({ icon, label, onClick, active }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-500 hover:bg-gray-100'}`}
    >
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);

export default NavItem;