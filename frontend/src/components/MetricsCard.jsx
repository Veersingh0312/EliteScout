export default function MetricsCard({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) {
  const iconColors = {
    blue: 'bg-blue-500/20 text-blue-500',
    green: 'bg-green-500/20 text-green-500',
    purple: 'bg-purple-500/20 text-purple-500',
    orange: 'bg-orange-500/20 text-orange-500',
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <div className="glass-card p-5 flex items-center justify-between hover:glow-blue transition-all">
      <div>
        <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-white">{value}</h4>
        
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-sm">
            <span className={trendColors[trend]}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconColors[color] || iconColors.blue}`}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
}
