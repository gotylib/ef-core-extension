# 🏗️ Архитектура EF Core Extension

## Общая схема

```
┌──────────────────────────────────────────────────────────────────┐
│                      VS Code Extension                            │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ extension.ts - Главный файл (Entry Point)                   │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ activate() - вызывается при старте расширения           │ │ │
│  │ │   1. Создаёт EfCoreManager                              │ │ │
│  │ │   2. Создаёт EfCoreSidebarProvider                      │ │ │
│  │ │   3. Регистрирует команды                               │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────┐        ┌──────────────────────────┐    │
│  │ efCoreManager.ts     │◄───────┤ sidebarProvider.ts       │    │
│  │ (Бизнес-логика)      │        │ (UI Контроллер)          │    │
│  │                      │        │                          │    │
│  │ - Хранение настроек  │        │ - Управление WebView     │    │
│  │ - Поиск .csproj      │        │ - Генерация HTML         │    │
│  │ - Выполнение команд  │        │ - Обработка событий      │    │
│  │ - Работа с терминалом│        │                          │    │
│  └──────────┬───────────┘        └────────┬─────────────────┘    │
│             │                             │                       │
│             │                             │                       │
│             │                             ▼                       │
│             │              ┌─────────────────────────────────┐   │
│             │              │ WebView (HTML/CSS/JS)           │   │
│             │              │ - Кнопки, формы, UI             │   │
│             │              │ - acquireVsCodeApi()            │   │
│             │              │ - postMessage() для связи       │   │
│             │              └─────────────────────────────────┘   │
│             │                             │                       │
│             └─────────────────────────────┘                       │
│                    Выполнение команд dotnet ef                    │
└──────────────────────────────────────────────────────────────────┘
```

## 📦 1. extension.ts (Entry Point)

**Задача:** Точка входа, инициализация всех компонентов

```typescript
export function activate(context: vscode.ExtensionContext) {
    // 1. Создаём менеджер бизнес-логики
    const efCoreManager = new EfCoreManager(context);
    
    // 2. Создаём UI провайдер
    const sidebarProvider = new EfCoreSidebarProvider(
        context.extensionUri,  // URI для доступа к ресурсам
        efCoreManager          // Передаём менеджер
    );
    
    // 3. Регистрируем WebView View Provider
    // Связываем ID из package.json с провайдером
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'ef-core.sidebarView',  // ID из package.json
            sidebarProvider
        )
    );
    
    // 4. Регистрируем команды (для Command Palette)
    const commands = [
        vscode.commands.registerCommand('ef-core.createMigration', async () => {
            // Команда доступна через Ctrl+Shift+P
            await efCoreManager.createMigration(name);
        })
    ];
    
    context.subscriptions.push(...commands);
}
```

**context.subscriptions** - массив disposable объектов, которые VS Code автоматически очистит при деактивации расширения.

---

## 🧠 2. efCoreManager.ts (Бизнес-логика)

**Задача:** Вся логика работы с EF Core, хранение данных, выполнение команд

### Ключевые свойства:

```typescript
export class EfCoreManager {
    // Map для хранения настроек разных workspace
    // Key: путь к workspace, Value: настройки проектов
    private settings: Map<string, ProjectSettings> = new Map();
    
    // Ключ для сохранения в workspaceState
    private readonly storageKey = 'efCoreProjects';
    
    // Контекст расширения (для доступа к storage)
    constructor(private context: vscode.ExtensionContext) {
        this.loadSettings();
    }
}
```

### Методы хранения:

```typescript
// Загрузка из workspaceState (хранилище VS Code)
private loadSettings() {
    // workspaceState - хранилище на уровне workspace
    const stored = this.context.workspaceState.get<any>(this.storageKey);
    if (stored) {
        // Преобразуем объект обратно в Map
        this.settings = new Map(Object.entries(stored));
    }
}

// Сохранение
private async saveSettings() {
    // Map нельзя сохранить напрямую, конвертируем в объект
    const obj = Object.fromEntries(this.settings);
    await this.context.workspaceState.update(this.storageKey, obj);
}
```

**workspaceState vs globalState:**
- `workspaceState` - данные для конкретной workspace (папки проекта)
- `globalState` - данные для всех workspace (глобальные)

### Выполнение команд:

```typescript
public async executeEfCommand(command: string) {
    const settings = this.getSettings();
    
    // Формируем команду с параметрами
    const fullCommand = `dotnet ef ${command} ` +
        `--startup-project "${settings.startupProject}" ` +
        `--project "${settings.migrationProject}"`;
    
    // Создаём терминал VS Code
    const terminal = vscode.window.createTerminal({
        name: 'EF Core',
        cwd: workspaceFolder.uri.fsPath  // Рабочая директория
    });
    
    terminal.show();           // Показываем терминал
    terminal.sendText(fullCommand);  // Отправляем команду
}
```

---

## 🎨 3. sidebarProvider.ts (UI Контроллер)

**Задача:** Управление WebView, генерация HTML, обработка событий от UI

### Ключевые свойства:

```typescript
export class EfCoreSidebarProvider implements vscode.WebviewViewProvider {
    // Ссылка на WebView (устанавливается при создании)
    private _view?: vscode.WebviewView;
    
    constructor(
        // URI расширения для загрузки ресурсов (иконки, CSS файлы)
        private readonly _extensionUri: vscode.Uri,
        // Менеджер для выполнения команд
        private readonly efCoreManager: EfCoreManager
    ) {}
}
```

### Lifecycle метод (вызывается VS Code):

```typescript
public resolveWebviewView(
    webviewView: vscode.WebviewView,  // Созданный VS Code WebView
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
) {
    this._view = webviewView;  // Сохраняем ссылку
    
    // Настройка WebView
    webviewView.webview.options = {
        enableScripts: true,  // Разрешаем JavaScript
        localResourceRoots: [this._extensionUri]  // Откуда можно грузить файлы
    };
    
    // Устанавливаем HTML содержимое
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    // Подписываемся на сообщения ОТ WebView
    webviewView.webview.onDidReceiveMessage(async (data) => {
        // Обработка событий от UI
    });
}
```

---

## 💬 4. Взаимодействие Frontend ↔ Backend

### 🔵 От WebView → Extension (Frontend → Backend)

**В HTML (WebView):**
```javascript
const vscode = acquireVsCodeApi();  // Получаем API для связи

function createMigration() {
    const name = document.getElementById('migrationName').value;
    
    // Отправляем сообщение в Extension
    vscode.postMessage({
        type: 'createMigration',  // Тип события
        value: name               // Данные
    });
}
```

**В TypeScript (Extension):**
```typescript
webviewView.webview.onDidReceiveMessage(async (data) => {
    // Принимаем сообщение от WebView
    switch (data.type) {
        case 'createMigration': {
            // Вызываем метод менеджера
            await this.efCoreManager.createMigration(data.value);
            break;
        }
    }
});
```

### 🟢 От Extension → WebView (Backend → Frontend)

**В TypeScript (Extension):**
```typescript
public refresh() {
    if (this._view) {
        const settings = this.efCoreManager.getSettings();
        
        // Отправляем сообщение В WebView
        this._view.webview.postMessage({
            type: 'updateSettings',
            settings: settings
        });
    }
}
```

**В HTML (WebView):**
```javascript
// Слушаем сообщения ОТ Extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'updateSettings':
            // Обновляем UI с новыми настройками
            updateSettingsUI(message.settings);
            break;
    }
});
```

---

## ❓ Про HTML + CSS + JS в строке

### Это НОРМАЛЬНО и стандартная практика! ✅

**Почему:**

1. **Изоляция безопасности** - WebView работает в песочнице (sandbox)
   - Нет доступа к Node.js, файловой системе
   - Только общение через postMessage
   
2. **Простота для маленьких UI**
   - Для больших UI можно вынести в отдельные файлы:
   ```typescript
   const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.html');
   const html = fs.readFileSync(htmlPath.fsPath, 'utf8');
   ```

3. **Можно использовать React/Vue/Svelte:**
   ```
   ┌─────────────────────────────┐
   │ Build React App             │
   │ npm run build → dist/       │
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌─────────────────────────────┐
   │ Загружаем bundle.js в       │
   │ WebView через <script>      │
   └─────────────────────────────┘
   ```

### Альтернативные подходы:

**1. Отдельные файлы:**
```
src/
  webview/
    sidebar.html
    sidebar.css
    sidebar.js
```

**2. React компоненты:**
```typescript
// Собираем React → bundle.js
// Загружаем в WebView
webview.html = `
  <script src="${bundleUri}"></script>
  <div id="root"></div>
`;
```

**3. Template literals (текущий подход):**
```typescript
private _getHtmlForWebview() {
    return `<!DOCTYPE html>
    <html>
        <head>...</head>
        <body>...</body>
    </html>`;
}
```

---

## 🎯 Резюме

```
Extension.ts
    ↓
    Creates: EfCoreManager + SidebarProvider
    ↓
EfCoreManager (Backend logic)
    - Stores settings (workspaceState)
    - Executes dotnet ef commands
    - Works with file system
    ↕
SidebarProvider (UI Controller)
    - Generates HTML
    - Sends data TO WebView (postMessage)
    - Receives events FROM WebView (onDidReceiveMessage)
    ↕
WebView (Frontend)
    - HTML/CSS/JS in iframe
    - acquireVsCodeApi() for communication
    - Isolated from Node.js/VS Code API
```

**Связь идёт ТОЛЬКО через postMessage** - это единственный способ общения между Extension и WebView!

Нужны ещё пояснения по какой-то части? 🤔

