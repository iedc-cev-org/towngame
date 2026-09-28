import { useState, useEffect, useCallback, useRef } from 'react';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/lib/mapData';

export function useMapCamera(viewportWidth: number, viewportHeight: number) {
  const [zoom, setZoom] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const initialPinchDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(1);

  // Center camera initially
  useEffect(() => {
    if (viewportWidth > 0 && viewportHeight > 0 && offset.x === 0 && offset.y === 0) {
      // Calculate a good initial zoom to fit the height of the map
      const initialFitZoom = Math.max(0.1, Math.min(viewportHeight / WORLD_HEIGHT, viewportWidth / WORLD_WIDTH));
      setZoom(initialFitZoom);
      const targetX = (viewportWidth - WORLD_WIDTH * initialFitZoom) / 2;
      const targetY = (viewportHeight - WORLD_HEIGHT * initialFitZoom) / 2;
      setOffset({ x: targetX, y: targetY });
    }
  }, [viewportWidth, viewportHeight, offset.x, offset.y, zoom]);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Only handle wheel events if the target is within the map viewer
    // We'll let MapViewer pass the event to us, or we attach it globally but check target.
    // Actually, attaching passive: false is required to preventDefault
    e.preventDefault();
    setZoom(prev => {
      const newZoom = prev - e.deltaY * 0.002;
      return Math.max(0.1, Math.min(newZoom, 4));
    });
  }, []);

  const getPinchDistance = (e: TouchEvent) => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false; // Stop drag, start pinch
      initialPinchDistance.current = getPinchDistance(e);
      setZoom(prev => {
        initialZoom.current = prev;
        return prev;
      });
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Prevent default to stop pull-to-refresh and native scrolling
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      const currentDistance = getPinchDistance(e);
      const scale = currentDistance / initialPinchDistance.current;
      const newZoom = initialZoom.current * scale;
      setZoom(Math.max(0.1, Math.min(newZoom, 4)));
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistance.current = null;
    }
    if (e.touches.length === 1) {
      // Revert back to dragging if one finger is left
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 0) {
      isDragging.current = false;
    }
  }, []);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    // Ignore if it's touch (handled by touch events)
    if (e.pointerType === 'touch') return;
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!isDragging.current) return;
    
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    isDragging.current = false;
  }, []);

  useEffect(() => {
    // It's better to attach these to the specific element instead of window to avoid blocking scroll on the rest of the app,
    // but since the map is full screen, window is okay for now.
    const options = { passive: false };
    window.addEventListener('wheel', handleWheel, options);
    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    
    // Mouse fallback
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handlePointerDown, handlePointerMove, handlePointerUp]);

  return { zoom, offset };
}
