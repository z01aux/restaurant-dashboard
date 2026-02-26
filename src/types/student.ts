// ============================================
// ARCHIVO: src/types/student.ts
// ============================================

export interface Student {
  id: string;
  full_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  full_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string;
}

// Grados actualizados con los del colegio
export const GRADES = [
  'RED ROOM',
  'YELLOW ROOM', 
  'GREEN ROOM',
  'PRIMERO DE PRIMARIA',
  'SEGUNDO DE PRIMARIA',
  'TERCERO DE PRIMARIA',
  'CUARTO DE PRIMARIA',
  'QUINTO DE PRIMARIA',
  'SEXTO DE PRIMARIA',
  'PRIMERO DE SECUNDARIA',
  'SEGUNDO DE SECUNDARIA',
  'TERCERO DE SECUNDARIA',
  'CUARTO DE SECUNDARIA',
  'QUINTO DE SECUNDARIA'
] as const;

export const SECTIONS = ['A', 'B'] as const;

export type Grade = typeof GRADES[number];
export type Section = typeof SECTIONS[number];