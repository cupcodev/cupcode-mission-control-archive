import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRecordedRef = useRef<boolean>(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, display_name, email, role')
                .eq('id', session.user.id)
                .single();
              
              setProfile(profileData);
            } catch (error) {
              console.log('Profile not found or error fetching profile');
              setProfile(null);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session telemetry: Create session record on login
  useEffect(() => {
    const createSessionRecord = async () => {
      if (!user || !session || sessionRecordedRef.current) return;

      // Check if we already recorded this session (prevent duplicates on reload)
      const sessionKey = `session_recorded_${user.id}_${session.access_token.slice(-10)}`;
      if (localStorage.getItem(sessionKey)) {
        sessionRecordedRef.current = true;
        return;
      }

      try {
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            user_agent: navigator.userAgent,
            ip_address: null,
            active: true,
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
          });

        if (!error) {
          localStorage.setItem(sessionKey, 'true');
          sessionRecordedRef.current = true;
        } else {
          console.log('Session telemetry insert failed (non-blocking):', error.message);
        }
      } catch (error) {
        console.log('Session telemetry insert error (non-blocking):', error);
      }
    };

    createSessionRecord();
  }, [user, session]);

  // Session telemetry: Heartbeat to update last_seen every 60 seconds
  useEffect(() => {
    if (!user || !sessionRecordedRef.current) return;

    const updateLastSeen = async () => {
      try {
        const { error } = await supabase
          .from('user_sessions')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.log('Session telemetry update failed (non-blocking):', error.message);
        }
      } catch (error) {
        console.log('Session telemetry update error (non-blocking):', error);
      }
    };

    // Start heartbeat
    heartbeatIntervalRef.current = setInterval(updateLastSeen, 60000); // 60 seconds

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [user, sessionRecordedRef.current]);

  const markSessionInactive = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ active: false })
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.log('Session telemetry logout update error (non-blocking):', error);
    }

    // Clear session tracking
    sessionRecordedRef.current = false;
    const sessionKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`session_recorded_${user.id}_`)
    );
    sessionKeys.forEach(key => localStorage.removeItem(key));
  };

  const signOut = async () => {
    await markSessionInactive();
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/app/overview`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
};