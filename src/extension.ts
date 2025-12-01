// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EfCoreManager } from './efCoreManager';
import { EfCoreSidebarProvider } from './sidebarProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('EF Core extension is now active!');

	// Create EF Core manager
	const efCoreManager = new EfCoreManager(context);

	// Create sidebar provider
	const sidebarProvider = new EfCoreSidebarProvider(context.extensionUri, efCoreManager);

	// Register WebView View Provider
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'ef-core.sidebarView',
			sidebarProvider
		)
	);

	// Extension commands
	const commands = [
		// Open panel command
		vscode.commands.registerCommand('ef-core.openPanel', () => {
			vscode.commands.executeCommand('workbench.view.extension.ef-core-sidebar');
		}),

		// Configure projects
		vscode.commands.registerCommand('ef-core.configureProjects', async () => {
			const csprojFiles = await efCoreManager.findCsprojFiles();

			if (csprojFiles.length === 0) {
				vscode.window.showErrorMessage('No .csproj files found in workspace!');
				return;
			}

			const startupProject = await vscode.window.showQuickPick(csprojFiles, {
				placeHolder: 'Select Startup Project'
			});

			if (!startupProject) {return;}

			const migrationProject = await vscode.window.showQuickPick(csprojFiles, {
				placeHolder: 'Select Migration Project'
			});

			if (!migrationProject) {return;}

			await efCoreManager.setSettings(startupProject, migrationProject);
			sidebarProvider.refresh();
		}),

		// Create migration
		vscode.commands.registerCommand('ef-core.createMigration', async () => {
			const name = await vscode.window.showInputBox({
				prompt: 'Enter migration name',
				placeHolder: 'AddUserTable'
			});
			if (name) {
				await efCoreManager.createMigration(name);
			}
		}),

		// Update database
		vscode.commands.registerCommand('ef-core.updateDatabase', async () => {
			await efCoreManager.updateDatabase();
		}),

		// Remove last migration
		vscode.commands.registerCommand('ef-core.removeMigration', async () => {
			await efCoreManager.removeLastMigration();
		}),

		// List migrations
		vscode.commands.registerCommand('ef-core.listMigrations', async () => {
			await efCoreManager.listMigrations();
		})
	];

	context.subscriptions.push(...commands);
}

// This method is called when your extension is deactivated
export function deactivate() {}
