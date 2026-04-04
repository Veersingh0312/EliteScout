import { useState } from 'react';
import { predictValue, predictTrajectory } from '../lib/api';
import { Calculator, Award, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PredictionPage() {
  const [formData, setFormData] = useState({
    age: 24,
    position_group: 'Attack',
    league_name: 'Premier League',
    career_span_years: 5,
    value_cagr: 0.2,
    value_multiplier_x: 2.5,
    value_volatility: 0.3,
    age_at_peak: 27,
    peak_value_eur: 60000000,
    years_to_peak: 3,
    num_clubs_career: 2
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Run both predictions
      const [valRes, trajRes] = await Promise.all([
         predictValue(formData),
         predictTrajectory({...formData, post_peak_decline_pct: 0, is_at_peak: 0, mean_yoy_growth_rate: 0.1})
      ]);
      
      setResult({
        value: valRes,
        trajectory: trajRes
      });
    } catch (err) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-white">Market Value Simulator</h1>
           <p className="text-gray-400 text-sm mt-1">Adjust player parameters to see real-time ML predictions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="font-bold text-lg text-white mb-4 border-b border-white/10 pb-2">Player Attributes</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Age ({formData.age})</label>
                <input type="range" min="15" max="40" name="age" value={formData.age} onChange={handleChange} className="w-full accent-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Position Group</label>
                <select name="position_group" value={formData.position_group} onChange={handleChange} className="select-dark">
                  <option>Attack</option><option>Midfield</option><option>Defender</option><option>Goalkeeper</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">League</label>
              <select name="league_name" value={formData.league_name} onChange={handleChange} className="select-dark">
                <option>Premier League</option><option>LaLiga</option><option>Serie A</option>
                <option>Bundesliga</option><option>Ligue 1</option><option>Other</option>
              </select>
            </div>

            <h3 className="font-bold text-lg text-white mb-4 mt-6 border-b border-white/10 pb-2">Career Metrics</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Career Span (Yrs)</label>
                <input type="number" name="career_span_years" value={formData.career_span_years} onChange={handleChange} className="input-dark" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Clubs Career</label>
                <input type="number" name="num_clubs_career" value={formData.num_clubs_career} onChange={handleChange} className="input-dark" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Value Multiplier</label>
                <input type="number" step="0.1" name="value_multiplier_x" value={formData.value_multiplier_x} onChange={handleChange} className="input-dark" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Peak Value (€)</label>
                <input type="number" step="1000000" name="peak_value_eur" value={formData.peak_value_eur} onChange={handleChange} className="input-dark" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary justify-center mt-6 py-3 text-base">
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
              ) : <Calculator size={20} />}
              Run Model Prediction
            </button>
            {error && <div className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> {error}</div>}
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {result ? (
            <>
              {/* Top Results Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="glass-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Award className="text-blue-500 mb-3" size={32} />
                    <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">Predicted Value</div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                      {result.value.predicted_value_formatted}
                    </div>
                 </div>

                 <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
                    <TrendingUp className="text-green-500 mb-3" size={32} />
                    <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">Predicted Trajectory</div>
                    <span className={`badge badge-${result.trajectory.predicted_trajectory} text-lg px-4 py-1`}>
                       {result.trajectory.predicted_trajectory.replace('_', ' ')}
                    </span>
                    <div className="text-xs text-gray-500 mt-2">Confidence: {(result.trajectory.confidence * 100).toFixed(1)}%</div>
                 </div>
              </div>

              {/* Feature Importance Chart */}
              {result.value.feature_importances && Object.keys(result.value.feature_importances).length > 0 && (
                <div className="glass-card p-6 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                     <BarChart3 className="text-gray-400" size={20} />
                     <h3 className="font-bold text-white text-lg">Key Drivers (Feature Impact)</h3>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.entries(result.value.feature_importances).map(([k,v]) => ({name:k.replace('_encoded',''), value:v})).sort((a,b)=>b.value-a.value).slice(0,5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" stroke="#64748B" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={100} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500 border-dashed border-2 border-white/5">
              <Calculator size={48} className="mb-4 text-gray-600 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Awaiting Parameters</h3>
              <p className="max-w-md">Adjust the player attributes on the left and click predict to see how market value is calculated based on our ML models.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
