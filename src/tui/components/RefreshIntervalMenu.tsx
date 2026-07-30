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

type ConfigureStatusLineValue = 'refreshInterval' | 'gitCacheTtl';

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

export function buildConfigureStatusLineItems(
    refreshInterval: number | null,
    supportsRefreshInterval: boolean,
    gitCacheTtlSeconds: number
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

export function validateGitCacheTtlInput(value: string): string | null {
    const parsed = parseInt(value, 10);

    if (value === '' || isNaN(parsed)) {
        return '請輸入有效數字';
    }

    if (parsed < 0) {
        return `Git 快取 TTL 最小為 0 秒（輸入了 ${parsed} 秒）`;
    }

    if (parsed > 60) {
        return `Git 快取 TTL 最大為 60 秒（輸入了 ${parsed} 秒）`;
    }

    return null;
}

export interface RefreshIntervalMenuProps {
    currentInterval: number | null;
    supportsRefreshInterval: boolean;
    gitCacheTtlSeconds: number;
    onUpdate: (interval: number | null) => void;
    onGitCacheTtlUpdate: (ttlSeconds: number) => void;
    onBack: () => void;
}

export const RefreshIntervalMenu: React.FC<RefreshIntervalMenuProps> = ({
    currentInterval,
    supportsRefreshInterval,
    gitCacheTtlSeconds,
    onUpdate,
    onGitCacheTtlUpdate,
    onBack
}) => {
    const [editingRefreshInterval, setEditingRefreshInterval] = useState(false);
    const [editingGitCacheTtl, setEditingGitCacheTtl] = useState(false);
    const [refreshInput, setRefreshInput] = useState(() => getRefreshInputValue(currentInterval));
    const [gitCacheTtlInput, setGitCacheTtlInput] = useState(() => String(gitCacheTtlSeconds));
    const [validationError, setValidationError] = useState<string | null>(null);

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

        if (editingGitCacheTtl) {
            if (key.return) {
                const error = validateGitCacheTtlInput(gitCacheTtlInput);

                if (error) {
                    setValidationError(error);
                } else {
                    const value = parseInt(gitCacheTtlInput, 10);
                    onGitCacheTtlUpdate(value);
                    setEditingGitCacheTtl(false);
                    setValidationError(null);
                }
            } else if (key.escape) {
                setGitCacheTtlInput(String(gitCacheTtlSeconds));
                setEditingGitCacheTtl(false);
                setValidationError(null);
            } else if (key.backspace) {
                setGitCacheTtlInput(gitCacheTtlInput.slice(0, -1));
                setValidationError(null);
            } else if (key.delete) {
                // No cursor position in simple input
            } else if (shouldInsertInput(input, key) && /\d/.test(input)) {
                const newValue = gitCacheTtlInput + input;
                if (newValue.length <= 2) {
                    setGitCacheTtlInput(newValue);
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
            ) : editingGitCacheTtl ? (
                <Box marginTop={1} flexDirection='column'>
                    <Text>
                        輸入 Git 快取 TTL（秒，0-60）:
                        {' '}
                        {gitCacheTtlInput}
                        {gitCacheTtlInput.length > 0 ? ' 秒' : ''}
                    </Text>
                    <Text> </Text>
                    <Text dimColor wrap='wrap'>
                        此設定影響 Git 元件多快能察覺到未暫存和未跟蹤的工作區改動。
                    </Text>
                    {validationError ? (
                        <Text color='red'>{validationError}</Text>
                    ) : (
                        <Text dimColor>
                            填 0 關閉按時長過期；快取有效性僅依據 .git/HEAD 和 .git/index 的 mtime。
                        </Text>
                    )}
                    <Text dimColor>按 Enter 確認，ESC 取消。</Text>
                </Box>
            ) : (
                <List
                    marginTop={1}
                    items={buildConfigureStatusLineItems(currentInterval, supportsRefreshInterval, gitCacheTtlSeconds)}
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

                        setGitCacheTtlInput(String(gitCacheTtlSeconds));
                        setEditingGitCacheTtl(true);
                    }}
                    showBackButton={true}
                />
            )}
        </Box>
    );
};
