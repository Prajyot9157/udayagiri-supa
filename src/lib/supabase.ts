import { createClient } from '@supabase/supabase-js';

// Get these from env or directly use the provided placeholders
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://kwqlrxjvxyxajfhkuajj.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cWxyeGp2eHl4YWpmaGt1YWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzA3NjcsImV4cCI6MjA5NzAwNjc2N30.rN24yvnTZbkqcJZBgDzqpN3Pt_ANhl_R-RyRIPf1Wso";

// In the instructions to generate placeholders, they provided literal string URL and key it seems.
// I will strip the rest/v1 from the URL as supabase-js needs the project root URL, NOT the REST root URL, normally.
const cleanUrl = SUPABASE_URL.replace('/rest/v1/', '').replace('/rest/v1', '');

export const supabase = createClient(cleanUrl, SUPABASE_ANON_KEY);
