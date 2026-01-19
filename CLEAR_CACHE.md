# How to Clear Cache and See Design Changes

## Step-by-Step Instructions

### 1. Unregister Service Worker
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** for any registered service workers
5. Check "Update on reload" if available

### 2. Clear All Caches
1. Still in **Application** tab
2. Click **Cache Storage** in the left sidebar
3. Right-click each cache → **Delete**
4. Click **Clear storage** in the left sidebar
5. Check ALL boxes
6. Click **Clear site data**

### 3. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### 4. Verify CSS is Loading
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check "Disable cache"
4. Refresh page
5. Look for `index.css` or `index-[hash].css` in the network list
6. Click on it and verify it's loading (Status 200)

### 5. Check Console for Errors
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for any red errors
4. If you see CSS loading errors, report them

## Alternative: Use Incognito/Private Mode
- Open the app in an incognito/private window
- This bypasses all cache and service workers

## If Still Not Working
1. Close the browser completely
2. Restart the dev server: `npm run dev`
3. Open a fresh browser window
4. Navigate to `http://localhost:3000`
