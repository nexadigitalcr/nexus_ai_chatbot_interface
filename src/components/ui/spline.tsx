'use client'

import { Suspense, lazy, useEffect, useState } from 'react'
import { motion } from 'framer-motion';
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    // Check if WebGL is available
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      setHasWebGLError(true);
      return;
    }

    // Suppress WebGL-related console errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('THREE.WebGLProgram: Shader Error') ||
         args[0].includes('VALIDATE_STATUS') ||
         args[0].includes('WebGL context') ||
         args[0].includes('WebGL2 context'))
      ) {
        setHasWebGLError(true);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const FallbackUI = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-8"
    >
      <div className="w-24 h-24 mb-6 relative">
        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-spin"></div>
        <div className="absolute inset-[8px] border-4 border-t-blue-500 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-[16px] border-4 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Interactive 3D Experience Unavailable</h3>
      <p className="text-gray-400 text-center max-w-md">
        Your browser might not support WebGL, or 3D acceleration might be disabled. 
        Don't worry - all other features are still available!
      </p>
    </motion.div>
  );

  if (hasWebGLError) {
    return <FallbackUI />;
  }

  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] rounded-lg">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-spin"></div>
            <div className="absolute inset-[6px] border-4 border-t-blue-500 rounded-full animate-spin-slow"></div>
          </div>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
        onError={() => setHasWebGLError(true)}
      />
    </Suspense>
  )
}