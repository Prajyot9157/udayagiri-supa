import { createClient } from '@supabase/supabase-js';

// Dynamic config getter to support direct browser override
export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('MHTCET_SUPABASE_URL');
  const localKey = localStorage.getItem('MHTCET_SUPABASE_ANON_KEY');
  
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const rawUrl = localUrl || envUrl || "https://kwqlrxjvxyxajfhkuajj.supabase.co/rest/v1/";
  const rawKey = localKey || envKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cWxyeGp2eHl4YWpmaGt1YWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzA3NjcsImV4cCI6MjA5NzAwNjc2N30.rN24yvnTZbkqcJZBgDzqpN3Pt_ANhl_R-RyRIPf1Wso";

  const cleanUrl = rawUrl.replace('/rest/v1/', '').replace('/rest/v1', '').trim();
  
  return { 
    url: cleanUrl, 
    key: rawKey.trim(),
    isOverridden: !!(localUrl || localKey),
    source: (localUrl || localKey) ? 'LocalStorage Override' : (envUrl || envKey) ? 'Environment Variables' : 'Default Sandbox'
  };
};

const config = getSupabaseConfig();
export const supabase = createClient(config.url, config.key);

// Dynamic client rebuilder helper
export const rebuildSupabaseClient = (customUrl: string, customKey: string) => {
  localStorage.setItem('MHTCET_SUPABASE_URL', customUrl);
  localStorage.setItem('MHTCET_SUPABASE_ANON_KEY', customKey);
  window.location.reload();
};

export const clearSupabaseOverrides = () => {
  localStorage.removeItem('MHTCET_SUPABASE_URL');
  localStorage.removeItem('MHTCET_SUPABASE_ANON_KEY');
  window.location.reload();
};

