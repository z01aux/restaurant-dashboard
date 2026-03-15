// ============================================
// ARCHIVO: src/components/students/StudentManager.tsx
// VERSIÓN PREMIUM - Badges completos siempre visibles
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X, 
  GraduationCap, 
  Users, 
  Phone, 
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { GRADES, SECTIONS, Grade, Section } from '../../types/student';
import { useAuth } from '../../hooks/useAuth';

// Mapa de colores para cada grado
const GRADE_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  'RED ROOM': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-200', light: 'bg-red-50' },
  'YELLOW ROOM': { bg: 'bg-yellow-400', text: 'text-gray-800', border: 'border-yellow-200', light: 'bg-yellow-50' },
  'GREEN ROOM': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-200', light: 'bg-green-50' },
  'PRIMERO DE PRIMARIA': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-200', light: 'bg-blue-50' },
  'SEGUNDO DE PRIMARIA': { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-200', light: 'bg-indigo-50' },
  'TERCERO DE PRIMARIA': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-200', light: 'bg-purple-50' },
  'CUARTO DE PRIMARIA': { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-200', light: 'bg-pink-50' },
  'QUINTO DE PRIMARIA': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-200', light: 'bg-orange-50' },
  'SEXTO DE PRIMARIA': { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-200', light: 'bg-amber-50' },
  'PRIMERO DE SECUNDARIA': { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-200', light: 'bg-cyan-50' },
  'SEGUNDO DE SECUNDARIA': { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-200', light: 'bg-teal-50' },
  'TERCERO DE SECUNDARIA': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-200', light: 'bg-emerald-50' },
  'CUARTO DE SECUNDARIA': { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-200', light: 'bg-violet-50' },
  'QUINTO DE SECUNDARIA': { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-200', light: 'bg-fuchsia-50' },
};

// Badge completo para grado (SIEMPRE VISIBLE)
const GradeBadge: React.FC<{ grade: string; section: string }> = ({ grade, section }) => {
  const colors = GRADE_COLORS[grade] || { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-200', light: 'bg-gray-50' };
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} shadow-sm`}>
      {grade} • {section}
    </span>
  );
};

// Componente Skeleton
const StudentSkeleton = () => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
          <div className="h-5 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="space-y-2 pl-10">
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
      </div>
    </div>
  </div>
);

// Modal de confirmación
const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({ isOpen, studentName, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} />
            <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            ¿Estás seguro de que deseas eliminar al alumno <span className="font-semibold text-gray-900">"{studentName}"</span>? Esta acción no se puede deshacer.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal para formulario de alumno
const StudentFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  student?: any;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
}> = ({ isOpen, onClose, student, onSave, loading }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    grade: GRADES[0] as Grade,
    section: SECTIONS[0] as Section,
    guardian_name: '',
    phone: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name,
        grade: student.grade as Grade,
        section: student.section as Section,
        guardian_name: student.guardian_name,
        phone: student.phone || ''
      });
    } else {
      setFormData({
        full_name: '',
        grade: GRADES[0] as Grade,
        section: SECTIONS[0] as Section,
        guardian_name: '',
        phone: ''
      });
    }
  }, [student]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.guardian_name.trim()) {
      alert('Por favor completa el nombre del alumno y del apoderado');
      return;
    }
    await onSave(formData);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Overlay con blur effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Modal centrado */}
      <div 
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente dinámico */}
        <div className={`bg-gradient-to-r ${student ? 'from-indigo-500 to-purple-600' : 'from-purple-500 to-indigo-600'} p-5 text-white sticky top-0 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                {student ? <Edit size={22} className="text-white" /> : <Plus size={22} className="text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-bold">{student ? 'Editar Alumno' : 'Nuevo Alumno'}</h2>
                <p className="text-xs text-purple-100 mt-0.5">
                  {student ? 'Modifica los datos del alumno' : 'Registra un nuevo alumno en el sistema'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido del formulario */}
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre del alumno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Alumno <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Ej: Juan Pérez García"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Grado y Sección en grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grado <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value as Grade})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                  disabled={loading}
                >
                  {GRADES.map(grade => (
                    <option key={grade} value={grade} className="py-2">
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sección <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value as Section})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                  disabled={loading}
                >
                  {SECTIONS.map(section => (
                    <option key={section} value={section}>Sección "{section}"</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vista previa del badge (completo) */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-2"></p>
              <GradeBadge grade={formData.grade} section={formData.section} />
            </div>

            {/* Apoderado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Apoderado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({...formData, guardian_name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ej: María Pérez García"
                required
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono <span className="text-gray-400">(opcional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: 987654321"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{student ? 'Actualizar' : 'Guardar'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente de estadísticas con badges
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className={`bg-${color}-50 rounded-xl p-4 border border-${color}-200 hover:shadow-md transition-all duration-200`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <div className={`text-${color}-600`}>{icon}</div>
      </div>
      <span className={`text-2xl font-bold text-${color}-600`}>{value}</span>
    </div>
    <p className={`text-sm text-${color}-800 font-medium`}>{label}</p>
  </div>
);

// Componente principal
const StudentManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { students, loading, createStudent, updateStudent, deleteStudent, fetchStudents } = useStudents();
  const { user } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filtrar alumnos
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.phone && student.phone.includes(searchTerm));

      const matchesGrade = gradeFilter === '' || student.grade === gradeFilter;
      const matchesSection = sectionFilter === '' || student.section === sectionFilter;

      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [students, searchTerm, gradeFilter, sectionFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter, sectionFilter]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: students.length,
    withPhone: students.filter(s => s.phone).length,
    grades: [...new Set(students.map(s => s.grade))].length
  }), [students]);

  const handleNewStudent = () => {
    setEditingStudent(null);
    setFormModalOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setFormModalOpen(true);
  };

  const handleSaveStudent = async (formData: any) => {
    setFormLoading(true);
    try {
      let result;
      if (editingStudent) {
        result = await updateStudent(editingStudent.id, formData);
      } else {
        result = await createStudent(formData);
      }

      if (result.success) {
        alert(`✅ Alumno ${editingStudent ? 'actualizado' : 'creado'} exitosamente`);
        setFormModalOpen(false);
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

  const handleDeleteClick = (id: string, name: string) => {
    setStudentToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    
    setFormLoading(true);
    const result = await deleteStudent(studentToDelete.id);
    
    if (result.success) {
      alert('✅ Alumno eliminado correctamente');
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    } else {
      alert('❌ ' + result.error);
    }
    setFormLoading(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGradeFilter('');
    setSectionFilter('');
  };

  const hasActiveFilters = searchTerm !== '' || gradeFilter !== '' || sectionFilter !== '';

  return (
    <>
      {/* Modal de formulario */}
      <StudentFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        onSave={handleSaveStudent}
        loading={formLoading}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        studentName={studentToDelete?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
        loading={formLoading}
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100/50 to-indigo-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header principal */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Alumnos</h1>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center">
                    <Sparkles size={14} className="mr-1 text-purple-500" />
                    {user?.name} · {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleNewStudent}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center space-x-2 hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Nuevo Alumno</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard
              icon={<Users size={20} />}
              label="Total Alumnos"
              value={stats.total}
              color="purple"
            />
            <StatsCard
              icon={<Phone size={20} />}
              label="Con Teléfono"
              value={stats.withPhone}
              color="green"
            />
            <StatsCard
              icon={<GraduationCap size={20} />}
              label="Grados"
              value={stats.grades}
              color="blue"
            />
          </div>

          {/* Filtros */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-sm border border-white/20 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full bg-white/80"
                  placeholder="Buscar por alumno, apoderado o teléfono..."
                />
              </div>
              
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 min-w-[160px]"
              >
                <option value="">Todos los grados</option>
                {GRADES.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>

              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 min-w-[120px]"
              >
                <option value="">Todas las secciones</option>
                {SECTIONS.map(section => (
                  <option key={section} value={section}>Sección "{section}"</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 text-sm text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center justify-center space-x-1 font-medium"
                >
                  <X size={16} />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-purple-600">{filteredStudents.length}</span> alumnos encontrados
              </span>
              {hasActiveFilters && (
                <span className="text-gray-400 text-xs flex items-center">
                  <Filter size={12} className="mr-1" />
                  Filtros activos
                </span>
              )}
            </div>
          </div>

          {/* Lista de Alumnos */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <StudentSkeleton key={i} />
              ))}
            </div>
          ) : paginatedStudents.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-12 shadow-sm border border-white/20 text-center">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {hasActiveFilters 
                  ? 'Intenta con otros términos de búsqueda o limpia los filtros' 
                  : 'Los alumnos aparecerán aquí cuando los registres'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors inline-flex items-center space-x-1"
                >
                  <X size={16} />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedStudents.map((student) => (
                  <div 
                    key={student.id} 
                    className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 group relative"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center border border-purple-200">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2">
                            {student.full_name}
                          </h3>
                          {/* Badge completo siempre visible */}
                          <GradeBadge grade={student.grade} section={student.section} />
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(student.id, student.full_name)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-center text-sm">
                        <Users size={14} className="text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 truncate">
                          {student.guardian_name}
                        </span>
                      </div>
                      
                      {student.phone && (
                        <div className="flex items-center text-sm">
                          <Phone size={14} className="text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white/90 backdrop-blur-lg rounded-xl p-3 border border-white/20">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      const isActive = page === currentPage;
                      
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-purple-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} className="text-gray-600" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentManager;