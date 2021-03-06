import * as vscode from 'vscode';

import { extensionName } from './appGlobals';
import { statusBar } from './StatusBar';
import { ExtensionManager, getExtensionWindowSettings } from './extensionManager';
import { registerSnapshotCodeLens, registerSnapshotPreview } from './SnapshotCodeLens';
import { DebugTestIdentifier } from './DebugCodeLens';

let extensionManager: ExtensionManager;

export function activate(context: vscode.ExtensionContext): void {
  extensionManager = new ExtensionManager(context);

  const languages = [
    { language: 'javascript' },
    { language: 'javascriptreact' },
    { language: 'typescript' },
    { language: 'typescriptreact' },
  ];

  context.subscriptions.push(
    ...statusBar.register((folder: string) => extensionManager.getByName(folder)),

    extensionManager.registerCommand(`${extensionName}.start`, (extension) => {
      vscode.window.showInformationMessage('Started Jest, press escape to hide this message.');
      extension.startProcess();
    }),
    extensionManager.registerCommand(`${extensionName}.stop`, (extension) =>
      extension.stopProcess()
    ),
    extensionManager.registerCommand(`${extensionName}.restart`, (extension) =>
      extension.restartProcess()
    ),
    // dublicate of "show-output" maybe remove?
    extensionManager.registerCommand(`${extensionName}.show-channel`, (extension) =>
      extension.channel.show()
    ),
    extensionManager.registerCommand(`${extensionName}.coverage.toggle`, (extension) =>
      extension.toggleCoverageOverlay()
    ),
    vscode.commands.registerCommand(
      `${extensionName}.run-test`,
      (document: vscode.TextDocument, filename: string, ...identifiers: DebugTestIdentifier[]) => {
        const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspace) {
          console.error(`no workspace found for the given document: ${document.uri.fsPath}`);
          return;
        }
        extensionManager.getByName(workspace.name)?.runTest(workspace, filename, ...identifiers);
      }
    ),
    ...registerSnapshotCodeLens(getExtensionWindowSettings()?.enableSnapshotPreviews ?? false),
    ...registerSnapshotPreview(),
    vscode.languages.registerCodeLensProvider(languages, extensionManager.coverageCodeLensProvider),
    vscode.languages.registerCodeLensProvider(languages, extensionManager.debugCodeLensProvider),
    // this provides the opportunity to inject test names into the DebugConfiguration
    vscode.debug.registerDebugConfigurationProvider(
      'node',
      extensionManager.debugConfigurationProvider
    ),
    // this provides the snippets generation
    vscode.debug.registerDebugConfigurationProvider(
      'vscode-jest-tests',
      extensionManager.debugConfigurationProvider
    ),
    vscode.workspace.onDidChangeConfiguration(
      extensionManager.onDidChangeConfiguration,
      extensionManager
    ),

    vscode.workspace.onDidChangeWorkspaceFolders(
      extensionManager.onDidChangeWorkspaceFolders,
      extensionManager
    ),

    vscode.workspace.onDidCloseTextDocument(
      extensionManager.onDidCloseTextDocument,
      extensionManager
    ),

    vscode.window.onDidChangeActiveTextEditor(
      extensionManager.onDidChangeActiveTextEditor,
      extensionManager
    ),
    vscode.workspace.onDidChangeTextDocument(
      extensionManager.onDidChangeTextDocument,
      extensionManager
    )
  );
}

export function deactivate(): void {
  extensionManager.unregisterAll();
}
