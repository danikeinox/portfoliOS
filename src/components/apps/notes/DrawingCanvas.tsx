'use client';
import React, { useRef, useEffect, useImperativeHandle } from 'react';
import { useDrag } from '@use-gesture/react';
import { cn } from '@/lib/utils';

export interface DrawingCanvasHandles {
  getDrawingData: () => string | undefined;
  clear: () => void;
}

interface DrawingCanvasProps {
  initialData?: string;
  strokeColor?: string;
  strokeWidth?: number;
  mode?: 'draw' | 'erase';
  eraserColor?: string;
  onDrawEnd?: (dataUrl: string) => void;
}

const DrawingCanvas = React.forwardRef<DrawingCanvasHandles, DrawingCanvasProps>(
  ({ initialData, strokeColor = '#000000', strokeWidth = 5, mode = 'draw', eraserColor = '#000000', onDrawEnd }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPoint = useRef<{ x: number, y: number } | null>(null);

    // Initialize canvas and load data
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }

        if (initialData) {
            const image = new Image();
            image.onload = () => {
                ctx.clearRect(0, 0, rect.width, rect.height);
                ctx.drawImage(image, 0, 0, rect.width, rect.height);
            };
            image.src = initialData;
        } else {
             ctx.clearRect(0, 0, rect.width, rect.height);
        }
    }, [initialData]);

    useDrag(({ xy: [x, y], first, last, event }) => {
        event.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const currentX = x - rect.left;
        const currentY = y - rect.top;

        if (first) {
            lastPoint.current = { x: currentX, y: currentY };
        }
        
        ctx.beginPath();
        ctx.strokeStyle = mode === 'draw' ? strokeColor! : eraserColor!;
        ctx.lineWidth = mode === 'draw' ? strokeWidth! : 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (lastPoint.current) {
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        }
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        lastPoint.current = { x: currentX, y: currentY };

        if (last) {
            lastPoint.current = null;
            if (onDrawEnd) {
                onDrawEnd(canvas.toDataURL('image/png'));
            }
        }
    }, { 
        target: canvasRef,
        eventOptions: { passive: false } 
    });

    useImperativeHandle(ref, () => ({
        getDrawingData: () => canvasRef.current?.toDataURL('image/png'),
        clear: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const rect = canvas.getBoundingClientRect();
                ctx.clearRect(0, 0, rect.width, rect.height);
                 if (onDrawEnd) {
                    onDrawEnd(canvas.toDataURL('image/png'));
                }
            }
        },
    }));

    return (
      <div className="w-full h-full relative bg-transparent">
          <canvas
            ref={canvasRef}
            className={cn(
              "absolute top-0 left-0 w-full h-full touch-none",
              mode === 'draw' ? 'cursor-crosshair' : 'cursor-grab'
            )}
          />
      </div>
    );
  }
);
DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
