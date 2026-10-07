import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import { shouldInsertInput } from '../../utils/input-guards';

import {
    List,
    type ListEntry
} from './List';

type TtlField = 'gitCacheTtl' | 'customCommandCacheTtl' | 'terminalWidthCacheTtl';
type ConfigureStatusLineValue = 'refreshInterval' | TtlField;

function getRefreshInputValue(interval: number | null): string {
    return interval === null ? '' : String(interval);
}

function getRefreshIntervalSublabel(interval: number | null, supported: boolean): string {
    if (!supported) {
        return '（需要 Claude Code ≥ 2.1.97）';
    }

    if (interval === null) {
        return '（未設定）';
    }

    return `（${interval} 秒）`;
}

function getGitCacheTtlSublabel(ttlSeconds: number): string {
    return ttlSeconds === 0
        ? '（僅 mtime）'
        : `（${ttlSeconds} 秒）`;
}

function getCacheTtlSublabel(ttlSeconds: number): string {
    return ttlSeconds === 0
        ? '（已停用）'
        : `（${ttlSeconds} 秒）`;
}

export function buildConfigureStatusLineItems(
    refreshInterval: number | null,
    supportsRefreshInterval: boolean,
    gitCacheTtlSeconds: number,
    customCommandCacheTtlSeconds: number,
    terminalWidthCacheTtlSeconds: number
): ListEntry<ConfigureStatusLineValue>[] {
    return [
        {
            label: '🔄 重新整理間隔',
            sublabel: getRefreshIntervalSublabel(refreshInterval, supportsRefreshInterval),
            value: 'refreshInterval',
            disabled: !supportsRefreshInterval,
            description: supportsRefreshInterval
                ? 'Claude Code 重新執行狀態列命令的頻率。輸入秒數 (1-60)，留空即移除。'
                : '本設定需要 Claude Code 2.1.97 或更高版本。請升級 Claude Code 後再使用。'
        },
        {
            label: '🧮 Git 快取 TTL',
            sublabel: getGitCacheTtlSublabel(gitCacheTtlSeconds),
            value: 'gitCacheTtl',
            description: 'Git 元件子程序輸出在 .git/HEAD 與 .git/index 未變動期間可複用的時長。輸入 0-60 秒；\n填 0 關閉按時長過期，快取輸出會一直複用，直到這些 git 後設資料 mtime 發生變化。'
        },
        {
            label: '🔧 自定義命令快取 TTL',
            sublabel: getCacheTtlSublabel(customCommandCacheTtlSeconds),
            value: 'customCommandCacheTtl',
            description: '自定義命令輸出在重新執行前可複用的時長。輸入 0-60 秒；\n填 0 關閉快取，每次狀態列重繪都會重新執行命令。'
        },
        {
            label: '🖥️  終端寬度快取 TTL',
            sublabel: getCacheTtlSublabel(terminalWidthCacheTtlSeconds),
            value: 'terminalWidthCacheTtl',
            description: '快取的「未偵測到 TTY」結果在重新探測終端寬度前可信任的時長。輸入 0-300 秒；\n填 0 關閉快取（每次都重新探測）。偵測到的寬度本身從不跨次渲染快取，僅這個無 TTY 的結果會被快取。'
        }
    ];
}

export function validateRefreshIntervalInput(value: string): string | null {
    if (value === '') {
        return null;
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
        return '請輸入有效數字';
    }

    if (parsed < 1) {
        return `最小間隔為 1 秒（輸入了 ${parsed} 秒）`;
    }

    if (parsed > 60) {
        return `最大間隔為 60 秒（輸入了 ${parsed} 秒）`;
    }

    return null;
}

function validateTtlInput(value: string, label: string, maximum = 60): string | null {
    const parsed = parseInt(value, 10);

    if (value === '' || isNaN(parsed)) {
        return '請輸入有效數字';
    }

    if (parsed < 0) {
        return `${label} 最小為 0 秒（輸入了 ${parsed} 秒）`;
    }

    if (parsed > maximum) {
        return `${label} 最大為 ${maximum} 秒（輸入了 ${parsed} 秒）`;
    }

    return null;
}

export function validateGitCacheTtlInput(value: string): string | null {
    return validateTtlInput(value, 'Git 快取 TTL');
}

export function validateCustomCommandCacheTtlInput(value: string): string | null {
    return validateTtlInput(value, '自定義命令快取 TTL');
}

export function validateTerminalWidthCacheTtlInput(value: string): string | null {
    return validateTtlInput(value, '終端寬度快取 TTL', 300);
}

interface TtlFieldConfig {
    currentValue: number;
    maxInputLength: number;
    prompt: string;
    helperText: string;
    hint: string;
    validate: (value: string) => string | null;
    onSave: (ttlSeconds: number) => void;
}

export interface RefreshIntervalMenuProps {
    currentInterval: number | null;
    supportsRefreshInterval: boolean;
    gitCacheTtlSeconds: number;
    customCommandCacheTtlSeconds: number;
    terminalWidthCacheTtlSeconds: number;
    onUpdate: (interval: number | null) => void;
    onGitCacheTtlUpdate: (ttlSeconds: number) => void;
    onCustomCommandCacheTtlUpdate: (ttlSeconds: number) => void;
    onTerminalWidthCacheTtlUpdate: (ttlSeconds: number) => void;
    onBack: () => void;
}

export const RefreshIntervalMenu: React.FC<RefreshIntervalMenuProps> = ({
    currentInterval,
    supportsRefreshInterval,
    gitCacheTtlSeconds,
    customCommandCacheTtlSeconds,
    terminalWidthCacheTtlSeconds,
    onUpdate,
    onGitCacheTtlUpdate,
    onCustomCommandCacheTtlUpdate,
    onTerminalWidthCacheTtlUpdate,
    onBack
}) => {
    const [editingRefreshInterval, setEditingRefreshInterval] = useState(false);
    const [editingTtlField, setEditingTtlField] = useState<TtlField | null>(null);
    const [refreshInput, setRefreshInput] = useState(() => getRefreshInputValue(currentInterval));
    const [ttlInput, setTtlInput] = useState(() => String(gitCacheTtlSeconds));
    const [validationError, setValidationError] = useState<string | null>(null);

    const ttlFields: Record<TtlField, TtlFieldConfig> = {
        gitCacheTtl: {
            currentValue: gitCacheTtlSeconds,
            maxInputLength: 2,
            prompt: '輸入 Git 快取 TTL（秒，0-60）:',
            helperText: '此設定影響 Git 元件多快能察覺到未暫存和未跟蹤的工作區改動。',
            hint: '填 0 關閉按時長過期；快取有效性僅依據 .git/HEAD 和 .git/index 的 mtime。',
            validate: validateGitCacheTtlInput,
            onSave: onGitCacheTtlUpdate
        },
        customCommandCacheTtl: {
            currentValue: customCommandCacheTtlSeconds,
            maxInputLength: 2,
            prompt: '輸入自定義命令快取 TTL（秒，0-60）:',
            helperText: '此設定影響自定義命令元件多快能顯示新輸出，以及多常重新啟動一個 shell。',
            hint: '填 0 關閉快取；每次狀態列重繪都會重新執行命令。',
            validate: validateCustomCommandCacheTtlInput,
            onSave: onCustomCommandCacheTtlUpdate
        },
        terminalWidthCacheTtl: {
            currentValue: terminalWidthCacheTtlSeconds,
            maxInputLength: 3,
            prompt: '輸入終端寬度快取 TTL（秒，0-300）:',
            helperText: '控制「未偵測到 TTY」結果的快取時長。偵測到的寬度在下次渲染時總會重新探測，因此視窗縮放會立即生效。',
            hint: '填 0 關閉快取（每次都重新探測）。',
            validate: validateTerminalWidthCacheTtlInput,
            onSave: onTerminalWidthCacheTtlUpdate
        }
    };

    useInput((input, key) => {
        if (editingRefreshInterval) {
            if (key.return) {
                if (refreshInput === '') {
                    onUpdate(null);
                    setEditingRefreshInterval(false);
                    setValidationError(null);
                    return;
                }

                const error = validateRefreshIntervalInput(refreshInput);

                if (error) {
                    setValidationError(error);
                } else {
                    const value = parseInt(refreshInput, 10);
                    onUpdate(value);
                    setEditingRefreshInterval(false);
                    setValidationError(null);
                }
            } else if (key.escape) {
                setRefreshInput(getRefreshInputValue(currentInterval));
                setEditingRefreshInterval(false);
                setValidationError(null);
            } else if (key.backspace) {
                setRefreshInput(refreshInput.slice(0, -1));
                setValidationError(null);
            } else if (key.delete) {
                // No cursor position in simple input
            } else if (shouldInsertInput(input, key) && /\d/.test(input)) {
                const newValue = refreshInput + input;
                if (newValue.length <= 2) {
                    setRefreshInput(newValue);
                    setValidationError(null);
                }
            }
            return;
        }

        if (editingTtlField) {
            const field = ttlFields[editingTtlField];

            if (key.return) {
                const error = field.validate(ttlInput);

                if (error) {
                    setValidationError(error);
                } else {
                    const value = parseInt(ttlInput, 10);
                    field.onSave(value);
                    setEditingTtlField(null);
                    setValidationError(null);
                }
            } else if (key.escape) {
                setTtlInput(String(field.currentValue));
                setEditingTtlField(null);
                setValidationError(null);
            } else if (key.backspace) {
                setTtlInput(ttlInput.slice(0, -1));
                setValidationError(null);
            } else if (key.delete) {
                // No cursor position in simple input
            } else if (shouldInsertInput(input, key) && /\d/.test(input)) {
                const newValue = ttlInput + input;
                if (newValue.length <= field.maxInputLength) {
                    setTtlInput(newValue);
                    setValidationError(null);
                }
            }
            return;
        }

        if (key.escape) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>配置狀態行</Text>
            <Text color='white'>配置 Claude Code 狀態行設定</Text>

            {editingRefreshInterval ? (
                <Box marginTop={1} flexDirection='column'>
                    <Text>
                        輸入重新整理間隔（秒，1-60）:
                        {' '}
                        {refreshInput}
                        {refreshInput.length > 0 ? ' 秒' : ''}
                    </Text>
                    {validationError ? (
                        <Text color='red'>{validationError}</Text>
                    ) : (
                        <Text dimColor>按 Enter 確認，ESC 取消。留空即移除。</Text>
                    )}
                </Box>
            ) : editingTtlField ? (
                <Box marginTop={1} flexDirection='column'>
                    <Text>
                        {ttlFields[editingTtlField].prompt}
                        {' '}
                        {ttlInput}
                        {ttlInput.length > 0 ? ' 秒' : ''}
                    </Text>
                    <Text> </Text>
                    <Text dimColor wrap='wrap'>
                        {ttlFields[editingTtlField].helperText}
                    </Text>
                    {validationError ? (
                        <Text color='red'>{validationError}</Text>
                    ) : (
                        <Text dimColor>
                            {ttlFields[editingTtlField].hint}
                        </Text>
                    )}
                    <Text dimColor>按 Enter 確認，ESC 取消。</Text>
                </Box>
            ) : (
                <List
                    marginTop={1}
                    items={buildConfigureStatusLineItems(
                        currentInterval,
                        supportsRefreshInterval,
                        gitCacheTtlSeconds,
                        customCommandCacheTtlSeconds,
                        terminalWidthCacheTtlSeconds
                    )}
                    onSelect={(value) => {
                        if (value === 'back') {
                            onBack();
                            return;
                        }

                        if (value === 'refreshInterval') {
                            setRefreshInput(getRefreshInputValue(currentInterval));
                            setEditingRefreshInterval(true);
                            return;
                        }

                        setTtlInput(String(ttlFields[value].currentValue));
                        setEditingTtlField(value);
                    }}
                    showBackButton={true}
                />
            )}
        </Box>
    );
};
