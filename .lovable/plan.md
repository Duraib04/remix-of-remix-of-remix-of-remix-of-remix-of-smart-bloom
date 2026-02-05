

# Implementation Plan: Image Scan Feature with AI Vision Analysis

## Overview

This plan adds a powerful **Scan Feature** that allows farmers to take photos of crops, pests, diseases, or plants and get AI-powered identification and advice in their chosen language. The feature works like Google Lens but is tailored specifically for farming needs.

---

## How It Works

```text
+------------------+     +------------------+     +------------------+
|  User Captures   | --> |  Upload to       | --> |  AI Vision       |
|  Photo (Camera   |     |  Supabase        |     |  Analysis        |
|  or Gallery)     |     |  Storage         |     |  (Gemini Pro)    |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                         +------------------+     +------------------+
                         |  Display Results | <-- |  Multilingual    |
                         |  with Actions    |     |  Response        |
                         +------------------+     +------------------+
```

### User Flow

1. User taps the **Scan** button (camera icon) on the dashboard
2. Choose to take a new photo or select from gallery
3. Photo uploads to secure storage
4. AI analyzes the image for:
   - Plant/crop identification
   - Disease detection
   - Pest identification
   - Nutrient deficiency signs
   - General farming queries
5. Results appear in the user's selected language (English, Tamil, Tanglish, Hindi)
6. AI provides actionable advice based on findings

---

## Key Features

### Camera Integration
- Access device camera directly from the app
- Front/rear camera switching
- Image preview before analysis
- Gallery upload option for existing photos

### AI Vision Analysis
- Uses Google Gemini Pro Vision model (already available via Lovable AI)
- No additional API keys required
- Specialized prompts for farming context
- Multi-language response support

### Scan Types Supported
- **Crop Health**: Identify yellowing, wilting, spots
- **Pest Detection**: Identify insects and pests
- **Disease Analysis**: Spot fungal, bacterial, viral infections
- **Plant ID**: Identify unknown plants/weeds
- **Soil Analysis**: Basic visual soil assessment

---

## New Components

### 1. ScanButton Component
A floating action button next to the voice assistant that opens the scanner interface.

### 2. ScannerModal Component
Full-screen modal with:
- Camera viewfinder or file picker
- Capture/upload buttons
- Analysis progress indicator
- Results display area

### 3. ScanResultCard Component
Displays AI analysis results:
- Identified item with confidence
- Problem detection (if any)
- Recommended actions
- Related tips

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/ScanButton.tsx` | Floating scan button |
| `src/components/dashboard/ScannerModal.tsx` | Camera/upload interface |
| `src/components/dashboard/ScanResultCard.tsx` | Results display |
| `supabase/functions/image-analyzer/index.ts` | AI vision analysis |
| `src/hooks/useImageScanner.ts` | Camera and upload logic |

### Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/LanguageContext.tsx` | Add scan-related translations |
| `src/pages/Index.tsx` | Add ScanButton to dashboard |

### Database Changes

```sql
-- Table to store scan history
CREATE TABLE scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  scan_type TEXT, -- 'crop', 'pest', 'disease', 'plant', 'soil'
  result JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for user access
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans"
  ON scan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Storage Setup

```sql
-- Create storage bucket for scan images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-images', 'scan-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Users can upload scan images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'scan-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view scan images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'scan-images');
```

---

## Edge Function: image-analyzer

The core AI analysis function that processes uploaded images.

### Input
```typescript
{
  imageUrl: string;      // Supabase storage URL
  scanType?: string;     // Optional: 'crop', 'pest', 'disease', etc.
  language: string;      // 'en', 'ta', 'tanglish', 'hi'
  farmContext?: {        // Optional farm context
    soilType?: string;
    location?: string;
  }
}
```

### Processing
1. Receive image URL and language preference
2. Build specialized farming-context prompt
3. Call Gemini Pro Vision via Lovable AI Gateway
4. Parse and structure the response
5. Return translated, actionable results

### Output
```typescript
{
  identified: {
    name: string;           // "Tomato Leaf Blight"
    confidence: number;     // 0.85
    category: string;       // "disease"
  };
  analysis: string;         // Detailed description
  severity?: string;        // "moderate"
  recommendations: string[];// Action items
  relatedTips: string[];    // Additional advice
}
```

---

## New Translations

Add to all 4 languages (English, Tamil, Tanglish, Hindi):

```typescript
// Scan feature translations
scanCrop: string;           // "Scan Crop"
takePhoto: string;          // "Take Photo"
uploadPhoto: string;        // "Upload Photo"
analyzing: string;          // "Analyzing..."
scanResult: string;         // "Scan Result"
identified: string;         // "Identified"
problemDetected: string;    // "Problem Detected"
recommendations: string;    // "Recommendations"
noIssuesFound: string;      // "No Issues Found"
scanAgain: string;          // "Scan Again"
saveScan: string;           // "Save to History"
scanHistory: string;        // "Scan History"
cropHealth: string;         // "Crop Health"
pestDetection: string;      // "Pest Detection"
diseaseAnalysis: string;    // "Disease Analysis"
plantId: string;            // "Plant Identification"
soilAnalysis: string;       // "Soil Analysis"
selectScanType: string;     // "What would you like to scan?"
cameraPermission: string;   // "Camera permission needed"
```

---

## UI Design

### Scan Button
- Positioned bottom-left, opposite to voice assistant
- Camera icon with subtle pulse animation
- Matches app theme colors

### Scanner Modal
- Full-screen on mobile for better camera access
- Dark overlay with centered viewfinder
- Clear capture and cancel buttons
- Scan type selector at top

### Results Display
- Card-based layout matching existing design
- Color-coded severity indicators
- Expandable recommendation sections
- Share/save actions

---

## Implementation Order

### Step 1: Database and Storage Setup
- Create `scan_history` table with RLS
- Configure `scan-images` storage bucket

### Step 2: Create Edge Function
- Build `image-analyzer` function
- Configure AI vision prompts for all languages
- Test with sample images

### Step 3: Add Translations
- Extend LanguageContext with all scan translations
- Ensure all 4 languages are covered

### Step 4: Build UI Components
- Create `ScanButton.tsx`
- Create `ScannerModal.tsx` with camera integration
- Create `ScanResultCard.tsx`
- Create `useImageScanner.ts` hook

### Step 5: Integration
- Add ScanButton to Index.tsx
- Connect all components
- Test end-to-end flow

---

## Benefits

- **No External API Keys**: Uses Lovable AI's Gemini Pro Vision
- **Works Offline-First**: Camera works without internet, uploads when connected
- **Multilingual**: Results in farmer's preferred language
- **Farming-Focused**: AI prompts optimized for agricultural context
- **History Tracking**: Save and review past scans

