const BrandLogo = ({ compact = false }) => (
    <span className="inline-flex items-center gap-2" aria-label="StayHub home">
        <span className="relative flex-shrink-0">
            <img
                src="/stayhub-logo.png"
                alt="StayHub logo"
                className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg object-cover`}
                onError={(event) => {
                    event.currentTarget.classList.add('hidden');
                    event.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
            />
            <span className={`${compact ? 'h-8 w-8 text-lg' : 'h-10 w-10 text-2xl'} hidden items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/60`} aria-hidden="true">⌂</span>
        </span>
        {!compact && <span className="text-xl font-extrabold tracking-tight">StayHub</span>}
    </span>
);

export default BrandLogo;
