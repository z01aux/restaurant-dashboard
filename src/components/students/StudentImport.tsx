// ============================================
// ARCHIVO: src/components/students/StudentImport.tsx
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
  // Salas de 3 años (RED ROOM, YELLOW ROOM, GREEN ROOM)
  'RED ROOM A': { grade: 'RED ROOM', section: 'A' },
  'YELLOW ROOM A': { grade: 'YELLOW ROOM', section: 'A' },
  'GREEN ROOM A': { grade: 'GREEN ROOM', section: 'A' },
  
  // Primero de Primaria
  'Primero de Primaria A': { grade: 'PRIMERO DE PRIMARIA', section: 'A' },
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
  'Segundo de Secundaria A': { grade: 'SEGUNDO DE SECUNDARIA', section: 'A' },
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

  // Función para procesar el archivo Excel
  const processExcelFile = async (file: File) => {
    console.log('📂 Archivo seleccionado:', file.name, 'tamaño:', file.size);
    setLoading(true);
    setResult(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          console.log('📄 Archivo leído correctamente');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // Leer el archivo con opciones para formato .xls
          const workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true, // Para fechas
            cellNF: false,
            cellText: false
          });
          
          console.log('📑 Hojas encontradas:', workbook.SheetNames);
          
          // Usar la primera hoja
          const sheetName = workbook.SheetNames[0];
          console.log('📊 Usando hoja:', sheetName);
          
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir a JSON con encabezados
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '' // Valor por defecto para celdas vacías
          });
          
          console.log('📝 Total de filas:', jsonData.length);
          console.log('📝 Primeras 5 filas:', jsonData.slice(0, 5));
          
          // Procesar los datos
          await processStudents(jsonData as any[][]);
          
        } catch (error) {
          console.error('❌ Error procesando Excel:', error);
          setResult({
            success: 0,
            errors: 1,
            duplicates: 0,
            details: ['Error al procesar el archivo Excel: ' + (error as Error).message]
          });
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = (error) => {
        console.error('❌ Error leyendo archivo:', error);
        setResult({
          success: 0,
          errors: 1,
          duplicates: 0,
          details: ['Error al leer el archivo']
        });
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('❌ Error leyendo archivo:', error);
      setLoading(false);
    }
  };

  // Función para procesar los alumnos
  const processStudents = async (rows: any[][]) => {
    console.log('🔄 Procesando alumnos...');
    
    const result: ImportResult = {
      success: 0,
      errors: 0,
      duplicates: 0,
      details: []
    };

    let currentClassroom = '';
    let currentGrade = '';
    let currentSection = '';

    // Recorrer cada fila
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row || !Array.isArray(row)) continue;
      
      // Limpiar valores undefined
      const cleanRow = row.map(cell => cell || '');
      
      // Buscar líneas de "Código de Salón:"
      if (cleanRow[0] === 'Código de Salón:' && cleanRow[2]) {
        const classroomName = cleanRow[4]; // El nombre del salón está en la columna 4
        console.log(`🏫 Encontrado salón en fila ${i + 1}:`, classroomName);
        
        if (classroomName && gradeMapping[classroomName]) {
          currentClassroom = classroomName;
          currentGrade = gradeMapping[classroomName].grade;
          currentSection = gradeMapping[classroomName].section;
          result.details.push(`📚 Procesando salón: ${currentClassroom} -> ${currentGrade} "${currentSection}"`);
          console.log(`✅ Salón mapeado: ${currentClassroom} -> ${currentGrade} "${currentSection}"`);
        } else {
          console.warn(`⚠️ Salón no mapeado: ${classroomName}`);
          result.details.push(`⚠️ Salón no mapeado: ${classroomName}`);
        }
        continue;
      }

      // Buscar filas de alumnos (deben tener un número en la primera columna)
      const firstCol = cleanRow[0];
      if (firstCol && !isNaN(Number(firstCol)) && currentGrade && currentSection) {
        const studentName = cleanRow[1]; // Nombre del alumno
        const fatherName = cleanRow[3];   // Nombre del padre
        const fatherPhone = cleanRow[4];  // Celular del padre
        const motherName = cleanRow[5];   // Nombre de la madre
        const motherPhone = cleanRow[6];  // Celular de la madre

        if (!studentName || studentName === '') continue;

        console.log(`👤 Procesando alumno: ${studentName}`);

        // Determinar apoderado (el que tenga teléfono)
        let guardianName = '';
        let phone = '';

        if (fatherPhone && fatherPhone !== '' && fatherPhone !== 0) {
          guardianName = fatherName || '';
          phone = fatherPhone.toString().trim();
          console.log(`  📞 Usando padre: ${guardianName} - ${phone}`);
        } else if (motherPhone && motherPhone !== '' && motherPhone !== 0) {
          guardianName = motherName || '';
          phone = motherPhone.toString().trim();
          console.log(`  📞 Usando madre: ${guardianName} - ${phone}`);
        } else {
          guardianName = fatherName || motherName || '';
          phone = '';
          console.log(`  ⚠️ Sin teléfono, apoderado: ${guardianName}`);
          result.details.push(`⚠️ Alumno sin teléfono: ${studentName}`);
        }

        // Limpiar el nombre del apoderado
        guardianName = guardianName.replace(/^(PADRE|MADRE):\s*/i, '').trim();

        // Verificar si el alumno ya existe
        const { data: existing, error: checkError } = await supabase
          .from('students')
          .select('id')
          .eq('full_name', studentName.trim())
          .eq('grade', currentGrade)
          .eq('section', currentSection)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error verificando duplicado:', checkError);
        }

        if (existing) {
          result.duplicates++;
          result.details.push(`🟡 Duplicado: ${studentName} ya existe en ${currentGrade} "${currentSection}"`);
          console.log(`🟡 Alumno duplicado: ${studentName}`);
          continue;
        }

        // Insertar nuevo alumno
        console.log(`💾 Insertando alumno: ${studentName}`);
        
        const { error } = await supabase
          .from('students')
          .insert({
            full_name: studentName.trim(),
            grade: currentGrade,
            section: currentSection,
            guardian_name: guardianName,
            phone: phone || null
          });

        if (error) {
          console.error('❌ Error insertando alumno:', error);
          result.errors++;
          result.details.push(`❌ Error insertando ${studentName}: ${error.message}`);
        } else {
          result.success++;
          result.details.push(`✅ Insertado: ${studentName} (${currentGrade} "${currentSection}") - Apoderado: ${guardianName}`);
          console.log(`✅ Alumno insertado correctamente`);
        }
      }
    }

    console.log('📊 Resultado final:', result);
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
      ['Código de Salón:', '', '2026001', '', 'RED ROOM A'],
      ['ALUMNO', '', '', 'PADRE', '', 'MADRE', ''],
      ['N°', 'Apellidos y nombres', 'DNI', 'Apellidos y nombres', 'Celular', 'Apellidos y nombres', 'Celular'],
      ['1', 'Ejemplo ALUMNO, Ejemplo', '12345678', 'Ejemplo PADRE, Ejemplo', '987654321', 'Ejemplo MADRE, Ejemplo', '987654322']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Hoja1');
    XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
  };

  return (
    <>
      {/* Botón para abrir el modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-md transition-all duration-300"
      >
        <Upload size={20} />
        <span>Importar Alumnos desde Excel</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload size={20} />
                  <h2 className="text-lg font-bold">Importar Alumnos desde Excel</h2>
                </div>
                <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Instrucciones:</h3>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Sube el archivo DIRECTORIO.xls que me enviaste</li>
                  <li>El script usará automáticamente la hoja "Hoja1"</li>
                  <li>Los nombres de salón deben coincidir con: RED ROOM A, YELLOW ROOM A, GREEN ROOM A, Primero de Primaria A, etc.</li>
                  <li>Se usará como apoderado la persona que tenga teléfono (prioridad al padre, luego madre)</li>
                  <li>Los alumnos duplicados (mismo nombre, grado y sección) serán omitidos</li>
                </ul>
              </div>

              {/* Botón descargar plantilla */}
              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors text-sm"
                >
                  <Download size={16} />
                  <span>Descargar Plantilla de Ejemplo</span>
                </button>
              </div>

              {/* Selector de archivo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo Excel (.xls o .xlsx):
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Estado de carga */}
              {loading && (
                <div className="text-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-600">Procesando archivo y subiendo alumnos...</p>
                  <p className="text-xs text-gray-400 mt-2">Revisa la consola del navegador para ver el progreso (F12)</p>
                </div>
              )}

              {/* Resultados */}
              {result && !loading && (
                <div className="border rounded-lg overflow-hidden">
                  <div className={`p-4 ${result.errors > 0 ? 'bg-yellow-50' : 'bg-green-50'} border-b`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {result.errors > 0 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <h3 className="font-semibold text-gray-900">Resultado de la Importación</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{result.success}</div>
                        <div className="text-xs text-gray-600">Insertados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{result.duplicates}</div>
                        <div className="text-xs text-gray-600">Duplicados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                        <div className="text-xs text-gray-600">Errores</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detalles */}
                  {result.details.length > 0 && (
                    <div className="max-h-60 overflow-y-auto p-4 bg-gray-50">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Detalles:</h4>
                      <div className="space-y-1">
                        {result.details.map((detail, index) => {
                          let color = 'text-gray-600';
                          if (detail.startsWith('✅')) color = 'text-green-600';
                          if (detail.startsWith('🟡')) color = 'text-yellow-600';
                          if (detail.startsWith('❌')) color = 'text-red-600';
                          if (detail.startsWith('⚠️')) color = 'text-orange-600';
                          if (detail.startsWith('📚')) color = 'text-purple-600';
                          
                          return (
                            <div key={index} className={`text-xs ${color} border-b border-gray-200 pb-1 last:border-0`}>
                              {detail}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
