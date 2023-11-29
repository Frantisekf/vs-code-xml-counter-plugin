import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

let xmlFileCountCache = new Map<string, number>();
let statusBarXMLCounter: vscode.StatusBarItem;

async function readDirectory(directory: string): Promise<number> {
    const files = await fs.promises.readdir(directory, { withFileTypes: true });
    const counts = await Promise.all(files.map(async (dirent) => {
        if (dirent.name === 'node_modules' || dirent.name.startsWith('.')) {
            return 0;
        }

        const fullPath = path.join(directory, dirent.name);
        if (dirent.isDirectory()) {
            return readDirectory(fullPath);
        } else if (dirent.isFile() && dirent.name.endsWith('.xml')) {
            return 1;
        }
        return 0;
    }));

    return counts.reduce((a, b) => a + b, 0);
}

export async function countXMLFiles(directory: string): Promise<number> {
    return readDirectory(directory);
}

export async function updateXMLFileCount(directory: string): Promise<void> {
    const count = await countXMLFiles(directory);
    xmlFileCountCache.set(directory, count);
    updateStatusBar();
}

function updateStatusBar() {
    const totalCount = Array.from(xmlFileCountCache.values()).reduce((a, b) => a + b, 0);
    statusBarXMLCounter.text = `XML files in the directory: ${totalCount}`;
    statusBarXMLCounter.show();
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    statusBarXMLCounter = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceFolder) {
            await updateXMLFileCount(workspaceFolder);
        }

        const watcher = vscode.workspace.createFileSystemWatcher('**/*.xml');
        watcher.onDidCreate(uri => updateXMLFileCount(path.dirname(uri.fsPath)));
        watcher.onDidDelete(uri => updateXMLFileCount(path.dirname(uri.fsPath)));
        watcher.onDidChange(uri => updateXMLFileCount(path.dirname(uri.fsPath)));

        context.subscriptions.push(statusBarXMLCounter, watcher);
    } catch (error) {
        console.error('Error counting XML files:', error);
    }

    statusBarXMLCounter.show();
}

export function deactivate(): void {
    if (statusBarXMLCounter) {
        statusBarXMLCounter.dispose();
    }
}