import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ProjectSettings {
    startupProject: string;
    migrationProject: string;
}

export class EfCoreManager {
    private settings: Map<string, ProjectSettings> = new Map();
    private readonly storageKey = 'efCoreProjects';
    
    constructor(private context: vscode.ExtensionContext) {
        this.loadSettings();
    }

    // Load settings from workspace state
    private loadSettings() {
        const stored = this.context.workspaceState.get<any>(this.storageKey);
        if (stored) {
            this.settings = new Map(Object.entries(stored));
        }
    }

    // Save settings
    private async saveSettings() {
        const obj = Object.fromEntries(this.settings);
        await this.context.workspaceState.update(this.storageKey, obj);
    }

    // Get settings for current workspace
    public getSettings(): ProjectSettings | undefined {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }
        return this.settings.get(workspaceFolder.uri.fsPath);
    }

    // Set settings
    public async setSettings(startupProject: string, migrationProject: string) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace is open!');
            return;
        }

        this.settings.set(workspaceFolder.uri.fsPath, {
            startupProject,
            migrationProject
        });

        await this.saveSettings();
        vscode.window.showInformationMessage('Settings saved!');
    }

    // Find all .csproj files in workspace
    public async findCsprojFiles(): Promise<string[]> {
        const files = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**');
        return files.map(f => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                return path.relative(workspaceFolder.uri.fsPath, f.fsPath);
            }
            return f.fsPath;
        });
    }

    // Execute dotnet ef command
    public async executeEfCommand(command: string, showTerminal: boolean = true): Promise<void> {
        const settings = this.getSettings();
        
        if (!settings?.startupProject || !settings?.migrationProject) {
            vscode.window.showErrorMessage('Please configure projects before running commands! (Startup Project and Migration Project)');
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace is open!');
            return;
        }

        // Формируем полную команду
        const fullCommand = `dotnet ef ${command} --startup-project "${settings.startupProject}" --project "${settings.migrationProject}"`;

        // Создаём или используем существующий терминал
        const terminal = vscode.window.createTerminal({
            name: 'EF Core',
            cwd: workspaceFolder.uri.fsPath
        });

        if (showTerminal) {
            terminal.show();
        }

        terminal.sendText(fullCommand);
    }

    // Create migration
    public async createMigration(name: string) {
        if (!name || name.trim() === '') {
            vscode.window.showErrorMessage('Please enter a migration name!');
            return;
        }
        
        await this.executeEfCommand(`migrations add ${name}`);
    }

    // Update database
    public async updateDatabase() {
        const answer = await vscode.window.showWarningMessage(
            'Apply all migrations to the database?',
            'Yes',
            'Cancel'
        );
        
        if (answer === 'Yes') {
            await this.executeEfCommand('database update');
        }
    }

    // Remove last migration
    public async removeLastMigration() {
        const answer = await vscode.window.showWarningMessage(
            'Remove the last migration?',
            { modal: true },
            'Yes',
            'Cancel'
        );
        
        if (answer === 'Yes') {
            await this.executeEfCommand('migrations remove');
        }
    }

    // List migrations
    public async listMigrations() {
        await this.executeEfCommand('migrations list');
    }

    // Rollback database to a specific migration
    public async rollbackToMigration() {
        const migrationName = await vscode.window.showInputBox({
            prompt: 'Enter migration name to rollback to (or 0 for complete rollback)',
            placeHolder: 'InitialCreate'
        });

        if (migrationName !== undefined) {
            await this.executeEfCommand(`database update ${migrationName}`);
        }
    }

    // Scaffold DbContext
    public async scaffoldDbContext() {
        const connectionString = await vscode.window.showInputBox({
            prompt: 'Enter connection string',
            placeHolder: 'Server=localhost;Database=MyDb;...'
        });

        if (connectionString) {
            const provider = await vscode.window.showQuickPick(
                ['Microsoft.EntityFrameworkCore.SqlServer', 
                 'Npgsql.EntityFrameworkCore.PostgreSQL',
                 'Pomelo.EntityFrameworkCore.MySql'],
                { placeHolder: 'Select database provider' }
            );

            if (provider) {
                await this.executeEfCommand(`dbcontext scaffold "${connectionString}" ${provider}`);
            }
        }
    }
}

