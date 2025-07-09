import React from 'react';

const TabButton = ({ children, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 text-lg font-medium rounded-t-lg transition-colors focus:outline-none ${
            isActive
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
);

export default TabButton;