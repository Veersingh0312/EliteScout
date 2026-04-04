export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`glass-card p-5 flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold text-white text-lg">{title}</h3>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-[250px] w-full">
        {children}
      </div>
    </div>
  );
}
