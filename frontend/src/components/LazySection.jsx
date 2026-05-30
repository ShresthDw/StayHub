import React from 'react';
import useInView from '../hooks/useInView.js';

/**
 * LazySection renders its children only when it scrolls near/into the viewport.
 * Saves DOM memory, network requests, and CPU execution.
 */
const LazySection = ({
    children,
    fallback = null,
    minHeight = '180px',
    rootMargin = '250px',
    className = ''
}) => {
    const [ref, isInView] = useInView({ rootMargin, triggerOnce: true });

    return (
        <div ref={ref} className={className} style={!isInView ? { minHeight } : undefined}>
            {isInView ? (
                children
            ) : (
                fallback || (
                    <div className="w-full h-full flex items-center justify-center animate-pulse py-8 opacity-40">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    </div>
                )
            )}
        </div>
    );
};

export default React.memo(LazySection);
