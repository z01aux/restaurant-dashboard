// ============================================
// ARCHIVO: src/hooks/useRealtimeSubscription.ts
// ============================================

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionProps<T> {
  table: string;
  onInsert?: (newRecord: T) => void;
  onUpdate?: (updatedRecord: T) => void;
  onDelete?: (deletedId: string) => void;
  enabled?: boolean;
}

export const useRealtimeSubscription = <T extends { id: string }>({
  table,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseRealtimeSubscriptionProps<T>) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log(`🔌 Conectando a Realtime para tabla: ${table}`);

    const channel = supabase
      .channel(`${table}-changes-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`🟢 INSERT en ${table}:`, payload.new);
          if (onInsert) {
            onInsert(payload.new as T);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`🟡 UPDATE en ${table}:`, payload.new);
          if (onUpdate) {
            onUpdate(payload.new as T);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`🔴 DELETE en ${table}:`, payload.old);
          if (onDelete) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Estado de suscripción ${table}:`, status);
      });

    channelRef.current = channel;

    return () => {
      console.log(`🔌 Desconectando Realtime para tabla: ${table}`);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [table, onInsert, onUpdate, onDelete, enabled]);
};
