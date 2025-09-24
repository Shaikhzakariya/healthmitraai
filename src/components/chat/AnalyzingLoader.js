import React from 'react';
import { Bot } from 'lucide-react';

const AnalyzingLoader = ({ isImage = false }) => (
    <div className="flex justify-start mb-4 animate-fade-in items-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2 shadow-md">
            <Bot className="w-5 h-5 text-white" />
        </div>
        <div
            className="max-w-[75%] p-4 rounded-2xl bg-indigo-900 bg-opacity-70 text-white rounded-bl-none shadow-lg relative overflow-hidden"
            style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'pulse-glow 5s infinite',
            }}
        >
            <div className="flex items-center space-x-2 text-sm">
                <span
                    className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500"
                    style={{ animation: 'flicker 1.5s infinite alternate' }}
                >
                    {isImage ? 'Analyzing your ingredients...' : 'Analyzing your request...'}
                </span>
                <div className="visualizer flex items-end h-4 gap-1">
                    <div className="bar h-2 w-1.5 rounded-full"
                         style={{
                             background: 'linear-gradient(to top, #00f2f2, #00c7e2)',
                             animation: 'bar-animation 1s infinite ease-in-out',
                             animationDelay: '0s'
                         }}></div>
                    <div className="bar h-3 w-1.5 rounded-full"
                         style={{
                             background: 'linear-gradient(to top, #ff00ff, #8a2be2)',
                             animation: 'bar-animation 1s infinite ease-in-out',
                             animationDelay: '0.2s'
                         }}></div>
                    <div className="bar h-5 w-1.5 rounded-full"
                         style={{
                             background: 'linear-gradient(to top, #00ff8c, #00e572)',
                             animation: 'bar-animation 1s infinite ease-in-out',
                             animationDelay: '0.4s'
                         }}></div>
                    <div className="bar h-2 w-1.5 rounded-full"
                         style={{
                             background: 'linear-gradient(to top, #00f2f2, #00c7e2)',
                             animation: 'bar-animation 1s infinite ease-in-out',
                             animationDelay: '0.6s'
                         }}></div>
                </div>
            </div>
        </div>
    </div>
);

export default AnalyzingLoader;
