import { formatCurrency } from '../lib/api';

export default function PlayerCard({ player }) {
  const imageUrl = player.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random`;
  
  return (
    <div className="glass-card player-card p-4 flex flex-col items-center text-center gap-3 w-full animate-fade-in-up">
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-lg relative bg-[#0F172A]">
        <img 
          src={imageUrl} 
          alt={player.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random`;
          }}
        />
      </div>
      <div>
        <h3 className="font-bold text-white text-lg leading-tight truncate px-2" title={player.name}>
          {player.name}
        </h3>
        <p className="text-gray-400 text-sm mt-1">{player.current_club}</p>
      </div>
      
      <div className="flex gap-2 justify-center flex-wrap">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
          {player.position_group || player.position}
        </span>
        {player.age && (
           <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
             {player.age} yrs
           </span>
        )}
      </div>

      <div className="mt-2 w-full pt-3 border-t border-white/5">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Market Value</div>
        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
          {formatCurrency(player.current_value_eur)}
        </div>
      </div>
    </div>
  );
}
