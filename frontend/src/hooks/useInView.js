import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect when an element enters the viewport.
 * @param {Object} options IntersectionObserver options (rootMargin, threshold, triggerOnce)
 * @returns [ref, isInView]
 */
export const useInView = ({ rootMargin = '0px 0px -30px 0px', threshold = 0.02, triggerOnce = true } = {}) => {
    const [isInView, setIsInView] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // If IntersectionObserver is not supported, fallback to immediate true
        if (typeof IntersectionObserver === 'undefined') {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (triggerOnce) {
                        observer.disconnect();
                    }
                } else if (!triggerOnce) {
                    setIsInView(false);
                }
            },
            { rootMargin, threshold }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [rootMargin, threshold, triggerOnce]);

    return [elementRef, isInView];
};

export default useInView;
