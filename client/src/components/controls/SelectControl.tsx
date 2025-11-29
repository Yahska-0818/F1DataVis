import React from 'react';

interface Props {
    label: string;
    value: string | number;
    onChange: (val: string) => void;
    options: { label: string | number; value: string | number }[];
    disabled?: boolean;
}

export const SelectControl: React.FC<Props> = ({ label, value, onChange, options, disabled }) => (
    <div className="space-y-2">
        <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider ml-1">{label}</label>
        <div className="relative">
            <select 
                className="w-full appearance-none bg-neutral-800 text-white px-4 py-3 rounded-2xl border border-neutral-700 hover:border-neutral-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-200 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);