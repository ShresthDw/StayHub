// features/rooms/components/HeroBackgroundAnimation.jsx
import { useEffect, useRef, useState } from 'react';

const HERO_SLIDES = [
    {
        url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2000&q=85',
        title: 'Luxury Villa & Pool'
    },
    {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85',
        title: 'Scenic Mountain Resort'
    },
    {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=85',
        title: 'Coastal Sunset Stay'
    },
    {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
        title: 'Boutique Hotel Suite'
    }
];

const HeroBackgroundAnimation = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const canvasRef = useRef(null);

    // Auto-advance slides with cinematic crossfade
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6500);
        return () => clearInterval(interval);
    }, []);

    // Ambient floating travel particles on HTML5 Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width = (canvas.width = canvas.offsetWidth);
        let height = (canvas.height = canvas.offsetHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', handleResize);

        // Particle configuration
        const particleCount = 40;
        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1,
            speedY: -(Math.random() * 0.4 + 0.15),
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.2,
            pulseSpeed: Math.random() * 0.02 + 0.01
        }));

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.005;

                // Wrap around edges
                if (p.y < 0) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(20, 184, 166, ${Math.max(0.1, Math.min(0.7, p.opacity))})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(45, 212, 191, 0.6)';
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {/* Cinematic Slideshow Images with Ken Burns Zoom Effect */}
            {HERO_SLIDES.map((slide, index) => {
                const isActive = index === currentSlide;
                return (
                    <div
                        key={slide.url}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                            }`}
                    >
                        <img
                            src={slide.url}
                            alt={slide.title}
                            className={`w-full h-full object-cover transform transition-transform duration-[7000ms] ease-out ${isActive ? 'scale-110' : 'scale-100'
                                }`}
                        />
                    </div>
                );
            })}

            {/* Minimal Crystal-Clear Light Overlay (Photos are bright & vibrant) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-teal-950/20 to-black/15 dark:from-black/50 dark:via-teal-950/35 dark:to-black/25" />
            <div className="absolute inset-0 bg-black/10" />

            {/* Interactive Particle Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Drifting Clouds / Atmospheric Mist Animation */}
            <div className="absolute top-0 left-0 w-[200%] h-32 opacity-20 bg-repeat-x animate-drift-slow"
                style={{
                    backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 70%)`,
                    backgroundSize: '400px 100px'
                }}
            />

            {/* Slide Indicator Dots on bottom right */}
            <div className="absolute bottom-4 right-8 z-20 flex items-center gap-1.5 opacity-75">
                {HERO_SLIDES.map((_, idx) => (
                    <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide
                            ? 'w-6 bg-teal-400'
                            : 'w-1.5 bg-white/40'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroBackgroundAnimation;
