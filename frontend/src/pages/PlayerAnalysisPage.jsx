import { useState } from 'react';
import { searchPlayers, fetchPlayerAnalysis, fetchPlayerForecast, formatCurrency } from '../lib/api';
import PlayerCard from '../components/PlayerCard';
import ChartCard from '../components/ChartCard';
import { Search as SearchIcon, CalendarDays, LineChart, Hash } from 'lucide-react';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PlayerAnalysisPage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  
  const [analysis, setAnalysis] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

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

  const handleSelect = async (id) => {
    setSelectedPlayerId(id);
    setLoadingData(true);
    
    try {
      const [analysisRes, forecastRes] = await Promise.all([
        fetchPlayerAnalysis(id),
        fetchPlayerForecast(id, 5).catch(() => null) // Ignore forecast errors for now
      ]);
      
      setAnalysis(analysisRes);
      setForecast(forecastRes);
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // Combine history and forecast data for charting
  let chartData = [];
  if (analysis && analysis.value_history) {
    chartData = analysis.value_history.map(item => ({
      date: item.valuation_date.substring(0,4), // Extract year
      value: item.value_eur / 1_000_000,
      isForecast: false
    }));
    
    // Smooth out duplicates per year by averaging or keeping last
    const yearMap = new Map();
    chartData.forEach(d => {
       yearMap.set(d.date, d.value);
    });
    chartData = Array.from(yearMap).map(([date, value]) => ({date, value, isForecast: false}));

    if (forecast && forecast.forecasts && forecast.forecasts.length > 0) {
      const lastYear = parseInt(chartData[chartData.length - 1]?.date || new Date().getFullYear());
      const forecastPoints = forecast.forecasts.map(f => ({
        date: (lastYear + f.year).toString(),
        value: f.predicted_value / 1_000_000,
        isForecast: true
      }));
      chartData = [...chartData, ...forecastPoints];
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10">
      
      {/* Search Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex-1 w-full max-w-xl relative">
          <form onSubmit={handleSearch} className="relative flex items-center w-full">
            <SearchIcon className="absolute left-4 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by player name (e.g. Mbappé, Haaland)..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-[#0F172A] border border-[rgba(255,255,255,0.1)] rounded-full w-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button type="submit" disabled={loadingSearch} className="absolute right-2 px-4 py-1.5 bg-blue-600 rounded-full text-sm font-medium hover:bg-blue-500 transition-colors">
              {loadingSearch ? '...' : 'Search'}
            </button>
          </form>
          
          {/* Search Dropdown */}
          {searchResults.length > 0 && (
             <div className="absolute top-14 left-0 right-0 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
               {searchResults.map((player) => (
                 <div 
                   key={player.player_id} 
                   onClick={() => handleSelect(player.player_id)}
                   className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors"
                 >
                   <img src={player.image_url || `https://ui-avatars.com/api/?name=${player.name}`} alt="" className="w-10 h-10 rounded-full bg-[#0F172A] object-cover" />
                   <div className="flex-1">
                     <div className="font-semibold text-white">{player.name}</div>
                     <div className="text-xs text-gray-400">{player.current_club} • {player.league_name}</div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-blue-400">{formatCurrency(player.current_value_eur)}</div>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      {loadingData && (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
        </div>
      )}

      {analysis && !loadingData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-3">
             <PlayerCard player={analysis.player} />
             
             <div className="glass-card mt-6 p-5 space-y-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Key Highlights</h3>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Hash size={18}/></div>
                  <div>
                    <div className="text-xs text-gray-400">Peak Value</div>
                    <div className="font-semibold">{formatCurrency(analysis.player.peak_value_eur || 0)}</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><LineChart size={18}/></div>
                  <div>
                    <div className="text-xs text-gray-400">Trajectory Mode</div>
                    <span className={`badge badge-${analysis.player.trajectory} uppercase mt-1`}>
                      {analysis.player.trajectory?.replace('_',' ')}
                    </span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><CalendarDays size={18}/></div>
                  <div>
                    <div className="text-xs text-gray-400">Career Span</div>
                    <div className="font-semibold">{analysis.player.career_span_years || (analysis.player.age && analysis.player.age - 18) ||'?'} Years</div>
                  </div>
               </div>
             </div>
           </div>

           <div className="lg:col-span-9 flex flex-col gap-6">
             <ChartCard title="Valuation History & ML Forecast" subtitle="Historical valuation points marked in solid line; forecast in dashed. Current value based on official data.">
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsLine data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}M`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                      formatter={(value, name, props) => [`€${value.toFixed(1)}M`, props.payload.isForecast ? 'Forecast Value' : 'Historical Value']}
                    />
                    {/* Separate lines for actual and forecast for visual styling */}
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0B5FFF" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#0B5FFF', strokeWidth: 0 }} 
                      activeDot={{ r: 6, fill: '#fff', stroke: '#0B5FFF', strokeWidth: 2 }}
                      isAnimationActive={true}
                    />
                  </RechartsLine>
                </ResponsiveContainer>
             </ChartCard>
           </div>
        </div>
      )}

      {/* Default State */}
      {!analysis && !loadingData && !loadingSearch && (
        <div className="glass-card p-12 text-center border-dashed border-2 border-white/5 flex flex-col items-center">
          <SearchIcon className="text-gray-600 opacity-50 mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Search for a player</h2>
          <p className="text-gray-400 max-w-md">Use the search box above to find any player in the Transfermarkt database and analyze their historical valuation and future outlook.</p>
        </div>
      )}

    </div>
  );
}
