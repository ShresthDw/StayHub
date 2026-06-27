import React from 'react';
import useInView from '../hooks/useInView.js';

/**
 * LazySection renders its children only when it scrolls near/into the viewport.
 * Saves DOM memory, network requests, and CPU execution.
 */
const LazySection = ({
    children,
    fallback = null,
    minHeight = '200px',
    rootMargin = '0px 0px -30px 0px',
    threshold = 0.02,
    className = ''
}) => {
    const [ref, isInView] = useInView({ rootMargin, threshold, triggerOnce: true });

    return (
        <div 
            ref={ref} 
            className={`${className} ${isInView ? 'animate-scroll-reveal' : 'opacity-0'}`} 
            style={!isInView ? { minHeight } : undefined}
        >
            {isInView ? children : fallback}
        </div>
    );
};

export default React.memo(LazySection);
