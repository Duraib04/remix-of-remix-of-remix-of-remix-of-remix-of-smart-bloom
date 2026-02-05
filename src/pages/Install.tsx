 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { ArrowLeft, Download, Smartphone, CheckCircle, Share, Plus, MoreVertical } from "lucide-react";
 
 interface BeforeInstallPromptEvent extends Event {
   prompt: () => Promise<void>;
   userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
 }
 
 const Install = () => {
   const navigate = useNavigate();
   const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
   const [isInstalled, setIsInstalled] = useState(false);
   const [isIOS, setIsIOS] = useState(false);
   const [isAndroid, setIsAndroid] = useState(false);
 
   useEffect(() => {
     // Check if already installed
     if (window.matchMedia('(display-mode: standalone)').matches) {
       setIsInstalled(true);
     }
 
     // Detect platform
     const userAgent = navigator.userAgent.toLowerCase();
     setIsIOS(/iphone|ipad|ipod/.test(userAgent));
     setIsAndroid(/android/.test(userAgent));
 
     // Listen for install prompt
     const handleBeforeInstallPrompt = (e: Event) => {
       e.preventDefault();
       setDeferredPrompt(e as BeforeInstallPromptEvent);
     };
 
     window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
 
     return () => {
       window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
     };
   }, []);
 
   const handleInstall = async () => {
     if (!deferredPrompt) return;
 
     await deferredPrompt.prompt();
     const { outcome } = await deferredPrompt.userChoice;
     
     if (outcome === 'accepted') {
       setIsInstalled(true);
     }
     setDeferredPrompt(null);
   };
 
   return (
     <div className="min-h-screen bg-background">
       <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-border/50">
         <div className="container flex h-16 items-center px-4 lg:px-8">
           <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <h1 className="text-lg font-semibold ml-2">Install App</h1>
         </div>
       </header>
 
       <main className="container px-4 lg:px-8 py-6 space-y-6 max-w-2xl mx-auto">
         {isInstalled ? (
           <Card className="border-success/30 bg-success/5">
             <CardHeader className="text-center">
               <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
               <CardTitle>App Already Installed!</CardTitle>
               <CardDescription>
                 FarmWise is already installed on your device. Look for it on your home screen.
               </CardDescription>
             </CardHeader>
             <CardContent className="text-center">
               <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
             </CardContent>
           </Card>
         ) : (
           <>
             <Card>
               <CardHeader className="text-center">
                 <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
                 <CardTitle>Install FarmWise</CardTitle>
                 <CardDescription>
                   Install the app on your device for quick access, offline support, and a native experience.
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {deferredPrompt ? (
                   <Button onClick={handleInstall} className="w-full" size="lg">
                     <Download className="h-5 w-5 mr-2" />
                     Install Now
                   </Button>
                 ) : isIOS ? (
                   <div className="space-y-4">
                     <h3 className="font-semibold text-center">Install on iOS</h3>
                     <ol className="space-y-3 text-sm">
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                         <span>Tap the <Share className="inline h-4 w-4" /> Share button in Safari</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                         <span>Scroll down and tap <Plus className="inline h-4 w-4" /> "Add to Home Screen"</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                         <span>Tap "Add" to confirm</span>
                       </li>
                     </ol>
                   </div>
                 ) : isAndroid ? (
                   <div className="space-y-4">
                     <h3 className="font-semibold text-center">Install on Android</h3>
                     <ol className="space-y-3 text-sm">
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                         <span>Tap the <MoreVertical className="inline h-4 w-4" /> menu button in Chrome</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                         <span>Tap "Add to Home screen" or "Install app"</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                         <span>Tap "Add" or "Install" to confirm</span>
                       </li>
                     </ol>
                   </div>
                 ) : (
                   <p className="text-center text-muted-foreground">
                     Open this page in Chrome or Safari on your mobile device to install the app.
                   </p>
                 )}
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                 <CardTitle>Benefits</CardTitle>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-3">
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                     <span>Quick access from your home screen</span>
                   </li>
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                     <span>Works offline - view your farm data anytime</span>
                   </li>
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                     <span>Native app experience - no browser bars</span>
                   </li>
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                     <span>Faster loading times</span>
                   </li>
                 </ul>
               </CardContent>
             </Card>
           </>
         )}
       </main>
     </div>
   );
 };
 
 export default Install;