# 🚀 Railway Deployment Checklist

## Pre-Deployment ✅

- [ ] All code changes committed to GitHub
- [ ] Railway configuration files added (`railway.json`, `nixpacks.toml`)
- [ ] Vite config updated for production (`vite.config.ts`)
- [ ] Build process tested locally (`npm run build`)
- [ ] Extension builds successfully (`npm run build:extension`)

## Deployment Steps ✅

- [ ] Push code to GitHub main branch
- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Connect GitHub repository to Railway
- [ ] Deploy project (automatic after GitHub connection)
- [ ] Note the production URL from Railway dashboard

## Post-Deployment ✅

- [ ] Test production URL in browser
- [ ] Verify login/signup functionality works
- [ ] Update extension with production URL:
  ```bash
  npm run update-extension <your-railway-url>
  ```
- [ ] Rebuild extension:
  ```bash
  npm run build:extension
  ```
- [ ] Reload extension in Chrome (`chrome://extensions/`)
- [ ] Test extension integration with production web app

## Verification Tests ✅

- [ ] Web app loads correctly at Railway URL
- [ ] User registration works
- [ ] User login works
- [ ] Extension detects web app login
- [ ] Extension can sync with web app
- [ ] API calls to backend work correctly
- [ ] Document status checking works
- [ ] Translation feature works (if enabled)

## Troubleshooting ✅

- [ ] Check Railway logs for build errors
- [ ] Verify environment variables are set
- [ ] Test API endpoints are accessible
- [ ] Check browser console for errors
- [ ] Verify extension permissions

## Final Steps ✅

- [ ] Update documentation with production URL
- [ ] Test on different browsers if needed
- [ ] Set up monitoring/alerting
- [ ] Share production URL with team/users

---

**Production URL:** `https://your-app-name.up.railway.app`

**Extension Status:** ✅ Ready for production
