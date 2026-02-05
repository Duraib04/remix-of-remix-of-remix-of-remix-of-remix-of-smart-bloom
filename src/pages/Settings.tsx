 import { useNavigate } from "react-router-dom";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Slider } from "@/components/ui/slider";
 import { ArrowLeft, Bell, Thermometer, Globe, Loader2 } from "lucide-react";
 import { useSettings } from "@/hooks/useSettings";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 const Settings = () => {
   const navigate = useNavigate();
   const { user, signOut } = useAuth();
   const { settings, isLoading, updateSettings } = useSettings();
   const { toast } = useToast();
   const { language, setLanguage, t } = useLanguage();
 
   if (!user) {
     navigate("/auth");
     return null;
   }
 
   const handleNotificationToggle = async (enabled: boolean) => {
     const { error } = await updateSettings({ notification_enabled: enabled });
     if (!error) {
       toast({
         title: "Settings updated",
         description: `Notifications ${enabled ? "enabled" : "disabled"}`,
       });
     }
   };
 
   const handleThresholdChange = async (value: number[]) => {
     await updateSettings({ rain_alert_threshold: value[0] });
   };
 
   const handleUnitChange = async (unit: string) => {
     const { error } = await updateSettings({ temperature_unit: unit });
     if (!error) {
       toast({
         title: "Settings updated",
         description: `Temperature unit set to ${unit}`,
       });
     }
   };
 
   const handleLanguageChange = async (lang: string) => {
     setLanguage(lang as "en" | "ta" | "hi");
     await updateSettings({ language: lang });
     toast({
       title: "Language updated",
       description: "Language preference saved",
     });
   };
 
   const handleSignOut = async () => {
     await signOut();
     navigate("/auth");
   };
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-border/50">
         <div className="container flex h-16 items-center px-4 lg:px-8">
           <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <h1 className="text-lg font-semibold ml-2">Settings</h1>
         </div>
       </header>
 
       <main className="container px-4 lg:px-8 py-6 space-y-6 max-w-2xl mx-auto">
         {/* Account Info */}
         <Card>
           <CardHeader>
             <CardTitle>Account</CardTitle>
             <CardDescription>Manage your account settings</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">{user.email}</p>
                 <p className="text-sm text-muted-foreground">Signed in</p>
               </div>
               <Button variant="outline" onClick={handleSignOut}>
                 Sign Out
               </Button>
             </div>
           </CardContent>
         </Card>
 
         {/* Notifications */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Bell className="h-5 w-5" />
               Notifications
             </CardTitle>
             <CardDescription>Configure notification preferences</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="flex items-center justify-between">
               <div>
                 <Label>Enable Notifications</Label>
                 <p className="text-sm text-muted-foreground">
                   Receive alerts for rain, irrigation, and system events
                 </p>
               </div>
               <Switch
                 checked={settings?.notification_enabled ?? true}
                 onCheckedChange={handleNotificationToggle}
               />
             </div>
 
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <Label>Rain Alert Threshold</Label>
                 <span className="text-sm font-medium">
                   {settings?.rain_alert_threshold ?? 60}%
                 </span>
               </div>
               <Slider
                 value={[settings?.rain_alert_threshold ?? 60]}
                 onValueCommit={handleThresholdChange}
                 min={20}
                 max={90}
                 step={5}
                 className="w-full"
               />
               <p className="text-sm text-muted-foreground">
                 Get notified when rain probability exceeds this threshold
               </p>
             </div>
           </CardContent>
         </Card>
 
         {/* Preferences */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Thermometer className="h-5 w-5" />
               Preferences
             </CardTitle>
             <CardDescription>Customize display settings</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="flex items-center justify-between">
               <div>
                 <Label>Temperature Unit</Label>
                 <p className="text-sm text-muted-foreground">
                   Choose Celsius or Fahrenheit
                 </p>
               </div>
               <Select
                 value={settings?.temperature_unit ?? 'celsius'}
                 onValueChange={handleUnitChange}
               >
                 <SelectTrigger className="w-32">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="celsius">Celsius</SelectItem>
                   <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </CardContent>
         </Card>
 
         {/* Language */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Globe className="h-5 w-5" />
               {t.language}
             </CardTitle>
             <CardDescription>Choose your preferred language</CardDescription>
           </CardHeader>
           <CardContent>
             <Select
               value={language}
               onValueChange={handleLanguageChange}
             >
               <SelectTrigger className="w-full">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="en">English</SelectItem>
                 <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                 <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
               </SelectContent>
             </Select>
           </CardContent>
         </Card>
       </main>
     </div>
   );
 };
 
 export default Settings;