import * as vscode from 'vscode';
import { InstantReqViewProvider } from './providers/InstantReqViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Instant Req is now active!');

    // Register the webview view provider for the side panel
    const provider = new InstantReqViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            InstantReqViewProvider.viewType,
            provider
        )
    );
}

export function deactivate() {}
