import {
    Box,
    Text,
    useInput
} from 'ink';
import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import { getColorLevelString } from '../../types/ColorLevel';
import type { Settings } from '../../types/Settings';
import {
    getPowerlineTheme,
    getPowerlineThemes
} from '../../utils/colors';
import { getPlainInput } from '../../utils/input-guards';
import { assignPowerlineThemeSlots } from '../../utils/powerline-theme-index';

import { ConfirmDialog } from './ConfirmDialog';
import {
    List,
    type ListEntry
} from './List';

export function buildPowerlineThemeItems(
    themes: string[],
    originalTheme: string
): ListEntry<string>[] {
    return themes.map((themeName) => {
        const theme = getPowerlineTheme(themeName);

        return {
            label: theme?.name ?? themeName,
            sublabel: themeName === originalTheme ? '（當前）' : undefined,
            value: themeName,
            description: theme?.description ?? ''
        };
    });
}

export function applyCustomPowerlineTheme(
    settings: Settings,
    themeName: string
): Settings | null {
    const theme = getPowerlineTheme(themeName);

    if (!theme || themeName === 'custom') {
        return null;
    }

    const colorLevel = getColorLevelString(settings.colorLevel);
    const colorLevelKey = colorLevel === 'ansi16' ? '1' : colorLevel === 'ansi256' ? '2' : '3';
    const themeColors = theme[colorLevelKey];

    if (!themeColors) {
        return null;
    }

    // Number the widgets the way the renderer picks theme colors, so the copy
    // matches what the theme showed: a merged group shares one color, and with
    // Continue Theme on, each line picks up where the previous one stopped
    let nextLineSlot = 0;
    const lines = settings.lines.map((line) => {
        const { slots, nextSlot } = assignPowerlineThemeSlots(
            line,
            settings.powerline.continueThemeAcrossLines ? nextLineSlot : 0
        );
        nextLineSlot = nextSlot;

        return line.map((widget, index) => {
            const slot = slots[index];
            if (typeof slot !== 'number') {
                return widget;
            }

            const fgColor = themeColors.fg[slot % themeColors.fg.length];
            const bgColor = themeColors.bg[slot % themeColors.bg.length];

            return {
                ...widget,
                color: fgColor,
                backgroundColor: bgColor
            };
        });
    });

    return {
        ...settings,
        powerline: {
            ...settings.powerline,
            theme: 'custom'
        },
        lines
    };
}

export interface PowerlineThemeSelectorProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
}

export const PowerlineThemeSelector: React.FC<PowerlineThemeSelectorProps> = ({
    settings,
    onUpdate,
    onBack
}) => {
    const themes = useMemo(() => getPowerlineThemes(), []);
    const currentTheme = settings.powerline.theme ?? 'custom';
    const [selectedIndex, setSelectedIndex] = useState(Math.max(0, themes.indexOf(currentTheme)));
    const [showCustomizeConfirm, setShowCustomizeConfirm] = useState(false);
    const originalThemeRef = useRef(currentTheme);
    const originalSettingsRef = useRef(settings);
    const latestSettingsRef = useRef(settings);
    const latestOnUpdateRef = useRef(onUpdate);
    const didHandleInitialSelectionRef = useRef(false);

    useEffect(() => {
        latestSettingsRef.current = settings;
        latestOnUpdateRef.current = onUpdate;
    }, [settings, onUpdate]);

    useEffect(() => {
        const themeName = themes[selectedIndex];

        if (!themeName) {
            return;
        }

        if (!didHandleInitialSelectionRef.current) {
            didHandleInitialSelectionRef.current = true;
            return;
        }

        latestOnUpdateRef.current({
            ...latestSettingsRef.current,
            powerline: {
                ...latestSettingsRef.current.powerline,
                theme: themeName
            }
        });
    }, [selectedIndex, themes]);

    useInput((input, key) => {
        const shortcut = getPlainInput(input, key);
        if (showCustomizeConfirm) {
            return;
        }

        if (key.escape) {
            onUpdate(originalSettingsRef.current);
            onBack();
        } else if (shortcut === 'c' || shortcut === 'C') {
            const currentThemeName = themes[selectedIndex];
            if (currentThemeName && currentThemeName !== 'custom') {
                setShowCustomizeConfirm(true);
            }
        }
    });

    const selectedThemeName = themes[selectedIndex];
    const themeItems = useMemo(
        () => buildPowerlineThemeItems(themes, originalThemeRef.current),
        [themes]
    );

    if (showCustomizeConfirm) {
        return (
            <Box flexDirection='column'>
                <Text bold color='yellow'>⚠ 確認自定義</Text>
                <Box marginTop={1} flexDirection='column'>
                    <Text>這將把當前主題顏色複製到你的元件中</Text>
                    <Text>並切換到自定義主題模式。</Text>
                    <Text color='red'>這將覆蓋所有現有的自定義顏色！</Text>
                </Box>
                <Box marginTop={2}>
                    <Text>是否繼續？</Text>
                </Box>
                <Box marginTop={1}>
                    <ConfirmDialog
                        inline={true}
                        onConfirm={() => {
                            if (selectedThemeName) {
                                const updatedSettings = applyCustomPowerlineTheme(settings, selectedThemeName);
                                if (updatedSettings) {
                                    onUpdate(updatedSettings);
                                }
                            }
                            setShowCustomizeConfirm(false);
                            onBack();
                        }}
                        onCancel={() => {
                            setShowCustomizeConfirm(false);
                        }}
                    />
                </Box>
            </Box>
        );
    }

    return (
        <Box flexDirection='column'>
            <Text bold>
                {`Powerline 主題選擇  |  `}
                <Text dimColor>
                    {`原始: ${originalThemeRef.current}`}
                </Text>
            </Text>
            <Box>
                <Text dimColor>
                    {`↑↓ 選擇，Enter 應用${selectedThemeName && selectedThemeName !== 'custom' ? '，(c)自定義主題' : ''}，ESC 取消`}
                </Text>
            </Box>

            <List
                marginTop={1}
                items={themeItems}
                onSelect={() => {
                    onBack();
                }}
                onSelectionChange={(themeName, index) => {
                    if (themeName === 'back') {
                        return;
                    }

                    setSelectedIndex(index);
                }}
                initialSelection={selectedIndex}
            />

            {selectedThemeName && selectedThemeName !== 'custom' && (
                <Box marginTop={1}>
                    <Text dimColor>按 (c) 自定義此主題 - 將顏色複製到元件</Text>
                </Box>
            )}
            {settings.colorLevel === 1 && (
                <Box marginTop={1}>
                    <Text color='yellow'>⚠ 16 色模式的主題調色盤非常有限，建議在終端選項中切換顏色級別</Text>
                </Box>
            )}
        </Box>
    );
};
