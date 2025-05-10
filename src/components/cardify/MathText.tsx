// src/components/cardify/MathText.tsx
"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string | null | undefined;
}

const MathText: React.FC<MathTextProps> = ({ text }) => {
  if (text === null || text === undefined || typeof text !== 'string') {
    return null;
  }

  // Regex to find $...$ (inline) and $$...$$ (block) math expressions
  // It captures the content within delimiters AND the delimiters themselves to ensure correct splitting
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = text.split(regex).filter(part => part && part.trim() !== ''); // Filter out empty or whitespace-only strings

  return (
    <>
      {parts.map((part, index) => {
        try {
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.substring(2, part.length - 2);
            return (
              <BlockMath 
                key={index} 
                math={math} 
                errorColor={'#CD5C5C'} // A softer red
                renderError={(error) => (
                  <span style={{ color: '#CD5C5C', display: 'block', textAlign: 'center' }}>
                    Math Error (Block): {error.name}. Problem: {part.substring(2, part.length - 2)}
                  </span>
                )}
              />
            );
          } else if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.substring(1, part.length - 1);
            return (
              <InlineMath 
                key={index} 
                math={math} 
                errorColor={'#CD5C5C'}
                renderError={(error) => (
                  <span style={{ color: '#CD5C5C' }}>
                    Math Error (Inline): {error.name}. Problem: {part.substring(1, part.length - 1)}
                  </span>
                )}
              />
            );
          } else {
            // Render text parts, preserving newlines and whitespace
            return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
          }
        } catch (e: any) {
          // Fallback for any unexpected error during parsing/rendering this part
          console.error("Error rendering MathText part: ", e, "Problematic part:", part);
          return <span key={index} style={{ whiteSpace: 'pre-wrap', color: '#CD5C5C' }}>{part} (render error: {e.message})</span>;
        }
      })}
    </>
  );
};

export default MathText;
