import React, { useEffect, useState } from 'react';

export interface TextTypeWriterProps {
  text: string;
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  delay?: number;
  loop?: boolean;
  showCursor?: boolean;
  onComplete?: () => void;
}

/**
 * Tactical Typewriter Component for Mission Dialogues, Comic Briefings & Visor HUD
 */
export const TextTypeWriter: React.FC<TextTypeWriterProps> = ({
  text,
  className = '',
  typingSpeed = 35,
  deletingSpeed = 20,
  delay = 100,
  loop = false,
  showCursor = true,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const delayTimeout = setTimeout(() => {
      setHasStarted(true);
    }, delay);
    return () => clearTimeout(delayTimeout);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;

    let currentIndex = 0;
    let timeout: NodeJS.Timeout;

    const typeText = () => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
        timeout = setTimeout(typeText, typingSpeed);
      } else {
        if (onComplete) onComplete();
        if (loop) {
          setIsTyping(false);
          timeout = setTimeout(deleteText, 1200);
        }
      }
    };

    const deleteText = () => {
      if (currentIndex > 0) {
        setDisplayText(text.slice(0, currentIndex - 1));
        currentIndex--;
        timeout = setTimeout(deleteText, deletingSpeed);
      } else {
        setIsTyping(true);
        timeout = setTimeout(typeText, 400);
      }
    };

    if (isTyping) {
      typeText();
    }

    return () => clearTimeout(timeout);
  }, [hasStarted, text, typingSpeed, deletingSpeed, loop, isTyping, onComplete]);

  return (
    <span className={`inline-flex items-center font-mono tracking-wide ${className}`}>
      <span>{displayText}</span>
      {showCursor && (
        <span
          className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default TextTypeWriter;
