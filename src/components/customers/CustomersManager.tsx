// ============================================
// ARCHIVO: src/components/customers/CustomersManager.tsx
// ACTUALIZADO: Modales para agregar/editar y confirmar eliminación
// ============================================

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Phone, MapPin, Save, X, Mail, AlertCircle, User } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';

// ── Modal de confirmación de eliminación ─────────────────────────────────────
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  customerName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({ isOpen, customerName, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 rounded-t-2xl text-white">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertCircle size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-bold">Eliminar Cliente</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-2">
              ¿Estás seguro de que deseas eliminar al cliente:
            </p>
            <p className="font-bold text-gray-900 text-lg mb-4">"{customerName}"</p>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-md transition-all font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /><span>Eliminando...</span></>
                  : <><Trash2 size={16} /><span>Sí, eliminar</span></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Modal de formulario (agregar / editar) ────────────────────────────────────
const CustomerFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  onSave: (data: { name: string; phone: string; address?: string; email?: string }) => Promise<boolean>;
  loading: boolean;
}> = ({ isOpen, onClose, customer, onSave, loading }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', email: '' });
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setError('');
      setFormData(customer
        ? { name: customer.name, phone: customer.phone, address: customer.address || '', email: customer.email || '' }
        : { name: '', phone: '', address: '', email: '' }
      );
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('El nombre y el teléfono son obligatorios.');
      return;
    }
    const ok = await onSave({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim() || undefined,
      email: formData.email.trim() || undefined,
    });
    if (ok) onClose();
  };

  const isEditing = !!customer;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${isEditing ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-amber-500'} p-5 rounded-t-2xl text-white sticky top-0 z-10`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  {isEditing ? <Edit size={22} className="text-white" /> : <Plus size={22} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                  <p className="text-xs opacity-80">{isEditing ? `Modificar datos de ${customer.name}` : 'Completa los datos de contacto'}</p>
                </div>
              </div>
              <button onClick={onClose} disabled={loading} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm"
                  placeholder="Nombre del cliente"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm"
                  placeholder="Número de teléfono"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm"
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Dirección <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm"
                  placeholder="Dirección completa"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 bg-gradient-to-r ${isEditing ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-amber-500'} text-white px-4 py-3 rounded-xl hover:shadow-md transition-all font-semibold disabled:opacity-50 flex items-center justify-center space-x-2`}
              >
                {loading
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /><span>{isEditing ? 'Guardando...' : 'Creando...'}</span></>
                  : <><Save size={16} /><span>{isEditing ? 'Guardar Cambios' : 'Crear Cliente'}</span></>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const CustomersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { customers, loading, createCustomer, updateCustomer, deleteCustomer, fetchCustomers } = useCustomers();

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNewCustomer = () => { setEditingCustomer(null); setShowForm(true); };
  const handleEditCustomer = (customer: any) => { setEditingCustomer(customer); setShowForm(true); };

  const handleSave = async (data: { name: string; phone: string; address?: string; email?: string }): Promise<boolean> => {
    setFormLoading(true);
    try {
      const result = editingCustomer
        ? await updateCustomer(editingCustomer.id, data)
        : await createCustomer(data);
      if (result.success) {
        await fetchCustomers();
        return true;
      } else {
        // El modal muestra el error internamente
        alert('❌ ' + (result.error || 'Error al guardar cliente'));
        return false;
      }
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const result = await deleteCustomer(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
        await fetchCustomers();
      } else {
        alert('❌ Error al eliminar: ' + result.error);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Modales */}
      <CustomerFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingCustomer(null); }}
        customer={editingCustomer}
        onSave={handleSave}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        customerName={deleteTarget?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-500 mt-1 text-sm">{customers.length} clientes registrados</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 w-full sm:w-64"
                placeholder="Buscar clientes..."
              />
            </div>
            <button
              onClick={handleNewCustomer}
              className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-xl flex items-center justify-center space-x-2 hover:shadow-md transition-all font-medium"
            >
              <Plus size={18} />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
            <p className="text-gray-500 mt-2">Cargando clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega tu primer cliente con el botón "Nuevo Cliente"'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200 relative group"
              >
                {/* Acciones */}
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors"
                    title="Editar cliente"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: customer.id, name: customer.name })}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors"
                    title="Eliminar cliente"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="pr-20">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">{customer.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                        <Phone size={16} className="text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Teléfono</div>
                        <div className="font-medium text-gray-900 text-sm">{customer.phone}</div>
                      </div>
                    </div>

                    {customer.email && (
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                          <Mail size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Email</div>
                          <div className="font-medium text-gray-900 text-sm break-all">{customer.email}</div>
                        </div>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start space-x-3 md:col-span-2">
                        <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                          <MapPin size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Dirección</div>
                          <div className="font-medium text-gray-900 text-sm">{customer.address}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-gray-400">
                    Registrado: {new Date(customer.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
            <div className="text-2xl font-bold text-red-600">{customers.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Clientes</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{customers.filter(c => c.email).length}</div>
            <div className="text-xs text-gray-500 mt-1">Con Email</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-600">{customers.filter(c => c.address).length}</div>
            <div className="text-xs text-gray-500 mt-1">Con Dirección</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersManager;
