# EF Core Tools

Visual Studio Code extension for managing Entity Framework Core migrations with ease.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/ef-core-tools.ef-core?style=flat-square&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=ef-core-tools.ef-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🗄️ **Sidebar Panel** for quick access to EF Core commands
- ⚙️ **Project Configuration** - save Startup and Migration projects for each workspace
- ➕ **Create Migrations** - interactive UI for creating migrations
- 🔄 **Database Management** - apply, rollback, and remove migrations
- 📋 **Migration List** - view all project migrations
- 🏗️ **Scaffold DbContext** - generate DbContext from existing database
- 💾 **Auto-save Settings** - settings are saved for each workspace

## 🚀 Quick Start

1. **Open the extension panel:**
   - Click on the 🗄️ "EF Core Tools" icon in the Activity Bar (left side)
   - Or use the `EF Core: Open Panel` command from Command Palette (Ctrl+Shift+P)

2. **Configure projects:**
   - Click the "📁 Configure Projects" button
   - Select **Startup Project** (project with Program.cs, typically Web API)
   - Select **Migration Project** (project with DbContext)
   
3. **Done!** You can now use all EF Core commands through the UI

## 📖 Usage

### Creating a Migration
1. Enter the migration name in the text field (e.g., `AddUserTable`)
2. Click "✨ Create Migration"
3. The command will execute in terminal: `dotnet ef migrations add AddUserTable`

### Applying Migrations to Database
1. Click "⬆️ Update Database"
2. Confirm the action
3. Executes: `dotnet ef database update`

### Removing Last Migration
1. Click "❌ Remove Last Migration"
2. Confirm removal
3. Executes: `dotnet ef migrations remove`

### Rolling Back to a Specific Migration
1. Click "⏮️ Rollback to Migration"
2. Enter the migration name (or `0` for complete rollback)
3. Database will rollback to the specified migration

## 🎯 Commands

All commands are available through Command Palette (Ctrl+Shift+P):

- `EF Core: Open Panel` - Open extension panel
- `EF Core: Configure Projects` - Configure projects
- `EF Core: Create Migration` - Create migration
- `EF Core: Update Database` - Apply migrations
- `EF Core: Remove Last Migration` - Remove last migration
- `EF Core: List Migrations` - Show migration list

## ⚙️ Requirements

- .NET SDK (6.0 or higher)
- EF Core Tools installed globally:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

## 📝 Notes

- Project settings are saved separately for each workspace
- All commands are executed with `--startup-project` and `--project` specified
- Commands run in VS Code terminal where you can see the output

## 🐛 Known Issues

No known issues at this time. If you find a bug, please create an issue.

## 📄 License

MIT

**Enjoy working with EF Core! 🚀**
