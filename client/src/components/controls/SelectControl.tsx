import React from 'react';

interface Props {
    label: string;
    value: string | number;
    onChange: (val: string) => void;
    options: { label: string | number; value: string | number }[];
    disabled?: boolean;
}

export const SelectControl: React.FC<Props> = ({ label, value, onChange, options, disabled }) => (
    <div className="space-y-1.5">
        <label className="text-[#e10600] text-[10px] font-black uppercase tracking-[0.2em]">{label}:</label>
        <div className="relative">
            <select
                className="w-full appearance-none f1-input text-sm px-3 py-2 rounded-md cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#1c1e2d]">{opt.label}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-500">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </div>
        </div>
    </div>
);