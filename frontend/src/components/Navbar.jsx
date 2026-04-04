import { Bell, Search, Hexagon } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 bg-[#1E293B]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 md:hidden">
        <Hexagon className="text-blue-500" size={24} />
      </div>
      
      <div className="flex items-center bg-[#0F172A] border border-[rgba(255,255,255,0.06)] rounded-full px-4 py-1.5 w-full max-w-sm hidden md:flex group focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
        <Search size={16} className="text-gray-400 group-focus-within:text-blue-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search players, leagues..." 
          className="bg-transparent border-none text-sm text-gray-200 focus:outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto text-gray-400">
        <button className="hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#1E293B]"></span>
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-green-400 flex items-center justify-center text-sm font-bold text-white shadow-lg cursor-pointer">
          A
        </div>
      </div>
    </header>
  );
}
