// ============================================
// ARCHIVO: src/components/students/StudentManager.tsx (CORREGIDO)
// Eliminado RefreshCw que no se usaba
// ============================================

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Save, X, GraduationCap, Users, Phone, User } from 'lucide-react'; // Eliminado RefreshCw
import { useStudents } from '../../hooks/useStudents';
import { GRADES, SECTIONS, Grade, Section } from '../../types/student';
import { useAuth } from '../../hooks/useAuth';
import { StudentImport } from './StudentImport';

const StudentManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    grade: GRADES[0] as Grade,
    section: SECTIONS[0] as Section,
    guardian_name: '',
    phone: ''
  });

  const { students, loading, createStudent, updateStudent, deleteStudent, fetchStudents } = useStudents();
  const { user } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.guardian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.phone && student.phone.includes(searchTerm))
  );

  const handleNewStudent = () => {
    setEditingStudent(null);
    setFormData({
      full_name: '',
      grade: GRADES[0] as Grade,
      section: SECTIONS[0] as Section,
      guardian_name: '',
      phone: ''
    });
    setShowForm(true);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      grade: student.grade as Grade,
      section: student.section as Section,
      guardian_name: student.guardian_name,
      phone: student.phone || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (!formData.full_name.trim() || !formData.guardian_name.trim()) {
        alert('Por favor completa el nombre del alumno y del apoderado');
        return;
      }

      let result;

      if (editingStudent) {
        result = await updateStudent(editingStudent.id, formData);
      } else {
        result = await createStudent(formData);
      }

      if (result.success) {
        alert(`✅ Alumno ${editingStudent ? 'actualizado' : 'creado'} exitosamente`);
        setShowForm(false);
        setEditingStudent(null);
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al alumno "${name}"?`)) {
      const result = await deleteStudent(id);
      if (result.success) {
        alert('✅ Alumno eliminado correctamente');
      } else {
        alert('❌ ' + result.error);
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 text-center">
        <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600">Solo administradores pueden gestionar alumnos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎒 Gestión de Alumnos FullDay</h1>
              <p className="text-gray-600 mt-1">Administra los alumnos para pedidos FullDay</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-64"
                  placeholder="Buscar alumnos..."
                />
              </div>
              
              {/* Botón de importación */}
              <StudentImport />
              
              <button 
                onClick={handleNewStudent}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
              >
                <Plus size={20} />
                <span>Nuevo Alumno</span>
              </button>
            </div>
          </div>

          {/* Formulario Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingStudent ? 'Editar Alumno' : 'Nuevo Alumno'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowForm(false);
                      setEditingStudent(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={formLoading}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Alumno *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: Juan Pérez García"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grado *
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value as Grade})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                        disabled={formLoading}
                      >
                        {GRADES.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sección *
                      </label>
                      <select
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value as Section})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                        disabled={formLoading}
                      >
                        {SECTIONS.map(section => (
                          <option key={section} value={section}>Sección "{section}"</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Apoderado *
                    </label>
                    <input
                      type="text"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({...formData, guardian_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: María Pérez"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: 987654321"
                      disabled={formLoading}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingStudent(null);
                      }}
                      disabled={formLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
                    >
                      <Save size={16} />
                      <span>
                        {formLoading 
                          ? (editingStudent ? 'Actualizando...' : 'Creando...') 
                          : (editingStudent ? 'Actualizar Alumno' : 'Crear Alumno')
                        }
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Alumnos */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando alumnos...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Los alumnos aparecerán aquí cuando los registres'}
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 relative group"
                >
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => handleEditStudent(student)}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-gray-200"
                      title="Editar alumno"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteStudent(student.id, student.full_name)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm border border-gray-200"
                      title="Eliminar alumno"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="pr-16">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <User className="h-5 w-5 text-purple-500 mr-2" />
                        {student.full_name}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <GraduationCap size={16} className="text-purple-500" />
                          <span className="font-medium">Grado:</span>
                          <span>{student.grade} "{student.section}"</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users size={16} className="text-blue-500" />
                          <span className="font-medium">Apoderado:</span>
                          <span>{student.guardian_name}</span>
                        </div>
                        
                        {student.phone && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Phone size={16} className="text-green-500" />
                            <span className="font-medium">Teléfono:</span>
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Estadísticas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{students.length}</div>
                <div className="text-sm text-gray-600">Total Alumnos</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {students.filter(s => s.phone).length}
                </div>
                <div className="text-sm text-gray-600">Con Teléfono</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {[...new Set(students.map(s => s.grade))].length}
                </div>
                <div className="text-sm text-gray-600">Grados</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManager;