import React from 'react';

interface FormInputProps {
    label: string;
    type: 'text' | 'number' | 'email' | 'password' | 'textarea';
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    required?: boolean;
    placeholder?: string;
    step?: string;
    min?: number;
    max?: number;
}

const FormInput: React.FC<FormInputProps> = ({
    label,
    type,
    name,
    value,
    onChange,
    required = false,
    placeholder = '',
    step,
    min,
    max
}) => {
    const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            
            {type === 'textarea' ? (
                <textarea
                    id={name}
                    name={name}
                    value={value as string}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    rows={3}
                    className={inputClasses}
                />
            ) : (
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    step={step}
                    min={min}
                    max={max}
                    className={inputClasses}
                />
            )}
        </div>
    );
};

export default FormInput;