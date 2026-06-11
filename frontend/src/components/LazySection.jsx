import React from 'react';
import useInView from '../hooks/useInView.js';

/**
 * LazySection renders its children only when it scrolls near/into the viewport.
 * Saves DOM memory, network requests, and CPU execution.
 */
const LazySection = ({
    children,
    fallback = null,
    minHeight = '240px',
    rootMargin = '300px',
    className = ''
}) => {
    const [ref, isInView] = useInView({ rootMargin, triggerOnce: true });

    return (
        <div ref={ref} className={className} style={!isInView ? { minHeight } : undefined}>
            {isInView ? children : fallback}
        </div>
    );
};

export default React.memo(LazySection);
