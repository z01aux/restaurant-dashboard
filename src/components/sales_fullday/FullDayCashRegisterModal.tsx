import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface FullDayCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'open' | 'close';
  cashRegister: any;
  onConfirm: (data: { initialCash?: number; finalCash?: number; notes?: string }) => Promise<void>;
  loading: boolean;
}

export const FullDayCashRegisterModal: React.FC<FullDayCashRegisterModalProps> = ({
  isOpen,
  onClose,
  type,
  cashRegister,
  onConfirm,
  loading,
}) => {
  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInitialCash('');
      setFinalCash('');
      setNotes('');
      setError('');
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type === 'open') {
      const cash = parseFloat(initialCash);
      if (isNaN(cash) || cash < 0) {
        setError('Ingresa un monto inicial válido');
        return;
      }
      await onConfirm({ initialCash: cash });
    } else {
      const cash = parseFloat(finalCash);
      if (isNaN(cash) || cash < 0) {
        setError('Ingresa un monto final válido');
        return;
      }
      await onConfirm({ finalCash: cash, notes });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {type === 'open' ? 'Abrir Caja FullDay' : 'Cerrar Caja FullDay'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {type === 'open' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Inicial *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  step="0.01"
                  value={initialCash}
                  onChange={(e) => setInitialCash(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Final *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    step="0.01"
                    value={finalCash}
                    onChange={(e) => setFinalCash(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Observaciones..."
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>{type === 'open' ? 'Abrir' : 'Cerrar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};