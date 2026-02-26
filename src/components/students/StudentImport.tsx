// ============================================
// ARCHIVO: src/components/students/StudentImport.tsx (VERSIÓN DE DIAGNÓSTICO CORREGIDA)
// ============================================

import React, { useState, useRef } from 'react';
import { Upload, Download, X, Loader } from 'lucide-react'; // Solo los que realmente usamos
import * as XLSX from 'xlsx';

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  details: string[];
}

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
          
          // Leer el archivo
          const workbook = XLSX.read(data, { type: 'array' });
          
          console.log('📑 Hojas encontradas:', workbook.SheetNames);
          
          // Crear resultado temporal para diagnóstico
          const diagnosticResult: ImportResult = {
            success: 0,
            errors: 0,
            duplicates: 0,
            details: [`📑 Hojas encontradas: ${workbook.SheetNames.join(', ')}`]
          };

          // Procesar CADA hoja para ver su contenido
          for (const sheetName of workbook.SheetNames) {
            diagnosticResult.details.push(`\n========== HOJA: ${sheetName} ==========`);
            
            const worksheet = workbook.Sheets[sheetName];
            
            // Convertir a JSON para ver las primeras filas
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: ''
            }) as any[][];
            
            diagnosticResult.details.push(`Total filas: ${jsonData.length}`);
            diagnosticResult.details.push(`Primeras 15 filas:`);
            
            // Mostrar las primeras 15 filas
            for (let i = 0; i < Math.min(15, jsonData.length); i++) {
              const row = jsonData[i];
              if (row && row.length > 0) {
                // Mostrar hasta 7 columnas
                const rowPreview = row.slice(0, 7).map(cell => {
                  if (cell === null || cell === undefined) return 'null';
                  if (typeof cell === 'string' && cell.trim() === '') return 'vacío';
                  return cell.toString().substring(0, 25);
                }).join(' | ');
                diagnosticResult.details.push(`Fila ${i + 1}: ${rowPreview}`);
              } else {
                diagnosticResult.details.push(`Fila ${i + 1}: [vacía]`);
              }
            }
            
            // Buscar "Código de Salón:" en todas las filas
            diagnosticResult.details.push(`\n🔍 Buscando "Código de Salón:"...`);
            let encontrados = 0;
            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (row && row[0] === 'Código de Salón:') {
                encontrados++;
                diagnosticResult.details.push(`✅ Encontrado en fila ${i + 1}:`);
                diagnosticResult.details.push(`  Columna 0: "${row[0]}"`);
                diagnosticResult.details.push(`  Columna 2: "${row[2] || 'vacío'}"`);
                diagnosticResult.details.push(`  Columna 4: "${row[4] || 'vacío'}"`);
              }
            }
            
            if (encontrados === 0) {
              diagnosticResult.details.push(`❌ No se encontró "Código de Salón:" en esta hoja`);
              
              // Buscar palabras similares
              diagnosticResult.details.push(`\n🔍 Buscando palabras similares...`);
              for (let i = 0; i < Math.min(30, jsonData.length); i++) {
                const row = jsonData[i];
                if (row) {
                  for (let j = 0; j < Math.min(5, row.length); j++) {
                    const cell = row[j];
                    if (cell && typeof cell === 'string' && 
                        (cell.includes('Código') || cell.includes('Salón') || cell.includes('CODIGO'))) {
                      diagnosticResult.details.push(`✅ Encontrado "${cell}" en fila ${i + 1}, columna ${j + 1}`);
                    }
                  }
                }
              }
            }
          }

          setResult(diagnosticResult);
          
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
                <h3 className="text-sm font-semibold text-blue-800 mb-2">🔍 MODO DIAGNÓSTICO</h3>
                <p className="text-xs text-blue-700">
                  Esta versión solo muestra el contenido del archivo para ver qué estructura tiene.
                  Selecciona tu archivo DIRECTORIO.xls y verás qué filas encuentra.
                </p>
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
                  <p className="text-gray-600">Procesando archivo...</p>
                </div>
              )}

              {/* Resultados */}
              {result && !loading && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-blue-50 border-b">
                    <h3 className="font-semibold text-gray-900 mb-2">📊 DIAGNÓSTICO DEL ARCHIVO</h3>
                  </div>
                  
                  {/* Detalles */}
                  {result.details.length > 0 && (
                    <div className="max-h-96 overflow-y-auto p-4 bg-gray-50">
                      <div className="space-y-1 font-mono text-xs">
                        {result.details.map((detail, index) => {
                          // Determinar color según el contenido
                          let color = 'text-gray-700';
                          if (detail.includes('✅')) color = 'text-green-600';
                          if (detail.includes('❌')) color = 'text-red-600';
                          if (detail.includes('🔍')) color = 'text-blue-600';
                          if (detail.includes('==========')) color = 'text-purple-600 font-bold';
                          if (detail.includes('Fila')) color = 'text-gray-600';
                          
                          return (
                            <div key={index} className={`${color} border-b border-gray-200 pb-1 last:border-0 whitespace-pre-wrap font-mono`}>
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
