
# Implementation Plan: Enhanced Dashboard with Crop Recommendations, Auth, Settings & PWA

## Overview
This plan adds four major features to your smart irrigation app:
1. **Crop Recommendations** - AI-powered suggestions based on weather, soil type, and sensor data
2. **User Authentication** - Login/signup system so each farmer has their own account
3. **Working Settings & Notifications** - Functional settings page and notification system
4. **Installable App (PWA)** - Download and install the app on your phone like a real app

---

## 1. Crop Recommendations Feature

### What You'll Get
- Select your soil type (Clay, Sandy, Loamy, etc.) when adding a farm
- Get crop suggestions based on your weather, soil, and sensor data
- AI-powered recommendations considering current conditions

### Database Changes
```sql
-- Add soil_type to farms table
ALTER TABLE farms ADD COLUMN soil_type TEXT;

-- Create crop recommendations table
CREATE TABLE crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  user_id UUID REFERENCES auth.users(id),
  crop_name TEXT NOT NULL,
  suitability_score INTEGER,
  reason TEXT,
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New Components
- **CropRecommendations.tsx** - Card displaying recommended crops
- **SoilTypeSelector** - Dropdown to select soil type when adding/editing farm
- **crop-recommendations edge function** - AI-powered recommendation engine

---

## 2. User Authentication

### What You'll Get
- Login and signup pages
- Each farmer sees only their own farms and data
- Secure access with email/password

### Database Changes
```sql
-- Add user_id to farms table
ALTER TABLE farms ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies to restrict access to own data
CREATE POLICY "Users can only see their own farms"
ON farms FOR SELECT
USING (auth.uid() = user_id);
```

### New Components
- **Auth.tsx** - Login/signup page with forms
- Update App.tsx with protected routes
- Update all hooks to filter by user_id

---

## 3. Settings & Notifications

### What You'll Get
- Settings page to configure preferences (units, language, notification preferences)
- Working notification bell showing alerts
- Push notification support for rain alerts

### Database Changes
```sql
-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  notification_enabled BOOLEAN DEFAULT true,
  rain_alert_threshold INTEGER DEFAULT 60,
  temperature_unit TEXT DEFAULT 'celsius',
  language TEXT DEFAULT 'en',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New Components
- **Settings.tsx** - Settings page with toggle switches
- **NotificationCenter.tsx** - Dropdown showing notifications
- **useNotifications.ts** hook for real-time notifications
- **useSettings.ts** hook for user preferences

---

## 4. Progressive Web App (PWA)

### What You'll Get
- Install button to add app to home screen
- Works offline
- Looks like a native app on mobile
- No app store needed

### Technical Setup
- Install `vite-plugin-pwa` package
- Configure PWA manifest with app name, icons, colors
- Add mobile meta tags to index.html
- Create app icons (multiple sizes)
- Add `/install` page with install instructions

---

## Implementation Order

### Phase 1: Authentication (Required First)
1. Create auth migration with user_id columns
2. Create Auth page with login/signup
3. Update App.tsx with protected routes
4. Update all existing hooks to filter by authenticated user

### Phase 2: Settings & Notifications
1. Create settings and notifications tables
2. Create Settings page component
3. Create NotificationCenter component
4. Add real-time notification subscription

### Phase 3: Crop Recommendations
1. Add soil_type to farms table
2. Update LocationSelector with soil type selection
3. Create crop-recommendations edge function
4. Create CropRecommendations component

### Phase 4: PWA Setup
1. Install vite-plugin-pwa
2. Configure manifest and service worker
3. Update index.html with mobile meta tags
4. Create install page

---

## ESP32 Integration Note

After authentication is added, you'll need to include the Supabase auth token when sending data from ESP32. I'll provide updated Arduino code with JWT authentication.

---

## Technical Details

### New Files to Create
```
src/pages/Auth.tsx
src/pages/Settings.tsx
src/pages/Install.tsx
src/components/dashboard/CropRecommendations.tsx
src/components/dashboard/NotificationCenter.tsx
src/hooks/useAuth.ts
src/hooks/useNotifications.ts
src/hooks/useSettings.ts
supabase/functions/crop-recommendations/index.ts
public/manifest.webmanifest
public/icons/icon-192.png
public/icons/icon-512.png
```

### Files to Modify
```
src/App.tsx - Add routes and auth protection
src/hooks/useFarm.ts - Filter by user_id
src/components/dashboard/Header.tsx - Add notifications and settings
src/components/dashboard/LocationSelector.tsx - Add soil type
vite.config.ts - Add PWA plugin
index.html - Add mobile meta tags and manifest link
```
