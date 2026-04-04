import { useEffect, useState } from 'react';
import { fetchDashboardSummary, fetchTopPlayers, fetchLeagueAnalysis, formatCurrency, formatNumber } from '../lib/api';
import MetricsCard from '../components/MetricsCard';
import ChartCard from '../components/ChartCard';
import PlayerCard from '../components/PlayerCard';
import { Users, DollarSign, Trophy, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, topRes, leagueRes] = await Promise.all([
          fetchDashboardSummary(),
          fetchTopPlayers(12),
          fetchLeagueAnalysis()
        ]);
        setSummary(sumRes);
        setTopPlayers(topRes.players || []);
        
        // Prepare league data for chart
        const lData = (leagueRes.leagues || []).map(l => ({
          name: l.league_name,
          value: parseFloat((l.total_value / 1_000_000).toFixed(1)),
          count: l.player_count
        })).sort((a,b) => b.value - a.value).slice(0, 5);
        setLeagues(lData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  const COLORS = ['#0B5FFF', '#22C55E', '#F59E0B', '#EF4444', '#A855F7'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <div className="text-sm text-gray-400">Transfermarkt Dataset Overview</div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          title="Total Players" 
          value={formatNumber(summary?.total_players)} 
          icon={Users} 
          color="blue" 
        />
        <MetricsCard 
          title="Average Market Value" 
          value={formatCurrency(summary?.avg_value)} 
          icon={DollarSign} 
          color="green" 
        />
        <MetricsCard 
          title="Highest Value Player" 
          value={summary?.top_player_name} 
          icon={Trophy} 
          color="orange" 
        />
        <MetricsCard 
          title="Top League (Value)" 
          value={summary?.top_league} 
          icon={Globe} 
          color="purple" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Total Market Value by League (Millions €)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leagues} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}M`} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                formatter={(value) => [`€${value}M`, 'Total Value']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {leagues.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Player Trajectory Distribution">
           {summary && summary.trajectory_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={Object.entries(summary.trajectory_distribution).map(([k,v]) => ({name: k, value: v}))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(summary.trajectory_distribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                    />
                 </PieChart>
              </ResponsiveContainer>
           ) : (
             <div className="flex items-center justify-center h-full text-gray-500">No data</div>
           )}
        </ChartCard>
      </div>

      {/* Top Players Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Top Valuable Players</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {topPlayers.map((player) => (
            <PlayerCard key={player.player_id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
