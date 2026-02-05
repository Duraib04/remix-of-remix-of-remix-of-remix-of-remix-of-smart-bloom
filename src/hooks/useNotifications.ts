 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 
 interface Notification {
   id: string;
   user_id: string;
   title: string;
   message: string;
   type: string;
   read: boolean;
   created_at: string;
 }
 
 export function useNotifications() {
   const { user } = useAuth();
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchNotifications = useCallback(async () => {
     if (!user) {
       setNotifications([]);
       setUnreadCount(0);
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from("notifications")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(20);
 
       if (!error && data) {
         setNotifications(data as Notification[]);
         setUnreadCount((data as Notification[]).filter(n => !n.read).length);
       }
     } catch (err) {
       console.error("Error fetching notifications:", err);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchNotifications();
   }, [fetchNotifications]);
 
   // Real-time subscription
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel('notifications-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'notifications',
           filter: `user_id=eq.${user.id}`,
         },
         () => {
           fetchNotifications();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user, fetchNotifications]);
 
   const markAsRead = useCallback(async (notificationId: string) => {
     if (!user) return;
 
     const { error } = await supabase
       .from("notifications")
       .update({ read: true })
       .eq("id", notificationId)
       .eq("user_id", user.id);
 
     if (!error) {
       setNotifications(prev =>
         prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
       );
       setUnreadCount(prev => Math.max(0, prev - 1));
     }
   }, [user]);
 
   const markAllAsRead = useCallback(async () => {
     if (!user) return;
 
     const { error } = await supabase
       .from("notifications")
       .update({ read: true })
       .eq("user_id", user.id)
       .eq("read", false);
 
     if (!error) {
       setNotifications(prev => prev.map(n => ({ ...n, read: true })));
       setUnreadCount(0);
     }
   }, [user]);
 
   const createNotification = useCallback(async (
     title: string,
     message: string,
     type: string = 'info'
   ) => {
     if (!user) return;
 
     await supabase
       .from("notifications")
       .insert({
         user_id: user.id,
         title,
         message,
         type,
       });
   }, [user]);
 
   return {
     notifications,
     unreadCount,
     isLoading,
     markAsRead,
     markAllAsRead,
     createNotification,
     refetch: fetchNotifications,
   };
 }