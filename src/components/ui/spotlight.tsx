'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useSpring, useTransform, SpringOptions } from 'framer-motion';
import { cn } from '../../lib/utils';

type SpotlightProps = {
  className?: string;
  size?: number;
  springOptions?: SpringOptions;
  fill?: string;
};

export function Spotlight({
  className,
  size = 200,
  springOptions = { bounce: 0 },
  fill = 'white'
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);

  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`);
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.style.overflow = 'hidden';
        setParentElement(parent);
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!parentElement || isMobile) return;
      const { left, top } = parentElement.getBoundingClientRect();
      mouseX.set(event.clientX - left);
      mouseY.set(event.clientY - top);
    },
    [mouseX, mouseY, parentElement, isMobile]
  );

  useEffect(() => {
    if (!parentElement) return;

    if (!isMobile) {
      parentElement.addEventListener('mousemove', handleMouseMove);
      parentElement.addEventListener('mouseenter', () => setIsHovered(true));
      parentElement.addEventListener('mouseleave', () => setIsHovered(false));
    }

    return () => {
      if (!isMobile) {
        parentElement.removeEventListener('mousemove', handleMouseMove);
        parentElement.removeEventListener('mouseenter', () => setIsHovered(true));
        parentElement.removeEventListener('mouseleave', () => setIsHovered(false));
      }
    };
  }, [parentElement, handleMouseMove, isMobile]);

  if (isMobile) {
    return (
      <motion.div
        ref={containerRef}
        className={cn(
          'pointer-events-none absolute rounded-full bg-gradient-radial',
          'from-zinc-50 via-zinc-100 to-zinc-200',
          'opacity-20 blur-2xl transition-opacity duration-500',
          className
        )}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at center, ${fill}, transparent 80%)`,
          left: '50%',
          top: '0',
          transform: 'translateX(-50%)',
        }}
      />
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops),transparent_80%)] blur-xl transition-opacity duration-200',
        'from-zinc-50 via-zinc-100 to-zinc-200',
        isHovered ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        width: size,
        height: size,
        left: spotlightLeft,
        top: spotlightTop,
      }}
    />
  );
}