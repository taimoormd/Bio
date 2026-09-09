import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  side = 'bottom',
  delay = 300,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[side];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-50 pointer-events-none flex items-center bg-slate-900/95 text-slate-100 text-[11px] font-medium px-2 py-0.5 rounded-md shadow-lg backdrop-blur-xs whitespace-nowrap select-none animate-in fade-in zoom-in-95 duration-100`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="ml-1.5 px-1 py-0.2 font-mono text-[10px] text-slate-400 bg-slate-800 rounded border border-slate-700">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};
