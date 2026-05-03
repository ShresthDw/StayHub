import { useNavigate } from 'react-router-dom';

const BackButton = ({
    to,
    fallback = '/',
    label = 'Back',
    className = 'mb-4',
    onClick
}) => {
    const navigate = useNavigate();

    const handleClick = (e) => {
        if (onClick) {
            onClick(e);
            return;
        }

        if (to) {
            navigate(to);
        } else if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(fallback);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 active:scale-[0.98] transition-all duration-150 cursor-pointer ${className}`}
            aria-label={label}
        >
            <svg
                className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 group-hover:-translate-x-0.5 transition-transform duration-150"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.25"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>{label}</span>
        </button>
    );
};

export default BackButton;
