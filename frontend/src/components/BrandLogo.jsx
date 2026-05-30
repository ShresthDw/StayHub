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
            <span className={`${compact ? 'h-6 w-6 text-sm' : 'h-7 w-7 text-base'} hidden items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/60`} aria-hidden="true">⌂</span>
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
