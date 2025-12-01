import * as vscode from 'vscode';
import { EfCoreManager } from './efCoreManager';

export class EfCoreSidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly efCoreManager: EfCoreManager
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Обработка сообщений от WebView
		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case 'configureProjects': {
					await this.configureProjects();
					break;
				}
				case 'createMigration': {
					await this.efCoreManager.createMigration(data.value);
					break;
				}
				case 'updateDatabase': {
					await this.efCoreManager.updateDatabase();
					break;
				}
				case 'removeMigration': {
					await this.efCoreManager.removeLastMigration();
					break;
				}
				case 'listMigrations': {
					await this.efCoreManager.listMigrations();
					break;
				}
				case 'rollbackMigration': {
					await this.efCoreManager.rollbackToMigration();
					break;
				}
				case 'scaffoldDbContext': {
					await this.efCoreManager.scaffoldDbContext();
					break;
				}
				case 'refresh': {
					this.refresh();
					break;
				}
			}
		});

		// Отправляем начальные данные
		this.refresh();
	}

	// Configure projects
	private async configureProjects() {
		const csprojFiles = await this.efCoreManager.findCsprojFiles();

		if (csprojFiles.length === 0) {
			vscode.window.showErrorMessage('No .csproj files found in workspace!');
			return;
		}

		// Select Startup Project
		const startupProject = await vscode.window.showQuickPick(csprojFiles, {
			placeHolder: 'Select Startup Project (project with Program.cs)'
		});

		if (!startupProject) {
			return;
		}

		// Select Migration Project
		const migrationProject = await vscode.window.showQuickPick(csprojFiles, {
			placeHolder: 'Select Migration Project (project with DbContext)'
		});

		if (!migrationProject) {
			return;
		}

		await this.efCoreManager.setSettings(startupProject, migrationProject);
		this.refresh();
	}

	// Refresh UI
	public refresh() {
		if (this._view) {
			const settings = this.efCoreManager.getSettings();
			this._view.webview.postMessage({
				type: 'updateSettings',
				settings: settings
			});
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>EF Core Manager</title>
			<style>
				* {
					box-sizing: border-box;
				}
				body {
					padding: 0;
					margin: 0;
					color: var(--vscode-foreground);
					font-family: var(--vscode-font-family);
					font-size: 13px;
				}
				.container {
					padding: 15px;
				}
				h2 {
					margin: 0 0 15px 0;
					font-size: 16px;
					font-weight: 600;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				h3 {
					margin: 0 0 10px 0;
					font-size: 13px;
					font-weight: 600;
					color: var(--vscode-foreground);
				}
				.section {
					margin-bottom: 15px;
					padding: 12px;
					background: var(--vscode-editor-background);
					border: 1px solid var(--vscode-panel-border);
					border-radius: 4px;
				}
				.settings-section {
					background: var(--vscode-editor-inactiveSelectionBackground);
					border-color: var(--vscode-focusBorder);
				}
				button {
					width: 100%;
					padding: 8px 12px;
					margin: 4px 0;
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					border-radius: 2px;
					cursor: pointer;
					font-size: 13px;
					text-align: left;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				button:hover {
					background: var(--vscode-button-hoverBackground);
				}
				button.secondary {
					background: var(--vscode-button-secondaryBackground);
					color: var(--vscode-button-secondaryForeground);
				}
				button.secondary:hover {
					background: var(--vscode-button-secondaryHoverBackground);
				}
				button.warning {
					background: var(--vscode-inputValidation-warningBackground);
					color: var(--vscode-inputValidation-warningForeground);
					border: 1px solid var(--vscode-inputValidation-warningBorder);
				}
				button.icon::before {
					content: attr(data-icon);
					font-size: 14px;
				}
				input {
					width: 100%;
					padding: 6px 8px;
					margin: 5px 0;
					background: var(--vscode-input-background);
					color: var(--vscode-input-foreground);
					border: 1px solid var(--vscode-input-border);
					border-radius: 2px;
					font-size: 13px;
				}
				input:focus {
					outline: 1px solid var(--vscode-focusBorder);
				}
				.info {
					font-size: 11px;
					color: var(--vscode-descriptionForeground);
					margin: 5px 0 0 0;
					line-height: 1.4;
				}
				.project-info {
					font-size: 11px;
					padding: 6px 8px;
					background: var(--vscode-textCodeBlock-background);
					border-radius: 2px;
					margin: 4px 0;
					word-break: break-all;
				}
				.status {
					display: inline-block;
					padding: 2px 6px;
					border-radius: 2px;
					font-size: 11px;
					font-weight: 600;
				}
				.status.configured {
					background: var(--vscode-testing-iconPassed);
					color: var(--vscode-editor-background);
				}
				.status.not-configured {
					background: var(--vscode-testing-iconFailed);
					color: var(--vscode-editor-background);
				}
				.divider {
					height: 1px;
					background: var(--vscode-panel-border);
					margin: 10px 0;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h2>
					<span>🗄️</span>
					<span>EF Core Manager</span>
				</h2>
				
				<!-- Project Settings -->
				<div class="section settings-section">
					<h3>⚙️ Project Settings</h3>
					<div id="settingsInfo">
						<p class="info">Loading...</p>
					</div>
					<button onclick="configureProjects()">
						<span>📁</span>
						<span>Configure Projects</span>
					</button>
				</div>

				<!-- Create Migration -->
				<div class="section">
					<h3>➕ Create Migration</h3>
					<input type="text" id="migrationName" placeholder="Migration name (e.g., AddUserTable)" />
					<button onclick="createMigration()">
						<span>✨</span>
						<span>Create Migration</span>
					</button>
					<p class="info">Executes: dotnet ef migrations add [name]</p>
				</div>

				<!-- Database Management -->
				<div class="section">
					<h3>🔄 Database Management</h3>
					<button onclick="updateDatabase()">
						<span>⬆️</span>
						<span>Apply Migrations</span>
					</button>
					<p class="info">Applies all migrations to the database</p>
					
					<button class="secondary" onclick="listMigrations()">
						<span>📋</span>
						<span>List Migrations</span>
					</button>
					
					<button class="secondary" onclick="rollbackMigration()">
						<span>⏮️</span>
						<span>Rollback Migration</span>
					</button>
					<p class="info">Rolls back the database to a specific migration</p>
				</div>

				<!-- Remove Migration -->
				<div class="section">
					<h3>🗑️ Remove Migration</h3>
					<button class="warning" onclick="removeMigration()">
						<span>❌</span>
						<span>Remove Last Migration</span>
					</button>
					<p class="info">⚠️ Removes the last created migration</p>
				</div>

				<!-- Additional Commands -->
				<div class="section">
					<h3>🔧 Additional</h3>
					<button class="secondary" onclick="scaffoldDbContext()">
						<span>🏗️</span>
						<span>Scaffold DbContext</span>
					</button>
					<p class="info">Creates DbContext from an existing database</p>
				</div>
			</div>

			<script>
				const vscode = acquireVsCodeApi();
				let currentSettings = null;

				// Получение сообщений от расширения
				window.addEventListener('message', event => {
					const message = event.data;
					switch (message.type) {
						case 'updateSettings':
							currentSettings = message.settings;
							updateSettingsUI();
							break;
					}
				});

				function updateSettingsUI() {
					const settingsInfo = document.getElementById('settingsInfo');
					if (currentSettings) {
						settingsInfo.innerHTML = \`
							<p class="info">
								<span class="status configured">✓ Configured</span>
							</p>
							<div class="project-info">
								<strong>Startup:</strong> \${currentSettings.startupProject}
							</div>
							<div class="project-info">
								<strong>Migration:</strong> \${currentSettings.migrationProject}
							</div>
						\`;
					} else {
						settingsInfo.innerHTML = \`
							<p class="info">
								<span class="status not-configured">! Not Configured</span>
							</p>
							<p class="info">Click "Configure Projects" to get started</p>
						\`;
					}
				}

				function configureProjects() {
					vscode.postMessage({ type: 'configureProjects' });
				}

				function createMigration() {
					const input = document.getElementById('migrationName');
					const name = input.value.trim();
					if (name) {
						vscode.postMessage({
							type: 'createMigration',
							value: name
						});
						input.value = '';
					} else {
						alert('Please enter a migration name!');
					}
				}

				function updateDatabase() {
					vscode.postMessage({ type: 'updateDatabase' });
				}

				function removeMigration() {
					vscode.postMessage({ type: 'removeMigration' });
				}

				function listMigrations() {
					vscode.postMessage({ type: 'listMigrations' });
				}

				function rollbackMigration() {
					vscode.postMessage({ type: 'rollbackMigration' });
				}

				function scaffoldDbContext() {
					vscode.postMessage({ type: 'scaffoldDbContext' });
				}

				// Запросить настройки при загрузке
				vscode.postMessage({ type: 'refresh' });
			</script>
		</body>
		</html>`;
	}
}

