// ============================================
// ARCHIVO: src/hooks/useStudents.ts
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Student, StudentFormData } from '../types/student';

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStudents = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,guardian_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('full_name', { ascending: true })
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching students:', error);
    }
  }, []);

  const createStudent = useCallback(async (studentData: StudentFormData) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          full_name: studentData.full_name.trim(),
          grade: studentData.grade,
          section: studentData.section,
          guardian_name: studentData.guardian_name.trim(),
          phone: studentData.phone?.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateStudent = useCallback(async (id: string, updates: Partial<StudentFormData>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          full_name: updates.full_name?.trim(),
          grade: updates.grade,
          section: updates.section,
          guardian_name: updates.guardian_name?.trim(),
          phone: updates.phone?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(s => s.id === id ? data : s));
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.filter(s => s.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const getStudentById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    searchResults,
    fetchStudents,
    searchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentById
  };
};