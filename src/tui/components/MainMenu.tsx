import {
    Box,
    Text
} from 'ink';
import React from 'react';

import type {
    InstallationMetadata,
    Settings
} from '../../types/Settings';
import { type PowerlineFontStatus } from '../../utils/powerline';

import { List } from './List';

export type MainMenuOption = 'lines'
    | 'colors'
    | 'powerline'
    | 'terminalConfig'
    | 'globalOverrides'
    | 'install'
    | 'manageInstallation'
    | 'checkUpdates'
    | 'configureStatusLine'
    | 'exportConfig'
    | 'importConfig'
    | 'starGithub'
    | 'save'
    | 'exit';

export interface MainMenuProps {
    onSelect: (value: MainMenuOption, index: number) => void;
    isClaudeInstalled: boolean;
    hasChanges: boolean;
    initialSelection?: number;
    powerlineFontStatus: PowerlineFontStatus;
    settings: Settings | null;
    installation?: InstallationMetadata;
    previewIsTruncated?: boolean;
}

interface MainMenuItem {
    label: string;
    sublabel?: string;
    disabled?: boolean;
    value: MainMenuOption;
    description: string;
}

export type MainMenuEntry = MainMenuItem | '-';

function usesManageInstallation(installation?: InstallationMetadata): boolean {
    return installation?.method === 'pinned' || installation?.method === 'self-managed';
}

function getInstallationMenuItem(
    isClaudeInstalled: boolean,
    installation?: InstallationMetadata
): MainMenuItem {
    if (!isClaudeInstalled) {
        return {
            label: '📦 安裝到 Claude Code',
            value: 'install',
            description: '將 ccstatusline-zh-tw 新增到 Claude Code 設定以自動渲染狀態列'
        };
    }

    if (usesManageInstallation(installation)) {
        return {
            label: '🧰 管理安裝',
            value: 'manageInstallation',
            description: '檢查已固定的全域性安裝更新或從 Claude Code 解除安裝 ccstatusline-zh-tw'
        };
    }

    return {
        label: '🔌 從 Claude Code 解除安裝',
        value: 'install',
        description: '從 Claude Code 設定中移除 ccstatusline-zh-tw'
    };
}

export function buildMainMenuItems(
    isClaudeInstalled: boolean,
    hasChanges: boolean,
    installation?: InstallationMetadata
): MainMenuEntry[] {
    const menuItems: MainMenuEntry[] = [
        {
            label: '📝 編輯狀態行',
            value: 'lines',
            description:
                '配置多行狀態列，新增模型資訊、Git 狀態、Token 用量等元件'
        },
        {
            label: '🎨 編輯顏色',
            value: 'colors',
            description:
                '為每個元件自定義前景色、背景色和加粗樣式'
        },
        {
            label: '⚡ Powerline 設定',
            value: 'powerline',
            description:
                '安裝 Powerline 字型以獲得更美觀的分隔符和符號'
        },
        '-',
        {
            label: '💻 終端選項',
            value: 'terminalConfig',
            description: '配置終端特定設定以獲得最佳顯示效果'
        },
        {
            label: '🌐 全域性覆蓋',
            value: 'globalOverrides',
            description:
                '設定適用於所有元件的全域性內邊距、分隔符和顏色覆蓋'
        },
        {
            label: '🔧 配置狀態行',
            sublabel: isClaudeInstalled ? undefined : '（請先安裝）',
            disabled: !isClaudeInstalled,
            value: 'configureStatusLine',
            description: '配置 Claude Code 狀態行設定（如重新整理間隔）'
        },
        '-',
        {
            label: '📤 匯出設定',
            value: 'exportConfig',
            description: '將目前設定儲存為 JSON 檔案以便備份或分享'
        },
        {
            label: '📥 匯入設定',
            value: 'importConfig',
            description: '從先前匯出的 JSON 檔案載入設定'
        },
        '-',
        getInstallationMenuItem(isClaudeInstalled, installation)
    ];

    if (hasChanges) {
        menuItems.push(
            '-',
            {
                label: '💾 儲存並退出',
                value: 'save',
                description: '儲存所有更改並退出配置工具'
            },
            {
                label: '❌ 不儲存退出',
                value: 'exit',
                description: '放棄更改並退出'
            },
            '-',
            {
                label: '⭐ 喜歡 ccstatusline-zh-tw？來 GitHub 給個 Star',
                value: 'starGithub',
                description: '在瀏覽器中開啟 ccstatusline-zh-tw GitHub 倉庫以 Star 本專案'
            }
        );
    } else {
        menuItems.push(
            '-',
            {
                label: '🚪 退出',
                value: 'exit',
                description: '退出配置工具'
            },
            '-',
            {
                label: '⭐ 喜歡 ccstatusline-zh-tw？來 GitHub 給個 Star',
                value: 'starGithub',
                description: '在瀏覽器中開啟 ccstatusline-zh-tw GitHub 倉庫以 Star 本專案'
            }
        );
    }

    return menuItems;
}

export function getMainMenuSelectionIndex(items: MainMenuEntry[], option: MainMenuOption): number {
    let selectionIndex = 0;

    for (const item of items) {
        if (item === '-') {
            continue;
        }

        if (item.value === option) {
            return selectionIndex;
        }

        if (!item.disabled) {
            selectionIndex += 1;
        }
    }

    return 0;
}

export function getMainMenuInstallSelectionIndex(
    isClaudeInstalled: boolean,
    installation?: InstallationMetadata
): number {
    const option = isClaudeInstalled && usesManageInstallation(installation)
        ? 'manageInstallation'
        : 'install';

    return getMainMenuSelectionIndex(buildMainMenuItems(isClaudeInstalled, false, installation), option);
}

export const MainMenu: React.FC<MainMenuProps> = ({
    onSelect,
    isClaudeInstalled,
    hasChanges,
    initialSelection = 0,
    powerlineFontStatus,
    settings,
    installation,
    previewIsTruncated
}) => {
    const menuItems = buildMainMenuItems(isClaudeInstalled, hasChanges, installation);

    // Check if we should show the truncation warning
    const showTruncationWarning
        = previewIsTruncated && settings?.flexMode === 'full-minus-40';

    return (
        <Box flexDirection='column'>
            {showTruncationWarning && (
                <Box marginBottom={1}>
                    <Text color='yellow'>
                        ⚠ 部分行被截斷，請檢視 終端選項 → 終端寬度
                        瞭解詳情
                    </Text>
                </Box>
            )}

            <Text bold>主選單</Text>

            <List
                items={menuItems}
                marginTop={1}
                onSelect={(value, index) => {
                    if (value === 'back') {
                        return;
                    }

                    onSelect(value, index);
                }}
                initialSelection={initialSelection}
            />
        </Box>
    );
};
