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

export const GRADES = ['1ero', '2do', '3ero', '4to', '5to', '6to'] as const;
export const SECTIONS = ['A', 'B', 'C', 'D', 'E'] as const;

export type Grade = typeof GRADES[number];
export type Section = typeof SECTIONS[number];