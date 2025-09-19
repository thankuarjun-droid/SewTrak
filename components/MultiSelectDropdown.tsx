
import React, { useState, useRef, useEffect } from 'react';
import { AdjustmentsHorizontalIcon, XIcon } from './IconComponents';

interface MultiSelectDropdownProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

export const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder }: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };
  
  const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
  }

  const getButtonLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
        const selectedOption = options.find(opt => opt.value === selectedValues[0]);
        return selectedOption ? selectedOption.label : placeholder;
    }
    return `${selectedValues.length} items selected`;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm flex items-center justify-between text-left"
      >
        <span className="truncate">{getButtonLabel()}</span>
        <div className="flex items-center">
            {selectedValues.length > 0 && (
                <XIcon onClick={handleClear} className="w-4 h-4 mr-2 text-slate-400 hover:text-slate-600"/>
            )}
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 flex items-center"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  readOnly
                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-3"
                />
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
