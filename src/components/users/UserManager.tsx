import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Trash2, User, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Employee {
  id: string;
  username: string;
  name: string;
  role: string;
  display_role: string;
  is_active: boolean;
  created_at: string;
  password_hash?: string;
}

const UserManager: React.FC = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'employee',
    display_role: 'CAJERO 01'
  });

  // Roles disponibles para mostrar
  const displayRoles = [
    'CAJERO 01', 'CAJERO 02', 'CAJERO 03',
    'MESERO 01', 'MESERO 02', 'MESERO 03', 
    'COCINA 01', 'COCINA 02', 'COCINA 03',
    'ADMINISTRADOR', 'SUPERVISOR', 'PERSONAL'
  ];

  // Cargar usuarios
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // No mostrar las contraseñas por seguridad
      const employeesWithoutPasswords = data?.map(emp => {
        const { password_hash, ...empWithoutPassword } = emp;
        return empWithoutPassword;
      }) || [];
      
      setEmployees(employeesWithoutPasswords);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      alert('Error al cargar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Crear usuario
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validaciones
      if (formData.username.length < 3) {
        throw new Error('El username debe tener al menos 3 caracteres');
      }

      if (formData.password.length < 4) {
        throw new Error('La contraseña debe tener al menos 4 caracteres');
      }

      const userData: any = {
        username: formData.username.toLowerCase().trim(),
        name: formData.name.trim(),
        role: formData.role,
        display_role: formData.display_role,
        is_active: true,
        password_hash: formData.password // Guardar la contraseña directamente
      };

      const { error } = await supabase
        .from('employees')
        .insert([userData]);

      if (error) throw error;
      
      alert('✅ Usuario creado exitosamente');
      setShowForm(false);
      setFormData({ 
        username: '', 
        name: '', 
        password: '', 
        role: 'employee', 
        display_role: 'CAJERO 01' 
      });
      setShowPassword(false);
      await loadEmployees();
      
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Eliminar usuario
  const deleteUser = async (id: string, username: string) => {
    if (username === 'admin') {
      alert('❌ No puedes eliminar el usuario admin principal');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar al usuario ${username}?`)) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('✅ Usuario eliminado');
      await loadEmployees();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    if (user?.role === 'admin') {
      loadEmployees();
    }
  }, [user]);

  // Si no es administrador, mostrar acceso denegado
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-sm border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            Solo los administradores pueden acceder a la gestión de usuarios.
          </p>
          <div className="text-sm text-gray-500">
            Tu rol actual: <span className="font-semibold capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                  <p className="text-gray-600 text-sm">Solo para administradores</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
            >
              <Plus size={20} />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          {/* Formulario Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Usuario</h3>
                  <button 
                    onClick={() => {
                      setShowForm(false);
                      setShowPassword(false);
                    }} 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={formLoading}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={createUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Ej: cajero01"
                      required
                      disabled={formLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Sin espacios, en minúsculas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Ej: Juan Pérez"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors pr-10"
                        placeholder="Mínimo 4 caracteres"
                        required
                        disabled={formLoading}
                        minLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={formLoading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mínimo 4 caracteres</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Usuario
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      disabled={formLoading}
                    >
                      <option value="employee">Personal</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      "Administrador" puede crear otros usuarios
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo *
                    </label>
                    <select
                      value={formData.display_role}
                      onChange={(e) => setFormData({...formData, display_role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      required
                      disabled={formLoading}
                    >
                      {displayRoles.map(role => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setShowPassword(false);
                      }}
                      disabled={formLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
                    >
                      <Save size={16} />
                      <span>{formLoading ? 'Creando...' : 'Crear Usuario'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Usuarios */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Usuarios del Sistema</h3>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {employees.length} usuarios
              </span>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando usuarios...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl text-gray-300 mb-3">👥</div>
                <p className="text-gray-600">No hay usuarios registrados</p>
                <p className="text-gray-400 text-sm mt-1">Crea el primer usuario haciendo click en "Nuevo Usuario"</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-red-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 text-lg">{employee.name}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.role === 'admin' 
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {employee.role}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <strong>Usuario:</strong> {employee.username}
                          </div>
                          <div>
                            <strong>Cargo:</strong> {employee.display_role}
                          </div>
                          <div>
                            <strong>Estado:</strong> 
                            <span className={`ml-1 ${employee.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {employee.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <div>
                            <strong>Creado:</strong> {new Date(employee.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {employee.username !== 'admin' && (
                          <button
                            onClick={() => deleteUser(employee.id, employee.username)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
