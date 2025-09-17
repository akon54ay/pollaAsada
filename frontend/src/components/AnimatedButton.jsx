import React, { useRef } from 'react';
import gsap from 'gsap';

const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const buttonRef = useRef(null);
  const rippleRef = useRef(null);

  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-700 text-white hover:from-gray-600 hover:to-gray-800',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700',
    outline: 'bg-transparent border-2 border-orange-500 text-orange-600 hover:bg-orange-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-5 py-2.5 text-base',
    large: 'px-7 py-3.5 text-lg'
  };

  const handleClick = (e) => {
    if (disabled || loading) return;

    // Crear efecto ripple
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - rect.left - radius}px`;
    ripple.style.top = `${e.clientY - rect.top - radius}px`;
    ripple.classList.add('ripple');

    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }

    button.appendChild(ripple);

    // Animación del botón
    gsap.to(button, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        if (onClick) onClick(e);
      }
    });

    // Remover ripple después de la animación
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleMouseEnter = () => {
    if (disabled || loading) return;
    
    gsap.to(buttonRef.current, {
      y: -2,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = () => {
    if (disabled || loading) return;
    
    gsap.to(buttonRef.current, {
      y: 0,
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${className}
        relative overflow-hidden
        font-semibold rounded-xl
        shadow-lg
        transform transition-all duration-300
        flex items-center justify-center space-x-2
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
      `}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" />}
          {children}
        </>
      )}
      
      <style jsx>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: scale(0);
          animation: ripple 600ms ease-out;
          pointer-events: none;
        }
        
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

export default AnimatedButton;
