 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { MapPin, Search, Navigation, Plus, Check, Loader2 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { useLanguage } from "@/contexts/LanguageContext";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 
 interface Farm {
   id: string;
   name: string;
   latitude: number;
   longitude: number;
   address: string | null;
  soil_type: string | null;
 }
 
const SOIL_TYPES = [
  { value: "clay", label: "Clay Soil" },
  { value: "sandy", label: "Sandy Soil" },
  { value: "loamy", label: "Loamy Soil" },
  { value: "silt", label: "Silt Soil" },
  { value: "peat", label: "Peat Soil" },
  { value: "chalky", label: "Chalky Soil" },
  { value: "black", label: "Black Soil (Regur)" },
  { value: "red", label: "Red Soil" },
  { value: "alluvial", label: "Alluvial Soil" },
];

 interface LocationSelectorProps {
   farms: Farm[];
   selectedFarm: Farm | null;
   onSelectFarm: (farmId: string) => void;
  onCreateFarm: (name: string, lat: number, lon: number, address?: string, soilType?: string) => Promise<unknown>;
  onUpdateFarmLocation: (farmId: string, lat: number, lon: number, address?: string, soilType?: string) => Promise<unknown>;
   isLoading?: boolean;
   className?: string;
 }
 
 export function LocationSelector({
   farms,
   selectedFarm,
   onSelectFarm,
   onCreateFarm,
   onUpdateFarmLocation,
   isLoading,
   className,
 }: LocationSelectorProps) {
   const { t } = useLanguage();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [isEditMode, setIsEditMode] = useState(false);
   const [farmName, setFarmName] = useState("");
   const [latitude, setLatitude] = useState("");
   const [longitude, setLongitude] = useState("");
   const [address, setAddress] = useState("");
  const [soilType, setSoilType] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isDetecting, setIsDetecting] = useState(false);
 
   const handleDetectLocation = () => {
     if (!navigator.geolocation) {
       alert("Geolocation is not supported by your browser");
       return;
     }
 
     setIsDetecting(true);
     navigator.geolocation.getCurrentPosition(
       async (position) => {
         setLatitude(position.coords.latitude.toFixed(6));
         setLongitude(position.coords.longitude.toFixed(6));
         
         // Try to get address using reverse geocoding
         try {
           const response = await fetch(
             `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
           );
           const data = await response.json();
           if (data.display_name) {
             setAddress(data.display_name);
           }
         } catch (error) {
           console.error("Reverse geocoding failed:", error);
         }
         setIsDetecting(false);
       },
       (error) => {
         console.error("Geolocation error:", error);
         alert("Failed to detect location. Please enter manually.");
         setIsDetecting(false);
       },
       { enableHighAccuracy: true, timeout: 10000 }
     );
   };
 
   const handleSearchAddress = async () => {
     if (!address.trim()) return;
     
     setIsDetecting(true);
     try {
       const response = await fetch(
         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
       );
       const data = await response.json();
       if (data && data.length > 0) {
         setLatitude(parseFloat(data[0].lat).toFixed(6));
         setLongitude(parseFloat(data[0].lon).toFixed(6));
         setAddress(data[0].display_name);
       } else {
         alert("Address not found. Please try a different search.");
       }
     } catch (error) {
       console.error("Geocoding failed:", error);
       alert("Failed to search address.");
     }
     setIsDetecting(false);
   };
 
   const handleSubmit = async () => {
     if (!latitude || !longitude) {
       alert("Please enter or detect location coordinates");
       return;
     }
 
     setIsSubmitting(true);
     try {
       if (isEditMode && selectedFarm) {
         await onUpdateFarmLocation(
           selectedFarm.id,
           parseFloat(latitude),
           parseFloat(longitude),
        address || undefined,
        soilType || undefined
         );
       } else {
         if (!farmName.trim()) {
           alert("Please enter a farm name");
           setIsSubmitting(false);
           return;
         }
         await onCreateFarm(
           farmName,
           parseFloat(latitude),
           parseFloat(longitude),
        address || undefined,
        soilType || undefined
         );
       }
       setIsDialogOpen(false);
       resetForm();
     } catch (error) {
       console.error("Error saving farm:", error);
     }
     setIsSubmitting(false);
   };
 
   const resetForm = () => {
     setFarmName("");
     setLatitude("");
     setLongitude("");
     setAddress("");
    setSoilType("");
     setIsEditMode(false);
   };
 
   const openEditDialog = () => {
     if (selectedFarm) {
       setIsEditMode(true);
       setFarmName(selectedFarm.name);
       setLatitude(selectedFarm.latitude.toString());
       setLongitude(selectedFarm.longitude.toString());
       setAddress(selectedFarm.address || "");
    setSoilType(selectedFarm.soil_type || "");
       setIsDialogOpen(true);
     }
   };
 
   const openAddDialog = () => {
     resetForm();
     setIsDialogOpen(true);
   };
 
   return (
     <Card className={cn("card-hover border-0 shadow-md", className)}>
       <CardHeader className="pb-2">
         <CardTitle className="text-base font-semibold flex items-center gap-2">
           <MapPin className="h-5 w-5 text-primary" />
           {t.farmLocation || "Farm Location"}
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-3">
         {isLoading ? (
           <div className="flex items-center justify-center py-4">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
           </div>
         ) : (
           <>
             {/* Farm Selection */}
             {farms.length > 0 ? (
               <div className="space-y-2">
                 {farms.slice(0, 3).map((farm) => (
                   <button
                     key={farm.id}
                     onClick={() => onSelectFarm(farm.id)}
                     className={cn(
                       "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                       selectedFarm?.id === farm.id
                         ? "bg-primary/10 border border-primary/30"
                         : "bg-muted hover:bg-muted/80"
                     )}
                   >
                     <div className="flex items-center gap-2">
                       <MapPin className={cn(
                         "h-4 w-4",
                         selectedFarm?.id === farm.id ? "text-primary" : "text-muted-foreground"
                       )} />
                       <div>
                         <p className="font-medium text-sm">{farm.name}</p>
                         <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {farm.soil_type ? `${farm.soil_type} • ` : ""}{farm.address || `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`}
                         </p>
                       </div>
                     </div>
                     {selectedFarm?.id === farm.id && (
                       <Check className="h-4 w-4 text-primary" />
                     )}
                   </button>
                 ))}
               </div>
             ) : (
               <div className="text-center py-4 text-muted-foreground">
                 <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                 <p className="text-sm">No farms added yet</p>
               </div>
             )}
 
             {/* Actions */}
             <div className="flex gap-2 pt-2">
               <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <DialogTrigger asChild>
                   <Button variant="outline" size="sm" className="flex-1" onClick={openAddDialog}>
                     <Plus className="h-4 w-4 mr-1" />
                     Add Farm
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px]">
                   <DialogHeader>
                     <DialogTitle>
                       {isEditMode ? "Update Farm Location" : "Add New Farm"}
                     </DialogTitle>
                     <DialogDescription>
                       Enter farm details or use GPS to detect your location automatically.
                     </DialogDescription>
                   </DialogHeader>
                   <div className="grid gap-4 py-4">
                     {!isEditMode && (
                       <div className="grid gap-2">
                         <Label htmlFor="farmName">Farm Name</Label>
                         <Input
                           id="farmName"
                           value={farmName}
                           onChange={(e) => setFarmName(e.target.value)}
                           placeholder="e.g., Main Field, North Farm"
                         />
                       </div>
                     )}
 
                     <div className="grid gap-2">
                       <Label htmlFor="address">Address (search or type)</Label>
                       <div className="flex gap-2">
                         <Input
                           id="address"
                           value={address}
                           onChange={(e) => setAddress(e.target.value)}
                           placeholder="Enter village, town or address"
                           className="flex-1"
                         />
                         <Button 
                           variant="outline" 
                           size="icon"
                           onClick={handleSearchAddress}
                           disabled={isDetecting}
                         >
                           {isDetecting ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <Search className="h-4 w-4" />
                           )}
                         </Button>
                       </div>
                     </div>
 
                     <Button
                       variant="secondary"
                       onClick={handleDetectLocation}
                       disabled={isDetecting}
                       className="w-full"
                     >
                       {isDetecting ? (
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       ) : (
                         <Navigation className="h-4 w-4 mr-2" />
                       )}
                       Detect My Location (GPS)
                     </Button>
 
                     <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-2">
                         <Label htmlFor="latitude">Latitude</Label>
                         <Input
                           id="latitude"
                           type="number"
                           step="0.000001"
                           value={latitude}
                           onChange={(e) => setLatitude(e.target.value)}
                           placeholder="e.g., 11.0168"
                         />
                       </div>
                       <div className="grid gap-2">
                         <Label htmlFor="longitude">Longitude</Label>
                         <Input
                           id="longitude"
                           type="number"
                           step="0.000001"
                           value={longitude}
                           onChange={(e) => setLongitude(e.target.value)}
                           placeholder="e.g., 76.9558"
                         />
                       </div>
                     </div>

                  <div className="grid gap-2">
                    <Label htmlFor="soilType">Soil Type</Label>
                    <Select value={soilType} onValueChange={setSoilType}>
                      <SelectTrigger id="soilType">
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOIL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select your soil type for better crop recommendations
                    </p>
                  </div>
                   </div>
                   <DialogFooter>
                     <Button 
                       onClick={handleSubmit} 
                       disabled={isSubmitting}
                       className="w-full"
                     >
                       {isSubmitting ? (
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       ) : null}
                       {isEditMode ? "Update Location" : "Add Farm"}
                     </Button>
                   </DialogFooter>
                 </DialogContent>
               </Dialog>
 
               {selectedFarm && (
                 <Button variant="ghost" size="sm" onClick={openEditDialog}>
                   <Navigation className="h-4 w-4 mr-1" />
                   Edit Location
                 </Button>
               )}
             </div>
           </>
         )}
       </CardContent>
     </Card>
   );
 }