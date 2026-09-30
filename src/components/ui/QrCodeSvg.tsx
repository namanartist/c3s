// src/components/ui/QrCodeSvg.tsx
import React, { useMemo } from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  title?: string;
}

/**
 * Deterministic pseudo-random 2D matrix generator for campus gate QR visualization.
 * Produces accurate QR finder patterns (7x7 corners) + timing tracks + payload bits.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 250,
  className = '',
  fgColor = '#000000',
  bgColor = '#ffffff',
  title = 'C3S Gate QR'
}) => {
  const matrixSize = 25; // 25x25 grid (Standard Version 2 QR)

  const grid = useMemo(() => {
    const m: boolean[][] = Array.from({ length: matrixSize }, () =>
      Array.from({ length: matrixSize }, () => false)
    );

    // 1. Helper to draw standard 7x7 finder pattern
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 || // Outer 7x7 square
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)       // Inner 3x3 solid center
          ) {
            m[startY + r][startX + c] = true;
          }
        }
      }
    };

    // Draw Top-Left, Top-Right, Bottom-Left finders
    drawFinder(0, 0);
    drawFinder(matrixSize - 7, 0);
    drawFinder(0, matrixSize - 7);

    // 2. Timing patterns (alternating bits connecting finders)
    for (let i = 8; i < matrixSize - 8; i++) {
      m[6][i] = i % 2 === 0;
      m[i][6] = i % 2 === 0;
    }

    // 3. Small alignment pattern in bottom right
    const alignX = matrixSize - 9;
    const alignY = matrixSize - 9;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
          m[alignY + r][alignX + c] = true;
        }
      }
    }

    // 4. Fill remaining data cells with deterministic hash of the payload
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) & 0xffffffff;
    }

    let seed = Math.abs(hash) || 1234567;
    const nextBit = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 16) % 2 === 1;
    };

    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder pattern zones
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= matrixSize - 8;
        const inBottomLeft = r >= matrixSize - 8 && c < 8;
        const inTiming = r === 6 || c === 6;
        const inAlign = r >= alignY && r < alignY + 5 && c >= alignX && c < alignX + 5;

        if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming && !inAlign) {
          m[r][c] = nextBit();
        }
      }
    }

    return m;
  }, [value, matrixSize]);

  const cellSize = 10;
  const viewBoxSize = matrixSize * cellSize + 20; // 10px quiet zone padding

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`rounded-2xl ${className}`}
      aria-label={title}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} rx="12" />
      <g transform="translate(10, 10)">
        {grid.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={fgColor}
                rx={
                  (r < 7 && c < 7) ||
                  (r < 7 && c >= matrixSize - 7) ||
                  (r >= matrixSize - 7 && c < 7)
                    ? 1.5
                    : 1
                }
              />
            ) : null
          )
        )}
      </g>
    </svg>
  );
};
