import React from 'react';

interface Props {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const ToggleControl: React.FC<Props> = ({ label, checked, onChange }) => (
    <div 
        className="flex items-center justify-between space-x-4 bg-neutral-800 p-2 px-4 rounded-xl border border-neutral-700 h-[50px] cursor-pointer hover:border-neutral-600 transition-colors"
        onClick={() => onChange(!checked)}
    >
        <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider cursor-pointer select-none">
            {label}
        </label>
        <div 
            className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${checked ? 'bg-red-600' : 'bg-neutral-600'}`}
        >
            <div 
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} 
            />
        </div>
    </div>
);