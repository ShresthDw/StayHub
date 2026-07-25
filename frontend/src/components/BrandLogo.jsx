const BrandLogo = ({ compact = false, isTransparent = false }) => (
    <span className="inline-flex items-center gap-2" aria-label="StayHub home">
        <span className="relative flex-shrink-0">
            <img
                src="/stayhub-logo.png"
                alt="StayHub logo"
                className={`${compact ? 'h-6 w-6' : 'h-7 w-7 sm:h-7.5 sm:w-7.5'} rounded-lg object-cover shadow-sm`}
                onError={(event) => {
                    event.currentTarget.classList.add('hidden');
                    event.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
            />
            <span className={`${compact ? 'h-6 w-6 text-sm' : 'h-7 w-7 text-base'} hidden items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300`} aria-hidden="true">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </span>
        </span>
        {!compact && (
            <span className={`text-base sm:text-lg font-extrabold tracking-tight transition-colors duration-300 ${
                isTransparent ? 'text-white drop-shadow-sm' : 'text-gray-900 dark:text-white'
            }`}>
                StayHub
            </span>
        )}
    </span>
);

export default BrandLogo;
