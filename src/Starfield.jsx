import React, { useMemo } from 'react';
import './Starfield.css';

export default function Starfield() {
  const stars = useMemo(() => {
    // Generate 250 completely random stars
    return Array.from({ length: 250 }).map((_, i) => {
      const isBig = Math.random() < 0.15; // 15% are bigger brighter stars
      return {
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: isBig ? (Math.random() * 2 + 1.5) : (Math.random() * 1.5 + 0.5),
        animDuration: `${Math.random() * 4 + 2}s`, // Random twinkle speed 2s - 6s
        animDelay: `${Math.random() * -6}s`, // Negative delay so they start immediately at different phases
        opacityBase: Math.random() * 0.4 + 0.1, // 0.1 to 0.5 minimum opacity
        opacityPeak: isBig ? (Math.random() * 0.3 + 0.7) : (Math.random() * 0.5 + 0.5) // Peak brightness
      };
    });
  }, []);

  return (
    <div className="starfield-wrapper">
      {/* Layer 1: The twinkling stars */}
      {stars.map(star => (
        <div 
          key={star.id} 
          className="real-star"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: star.animDuration,
            animationDelay: star.animDelay,
            '--op-base': star.opacityBase,
            '--op-peak': star.opacityPeak,
            boxShadow: star.size > 2 ? '0 0 4px rgba(255, 255, 255, 0.8)' : 'none'
          }}
        />
      ))}
      
      {/* Layer 2: Shooting Stars */}
      <div className="shooting-star-canvas">
        <div className="shooting-star ss-1"></div>
        <div className="shooting-star ss-2"></div>
        <div className="shooting-star ss-3"></div>
      </div>
    </div>
  );
}
