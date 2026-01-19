# Vercel Deployment Guide

## Quick Setup

1. **Connect your GitHub repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository: `https://github.com/SPIGELAI1005/AI_pproval`

2. **Configure Environment Variables**
   - In your Vercel project settings, go to **Settings → Environment Variables**
   - Add at least one of the following:
     ```
     AI_API_KEY=your_api_key_here
     ```
     OR provider-specific keys:
     ```
     GEMINI_API_KEY=your_gemini_key
     OPENAI_API_KEY=your_openai_key
     ANTHROPIC_API_KEY=your_anthropic_key
     ```
   - Optional: Set provider explicitly:
     ```
     AI_PROVIDER=gemini|openai|anthropic
     ```

3. **Deploy**
   - Vercel will automatically detect Vite and build your project
   - The app will work even without an API key (AI features will be disabled)

## Important Notes

- **The app will NOT crash if no API key is set** - it will gracefully disable AI features
- AI features that require an API key:
  - AI Analysis (Run Scan button)
  - Voice Assistant
  - Translation Service
  - Conflict Detection (will use fallback string matching)
- Non-AI features will work normally:
  - Dashboard
  - Form creation and editing
  - PDF export
  - All UI components

## Troubleshooting

### Empty Page on Vercel

If you see an empty page, check:
1. Browser console (F12) for errors
2. Vercel build logs for compilation errors
3. Ensure environment variables are set correctly

### AI Features Not Working

- Check that your API key is set in Vercel environment variables
- Verify the API key is valid and has proper permissions
- Check browser console for specific error messages

## Build Configuration

Vercel automatically detects:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

No additional configuration needed!
