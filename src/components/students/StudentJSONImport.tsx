// ============================================
// ARCHIVO: src/components/students/StudentJSONImport.tsx
// Componente para importar alumnos desde JSON
// ============================================

import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  details: string[];
}

interface StudentJSON {
  full_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
}

export const StudentJSONImport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<StudentJSON[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processJSONFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    setPreview([]);

    try {
      const text = await file.text();
      const students = JSON.parse(text) as StudentJSON[];

      if (!Array.isArray(students)) {
        throw new Error('El archivo debe contener un array de alumnos');
      }

      setPreview(students.slice(0, 5)); // Mostrar vista previa

      const result: ImportResult = {
        success: 0,
        errors: 0,
        duplicates: 0,
        details: []
      };

      for (const student of students) {
        // Validar datos mínimos
        if (!student.full_name || !student.grade || !student.section || !student.guardian_name) {
          result.errors++;
          result.details.push(`❌ Datos incompletos: ${student.full_name || 'Sin nombre'}`);
          continue;
        }

        // Verificar duplicado
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('full_name', student.full_name.trim())
          .eq('grade', student.grade)
          .eq('section', student.section)
          .maybeSingle();

        if (existing) {
          result.duplicates++;
          result.details.push(`🟡 Duplicado: ${student.full_name} (${student.grade} "${student.section}")`);
          continue;
        }

        // Insertar
        const { error } = await supabase
          .from('students')
          .insert({
            full_name: student.full_name.trim(),
            grade: student.grade,
            section: student.section,
            guardian_name: student.guardian_name.trim(),
            phone: student.phone || null
          });

        if (error) {
          result.errors++;
          result.details.push(`❌ Error: ${student.full_name} - ${error.message}`);
        } else {
          result.success++;
        }
      }

      setResult(result);

    } catch (error: any) {
      setResult({
        success: 0,
        errors: 1,
        duplicates: 0,
        details: [`Error: ${error.message}`]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processJSONFile(file);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-md transition-all duration-300"
      >
        <Upload size={20} />
        <span>Importar desde JSON</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload size={20} />
                  <h2 className="text-lg font-bold">Importar Alumnos desde JSON</h2>
                </div>
                <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Instrucciones:</h3>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Usa el conversor HTML para convertir tu Excel a JSON</li>
                  <li>Sube el archivo JSON generado</li>
                  <li>Formato esperado: array de objetos con full_name, grade, section, guardian_name, phone</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo JSON:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {preview.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Vista previa:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-xs">
                    <pre>{JSON.stringify(preview, null, 2)}</pre>
                  </div>
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">Importando alumnos...</p>
                </div>
              )}

              {result && !loading && (
                <div className="border rounded-lg overflow-hidden">
                  <div className={`p-4 ${result.errors > 0 ? 'bg-yellow-50' : 'bg-green-50'} border-b`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {result.errors > 0 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <h3 className="font-semibold">Resultado</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{result.success}</div>
                        <div className="text-xs">Insertados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{result.duplicates}</div>
                        <div className="text-xs">Duplicados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                        <div className="text-xs">Errores</div>
                      </div>
                    </div>
                  </div>
                  
                  {result.details.length > 0 && (
                    <div className="max-h-40 overflow-y-auto p-4 bg-gray-50 text-xs">
                      {result.details.map((detail, index) => (
                        <div key={index} className="border-b border-gray-200 pb-1 mb-1">
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};