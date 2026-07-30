import {
    Box,
    Text,
    useInput
} from 'ink';
import React from 'react';

import type { ResolvedInstallationMetadata } from '../../types/Settings';
import type {
    ActiveGlobalCommandResolution,
    GlobalPackageInstallation,
    GlobalPackageManager
} from '../../utils/global-package-manager';

import {
    List,
    type ListEntry
} from './List';

export type ManageInstallationAction = 'checkUpdates' | 'uninstall';

export interface UninstallSelection { packageManagers: GlobalPackageManager[] }

export interface ManageInstallationMenuProps {
    installation: ResolvedInstallationMetadata;
    activeCommand: ActiveGlobalCommandResolution | null;
    onSelect: (action: ManageInstallationAction) => void;
    onBack: () => void;
}

export interface UninstallMenuProps {
    installations: GlobalPackageInstallation[];
    onSelect: (selection: UninstallSelection) => void;
    onBack: () => void;
}

function getInstallationLabel(installation: ResolvedInstallationMetadata): string {
    if (installation.method === 'pinned') {
        const version = installation.installedVersion
            ? ` ${installation.installedVersion}`
            : '';
        const manager = installation.packageManager === 'unknown'
            ? ''
            : `，包管理器：${installation.packageManager}`;

        return `固定全域性安裝${manager}${version}`;
    }

    if (installation.method === 'self-managed') {
        return '自管理 / 全域性安裝';
    }

    if (installation.method === 'auto-update') {
        return `透過 ${installation.packageManager} 自動更新`;
    }

    return '未知安裝方式';
}

function getActiveCommandLabel(activeCommand: ActiveGlobalCommandResolution | null): string | null {
    if (!activeCommand?.resolvedPath) {
        return null;
    }

    if (activeCommand.packageManager === 'unknown') {
        return `當前 PATH 匹配：${activeCommand.resolvedPath}`;
    }

    const version = activeCommand.version
        ? ` ${activeCommand.version}`
        : '';

    return `當前 PATH 匹配：${activeCommand.packageManager} 全域性${version}（${activeCommand.resolvedPath}）`;
}

export function buildManageInstallationItems(): ListEntry<ManageInstallationAction>[] {
    return [
        {
            label: '🔄 檢查更新',
            value: 'checkUpdates',
            description: '查詢 npm 上最新版本並更新固定全域性安裝的 ccstatusline-zh-tw 包'
        },
        {
            label: '🔌 解除安裝',
            value: 'uninstall',
            description: '從 Claude Code 設定中移除 ccstatusline-zh-tw，可選同時清理全域性 npm/bun 包'
        }
    ];
}

function formatPackageManagers(packageManagers: GlobalPackageManager[]): string {
    return packageManagers.join(' + ');
}

export function buildUninstallItems(
    installations: GlobalPackageInstallation[]
): ListEntry<UninstallSelection>[] {
    const removableManagers = installations
        .filter(installation => installation.installed && installation.available)
        .map(installation => installation.packageManager);

    const items: ListEntry<UninstallSelection>[] = [
        {
            label: '僅從 Claude Code 設定中移除',
            value: { packageManagers: [] },
            description: '保留已安裝的全域性 npm / bun ccstatusline-zh-tw 包'
        }
    ];

    for (const packageManager of removableManagers) {
        items.push({
            label: `移除 Claude 設定，並解除安裝 ${packageManager} 全域性包`,
            value: { packageManagers: [packageManager] },
            description: `移除 Claude Code 設定後執行 ${packageManager === 'npm'
                ? 'npm uninstall -g ccstatusline-zh-tw'
                : 'bun remove -g ccstatusline-zh-tw'}`
        });
    }

    if (removableManagers.length > 1) {
        items.push({
            label: `移除 Claude 設定，並解除安裝 ${formatPackageManagers(removableManagers)} 全域性包`,
            value: { packageManagers: removableManagers },
            description: '在移除 Claude Code 設定後，刪除所有檢測到的全域性 ccstatusline-zh-tw 包'
        });
    }

    return items;
}

export const ManageInstallationMenu: React.FC<ManageInstallationMenuProps> = ({
    installation,
    activeCommand,
    onSelect,
    onBack
}) => {
    const activeCommandLabel = getActiveCommandLabel(activeCommand);

    useInput((_, key) => {
        if (key.escape) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>Manage Installation</Text>
            <Box marginTop={1}>
                <Text>
                    當前:
                    {' '}
                    {getInstallationLabel(installation)}
                </Text>
            </Box>
            {activeCommandLabel && (
                <Box>
                    <Text dimColor>{activeCommandLabel}</Text>
                </Box>
            )}
            {activeCommand?.warning && (
                <Box marginTop={1}>
                    <Text color='yellow' wrap='wrap'>{activeCommand.warning}</Text>
                </Box>
            )}
            <List
                marginTop={1}
                items={buildManageInstallationItems()}
                onSelect={(value) => {
                    if (value === 'back') {
                        onBack();
                        return;
                    }

                    onSelect(value);
                }}
                showBackButton={true}
            />
        </Box>
    );
};

export const UninstallMenu: React.FC<UninstallMenuProps> = ({
    installations,
    onSelect,
    onBack
}) => {
    const items = buildUninstallItems(installations);
    const detectedManagers = installations
        .filter(installation => installation.installed && installation.available)
        .map(installation => installation.packageManager);

    useInput((_, key) => {
        if (key.escape) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>解除安裝 ccstatusline-zh-tw</Text>
            <Box marginTop={1}>
                <Text dimColor>
                    請選擇要從本機移除的內容。
                </Text>
            </Box>
            {detectedManagers.length === 0 && (
                <Box marginTop={1}>
                    <Text dimColor>未檢測到全域性 npm 或 bun ccstatusline-zh-tw 包。</Text>
                </Box>
            )}
            <List
                marginTop={1}
                items={items}
                onSelect={(value) => {
                    if (value === 'back') {
                        onBack();
                        return;
                    }

                    onSelect(value);
                }}
                showBackButton={true}
            />
        </Box>
    );
};
