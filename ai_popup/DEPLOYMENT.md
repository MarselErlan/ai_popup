# 🚀 Railway Deployment Guide

This guide will help you deploy your AI Popup application to Railway using GitHub integration.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Node.js** - Version 18+ (Railway will use Node.js 20)

## Step 1: Prepare Your Repository

### 1.1 Update Extension Configuration

After deployment, you'll need to update the extension to point to your production frontend URL. The extension currently looks for the web app at `localhost:5173` - you'll need to update this to your Railway URL.

### 1.2 Commit Your Changes

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

## Step 2: Deploy to Railway

### 2.1 Connect GitHub to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### 2.2 Configure Environment Variables

Railway will automatically set:

- `PORT` - The port your app should run on
- `NODE_ENV` - Set to "production"

### 2.3 Deploy

Railway will automatically:

1. Install dependencies (`npm ci`)
2. Build the project (`npm run build`)
3. Start the preview server (`npm run preview`)

## Step 3: Update Extension for Production

After deployment, you'll get a Railway URL like: `https://your-app-name.up.railway.app`

### 3.1 Update Extension Code

In `ai-form-assistant/popup-unified.js`, update the web app detection:

```javascript
// Find this line in checkWebAppLogin method:
if (tab.url && (tab.url.includes('localhost:5173') || tab.url.includes('127.0.0.1:5173'))) {

// Replace with your Railway URL:
if (tab.url && (tab.url.includes('your-app-name.up.railway.app'))) {
```

### 3.2 Rebuild Extension

```bash
npm run build:extension
```

### 3.3 Update Extension in Browser

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `ai-form-assistant` folder
5. Or click "Reload" if already loaded

## Step 4: Verify Deployment

### 4.1 Check Railway Dashboard

- Go to your Railway project dashboard
- Check the "Deployments" tab
- Verify the build was successful
- Note your production URL

### 4.2 Test Your Application

1. Visit your Railway URL
2. Test login/signup functionality
3. Test the extension integration
4. Verify API calls work correctly

## Step 5: Continuous Deployment

Railway will automatically redeploy when you push changes to your GitHub repository.

### 5.1 Automatic Deployments

- Push to `main` branch → Automatic deployment
- Railway will rebuild and deploy automatically
- Check the "Deployments" tab for status

### 5.2 Manual Deployments

You can also trigger manual deployments from the Railway dashboard.

## Troubleshooting

### Build Failures

1. Check Railway logs in the dashboard
2. Verify all dependencies are in `package.json`
3. Ensure build scripts work locally

### Runtime Errors

1. Check application logs in Railway
2. Verify environment variables are set
3. Test API endpoints are accessible

### Extension Issues

1. Update extension with new production URL
2. Clear browser cache and reload extension
3. Check browser console for errors

## Environment Variables

Railway automatically provides:

- `PORT` - Server port
- `NODE_ENV` - Environment (production)

You can add custom environment variables in the Railway dashboard if needed.

## Monitoring

Railway provides:

- Real-time logs
- Performance metrics
- Error tracking
- Automatic restarts

## Cost

Railway offers:

- Free tier for development
- Pay-as-you-go pricing for production
- Automatic scaling based on usage

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic)
3. Set up monitoring and alerts
4. Configure backup strategies

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- GitHub Issues: For code-related problems
- Railway Support: For deployment issues
