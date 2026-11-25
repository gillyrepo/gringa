import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabase';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error('Erro ao fazer login: ' + error.message);
      return false;
    }

    setIsAuthenticated(true);
    toast.success('Login realizado com sucesso!');
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loading, signIn, signOut };
}
