// ============================================
// ARCHIVO: src/components/students/StudentImport.tsx (VERSIÓN FINAL)
// ============================================

import React, { useState, useRef } from 'react';
import { Upload, Download, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  details: string[];
}

// Mapeo de nombres de salón a grado y sección
const gradeMapping: Record<string, { grade: string; section: string }> = {
  // Salas de 3 años
  'RED ROOM A': { grade: 'RED ROOM', section: 'A' },
  'YELLOW ROOM A': { grade: 'YELLOW ROOM', section: 'A' },
  'GREEN ROOM A': { grade: 'GREEN ROOM', section: 'A' },
  
  // Primero de Primaria
  'Primero de Primaria  A': { grade: 'PRIMERO DE PRIMARIA', section: 'A' },
  'Primero de Primaria B': { grade: 'PRIMERO DE PRIMARIA', section: 'B' },
  
  // Segundo de Primaria
  'Segundo de Primaria A': { grade: 'SEGUNDO DE PRIMARIA', section: 'A' },
  
  // Tercero de Primaria
  'Tercero de Primaria A': { grade: 'TERCERO DE PRIMARIA', section: 'A' },
  'Tercero de Primaria B': { grade: 'TERCERO DE PRIMARIA', section: 'B' },
  
  // Cuarto de Primaria
  'Cuarto de Primaria A': { grade: 'CUARTO DE PRIMARIA', section: 'A' },
  'Cuarto de Primaria B': { grade: 'CUARTO DE PRIMARIA', section: 'B' },
  
  // Quinto de Primaria
  'Quinto de Primaria A': { grade: 'QUINTO DE PRIMARIA', section: 'A' },
  'Quinto de Primaria B': { grade: 'QUINTO DE PRIMARIA', section: 'B' },
  
  // Sexto de Primaria
  'Sexto de Primaria A': { grade: 'SEXTO DE PRIMARIA', section: 'A' },
  'Sexto de Primaria B': { grade: 'SEXTO DE PRIMARIA', section: 'B' },
  
  // Primero de Secundaria
  'Primero de Secundaria A': { grade: 'PRIMERO DE SECUNDARIA', section: 'A' },
  'Primero de Secundaria B': { grade: 'PRIMERO DE SECUNDARIA', section: 'B' },
  
  // Segundo de Secundaria
  'Segundo de secundaria A': { grade: 'SEGUNDO DE SECUNDARIA', section: 'A' },
  'Segundo de Secundaria B': { grade: 'SEGUNDO DE SECUNDARIA', section: 'B' },
  
  // Tercero de Secundaria
  'Tercero de Secundaria A': { grade: 'TERCERO DE SECUNDARIA', section: 'A' },
  'Tercero de Secundaria B': { grade: 'TERCERO DE SECUNDARIA', section: 'B' },
  
  // Cuarto de Secundaria
  'Cuarto de Secundaria A': { grade: 'CUARTO DE SECUNDARIA', section: 'A' },
  'Cuarto de Secundaria B': { grade: 'CUARTO DE SECUNDARIA', section: 'B' },
  
  // Quinto de Secundaria
  'Quinto de Secundaria A': { grade: 'QUINTO DE SECUNDARIA', section: 'A' },
  'Quinto de Secundaria B': { grade: 'QUINTO DE SECUNDARIA', section: 'B' }
};

export const StudentImport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processExcelFile = async (file: File) => {
    setLoading(true);
    setResult(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Usar la hoja "0099" que es la que tiene los datos
          const sheetName = workbook.SheetNames.find(name => name === '0099') || workbook.SheetNames[0];
          console.log('📊 Usando hoja:', sheetName);
          
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
          
          await processStudents(rows);
          
        } catch (error) {
          console.error('Error:', error);
          setResult({
            success: 0,
            errors: 1,
            duplicates: 0,
            details: ['Error al procesar el archivo: ' + (error as Error).message]
          });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const processStudents = async (rows: any[][]) => {
    const result: ImportResult = {
      success: 0,
      errors: 0,
      duplicates: 0,
      details: []
    };

    let currentClassroom = '';
    let currentGrade = '';
    let currentSection = '';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      // Buscar línea de Código de Salón (columna 0)
      if (row[0] === 'Código de Salón:') {
        // El código está en columna 3 (índice 3)
        // El nombre del salón está en columna 8 (índice 8) después de "Salón:"
        let classroomName = '';
        
        // Buscar "Salón:" en la fila
        for (let j = 0; j < row.length; j++) {
          if (row[j] === 'Salón:' && row[j + 2]) {
            classroomName = row[j + 2]?.toString().trim() || '';
            break;
          }
        }
        
        if (classroomName && gradeMapping[classroomName]) {
          currentClassroom = classroomName;
          currentGrade = gradeMapping[classroomName].grade;
          currentSection = gradeMapping[classroomName].section;
          result.details.push(`📚 Procesando salón: ${currentClassroom} -> ${currentGrade} "${currentSection}"`);
        } else if (classroomName) {
          result.details.push(`⚠️ Salón no mapeado: "${classroomName}"`);
        }
        continue;
      }

      // Buscar filas de alumnos (deben tener un número en columna 0)
      const firstCol = row[0];
      if (firstCol && !isNaN(Number(firstCol)) && currentGrade && currentSection) {
        // Nombre del alumno está en columna 2 (índice 2)
        const studentName = row[2]?.toString().trim();
        
        // Datos del padre (comienzan en columna 9)
        const fatherName = row[9]?.toString().trim() || '';
        const fatherPhone = row[13]?.toString().trim() || ''; // Celular en columna 13
        
        // Datos de la madre (comienzan en columna 16)
        const motherName = row[16]?.toString().trim() || '';
        const motherPhone = row[19]?.toString().trim() || ''; // Celular en columna 19

        if (!studentName) continue;

        // Determinar apoderado (el que tenga teléfono)
        let guardianName = '';
        let phone = '';

        if (fatherPhone && fatherPhone !== '' && fatherPhone !== '0') {
          guardianName = fatherName;
          phone = fatherPhone;
        } else if (motherPhone && motherPhone !== '' && motherPhone !== '0') {
          guardianName = motherName;
          phone = motherPhone;
        } else {
          guardianName = fatherName || motherName;
          phone = '';
        }

        // Limpiar nombres
        guardianName = guardianName.replace(/^(PADRE|MADRE):\s*/i, '').trim();

        // Verificar duplicado
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('full_name', studentName)
          .eq('grade', currentGrade)
          .eq('section', currentSection)
          .maybeSingle();

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Insertar alumno
        const { error } = await supabase
          .from('students')
          .insert({
            full_name: studentName,
            grade: currentGrade,
            section: currentSection,
            guardian_name: guardianName,
            phone: phone || null
          });

        if (error) {
          result.errors++;
          result.details.push(`❌ Error: ${studentName} - ${error.message}`);
        } else {
          result.success++;
        }
      }
    }

    result.details.unshift(`✅ Procesados: ${result.success} insertados, ${result.duplicates} duplicados, ${result.errors} errores`);
    setResult(result);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Código de Salón:', '', '', '2026001', '', '', 'Salón:', '', 'RED ROOM A'],
      ['', '', 'ALUMNO', '', '', '', '', '', 'PADRE', '', '', '', '', 'Celular', '', '', 'MADRE', '', '', '', 'Celular'],
      ['N°', '', 'Apellidos y nombres', '', '', '', '', '', 'Apellidos y nombres', '', '', '', 'Celular', '', '', 'Apellidos y nombres', '', '', '', 'Celular']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, '0099');
    XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-md"
      >
        <Upload size={20} />
        <span>Importar Alumnos desde Excel</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload size={20} />
                  <h2 className="text-lg font-bold">Importar Alumnos</h2>
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
                  <li>Sube el archivo DIRECTORIO.xls (usará la hoja "0099")</li>
                  <li>Se importarán: nombre del alumno, grado, sección, apoderado y teléfono</li>
                  <li>Se usará como apoderado quien tenga teléfono (padre → madre)</li>
                </ul>
              </div>

              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 text-sm"
                >
                  <Download size={16} />
                  <span>Descargar Plantilla</span>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {loading && (
                <div className="text-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-600">Procesando archivo...</p>
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
                    <div className="max-h-60 overflow-y-auto p-4 bg-gray-50">
                      {result.details.map((detail, index) => (
                        <div key={index} className="text-xs border-b border-gray-200 pb-1 mb-1">
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
