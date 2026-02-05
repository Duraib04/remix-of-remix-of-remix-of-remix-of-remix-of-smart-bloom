 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { Bell, Check, CloudRain, AlertTriangle, Info, Droplets, Loader2 } from "lucide-react";
 import { useNotifications } from "@/hooks/useNotifications";
 import { cn } from "@/lib/utils";
 import { formatDistanceToNow } from "date-fns";
 
 const typeIcons: Record<string, React.ReactNode> = {
   rain: <CloudRain className="h-4 w-4 text-blue-500" />,
   warning: <AlertTriangle className="h-4 w-4 text-warning" />,
   info: <Info className="h-4 w-4 text-primary" />,
   irrigation: <Droplets className="h-4 w-4 text-success" />,
 };
 
 export function NotificationCenter() {
   const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
   const [isOpen, setIsOpen] = useState(false);
 
   const formatTime = (dateString: string) => {
     try {
       return formatDistanceToNow(new Date(dateString), { addSuffix: true });
     } catch {
       return "Just now";
     }
   };
 
   return (
     <Popover open={isOpen} onOpenChange={setIsOpen}>
       <PopoverTrigger asChild>
         <Button variant="ghost" size="icon" className="relative">
           <Bell className="h-5 w-5" />
           {unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
               {unreadCount > 9 ? "9+" : unreadCount}
             </span>
           )}
         </Button>
       </PopoverTrigger>
       <PopoverContent className="w-80 p-0" align="end">
         <div className="flex items-center justify-between p-4 border-b">
           <h4 className="font-semibold">Notifications</h4>
           {unreadCount > 0 && (
             <Button
               variant="ghost"
               size="sm"
               onClick={markAllAsRead}
               className="text-xs"
             >
               <Check className="h-3 w-3 mr-1" />
               Mark all read
             </Button>
           )}
         </div>
 
         <ScrollArea className="h-[300px]">
           {isLoading ? (
             <div className="flex items-center justify-center py-8">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
             </div>
           ) : notifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
               <Bell className="h-8 w-8 mb-2 opacity-50" />
               <p className="text-sm">No notifications yet</p>
             </div>
           ) : (
             <div className="divide-y">
               {notifications.map((notification) => (
                 <button
                   key={notification.id}
                   onClick={() => !notification.read && markAsRead(notification.id)}
                   className={cn(
                     "w-full p-4 text-left transition-colors hover:bg-muted/50",
                     !notification.read && "bg-primary/5"
                   )}
                 >
                   <div className="flex gap-3">
                     <div className="flex-shrink-0 mt-0.5">
                       {typeIcons[notification.type] || typeIcons.info}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="font-medium text-sm truncate">
                           {notification.title}
                         </p>
                         {!notification.read && (
                           <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full bg-primary" />
                         )}
                       </div>
                       <p className="text-sm text-muted-foreground line-clamp-2">
                         {notification.message}
                       </p>
                       <p className="text-xs text-muted-foreground mt-1">
                         {formatTime(notification.created_at)}
                       </p>
                     </div>
                   </div>
                 </button>
               ))}
             </div>
           )}
         </ScrollArea>
       </PopoverContent>
     </Popover>
   );
 }