import React from 'react';

interface Props {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    colorMap?: Record<string, string>;
    disabled?: boolean;
}

export const MultiSelectControl: React.FC<Props> = ({ options, selected, onChange, colorMap, disabled }) => {
    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
        else onChange([...selected, opt]);
    };

    const allSelected = selected.length === options.length;

    return (
        <div className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[#e10600] text-[10px] font-black uppercase tracking-[0.2em]">Select Drivers</span>
            </div>

            <label
                className="flex items-center gap-2 mb-2 cursor-pointer group"
                onClick={() => { if (allSelected) onChange([]); else onChange([...options]); }}
            >
                <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-red-600 border-red-600' : 'border-[#3a3d4d] group-hover:border-neutral-400'}`}>
                    {allSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                </div>
                <span className="text-[11px] text-neutral-400 font-semibold">Select All</span>
            </label>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {options.map(opt => {
                    const isSelected = selected.includes(opt);
                    const color = colorMap?.[opt];
                    return (
                        <label key={opt} className="flex items-center gap-2 py-0.5 cursor-pointer group" onClick={() => toggleOption(opt)}>
                            <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-red-600 border-red-600' : 'border-[#3a3d4d] group-hover:border-neutral-400'}`}>
                                {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                            </div>
                            {color && <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />}
                            <span className={`text-[11px] font-semibold transition-colors ${isSelected ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}>{opt}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};