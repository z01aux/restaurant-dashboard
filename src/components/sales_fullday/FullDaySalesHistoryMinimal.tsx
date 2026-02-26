import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

interface FullDaySalesHistoryMinimalProps {
  closures: any[];
}

export const FullDaySalesHistoryMinimal: React.FC<FullDaySalesHistoryMinimalProps> = ({ closures }) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const displayedClosures = showAll ? closures : closures.slice(0, 5);

  if (closures.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700">CIERRES FULLDAY</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {displayedClosures.map((closure) => (
          <div key={closure.id} className="text-xs">
            <div 
              className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => setExpandedId(expandedId === closure.id ? null : closure.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-gray-500 w-16">
                  {new Date(closure.closed_at).toLocaleDateString()}
                </span>
                <span className="font-semibold text-purple-600">
                  S/ {closure.total_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    /* export */
                  }}
                  className="p-1 text-gray-400 hover:text-green-600"
                >
                  <Download size={12} />
                </button>
                {expandedId === closure.id ? 
                  <ChevronUp size={14} className="text-gray-400" /> : 
                  <ChevronDown size={14} className="text-gray-400" />
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {closures.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-xs text-center text-purple-600 bg-gray-50 border-t border-gray-200"
        >
          {showAll ? 'Ver menos' : `Ver ${closures.length - 5} más...`}
        </button>
      )}
    </div>
  );
};