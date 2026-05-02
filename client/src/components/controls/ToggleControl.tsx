import React from 'react';

interface Props {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const ToggleControl: React.FC<Props> = ({ label, checked, onChange }) => (
    <div
        className="flex items-center justify-between gap-3 cursor-pointer group py-1"
        onClick={() => onChange(!checked)}
    >
        <label className="text-neutral-400 text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none group-hover:text-neutral-300 transition-colors">
            {label}
        </label>
        <div
            className={`relative w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-red-600' : 'bg-[#2a2d3d]'}`}
        >
            <div
                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
            />
        </div>
    </div>
);