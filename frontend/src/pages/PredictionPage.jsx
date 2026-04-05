import { useState } from 'react';
import { predictValue, predictTrajectory, searchPlayers, fetchPlayerAnalysis, formatCurrency } from '../lib/api';
import { Calculator, Award, TrendingUp, AlertCircle, BarChart3, Search as SearchIcon, Info } from 'lucide-react';
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

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoadingSearch(true);
    try {
      const res = await searchPlayers(query);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectPlayer = async (id) => {
    setLoadingData(true);
    try {
      const analysisRes = await fetchPlayerAnalysis(id);
      if (analysisRes && analysisRes.player) {
        const p = analysisRes.player;
        setSelectedPlayer(p);
        
        // Auto-populate the prediction form with base stats
        setFormData({
          age: p.age || 24,
          position_group: p.position_group || 'Attack',
          league_name: p.league_name || 'Premier League',
          career_span_years: p.career_span_years ? parseFloat(p.career_span_years.toFixed(1)) : 5,
          value_cagr: p.value_cagr ? parseFloat(p.value_cagr.toFixed(3)) : 0.2,
          value_multiplier_x: p.value_multiplier_x ? parseFloat(p.value_multiplier_x.toFixed(2)) : 2.5,
          value_volatility: p.value_volatility ? parseFloat(p.value_volatility.toFixed(3)) : 0.3,
          age_at_peak: p.age_at_peak || 27,
          peak_value_eur: p.peak_value_eur || 60000000,
          years_to_peak: p.years_to_peak ? parseFloat(p.years_to_peak.toFixed(1)) : 3,
          num_clubs_career: p.num_clubs_career || 2
        });
        
        // Optional: Run simulation immediately
        // predictWithData(newFormData, p);
      }
      setSearchResults([]);
      setQuery('');
      setResult(null); // Clear previous prediction
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

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
      // Run both predictions, using player-specific hidden fields if available
      const [valRes, trajRes] = await Promise.all([
         predictValue(formData),
         predictTrajectory({
           ...formData, 
           post_peak_decline_pct: selectedPlayer?.post_peak_decline_pct || 0, 
           is_at_peak: selectedPlayer?.is_at_peak || 0, 
           mean_yoy_growth_rate: selectedPlayer?.mean_yoy_growth_rate || 0.1
         })
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
           <h1 className="text-2xl font-bold text-white">Scenario Simulator</h1>
           <p className="text-gray-400 text-sm mt-1">Load an existing player & adjust features to predict counter-factual values</p>
        </div>
      </div>

      {/* Player Search Section */}
      <div className="glass-card p-6 flex flex-col items-center justify-center relative">
        <div className="w-full max-w-2xl relative">
          <form onSubmit={handleSearch} className="relative flex items-center w-full">
            <SearchIcon className="absolute left-4 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by player name to simulate (e.g. Bukayo Saka)..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-[#0F172A] border border-[rgba(255,255,255,0.1)] rounded-full w-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button type="submit" disabled={loadingSearch} className="absolute right-2 px-4 py-1.5 bg-blue-600 rounded-full text-sm font-medium hover:bg-blue-500 transition-colors">
              {loadingSearch ? '...' : 'Load'}
            </button>
          </form>
          
          {/* Search Dropdown */}
          {searchResults.length > 0 && (
             <div className="absolute top-14 left-0 right-0 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
               {searchResults.map((p) => (
                 <div 
                   key={p.player_id} 
                   onClick={() => handleSelectPlayer(p.player_id)}
                   className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors"
                 >
                   <img src={p.image_url || `https://ui-avatars.com/api/?name=${p.name}`} alt="" className="w-10 h-10 rounded-full bg-[#0F172A] object-cover" />
                   <div className="flex-1">
                     <div className="font-semibold text-white">{p.name}</div>
                     <div className="text-xs text-gray-400">{p.current_club} • {p.league_name}</div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-blue-400">{formatCurrency(p.current_value_eur)}</div>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      {loadingData && (
        <div className="flex justify-center my-8">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Selected Player Summary */}
          {selectedPlayer && (
            <div className="glass-card p-5 relative overflow-hidden group border-blue-500/20 border-2">
               <div className="absolute top-0 right-0 p-2 bg-blue-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-bl-lg">Active Scenario</div>
               <div className="flex items-center gap-4">
                 <img src={selectedPlayer.image_url || `https://ui-avatars.com/api/?name=${selectedPlayer.name}`} alt="" className="w-16 h-16 rounded-full bg-[#0F172A] object-cover shadow-lg" />
                 <div>
                   <h3 className="font-bold text-white text-lg">{selectedPlayer.name}</h3>
                   <p className="text-xs text-gray-400">{selectedPlayer.current_club} • {selectedPlayer.position}</p>
                   <div className="text-sm font-semibold text-blue-400 mt-1">Current Base: {formatCurrency(selectedPlayer.current_value_eur)}</div>
                 </div>
               </div>
            </div>
          )}

          <div className="glass-card p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="font-bold text-lg text-white">Player Attributes</h3>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Info size={12}/> Scenario Parameters</span>
              </div>
              
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
                Simulate Scenario
              </button>
              {error && <div className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> {error}</div>}
            </form>
          </div>
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
                    <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">Simulated Value</div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                      {result.value.predicted_value_formatted}
                    </div>
                    {selectedPlayer && (
                      <div className={`text-xs mt-2 font-medium ${result.value.predicted_value > selectedPlayer.current_value_eur ? 'text-green-400' : 'text-red-400'}`}>
                        {result.value.predicted_value > selectedPlayer.current_value_eur ? '+' : ''}
                        {formatCurrency(result.value.predicted_value - selectedPlayer.current_value_eur)} vs actual
                      </div>
                    )}
                 </div>

                 <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
                    <TrendingUp className="text-green-500 mb-3" size={32} />
                    <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">Simulated Trajectory</div>
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
                     <h3 className="font-bold text-white text-lg">Key Drivers in Scenario</h3>
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
              <h3 className="text-xl font-bold text-white mb-2">Scenario Ready</h3>
              <p className="max-w-md">Search for a player to load their actual base metrics, or adjust the parameters manually and run the model prediction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
