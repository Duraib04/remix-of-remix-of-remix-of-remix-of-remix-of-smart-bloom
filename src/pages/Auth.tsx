 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { z } from "zod";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Leaf, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 
 const emailSchema = z.string().email("Please enter a valid email address");
 const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
 
 const Auth = () => {
   const navigate = useNavigate();
   const { signIn, signUp, isAuthenticated } = useAuth();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   
   // Login form state
   const [loginEmail, setLoginEmail] = useState("");
   const [loginPassword, setLoginPassword] = useState("");
   
   // Signup form state
   const [signupEmail, setSignupEmail] = useState("");
   const [signupPassword, setSignupPassword] = useState("");
   const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
 
   // Redirect if already authenticated
   if (isAuthenticated) {
     navigate("/");
     return null;
   }
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
 
     try {
       emailSchema.parse(loginEmail);
       passwordSchema.parse(loginPassword);
     } catch (validationError) {
       if (validationError instanceof z.ZodError) {
         setError(validationError.errors[0].message);
         return;
       }
     }
 
     setIsLoading(true);
     const { error: authError } = await signIn(loginEmail, loginPassword);
     setIsLoading(false);
 
     if (authError) {
       if (authError.message.includes("Invalid login")) {
         setError("Invalid email or password. Please try again.");
       } else if (authError.message.includes("Email not confirmed")) {
         setError("Please verify your email address before signing in.");
       } else {
         setError(authError.message);
       }
       return;
     }
 
     toast({
       title: "Welcome back!",
       description: "You have successfully signed in.",
     });
     navigate("/");
   };
 
   const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
 
     try {
       emailSchema.parse(signupEmail);
       passwordSchema.parse(signupPassword);
     } catch (validationError) {
       if (validationError instanceof z.ZodError) {
         setError(validationError.errors[0].message);
         return;
       }
     }
 
     if (signupPassword !== signupConfirmPassword) {
       setError("Passwords do not match");
       return;
     }
 
     setIsLoading(true);
     const { error: authError, data } = await signUp(signupEmail, signupPassword);
     setIsLoading(false);
 
     if (authError) {
       if (authError.message.includes("already registered")) {
         setError("This email is already registered. Please sign in instead.");
       } else {
         setError(authError.message);
       }
       return;
     }
 
     if (data?.user && !data.session) {
       toast({
         title: "Check your email",
         description: "We've sent you a verification link. Please check your inbox.",
       });
     } else {
       toast({
         title: "Welcome!",
         description: "Your account has been created successfully.",
       });
       navigate("/");
     }
   };
 
   return (
     <div className="min-h-screen bg-background flex items-center justify-center p-4">
       <div className="w-full max-w-md">
         {/* Logo */}
         <div className="flex items-center justify-center gap-2 mb-8">
           <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
             <Leaf className="h-7 w-7" />
           </div>
           <div>
             <h1 className="text-2xl font-display font-bold">FarmWise</h1>
             <p className="text-sm text-muted-foreground">Smart Irrigation</p>
           </div>
         </div>
 
         <Card className="border-0 shadow-lg">
           <CardHeader className="text-center">
             <CardTitle>Welcome</CardTitle>
             <CardDescription>
               Sign in to your account or create a new one
             </CardDescription>
           </CardHeader>
           <CardContent>
             {error && (
               <Alert variant="destructive" className="mb-4">
                 <AlertCircle className="h-4 w-4" />
                 <AlertDescription>{error}</AlertDescription>
               </Alert>
             )}
 
             <Tabs defaultValue="login" className="w-full">
               <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="login">Sign In</TabsTrigger>
                 <TabsTrigger value="signup">Sign Up</TabsTrigger>
               </TabsList>
 
               <TabsContent value="login">
                 <form onSubmit={handleLogin} className="space-y-4 mt-4">
                   <div className="space-y-2">
                     <Label htmlFor="login-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input
                         id="login-email"
                         type="email"
                         placeholder="farmer@example.com"
                         value={loginEmail}
                         onChange={(e) => setLoginEmail(e.target.value)}
                         className="pl-9"
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="login-password">Password</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input
                         id="login-password"
                         type="password"
                         placeholder="••••••••"
                         value={loginPassword}
                         onChange={(e) => setLoginPassword(e.target.value)}
                         className="pl-9"
                         required
                       />
                     </div>
                   </div>
                   <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? (
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     ) : null}
                     Sign In
                   </Button>
                 </form>
               </TabsContent>
 
               <TabsContent value="signup">
                 <form onSubmit={handleSignup} className="space-y-4 mt-4">
                   <div className="space-y-2">
                     <Label htmlFor="signup-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input
                         id="signup-email"
                         type="email"
                         placeholder="farmer@example.com"
                         value={signupEmail}
                         onChange={(e) => setSignupEmail(e.target.value)}
                         className="pl-9"
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="signup-password">Password</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input
                         id="signup-password"
                         type="password"
                         placeholder="••••••••"
                         value={signupPassword}
                         onChange={(e) => setSignupPassword(e.target.value)}
                         className="pl-9"
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="signup-confirm">Confirm Password</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input
                         id="signup-confirm"
                         type="password"
                         placeholder="••••••••"
                         value={signupConfirmPassword}
                         onChange={(e) => setSignupConfirmPassword(e.target.value)}
                         className="pl-9"
                         required
                       />
                     </div>
                   </div>
                   <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? (
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     ) : null}
                     Create Account
                   </Button>
                 </form>
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>
 
         <p className="text-center text-sm text-muted-foreground mt-4">
           Smart irrigation for modern farming
         </p>
       </div>
     </div>
   );
 };
 
 export default Auth;