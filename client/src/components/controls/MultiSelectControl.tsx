import React from 'react';

interface Props {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    disabled?: boolean;
}

export const MultiSelectControl: React.FC<Props> = ({ options, selected, onChange, disabled }) => {
    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(s => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const toggleAll = () => {
        if (selected.length === options.length) onChange([]);
        else onChange([...options]);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Select Drivers</label>
                <button 
                    onClick={toggleAll}
                    disabled={disabled}
                    className="text-xs font-bold text-red-500 hover:text-red-400 disabled:text-neutral-600 transition-colors"
                >
                    {selected.length === options.length ? 'Clear All' : 'Select All'}
                </button>
            </div>

            <div className={`grid grid-rows-2 grid-flow-col gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => toggleOption(opt)}
                        className={`
                            whitespace-nowrap px-1 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg border transition-all text-center
                            ${selected.includes(opt)
                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
                            }
                        `}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};