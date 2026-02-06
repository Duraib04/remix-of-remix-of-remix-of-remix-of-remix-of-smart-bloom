

# Plan: Fix Build Errors and Improve Chatbot Responses

## Overview

This plan addresses two main issues:
1. **Fix build errors** - TypeScript errors preventing the app from running
2. **Improve chatbot** - Make responses cleaner (no `*` or `'` symbols) and more farmer-friendly

---

## Part 1: Fix Build Errors

### 1.1 Fix Index.tsx Issues

**Problem**: The code references properties that don't exist

| Line | Issue | Solution |
|------|-------|----------|
| 77 | `irsResult` doesn't exist on hook return | Remove - the hook only returns `decision` |
| 82 | `processDecision` called with 1 argument | The hook auto-processes on data change; remove manual call |
| 96 | `farm?.crop_type` doesn't exist | Use a fallback default value |
| 303 | `irsResult` prop passed to IRSScoreCard | Remove - component only needs `decision` prop |

**File**: `src/pages/Index.tsx`
- Remove references to `irsResult` 
- Simplify the `useEffect` to not call `processDecision` manually
- Replace `farm?.crop_type` with a default value

### 1.2 Fix Missing Translations

**Problem**: Tamil, Tanglish, and Hindi translations are missing ~40 keys

Missing keys include:
- CropEconomics: `cropEconomics`, `costBreakdownDetails`, `selectCrop`, `landSize`, `analyzeEconomics`, `totalInvestment`, `projectedEarnings`, `profitMargin`, `roi`, `investmentViability`, `viableCrop`, `notViable`, `timelineToHarvest`, `daysToMaturity`, `seedToHarvest`, `months`, `bestPlantingTime`, `marketOutlook`, `currentPrice`, `perUnit`, `expectedYield`, `quintals`, `revenuePerAcre`, `costBreakdown`, `seedCost`, `fertiliserCost`, `labourCost`, `waterManagement`, `pestControl`, `totalCost`, `economicsSummary`, `willNeed`, `expectedIncome`, `profitAfterCosts`, `timeTillHarvest`, `invalidInput`, `failedAnalysis`
- IRS: `irsScore`, `riskLevelSafe`, `riskLevelWarning`, `riskLevelCritical`, and 23 more

**File**: `src/contexts/LanguageContext.tsx`
- Add all missing translation keys to Tamil (`ta`), Tanglish, and Hindi (`hi`) objects

---

## Part 2: Improve Chatbot Responses

### 2.1 Clean Response Text

**Problem**: AI responses contain markdown formatting (`*`, `'`, `**`) which looks unfriendly

**Solution**: Add a text cleaning function to remove markdown before displaying

**File**: `src/components/dashboard/VoiceAssistant.tsx`
- Add `cleanResponseText()` function that removes:
  - `**bold**` markers
  - `*italic*` markers
  - Bullet points (`*` or `-` at line start)
  - Extra whitespace
- Apply cleaning before displaying and speaking

### 2.2 Update Edge Function Prompts

**Problem**: AI sometimes generates overly technical or formatted responses

**File**: `supabase/functions/farm-assistant/index.ts`
- Update system prompts to explicitly instruct:
  - "Do not use markdown formatting"
  - "Do not use asterisks or special characters"
  - "Write in plain text only"
  - "Keep sentences short and simple"

### 2.3 Better Error Handling

**File**: `src/components/dashboard/VoiceAssistant.tsx`
- Show friendlier error messages in the user's language
- Add retry button for failed requests
- Show loading state more clearly

---

## Implementation Steps

### Step 1: Fix Index.tsx (5 changes)
Remove invalid property references and simplify hook usage

### Step 2: Add Missing Translations (3 files modified)
Add ~40 translation keys each to Tamil, Tanglish, and Hindi sections of LanguageContext

### Step 3: Update VoiceAssistant.tsx
- Add `cleanResponseText()` function
- Apply to response display and speech synthesis
- Improve error handling

### Step 4: Update Edge Function
- Modify prompts to request plain text responses
- Ensure all 4 languages have clear "no formatting" instructions

---

## Expected Results

After implementation:
- App builds without errors
- All pages display correctly in all 4 languages
- Chatbot responses appear as clean, readable text
- No asterisks, bullet points, or markdown in chat
- Speech synthesis works smoothly without reading symbols

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Fix 5 TypeScript errors |
| `src/contexts/LanguageContext.tsx` | Add ~120 missing translations (40 per language) |
| `src/components/dashboard/VoiceAssistant.tsx` | Add text cleaning and better error handling |
| `supabase/functions/farm-assistant/index.ts` | Update prompts for plain text responses |

