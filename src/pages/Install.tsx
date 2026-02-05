 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { ArrowLeft, Download, Smartphone, CheckCircle, Share, Plus, MoreVertical } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
 
 interface BeforeInstallPromptEvent extends Event {
   prompt: () => Promise<void>;
   userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
 }
 
 const Install = () => {
   const navigate = useNavigate();
  const { t } = useLanguage();
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
          <h1 className="text-lg font-semibold ml-2">{t.installApp}</h1>
         </div>
       </header>
 
       <main className="container px-4 lg:px-8 py-6 space-y-6 max-w-2xl mx-auto">
         {isInstalled ? (
           <Card className="border-success/30 bg-success/5">
             <CardHeader className="text-center">
               <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <CardTitle>{t.appInstalled}</CardTitle>
               <CardDescription>
                {t.appInstalledDesc}
               </CardDescription>
             </CardHeader>
             <CardContent className="text-center">
              <Button onClick={() => navigate("/")}>{t.goToDashboard}</Button>
             </CardContent>
           </Card>
         ) : (
           <>
             <Card>
               <CardHeader className="text-center">
                 <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle>{t.installApp}</CardTitle>
                 <CardDescription>
                  {t.installDescription}
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {deferredPrompt ? (
                   <Button onClick={handleInstall} className="w-full" size="lg">
                     <Download className="h-5 w-5 mr-2" />
                    {t.installNow}
                   </Button>
                 ) : isIOS ? (
                   <div className="space-y-4">
                    <h3 className="font-semibold text-center">{t.installOnIos}</h3>
                     <ol className="space-y-3 text-sm">
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                        <span>{t.tapShare} <Share className="inline h-4 w-4" /></span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                        <span>{t.tapAddHome} <Plus className="inline h-4 w-4" /></span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                        <span>{t.tapAdd}</span>
                       </li>
                     </ol>
                   </div>
                 ) : isAndroid ? (
                   <div className="space-y-4">
                    <h3 className="font-semibold text-center">{t.installOnAndroid}</h3>
                     <ol className="space-y-3 text-sm">
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                        <span>{t.tapMenu} <MoreVertical className="inline h-4 w-4" /></span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                        <span>{t.tapInstall}</span>
                       </li>
                       <li className="flex items-start gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                        <span>{t.tapAdd}</span>
                       </li>
                     </ol>
                   </div>
                 ) : (
                   <p className="text-center text-muted-foreground">
                    {t.openInBrowser}
                   </p>
                 )}
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                <CardTitle>{t.benefits}</CardTitle>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-3">
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                    <span>{t.quickAccess}</span>
                   </li>
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                    <span>{t.worksOffline}</span>
                   </li>
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                    <span>{t.nativeExperience}</span>
                   </li>
                   <li className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-success" />
                    <span>{t.fasterLoading}</span>
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