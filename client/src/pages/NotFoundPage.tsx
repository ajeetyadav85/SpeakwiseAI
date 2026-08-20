import React from 'react';
import { Link } from 'react-router-dom';
import { MicOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center text-center p-4">
      <div className="space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mx-auto">
          <MicOff className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white">404 — Frequency Lost</h1>
        <p className="text-slate-400 text-sm">The page or report stream you requested could not be located in our speech vault.</p>
        <Link to="/dashboard">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Main Workspace
          </Button>
        </Link>
      </div>
    </div>
  );
};
