import { render } from 'ink';
import { PassThrough } from 'node:stream';
import React, { useState } from 'react';
import stripAnsi from 'strip-ansi';
import {
    describe,
    expect,
    it,
    vi
} from 'vitest';

import { DEFAULT_SETTINGS } from '../../../types/Settings';
import type { WidgetItem } from '../../../types/Widget';
import { waitFor } from '../../__tests__/helpers/wait-for-ink';
import { ItemsEditor } from '../ItemsEditor';

class MockTtyStream extends PassThrough {
    isTTY = true;
    columns = 120;
    rows = 40;

    setRawMode() {
        return this;
    }

    ref() {
        return this;
    }

    unref() {
        return this;
    }
}

interface CapturedWriteStream extends NodeJS.WriteStream {
    clearOutput: () => void;
    getOutput: () => string;
}

function createMockStdin(): NodeJS.ReadStream {
    return new MockTtyStream() as unknown as NodeJS.ReadStream;
}

function createMockStdout(): CapturedWriteStream {
    const stream = new MockTtyStream();
    const chunks: string[] = [];

    stream.on('data', (chunk: Buffer | string) => {
        chunks.push(chunk.toString());
    });

    return Object.assign(stream as unknown as NodeJS.WriteStream, {
        clearOutput() {
            chunks.length = 0;
        },
        getOutput() {
            return chunks.join('');
        }
    });
}

function flushInk() {
    return new Promise((resolve) => {
        setTimeout(resolve, 25);
    });
}

function StatefulItemsEditor({ initialWidgets }: { initialWidgets: WidgetItem[] }) {
    const [widgets, setWidgets] = useState(initialWidgets);

    return React.createElement(ItemsEditor, {
        widgets,
        onUpdate: setWidgets,
        onBack: vi.fn(),
        lineNumber: 1,
        settings: DEFAULT_SETTINGS
    });
}

describe('ItemsEditor', () => {
    it('shows only non-default number styles beside the widget name', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();

        const instance = render(
            React.createElement(StatefulItemsEditor, { initialWidgets: [{ id: '1', type: 'tokens-input' }] }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 輸入 Token');
            expect(stripAnsi(stdout.getOutput())).not.toContain('(compact)');

            stdout.clearOutput();
            stdin.write('.');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 輸入 Token (compact)');

            stdout.clearOutput();
            stdin.write('.');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 輸入 Token (whole)');

            stdout.clearOutput();
            stdin.write('.');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 輸入 Token');
            expect(stripAnsi(stdout.getOutput())).not.toContain('(compact)');
            expect(stripAnsi(stdout.getOutput())).not.toContain('(whole)');
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });

    it('preserves existing widget modifiers before the number style', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();

        const instance = render(
            React.createElement(ItemsEditor, {
                widgets: [{
                    id: '1',
                    type: 'cache-read',
                    metadata: { cacheScopeSession: 'true' },
                    numberFormat: { style: 'compact' }
                }],
                onUpdate: vi.fn(),
                onBack: vi.fn(),
                lineNumber: 1,
                settings: DEFAULT_SETTINGS
            }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 快取讀取 (session) (compact)');
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });
    it('edits a widget label and hides the label keybind in raw value mode', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();

        const instance = render(
            React.createElement(StatefulItemsEditor, { initialWidgets: [{ id: '1', type: 'model' }] }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('(e)編輯標籤…');

            stdout.clearOutput();
            stdin.write('e');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('（預設: "模型: "）');

            // Trim "模型: " down to "模", one backspace per keypress
            for (const key of Array.from('型: ', () => '\x7f')) {
                stdin.write(key);
                await flushInk();
            }
            stdin.write(' ');
            await flushInk();
            stdout.clearOutput();
            stdin.write('\r');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 模型 （標籤: "模 "）');

            stdout.clearOutput();
            stdin.write('r');
            await flushInk();
            const rawOutput = stripAnsi(stdout.getOutput());
            expect(rawOutput).toContain('(raw value)');
            expect(rawOutput).not.toContain('(e)編輯標籤…');
            expect(rawOutput).not.toContain('（標籤:');
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });

    it.each([
        { query: '會話費用', name: '會話費用', keepsLabel: false },
        { query: '模型', name: '模型', keepsLabel: true }
    ])('preserves the label only when reselecting the same type: $name', async ({ query, name, keepsLabel }) => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();

        const instance = render(
            React.createElement(StatefulItemsEditor, { initialWidgets: [{ id: '1', type: 'model', metadata: { label: 'M ' } }] }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 模型 （標籤: "M "）');

            stdin.write('\x1b[C');
            await flushInk();
            for (const char of query) {
                stdin.write(char);
                await flushInk();
            }
            stdout.clearOutput();
            stdin.write('\r');
            await flushInk();
            const output = stripAnsi(stdout.getOutput());
            expect(output).toContain(`1. ${name}`);
            if (keepsLabel) {
                expect(output).toContain('（標籤: "M "）');
            } else {
                expect(output).not.toContain('（標籤:');
            }
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });

    it('keeps every key typed into the label editor before a re-render', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();

        const instance = render(
            React.createElement(StatefulItemsEditor, { initialWidgets: [{ id: '1', type: 'model' }] }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await flushInk();
            stdin.write('e');
            await flushInk();

            // One macrotask apart: separate keypresses, but no re-render between them
            stdin.write('\x7f');
            await new Promise(resolve => setImmediate(resolve));
            stdin.write('\x7f');
            await flushInk();
            stdout.clearOutput();
            stdin.write('\r');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('1. 模型 （標籤: "模型"）');
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });

    it.each([
        { type: 'model', openKey: 'e', prompt: '（預設: "模型: "）', edit: 'X', expected: '1. 模型 （標籤: "模型: X"）' },
        { type: 'model', openKey: 'e', prompt: '（預設: "模型: "）', edit: '\x7f', expected: '1. 模型 （標籤: "模型:"）' },
        { type: 'custom-text', openKey: 'e', prompt: '輸入自定義文字：', edit: 'X', expected: '1. 自定義文字 (HelloX)' },
        { type: 'custom-text', openKey: 'e', prompt: '輸入自定義文字：', edit: '\x7f', expected: '1. 自定義文字 (Hell)' }
    ])('saves the latest $type edit when Enter arrives before a redraw ($edit)', async ({ type, openKey, prompt, edit, expected }) => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();
        const instance = render(
            React.createElement(StatefulItemsEditor, { initialWidgets: [{ id: '1', type, customText: 'Hello' }] }),
            { stdin, stdout, stderr, debug: true, exitOnCtrlC: false, patchConsole: false }
        );

        try {
            await waitFor(() => {
                expect(stripAnsi(stdout.getOutput())).toContain('1. ');
            });
            stdout.clearOutput();
            stdin.write(openKey);
            await waitFor(() => {
                expect(stripAnsi(stdout.getOutput())).toContain(prompt);
            });

            stdout.clearOutput();
            stdin.write(edit);
            await new Promise(resolve => setImmediate(resolve));
            stdin.write('\r');
            await waitFor(() => {
                expect(stripAnsi(stdout.getOutput())).toContain(expected);
            });
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });

    it('shows a joined emoji label in full beside its default', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();

        const instance = render(
            React.createElement(StatefulItemsEditor, { initialWidgets: [{ id: '1', type: 'model', metadata: { label: '\u{1F469}\u200D\u{1F4BB} ' } }] }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await flushInk();
            stdout.clearOutput();
            stdin.write('e');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('"\u{1F469}\u200D\u{1F4BB}  " （預設: "模型: "）');
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });

    it('keeps a label equal to the bar-mode default for every mode, and Tab clears it', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();

        const instance = render(
            React.createElement(StatefulItemsEditor, { initialWidgets: [{ id: '1', type: 'block-timer', metadata: { display: 'progress' } }] }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await flushInk();
            stdin.write('e');
            await flushInk();
            stdout.clearOutput();
            stdin.write('\r');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).toContain('（標籤: "時段 "）');

            stdin.write('e');
            await flushInk();
            stdout.clearOutput();
            stdin.write('\t');
            await flushInk();
            expect(stripAnsi(stdout.getOutput())).not.toContain('（標籤:');
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });

    it('offers (m)erge on the last widget only to clear a merge left on it', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();
        const stderr = createMockStdout();
        // Debug mode writes whole frames; the last one starts at the last title
        const lastFrame = () => {
            const output = stripAnsi(stdout.getOutput());
            return output.slice(output.lastIndexOf('Edit Line 1'));
        };

        const instance = render(
            React.createElement(StatefulItemsEditor, {
                initialWidgets: [
                    { id: '1', type: 'model' },
                    { id: '2', type: 'git-branch', merge: true }
                ]
            }),
            {
                stdin,
                stdout,
                stderr,
                debug: true,
                exitOnCtrlC: false,
                patchConsole: false
            }
        );

        try {
            await waitFor(() => {
                expect(lastFrame()).toContain('▶  1. 模型');
            });

            stdin.write('\u001B[B');
            await waitFor(() => {
                expect(lastFrame()).toContain('▶  2. Git 分支 (merged→)');
            });
            expect(lastFrame()).toContain('(m)合併');

            stdin.write('m');
            await waitFor(() => {
                expect(lastFrame()).toContain('▶  2. Git 分支');
                expect(lastFrame()).not.toContain('(merged→)');
            });
            expect(lastFrame()).not.toContain('(m)合併');
        } finally {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    });
});
