import { useEffect, useState } from 'react';

const Toast = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(!!message);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, 3000); // Auto-dismiss after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    const bgColor = type === 'success' 
        ? 'bg-green-500 text-white' 
        : type === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-blue-500 text-white';

    return (
        <div
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl font-medium transition-all duration-300 ease-in-out z-50 ${
                bgColor
            } ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}
        >
            {message}
        </div>
    );
};

export default Toast;
