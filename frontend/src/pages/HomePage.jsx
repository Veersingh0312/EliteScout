import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Search, LineChart, BrainCircuit } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="h-full flex flex-col items-center pt-10 md:pt-20 px-4 animate-fade-in-up">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-sm mb-4 animate-float">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Powered by MLflow & Transfermarkt Data
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Football Market Value <br />
          <span className="gradient-text">Intelligence Platform</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Predict player market values, analyze career trajectories, and forecast future 
          growth using advanced Machine Learning models.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/predict" className="w-full sm:w-auto btn-primary glow-blue">
            Start Predicting <ArrowRight size={18} />
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto btn-secondary">
            View Analytics
          </Link>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 w-full max-w-7xl stagger-children">
        
        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Value Prediction</h3>
          <p className="text-gray-400 flex-1">
            Machine learning models predict current market values based on player attributes, performance, and age.
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
            <Search size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Player Analytics</h3>
          <p className="text-gray-400 flex-1">
            Deep dive into historical valuation data and compare player growth curves.
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
            <LineChart size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Career Trajectory</h3>
          <p className="text-gray-400 flex-1">
            Classification models predict if a player is a rising star, growing, stable, or declining.
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
            <BrainCircuit size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">MLOps Pipeline</h3>
          <p className="text-gray-400 flex-1">
            End-to-end tracked experiments via MLflow, versioned data via DVC, and served via FastAPI.
          </p>
        </div>

      </div>
    </div>
  );
}
