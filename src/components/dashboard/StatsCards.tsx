import React from 'react';
import { Coffee, TrendingUp } from 'lucide-react';

const StatsCards: React.FC = () => {
  const stats = [
    {
      title: 'Órdenes Activas',
      value: '12',
      change: '+2',
      icon: Coffee,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Clientes Hoy',
      value: '48',
      change: '+8',
      icon: Coffee,
      color: 'from-amber-500 to-yellow-500',
    },
    {
      title: 'Tiempo Promedio',
      value: '18min',
      change: '-2min',
      icon: Coffee,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Ingresos Hoy',
      value: 'S/ 1,240',
      change: '+15%',
      icon: Coffee,
      color: 'from-gray-600 to-gray-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <div className="flex items-baseline space-x-1 sm:space-x-2">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-1 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp size={8} className="mr-1" />
                  {stat.change}
                </span>
              </div>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color}`}>
              <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="w-full bg-gray-100 rounded-full h-1 sm:h-1.5">
              <div 
                className={`h-1 sm:h-1.5 rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000`}
                style={{ width: `${70 + (index * 10)}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
