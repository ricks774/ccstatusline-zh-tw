import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import type { InstallationMetadata } from '../../types/Settings';
import {
    CCSTATUSLINE_COMMANDS,
    PINNED_INSTALL_COMMANDS,
    getClaudeSettingsPath,
    type PackageCommandAvailability,
    type StatusLineCommandMode
} from '../../utils/claude-settings';

import {
    List,
    type ListEntry
} from './List';

export type InstallUpdateStyle = 'auto-update' | 'pinned';
export type InstallPackageManager = 'npm' | 'bun';

export interface InstallSelection {
    updateStyle: InstallUpdateStyle;
    packageManager: InstallPackageManager;
    commandMode: StatusLineCommandMode;
    metadata: InstallationMetadata;
    displayedCommand: string;
    globalInstallCommand?: string;
}

export interface InstallMenuProps {
    commandAvailability: PackageCommandAvailability;
    currentVersion: string;
    existingStatusLine: string | null;
    onSelect: (selection: InstallSelection) => void;
    onCancel: () => void;
    initialPackageSelection?: number;
}

type InstallStep = 'style' | 'manager';

const AUTO_UPDATE_DESCRIPTION = '透過 npx/bunx 執行 `@latest`，自動跟隨最新版本；每次啟動會有少量包解析開銷。如果你希望顯式控制升級，可以改用「固定全域性安裝」。';

function getPinnedDescription(currentVersion: string): string {
    return `將 \`ccstatusline-zh-tw@${currentVersion}\` 全域性安裝，Claude Code 直接呼叫 \`ccstatusline-zh-tw\`，每次渲染更快，只有手動更新時才會變化。`;
}

function getStyleItems(currentVersion: string): ListEntry<InstallUpdateStyle>[] {
    return [
        {
            label: '固定全域性安裝',
            value: 'pinned',
            description: getPinnedDescription(currentVersion)
        },
        {
            label: '自動更新',
            value: 'auto-update',
            description: AUTO_UPDATE_DESCRIPTION
        }
    ];
}

function getManagerItems(
    updateStyle: InstallUpdateStyle,
    commandAvailability: PackageCommandAvailability,
    currentVersion: string
): ListEntry<InstallPackageManager>[] {
    if (updateStyle === 'auto-update') {
        return [
            {
                label: CCSTATUSLINE_COMMANDS.AUTO_NPX,
                value: 'npm',
                disabled: !commandAvailability.npx,
                sublabel: commandAvailability.npx ? undefined : '（未檢測到 npx）'
            },
            {
                label: CCSTATUSLINE_COMMANDS.AUTO_BUNX,
                value: 'bun',
                disabled: !commandAvailability.bunx,
                sublabel: commandAvailability.bunx ? undefined : '（未檢測到 bunx）'
            }
        ];
    }

    return [
        {
            label: PINNED_INSTALL_COMMANDS.NPM(currentVersion),
            value: 'npm',
            disabled: !commandAvailability.npm,
            sublabel: commandAvailability.npm ? undefined : '（未檢測到 npm）'
        },
        {
            label: PINNED_INSTALL_COMMANDS.BUN(currentVersion),
            value: 'bun',
            disabled: !commandAvailability.bun,
            sublabel: commandAvailability.bun ? undefined : '（未檢測到 bun）'
        }
    ];
}

function buildSelection(
    updateStyle: InstallUpdateStyle,
    packageManager: InstallPackageManager,
    currentVersion: string
): InstallSelection {
    if (updateStyle === 'auto-update') {
        return {
            updateStyle,
            packageManager,
            commandMode: packageManager === 'bun' ? 'auto-bunx' : 'auto-npx',
            displayedCommand: packageManager === 'bun'
                ? CCSTATUSLINE_COMMANDS.AUTO_BUNX
                : CCSTATUSLINE_COMMANDS.AUTO_NPX,
            metadata: {
                method: 'auto-update',
                packageManager
            }
        };
    }

    return {
        updateStyle,
        packageManager,
        commandMode: 'global',
        displayedCommand: packageManager === 'bun'
            ? PINNED_INSTALL_COMMANDS.BUN(currentVersion)
            : PINNED_INSTALL_COMMANDS.NPM(currentVersion),
        globalInstallCommand: packageManager === 'bun'
            ? PINNED_INSTALL_COMMANDS.BUN(currentVersion)
            : PINNED_INSTALL_COMMANDS.NPM(currentVersion),
        metadata: {
            method: 'pinned',
            installedVersion: currentVersion
        }
    };
}

export const InstallMenu: React.FC<InstallMenuProps> = ({
    commandAvailability,
    currentVersion,
    existingStatusLine,
    onSelect,
    onCancel,
    initialPackageSelection = 0
}) => {
    const [step, setStep] = useState<InstallStep>('style');
    const [updateStyle, setUpdateStyle] = useState<InstallUpdateStyle>('pinned');

    useInput((_, key) => {
        if (key.escape) {
            if (step === 'manager') {
                setStep('style');
                return;
            }

            onCancel();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>安裝 ccstatusline-zh-tw 到 Claude Code</Text>

            {existingStatusLine && (
                <Box marginBottom={1}>
                    <Text color='yellow'>
                        ⚠ 當前狀態列: "
                        {existingStatusLine}
                        "
                    </Text>
                </Box>
            )}

            {step === 'style' && (
                <>
                    <Box>
                        <Text dimColor>選擇安裝方式：</Text>
                    </Box>

                    <List
                        color='blue'
                        marginTop={1}
                        items={getStyleItems(currentVersion)}
                        onSelect={(value) => {
                            if (value === 'back') {
                                onCancel();
                                return;
                            }

                            setUpdateStyle(value);
                            setStep('manager');
                        }}
                        initialSelection={0}
                        showBackButton={true}
                    />
                </>
            )}

            {step === 'manager' && (
                <>
                    <Box>
                        <Text dimColor>選擇包管理器：</Text>
                    </Box>

                    <List
                        color='blue'
                        marginTop={1}
                        items={getManagerItems(updateStyle, commandAvailability, currentVersion)}
                        onSelect={(value) => {
                            if (value === 'back') {
                                setStep('style');
                                return;
                            }

                            onSelect(buildSelection(updateStyle, value, currentVersion));
                        }}
                        initialSelection={initialPackageSelection}
                        showBackButton={true}
                    />
                </>
            )}

            <Box marginTop={2}>
                <Text dimColor>
                    所選命令將寫入
                    {' '}
                    {getClaudeSettingsPath()}
                </Text>
            </Box>

            <Box marginTop={1}>
                <Text dimColor>按 Enter 選擇，ESC 返回</Text>
            </Box>
        </Box>
    );
};
