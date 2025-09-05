import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useApprovalCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    const fetchApprovalCount = async () => {
      try {
        const { data, error } = await (supabase as any)
          .schema('mc')
          .from('tasks')
          .select('id')
          .eq('type', 'approval')
          .in('status', ['open', 'in_progress']);

        if (error) throw error;
        setCount(data?.length || 0);
      } catch (error) {
        console.error('Erro ao buscar contagem de aprovações:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalCount();

    // Subscribe to changes
    const subscription = (supabase as any)
      .channel('approval_count_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'mc',
        table: 'tasks',
        filter: 'type=eq.approval'
      }, fetchApprovalCount)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { count, loading };
};