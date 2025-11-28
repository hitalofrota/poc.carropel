import React from 'react';

interface AlertProps {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
    const baseClasses = "p-4 mb-4 rounded border";
    
    const typeClasses = {
        success: "bg-green-100 border-green-400 text-green-700",
        error: "bg-red-100 border-red-400 text-red-700",
        info: "bg-blue-100 border-blue-400 text-blue-700",
        warning: "bg-yellow-100 border-yellow-400 text-yellow-700"
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
            <div className="flex justify-between items-center">
                <span>{message}</span>
                {onClose && (
                    <button
                        type="button"
                        className="text-lg font-semibold"
                        onClick={onClose}
                        aria-label="Fechar"
                    >
                        &times;
                    </button>
                )}
            </div>
        </div>
    );
};

export default Alert;