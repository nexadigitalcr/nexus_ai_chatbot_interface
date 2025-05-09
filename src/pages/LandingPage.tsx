import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SplineSceneBasic } from '../components/ui/demo';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <SplineSceneBasic />
      </div>
    </div>
  );
};