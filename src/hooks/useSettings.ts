 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 
 interface UserSettings {
   id: string;
   user_id: string;
   notification_enabled: boolean;
   rain_alert_threshold: number;
   temperature_unit: string;
   language: string;
   created_at: string;
   updated_at: string;
 }
 
 const defaultSettings: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
   notification_enabled: true,
   rain_alert_threshold: 60,
   temperature_unit: 'celsius',
   language: 'en',
 };
 
 export function useSettings() {
   const { user } = useAuth();
   const [settings, setSettings] = useState<UserSettings | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchSettings = useCallback(async () => {
     if (!user) {
       setSettings(null);
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from("user_settings")
         .select("*")
         .eq("user_id", user.id)
         .single();
 
       if (error && error.code === 'PGRST116') {
         // No settings found, create default settings
         const { data: newSettings, error: insertError } = await supabase
           .from("user_settings")
           .insert({ user_id: user.id, ...defaultSettings })
           .select()
           .single();
 
         if (!insertError && newSettings) {
           setSettings(newSettings as UserSettings);
         }
       } else if (!error && data) {
         setSettings(data as UserSettings);
       }
     } catch (err) {
       console.error("Error fetching settings:", err);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchSettings();
   }, [fetchSettings]);
 
   const updateSettings = useCallback(async (updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
     if (!user || !settings) return { error: new Error("Not authenticated") };
 
     try {
       const { data, error } = await supabase
         .from("user_settings")
         .update(updates)
         .eq("user_id", user.id)
         .select()
         .single();
 
       if (!error && data) {
         setSettings(data as UserSettings);
       }
       return { data, error };
     } catch (err) {
       return { error: err as Error };
     }
   }, [user, settings]);
 
   return {
     settings,
     isLoading,
     updateSettings,
     refetch: fetchSettings,
   };
 }