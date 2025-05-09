'use client'

import { SplineScene } from "./spline";
import { Card } from "./card"
import { Spotlight } from "./spotlight"
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';
 
export function SplineSceneBasic() {
  const navigate = useNavigate();

  return (
    <Card className="w-full min-h-[500px] bg-black/[0.96] relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      <div className="flex flex-col lg:flex-row min-h-[500px] lg:h-full">
        {/* Left content */}
        <div className="flex-1 p-6 md:p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 text-center lg:text-left">
            Nexus AI
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg text-center lg:text-left text-sm sm:text-base">
            Bienvenidos al primer ChatBot de Costa Rica
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group w-full sm:w-auto"
            >
              <span>Probar ahora</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-[#2A2B32] text-white rounded-lg font-medium hover:bg-[#40414F] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>Iniciar sesión</span>
              <LogIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 relative min-h-[300px] lg:min-h-full order-first lg:order-last">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full absolute inset-0"
          />
        </div>
      </div>
    </Card>
  )
}