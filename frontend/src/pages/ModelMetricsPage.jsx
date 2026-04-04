import { useEffect, useState } from 'react';
import { fetchModelMetrics } from '../lib/api';
import { Database, Filter, Layers, Settings2, BarChart2, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ModelMetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchModelMetrics();
        setMetrics(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
     <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
     </div>
  );

  const bestRegressor = metrics?.regression?.best_model;
  const bestClassifier = metrics?.classification?.best_model;
  const regModels = metrics?.regression?.models || {};

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
           <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Database size={24}/> Model Registry & Metrics</h1>
           <p className="text-gray-400 text-sm mt-1">Live performance tracking from MLflow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Regression Models Section */}
         <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Layers size={20} className="text-blue-500"/> Value Regression Models</h2>
            
            {Object.entries(regModels).map(([name, data]) => (
               <div key={name} className={`glass-card p-5 relative overflow-hidden transition-all ${name === bestRegressor ? 'ring-1 ring-blue-500 bg-blue-500/5' : ''}`}>
                 {name === bestRegressor && <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1"><Star size={12}/> ACTIVE</div>}
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-white">{name}</h3>
                    <span className="text-xs uppercase bg-white/10 px-2 py-0.5 rounded text-gray-300">Regressor</span>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5 text-center">
                       <div className="text-xs text-gray-500 font-semibold mb-1">R² Score</div>
                       <div className="text-xl font-black text-green-400">{data.r2.toFixed(3)}</div>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5 text-center">
                       <div className="text-xs text-gray-500 font-semibold mb-1">CV R²</div>
                       <div className="text-lg font-bold text-white">{data.cv_r2_mean?.toFixed(3) || 'N/A'}</div>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5 text-center">
                       <div className="text-xs text-gray-500 font-semibold mb-1">MAE</div>
                       <div className="text-lg font-bold text-white">€{(data.mae/1_000_000).toFixed(1)}M</div>
                    </div>
                 </div>

                 {/* Feature Importances Mini Chart */}
                 {data.feature_importances && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                       <div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Settings2 size={12}/> Top Features</div>
                       <div className="flex flex-wrap gap-2">
                         {Object.entries(data.feature_importances)
                           .sort((a,b)=>b[1]-a[1]).slice(0, 4)
                           .map(([feat, val]) => (
                             <span key={feat} className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">
                               {feat.replace('_encoded','')} ({(val*100).toFixed(0)}%)
                             </span>
                           ))}
                       </div>
                    </div>
                 )}
               </div>
            ))}
         </div>

         {/* Classification & TS Models */}
         <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Filter size={20} className="text-green-500"/> Classification Models</h2>
            
            {metrics?.classification?.models && Object.entries(metrics.classification.models).map(([name, data]) => (
               <div key={name} className={`glass-card p-5 relative overflow-hidden transition-all ${name === bestClassifier ? 'ring-1 ring-green-500 bg-green-500/5' : ''}`}>
                 {name === bestClassifier && <div className="absolute top-0 right-0 bg-green-600 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1"><Star size={12}/> ACTIVE</div>}
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-white">{name}</h3>
                    <span className="text-xs uppercase bg-white/10 px-2 py-0.5 rounded text-gray-300">Classifier</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5 text-center">
                       <div className="text-xs text-gray-500 font-semibold mb-1">F1 Score (Weighted)</div>
                       <div className="text-xl font-black text-green-400">{data.f1_score?.toFixed(3)}</div>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5 text-center">
                       <div className="text-xs text-gray-500 font-semibold mb-1">Accuracy</div>
                       <div className="text-xl font-black text-white">{data.accuracy?.toFixed(3)}</div>
                    </div>
                 </div>
               </div>
            ))}

            <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-8 pt-6 border-t border-white/10"><BarChart2 size={20} className="text-orange-500"/> Time Series Forecasting</h2>
            
            {metrics?.timeseries?.models && Object.entries(metrics.timeseries.models).map(([name, data]) => (
               <div key={name} className="glass-card p-5 relative ring-1 ring-orange-500 bg-orange-500/5">
                 <div className="absolute top-0 right-0 bg-orange-600 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1"><Star size={12}/> ACTIVE</div>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-white">{name}</h3>
                    <span className="text-xs uppercase bg-white/10 px-2 py-0.5 rounded text-gray-300">TS Regressor</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5 text-center">
                       <div className="text-xs text-gray-500 font-semibold mb-1">R²</div>
                       <div className="text-lg font-bold text-green-400">{data.r2?.toFixed(3)}</div>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5 text-center">
                       <div className="text-xs text-gray-500 font-semibold mb-1">MAE</div>
                       <div className="text-lg font-bold text-white">€{((data.mae||0)/1_000_000).toFixed(1)}M</div>
                    </div>
                 </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
