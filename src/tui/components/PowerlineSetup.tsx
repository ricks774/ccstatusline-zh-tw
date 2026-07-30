import {
    Box,
    Text,
    useInput
} from 'ink';
import * as os from 'os';
import React, { useState } from 'react';

import type { PowerlineConfig } from '../../types/PowerlineConfig';
import type { Settings } from '../../types/Settings';
import { type PowerlineFontStatus } from '../../utils/powerline';
import { buildEnabledPowerlineSettings } from '../../utils/powerline-settings';

import { ConfirmDialog } from './ConfirmDialog';
import {
    List,
    type ListEntry
} from './List';
import { PowerlineSeparatorEditor } from './PowerlineSeparatorEditor';
import { PowerlineThemeSelector } from './PowerlineThemeSelector';

type PowerlineMenuValue = 'separator' | 'startCap' | 'endCap' | 'themes';
type Screen = 'menu' | PowerlineMenuValue;
function formatPowerlineMenuLabel(label: string): string {
    // 中文字元佔 2 個終端寬度，計算實際顯示寬度後用空格補齊
    const segmenter = new Intl.Segmenter();
    const displayWidth = Array.from(segmenter.segment(label)).reduce((w, { segment: ch }) => w + ((ch.codePointAt(0) ?? 0) > 0x7F ? 2 : 1), 0);
    const targetWidth = 10;
    const padCount = Math.max(0, targetWidth - displayWidth);
    return label + ' '.repeat(padCount);
}

export function getSeparatorDisplay(powerlineConfig: PowerlineConfig): string {
    const seps = powerlineConfig.separators;

    if (seps.length > 1) {
        return '多個';
    }

    const sep = seps[0] ?? '\uE0B0';
    const presets = [
        { char: '\uE0B0', name: '右三角' },
        { char: '\uE0B2', name: '左三角' },
        { char: '\uE0B4', name: '右圓弧' },
        { char: '\uE0B6', name: '左圓弧' }
    ];
    const preset = presets.find(item => item.char === sep);

    if (preset) {
        return `${preset.char} - ${preset.name}`;
    }

    return `${sep} - 自定義`;
}

export function getCapDisplay(
    powerlineConfig: PowerlineConfig,
    type: 'start' | 'end'
): string {
    const caps = type === 'start'
        ? powerlineConfig.startCaps
        : powerlineConfig.endCaps;

    if (caps.length === 0) {
        return '無';
    }

    if (caps.length > 1) {
        return '多個';
    }

    const cap = caps[0];

    if (!cap) {
        return '無';
    }

    const presets = type === 'start' ? [
        { char: '\uE0B2', name: '三角' },
        { char: '\uE0B6', name: '圓弧' },
        { char: '\uE0BA', name: '下三角' },
        { char: '\uE0BE', name: '斜線' }
    ] : [
        { char: '\uE0B0', name: '三角' },
        { char: '\uE0B4', name: '圓弧' },
        { char: '\uE0B8', name: '下三角' },
        { char: '\uE0BC', name: '斜線' }
    ];
    const preset = presets.find(item => item.char === cap);

    if (preset) {
        return `${preset.char} - ${preset.name}`;
    }

    return `${cap} - 自定義`;
}

export function getThemeDisplay(powerlineConfig: PowerlineConfig): string {
    const theme = powerlineConfig.theme;

    if (!theme || theme === 'custom') {
        return '自定義';
    }

    return theme.charAt(0).toUpperCase() + theme.slice(1);
}

export function buildPowerlineSetupMenuItems(
    powerlineConfig: PowerlineConfig
): ListEntry<PowerlineMenuValue>[] {
    const disabled = !powerlineConfig.enabled;

    return [
        {
            label: formatPowerlineMenuLabel('分隔符'),
            sublabel: `(${getSeparatorDisplay(powerlineConfig)})`,
            value: 'separator',
            disabled,
            description: '選擇 Powerline 段之間使用的字形。'
        },
        {
            label: formatPowerlineMenuLabel('起始端帽'),
            sublabel: `(${getCapDisplay(powerlineConfig, 'start')})`,
            value: 'startCap',
            disabled,
            description: '配置每行 Powerline 起始位置顯示的端帽字形。'
        },
        {
            label: formatPowerlineMenuLabel('結束端帽'),
            sublabel: `(${getCapDisplay(powerlineConfig, 'end')})`,
            value: 'endCap',
            disabled,
            description: '配置每行 Powerline 結束位置顯示的端帽字形。'
        },
        {
            label: formatPowerlineMenuLabel('主題'),
            sublabel: `(${getThemeDisplay(powerlineConfig)})`,
            value: 'themes',
            disabled,
            description: '預覽內建 Powerline 主題或將主題複製到自定義元件顏色中。'
        }
    ];
}

export interface PowerlineSetupProps {
    settings: Settings;
    powerlineFontStatus: PowerlineFontStatus;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
    onInstallFonts: () => void;
    installingFonts: boolean;
    fontInstallMessage: string | null;
    onClearMessage: () => void;
}

export const PowerlineSetup: React.FC<PowerlineSetupProps> = ({
    settings,
    powerlineFontStatus,
    onUpdate,
    onBack,
    onInstallFonts,
    installingFonts,
    fontInstallMessage,
    onClearMessage
}) => {
    const powerlineConfig = settings.powerline;
    const [screen, setScreen] = useState<Screen>('menu');
    const [selectedMenuItem, setSelectedMenuItem] = useState(0);
    const [confirmingEnable, setConfirmingEnable] = useState(false);
    const [confirmingFontInstall, setConfirmingFontInstall] = useState(false);

    const hasManualSeparatorItems = settings.lines.some(line => line.some(
        item => item.type === 'separator'
    ));
    const hasGlobalFgOverride = Boolean(settings.overrideForegroundColor && settings.overrideForegroundColor !== 'none');
    const globalOverrideMessage = hasGlobalFgOverride ? '⚠ 前景色全域性覆蓋已啟用' : null;

    useInput((input, key) => {
        if (fontInstallMessage || installingFonts) {
            if (fontInstallMessage && !key.escape) {
                onClearMessage();
            }
            return;
        }

        if (confirmingFontInstall || confirmingEnable) {
            return;
        }

        if (screen === 'menu') {
            if (key.escape) {
                onBack();
            } else if (input === 't' || input === 'T') {
                if (!powerlineConfig.enabled) {
                    if (hasManualSeparatorItems) {
                        setConfirmingEnable(true);
                    } else {
                        onUpdate(buildEnabledPowerlineSettings(settings, false));
                    }
                } else {
                    onUpdate({
                        ...settings,
                        powerline: {
                            ...powerlineConfig,
                            enabled: false
                        }
                    });
                }
            } else if (input === 'i' || input === 'I') {
                setConfirmingFontInstall(true);
            } else if ((input === 'a' || input === 'A') && powerlineConfig.enabled) {
                onUpdate({
                    ...settings,
                    powerline: {
                        ...powerlineConfig,
                        autoAlign: !powerlineConfig.autoAlign
                    }
                });
            } else if ((input === 'c' || input === 'C') && powerlineConfig.enabled) {
                onUpdate({
                    ...settings,
                    powerline: {
                        ...powerlineConfig,
                        continueThemeAcrossLines: !powerlineConfig.continueThemeAcrossLines
                    }
                });
            }
        }
    });

    if (screen === 'separator') {
        return (
            <PowerlineSeparatorEditor
                settings={settings}
                mode='separator'
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    if (screen === 'startCap') {
        return (
            <PowerlineSeparatorEditor
                settings={settings}
                mode='startCap'
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    if (screen === 'endCap') {
        return (
            <PowerlineSeparatorEditor
                settings={settings}
                mode='endCap'
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    if (screen === 'themes') {
        return (
            <PowerlineThemeSelector
                settings={settings}
                onUpdate={onUpdate}
                onBack={() => { setScreen('menu'); }}
            />
        );
    }

    return (
        <Box flexDirection='column'>
            {!confirmingFontInstall && !installingFonts && !fontInstallMessage && (
                <Box>
                    <Text bold>Powerline 設定</Text>
                    {globalOverrideMessage && (
                        <Text color='yellow' dimColor>
                            {'.  '}
                            {globalOverrideMessage}
                        </Text>
                    )}
                </Box>
            )}

            {confirmingFontInstall ? (
                <Box flexDirection='column'>
                    <Box marginBottom={1}>
                        <Text color='cyan' bold>字型安裝</Text>
                    </Box>

                    <Box marginBottom={1} flexDirection='column'>
                        <Text bold>將會執行：</Text>
                        <Text>
                            <Text dimColor>• 從以下地址克隆字型 </Text>
                            <Text color='blue'>https://github.com/powerline/fonts</Text>
                        </Text>
                        {os.platform() === 'darwin' && (
                            <>
                                <Text dimColor>• 執行 install.sh 指令碼：</Text>
                                <Text dimColor>  - 複製所有 .ttf/.otf 檔案到 ~/Library/Fonts</Text>
                                <Text dimColor>  - 在 macOS 中註冊字型</Text>
                            </>
                        )}
                        {os.platform() === 'linux' && (
                            <>
                                <Text dimColor>• 執行 install.sh 指令碼：</Text>
                                <Text dimColor>  - 複製所有 .ttf/.otf 檔案到 ~/.local/share/fonts</Text>
                                <Text dimColor>  - 執行 fc-cache 更新字型快取</Text>
                            </>
                        )}
                        {os.platform() === 'win32' && (
                            <>
                                <Text dimColor>• 複製 Powerline .ttf/.otf 檔案到：</Text>
                                <Text dimColor>  AppData\Local\Microsoft\Windows\Fonts</Text>
                            </>
                        )}
                        <Text dimColor>• 清理臨時檔案</Text>
                    </Box>

                    <Box marginBottom={1}>
                        <Text color='yellow' bold>前提條件：</Text>
                        <Text dimColor>已安裝 Git、網路連線、寫入許可權</Text>
                    </Box>

                    <Box marginBottom={1} flexDirection='column'>
                        <Text color='green' bold>安裝後：</Text>
                        <Text dimColor>• 重啟終端</Text>
                        <Text dimColor>• 選擇一個 Powerline 字型</Text>
                        <Text dimColor>  （例如 "Meslo LG S for Powerline"）</Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text>是否繼續？</Text>
                    </Box>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            inline={true}
                            onConfirm={() => {
                                setConfirmingFontInstall(false);
                                onInstallFonts();
                            }}
                            onCancel={() => {
                                setConfirmingFontInstall(false);
                            }}
                        />
                    </Box>
                </Box>
            ) : confirmingEnable ? (
                <Box flexDirection='column' marginTop={1}>
                    {hasManualSeparatorItems && (
                        <>
                            <Box>
                                <Text color='yellow'>⚠ 警告：啟用 Powerline 模式將移除狀態列中所有現有的分隔符和彈性分隔符。</Text>
                            </Box>
                            <Box marginBottom={1}>
                                <Text dimColor>Powerline 模式使用自己的分隔符系統，與手動分隔符不相容。</Text>
                            </Box>
                        </>
                    )}
                    <Box marginTop={hasManualSeparatorItems ? 1 : 0}>
                        <Text>是否要繼續？</Text>
                    </Box>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            inline={true}
                            onConfirm={() => {
                                onUpdate(buildEnabledPowerlineSettings(settings, true));
                                setConfirmingEnable(false);
                            }}
                            onCancel={() => {
                                setConfirmingEnable(false);
                            }}
                        />
                    </Box>
                </Box>
            ) : installingFonts ? (
                <Box>
                    <Text color='yellow'>正在安裝 Powerline 字型... 這可能需要一些時間。</Text>
                </Box>
            ) : fontInstallMessage ? (
                <Box flexDirection='column'>
                    <Text color={fontInstallMessage.includes('success') ? 'green' : 'red'}>
                        {fontInstallMessage}
                    </Text>
                    <Box marginTop={1}>
                        <Text dimColor>按任意鍵繼續...</Text>
                    </Box>
                </Box>
            ) : (
                <>
                    <Box flexDirection='column'>
                        <Text>
                            {'    字型狀態：   '}
                            {powerlineFontStatus.installed ? (
                                <>
                                    <Text color='green'>✓ 已安裝</Text>
                                    <Text dimColor> - 請確保終端中已啟用字型</Text>
                                </>
                            ) : (
                                <>
                                    <Text color='yellow'>✗ 未安裝</Text>
                                    <Text dimColor> - 按 (i) 安裝 Powerline 字型</Text>
                                </>
                            )}
                        </Text>
                    </Box>

                    <Box>
                        <Text> Powerline 模式：</Text>
                        <Text color={powerlineConfig.enabled ? 'green' : 'red'}>
                            {powerlineConfig.enabled ? '✓ 已啟用  ' : '✗ 已禁用  '}
                        </Text>
                        <Text dimColor> - 按 (t) 切換</Text>
                    </Box>

                    {powerlineConfig.enabled && (
                        <>
                            <Box>
                                <Text>    對齊元件：   </Text>
                                <Text color={powerlineConfig.autoAlign ? 'green' : 'red'}>
                                    {powerlineConfig.autoAlign ? '✓ 已啟用  ' : '✗ 已禁用  '}
                                </Text>
                                <Text dimColor> - 按 (a) 切換</Text>
                            </Box>

                            <Box>
                                <Text> 主題色延續: </Text>
                                <Text color={powerlineConfig.continueThemeAcrossLines ? 'green' : 'red'}>
                                    {powerlineConfig.continueThemeAcrossLines ? '✓ 已啟用  ' : '✗ 已禁用 '}
                                </Text>
                                <Text dimColor> - 按 (c) 切換</Text>
                            </Box>

                            <Box flexDirection='column' marginTop={1}>
                                <Text dimColor>
                                    Powerline 模式使用獨立的分隔符系統
                                </Text>
                                <Text dimColor>
                                    主題色延續：Powerline 顏色序列跨多行狀態列連續延續
                                </Text>
                            </Box>
                        </>
                    )}

                    {!powerlineConfig.enabled && (
                        <Box marginTop={1}>
                            <Text dimColor>啟用 Powerline 模式以配置分隔符、端帽和主題。</Text>
                        </Box>
                    )}

                    <List
                        marginTop={1}
                        items={buildPowerlineSetupMenuItems(powerlineConfig)}
                        onSelect={(value) => {
                            if (value === 'back') {
                                onBack();
                                return;
                            }

                            setScreen(value);
                        }}
                        onSelectionChange={(_, index) => {
                            setSelectedMenuItem(index);
                        }}
                        initialSelection={selectedMenuItem}
                        showBackButton={true}
                    />
                </>
            )}
        </Box>
    );
};
