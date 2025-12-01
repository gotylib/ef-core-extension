# 🚀 Quick Start: Publishing to VS Code Marketplace

## 5-Minute Setup

### 1. Install vsce
```bash
npm install -g @vscode/vsce
```

### 2. Create Azure DevOps Account & Get Token
1. Go to https://dev.azure.com
2. Create organization
3. Click profile → **Personal access tokens** → **+ New Token**
4. Name: "VS Code"
5. Scope: **Marketplace (Manage)**
6. **Copy the token!**

### 3. Update package.json
Replace these values:
```json
{
  "publisher": "your-publisher-name",  // Choose unique name
  "author": {
    "name": "Your Name"
  },
  "repository": {
    "url": "https://github.com/your-username/ef-core-extension.git"
  }
}
```

### 4. Create Publisher
```bash
vsce create-publisher your-publisher-name
```
Enter:
- Display Name: "Your Company"
- Email: your@email.com
- **Paste your token** when prompted

### 5. Publish!
```bash
vsce publish
```

Done! 🎉

Your extension will be live at:
https://marketplace.visualstudio.com/items?itemName=your-publisher-name.ef-core

---

## Before Publishing Checklist

- [ ] Updated `publisher` in package.json
- [ ] Updated `author` in package.json
- [ ] Updated `repository` URL
- [ ] Created GitHub repository
- [ ] Tested extension (press F5)
- [ ] Compiled code (`npm run compile`)
- [ ] Have Azure DevOps PAT token ready

---

## Common Commands

```bash
# Package (create .vsix file)
vsce package

# Test package locally
code --install-extension ef-core-0.0.1.vsix

# Publish
vsce publish

# Update version & publish
vsce publish patch   # 0.0.1 → 0.0.2
vsce publish minor   # 0.0.1 → 0.1.0
vsce publish major   # 0.0.1 → 1.0.0
```

---

## Need Help?

Read full guide: [PUBLISHING.md](./PUBLISHING.md)

