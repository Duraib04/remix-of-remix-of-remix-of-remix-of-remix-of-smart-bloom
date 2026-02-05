 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
 
 interface Farm {
   id: string;
   name: string;
   latitude: number;
   longitude: number;
   address: string | null;
  soil_type: string | null;
  user_id: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export function useFarm() {
  const { user } = useAuth();
   const [farm, setFarm] = useState<Farm | null>(null);
   const [farms, setFarms] = useState<Farm[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Fetch all farms
   const fetchFarms = useCallback(async () => {
     try {
       const { data, error: fetchError } = await supabase
         .from("farms")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (fetchError) throw fetchError;
       setFarms(data || []);
       
       // Set first farm as active if none selected
       if (data && data.length > 0 && !farm) {
         setFarm(data[0]);
       }
     } catch (err) {
       console.error("Error fetching farms:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch farms");
     } finally {
       setIsLoading(false);
     }
   }, [farm]);
 
   // Create a new farm
   const createFarm = useCallback(async (
     name: string,
     latitude: number,
     longitude: number,
    address?: string,
    soilType?: string
   ) => {
     try {
       setIsLoading(true);
       const { data, error: insertError } = await supabase
         .from("farms")
        .insert({ 
          name, 
          latitude, 
          longitude, 
          address,
          soil_type: soilType,
          user_id: user?.id 
        })
         .select()
         .single();
 
       if (insertError) throw insertError;
       
       setFarm(data);
       setFarms(prev => [data, ...prev]);
       return data;
     } catch (err) {
       console.error("Error creating farm:", err);
       setError(err instanceof Error ? err.message : "Failed to create farm");
       throw err;
     } finally {
       setIsLoading(false);
     }
  }, [user]);
 
   // Update farm location
   const updateFarmLocation = useCallback(async (
     farmId: string,
     latitude: number,
     longitude: number,
    address?: string,
    soilType?: string
   ) => {
     try {
      const updateData: Record<string, unknown> = { latitude, longitude };
      if (address !== undefined) updateData.address = address;
      if (soilType !== undefined) updateData.soil_type = soilType;
      
       const { data, error: updateError } = await supabase
         .from("farms")
        .update(updateData)
         .eq("id", farmId)
         .select()
         .single();
 
       if (updateError) throw updateError;
       
       setFarm(data);
       setFarms(prev => prev.map(f => f.id === farmId ? data : f));
       return data;
     } catch (err) {
       console.error("Error updating farm:", err);
       setError(err instanceof Error ? err.message : "Failed to update farm");
       throw err;
     }
   }, []);
 
  // Update soil type only
  const updateSoilType = useCallback(async (farmId: string, soilType: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from("farms")
        .update({ soil_type: soilType })
        .eq("id", farmId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setFarm(data);
      setFarms(prev => prev.map(f => f.id === farmId ? data : f));
      return data;
    } catch (err) {
      console.error("Error updating soil type:", err);
      throw err;
    }
  }, []);

   // Select active farm
   const selectFarm = useCallback((farmId: string) => {
     const selected = farms.find(f => f.id === farmId);
     if (selected) setFarm(selected);
   }, [farms]);
 
   useEffect(() => {
     fetchFarms();
   }, []);
 
   return {
     farm,
     farms,
     isLoading,
     error,
     createFarm,
     updateFarmLocation,
    updateSoilType,
     selectFarm,
     refetch: fetchFarms,
   };
 }