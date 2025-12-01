# 📦 Publishing EF Core Extension to VS Code Marketplace

## Prerequisites

1. **.NET SDK** with EF Core tools installed
2. **Node.js and npm** installed
3. **Git** and **GitHub account**
4. **Azure DevOps account** (free) - for publishing

---

## Step 1: Prepare Your Extension

### 1.1 Update package.json

Edit `package.json` and update these fields:

```json
{
  "publisher": "your-publisher-name",  // Create this in Step 2
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/ef-core-extension.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/ef-core-extension/issues"
  },
  "homepage": "https://github.com/your-username/ef-core-extension#readme"
}
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository: `ef-core-extension`
3. Initialize and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/ef-core-extension.git
git push -u origin main
```

### 1.3 Verify Extension Works

```bash
npm run compile
# Press F5 to test in Extension Development Host
```

---

## Step 2: Create Publisher Account

### 2.1 Create Azure DevOps Organization

1. Go to https://dev.azure.com
2. Sign in with your Microsoft account (create one if needed)
3. Click "Create new organization"
4. Choose a name (e.g., "yourname-extensions")

### 2.2 Create Personal Access Token (PAT)

1. In Azure DevOps, click your profile icon (top right)
2. Click **"Personal access tokens"**
3. Click **"+ New Token"**
4. Configure:
   - **Name**: "VS Code Marketplace"
   - **Organization**: Select your organization
   - **Expiration**: Custom (90 days or more)
   - **Scopes**: 
     - Select **"Custom defined"**
     - Click **"Show all scopes"**
     - Check **"Marketplace"** → **"Manage"**
5. Click **"Create"**
6. **IMPORTANT**: Copy the token immediately! You won't see it again.

```
Example token: abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx
```

---

## Step 3: Install vsce (VS Code Extension Manager)

Install the publishing tool globally:

```bash
npm install -g @vscode/vsce
```

Verify installation:

```bash
vsce --version
```

---

## Step 4: Create Publisher Profile

### 4.1 Login to Marketplace

```bash
vsce login your-publisher-name
```

When prompted, enter your **Personal Access Token** from Step 2.2.

### 4.2 Create Publisher (if doesn't exist)

If you need to create a new publisher:

```bash
vsce create-publisher your-publisher-name
```

You'll be asked for:
- **Publisher Name**: `your-publisher-name` (must match package.json)
- **Display Name**: "Your Company Name"
- **Email**: your.email@example.com
- **Personal Access Token**: Paste your PAT

Or create via web:
1. Go to https://marketplace.visualstudio.com/manage
2. Click **"Create publisher"**
3. Fill in the form

---

## Step 5: Package Your Extension

Create a `.vsix` file (installable package):

```bash
vsce package
```

This creates `ef-core-0.0.1.vsix`

### Test the Package

Install it locally:

```bash
code --install-extension ef-core-0.0.1.vsix
```

---

## Step 6: Publish to Marketplace

### Option A: Publish via Command Line

```bash
vsce publish
```

This will:
1. Package your extension
2. Upload to VS Code Marketplace
3. Auto-increment version number (optional)

### Option B: Publish via Web Interface

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in
3. Click on your publisher
4. Click **"+ New extension"** → **"Visual Studio Code"**
5. Drag & drop your `.vsix` file
6. Click **"Upload"**

---

## Step 7: Verify Publication

1. Go to https://marketplace.visualstudio.com/items?itemName=your-publisher-name.ef-core
2. Your extension should appear within 5-10 minutes
3. Install it from VS Code:
   - Press `Ctrl+Shift+X`
   - Search for "EF Core Tools"
   - Click **"Install"**

---

## Updating Your Extension

### 1. Make changes to your code

### 2. Update version in package.json

```json
"version": "0.0.2"
```

Or use vsce to auto-increment:

```bash
vsce publish patch   # 0.0.1 → 0.0.2
vsce publish minor   # 0.0.1 → 0.1.0
vsce publish major   # 0.0.1 → 1.0.0
```

### 3. Publish update

```bash
vsce publish
```

---

## Important Files for Publishing

### .vscodeignore

Create this file to exclude unnecessary files from the package:

```
.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/eslint.config.mjs
**/*.map
**/*.ts
!**/*.d.ts
**/.vscode-test.*
node_modules/**
.github/**
*.vsix
PUBLISHING.md
ARCHITECTURE.md
```

### LICENSE

Create a `LICENSE` file (MIT License example):

```
MIT License

Copyright (c) 2025 Your Name

Permission is hereby granted, free of charge...
```

---

## Troubleshooting

### "Error: Personal Access Token verification failed"
- Check token hasn't expired
- Verify token has "Marketplace (Manage)" scope
- Create a new token if needed

### "Error: Publisher not found"
- Make sure `publisher` in package.json matches your Azure publisher name
- Create publisher: `vsce create-publisher publisher-name`

### "Extension validation failed"
- Run `vsce package` to see detailed errors
- Check `icon` path is correct
- Verify all required fields in package.json

### "Cannot find module"
- Run `npm install` before publishing
- Run `npm run compile` to build

---

## Best Practices

1. ✅ **Test thoroughly** before publishing
2. ✅ **Write good README.md** - users see this first
3. ✅ **Add screenshots/GIFs** to README
4. ✅ **Use semantic versioning** (major.minor.patch)
5. ✅ **Keep CHANGELOG.md** updated
6. ✅ **Respond to user issues** on GitHub
7. ✅ **Don't include sensitive data** (tokens, passwords)
8. ✅ **Check file size** - keep it under 50MB

---

## Quick Reference

```bash
# Install vsce
npm install -g @vscode/vsce

# Login
vsce login your-publisher-name

# Package
vsce package

# Publish
vsce publish

# Publish with version bump
vsce publish patch   # 0.0.1 → 0.0.2
vsce publish minor   # 0.0.1 → 0.1.0
vsce publish major   # 0.0.1 → 1.0.0

# Unpublish (use carefully!)
vsce unpublish your-publisher-name.ef-core
```

---

## Useful Links

- 📚 [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- 🏪 [VS Code Marketplace](https://marketplace.visualstudio.com/)
- 🔧 [Manage Publishers](https://marketplace.visualstudio.com/manage)
- 🎫 [Create Azure DevOps PAT](https://dev.azure.com)
- 📦 [vsce Documentation](https://github.com/microsoft/vscode-vsce)

---

## Support

If you encounter issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Read [official documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/visual-studio-code) with tag `visual-studio-code`

Good luck with your extension! 🚀

