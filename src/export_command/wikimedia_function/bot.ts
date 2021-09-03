/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Rowe Wilson Frederisk Holme. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import MWBot from 'mwbot';
import * as vscode from 'vscode';
import { getHost } from '../host_function/host';
import { Action } from './args';
import { showMWErrorMessage } from './errmsg';

export let bot: MWBot | undefined;

export async function login(): Promise<void> {
    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("wikitext");

    const host: string | undefined = await getHost();
    if (!host) { return undefined; }

    const userInfo: { username?: string; password?: string } = {
        username: config.get('userName'),
        password: config.get('password')
    };

    if (!userInfo.username || !userInfo.password) {
        vscode.window.showWarningMessage("You have not filled in the user name or password, please go to the settings to edit them and try again.");
        return undefined;
    }

    bot = new MWBot({
        apiUrl: config.get("transferProtocol") + host + config.get("apiPath")
    });
    const barMessage: vscode.Disposable = vscode.window.setStatusBarMessage("Wikitext: Login...");
    try {
        const response = await bot?.login(userInfo);
        vscode.window.showInformationMessage(`User "${response.lgusername}"(UserID:"${response.lguserid}") Login Result is "${response.result}". Login Token is "${response.token}".`
        );
    }
    catch (error) {
        showMWErrorMessage('login', error);
    }
    finally {
        barMessage.dispose();
    }
}

export async function logout(): Promise<void> {
    await bot?.getEditToken();
    const barMessage: vscode.Disposable = vscode.window.setStatusBarMessage("Wikitext: Logout...");
    try {
        // it will be {} if success
        await bot?.request({
            'action': Action.logout,
            'token': bot.editToken
        });
        // clear bot
        bot = undefined;
        vscode.window.showInformationMessage('result: "Success"');
    }
    catch (error) {
        showMWErrorMessage('logout', error);
    }
    finally {
        barMessage.dispose();
    }
}

export async function getBot(): Promise<MWBot | undefined> {
    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("wikitext");
    let tbot: MWBot;
    if (bot) {
        tbot = bot;
    }
    else {
        // get host
        const host: string | undefined = await getHost();
        if (!host) { return undefined; }
        tbot = new MWBot({
            apiUrl: config.get("transferProtocol") + host + config.get("apiPath")
        });
    }
    return tbot;
}
