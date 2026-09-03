import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import { getColorLevelString } from '../../types/ColorLevel';
import {
    NUMBER_KINDS,
    type GlobalNumberFormat,
    type NumberFormat,
    type NumberKind
} from '../../types/NumberFormat';
import {
    DefaultPaddingSideSchema,
    type Settings
} from '../../types/Settings';
import {
    COLOR_MAP,
    applyColors,
    getChalkColor,
    getColorDisplayName
} from '../../utils/colors';
import { GRADIENT_PRESET_NAMES } from '../../utils/gradient';
import { shouldInsertInput } from '../../utils/input-guards';
import { getNextNumberStyle } from '../../utils/number-format';

import { ConfirmDialog } from './ConfirmDialog';

const NUMBER_FORMAT_KIND_WIDTH = Math.max(...NUMBER_KINDS.map(kind => kind.length));

// Cycle a number kind's global style: default (precise) -> compact -> whole -> default.
// A global style forces that kind across all widgets (see resolveNumberFormat).
function cycleGlobalNumberStyle(settings: Settings, kind: NumberKind): Settings {
    const current = settings.numberFormat?.[kind]?.style;
    const nextStyle = getNextNumberStyle(current);

    const kindFormat: NumberFormat = { ...settings.numberFormat?.[kind] };
    if (nextStyle === undefined) {
        delete kindFormat.style;
    } else {
        kindFormat.style = nextStyle;
    }

    const { [kind]: removedKind, ...restGlobal } = settings.numberFormat ?? {};
    void removedKind; // Intentionally unused
    const nextGlobal: GlobalNumberFormat = Object.keys(kindFormat).length > 0
        ? { ...restGlobal, [kind]: kindFormat }
        : restGlobal;

    return {
        ...settings,
        numberFormat: Object.keys(nextGlobal).length > 0 ? nextGlobal : undefined
    };
}

export interface GlobalOverridesMenuProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
}

export const GlobalOverridesMenu: React.FC<GlobalOverridesMenuProps> = ({ settings, onUpdate, onBack }) => {
    const [editingPadding, setEditingPadding] = useState(false);
    const [editingSeparator, setEditingSeparator] = useState(false);
    const [confirmingSeparator, setConfirmingSeparator] = useState(false);
    const [paddingInput, setPaddingInput] = useState(settings.defaultPadding ?? '');
    const [separatorInput, setSeparatorInput] = useState(settings.defaultSeparator ?? '');
    const [inheritColors, setInheritColors] = useState(settings.inheritSeparatorColors);
    const [globalBold, setGlobalBold] = useState(settings.globalBold);
    const [minimalistMode, setMinimalistMode] = useState(settings.minimalistMode);
    const [numberFormatMode, setNumberFormatMode] = useState(false);
    const [numberFormatKindIndex, setNumberFormatKindIndex] = useState(0);
    const [gradientMode, setGradientMode] = useState(false);
    const [gradientIndex, setGradientIndex] = useState(0);
    const [gradientCustomStep, setGradientCustomStep] = useState<'start' | 'end' | null>(null);
    const [gradientStartHex, setGradientStartHex] = useState('');
    const [gradientHexInput, setGradientHexInput] = useState('');
    const isPowerlineEnabled = settings.powerline.enabled;

    // Check if there are any manual separators in the current configuration
    const hasManualSeparators = settings.lines.some(line => line.some(item => item.type === 'separator')
    );

    // Get colors from COLOR_MAP
    const bgColors = ['none', ...COLOR_MAP.filter(c => c.isBackground).map(c => c.name)];
    const fgColors = ['none', ...COLOR_MAP.filter(c => !c.isBackground).map(c => c.name)];

    const currentBgIndex = bgColors.indexOf(settings.overrideBackgroundColor ?? 'none');
    const currentFgIndex = fgColors.indexOf(settings.overrideForegroundColor ?? 'none');

    useInput((input, key) => {
        if (editingPadding) {
            if (key.return) {
                const updatedSettings = {
                    ...settings,
                    defaultPadding: paddingInput
                };
                onUpdate(updatedSettings);
                setEditingPadding(false);
            } else if (key.escape) {
                setPaddingInput(settings.defaultPadding ?? '');
                setEditingPadding(false);
            } else if (key.backspace) {
                setPaddingInput(paddingInput.slice(0, -1));
            } else if (key.delete) {
                // For simple text inputs without cursor, forward delete does nothing
            } else if (shouldInsertInput(input, key)) {
                setPaddingInput(paddingInput + input);
            }
        } else if (editingSeparator) {
            if (key.return) {
                // Only show confirmation if setting a non-empty separator AND there are manual separators
                if (separatorInput && hasManualSeparators) {
                    setEditingSeparator(false);
                    setConfirmingSeparator(true);
                } else {
                    // Apply directly without confirmation
                    const updatedSettings = {
                        ...settings,
                        defaultSeparator: separatorInput || undefined,
                        // Only remove manual separators if we're setting a non-empty default
                        lines: separatorInput
                            ? settings.lines.map(line => line.filter(item => item.type !== 'separator'))
                            : settings.lines
                    };
                    onUpdate(updatedSettings);
                    setEditingSeparator(false);
                }
            } else if (key.escape) {
                setSeparatorInput(settings.defaultSeparator ?? '');
                setEditingSeparator(false);
            } else if (key.backspace) {
                setSeparatorInput(separatorInput.slice(0, -1));
            } else if (key.delete) {
                // For simple text inputs without cursor, forward delete does nothing
            } else if (shouldInsertInput(input, key)) {
                setSeparatorInput(separatorInput + input);
            }
        } else if (confirmingSeparator) {
            // Skip input handling when confirmation is active - let ConfirmDialog handle it
            return;
        } else if (gradientMode) {
            const exitGradient = () => {
                setGradientMode(false);
                setGradientCustomStep(null);
                setGradientStartHex('');
                setGradientHexInput('');
            };

            const applyGradientValue = (value: string) => {
                onUpdate({
                    ...settings,
                    overrideForegroundColor: value
                });
                exitGradient();
            };

            if (gradientCustomStep) {
                if (key.escape) {
                    setGradientCustomStep(null);
                    setGradientHexInput('');
                } else if (key.return) {
                    if (gradientHexInput.length === 6) {
                        if (gradientCustomStep === 'start') {
                            setGradientStartHex(gradientHexInput);
                            setGradientHexInput('');
                            setGradientCustomStep('end');
                        } else {
                            applyGradientValue(`gradient:${gradientStartHex}-${gradientHexInput}`);
                        }
                    }
                } else if (key.backspace || key.delete) {
                    setGradientHexInput(gradientHexInput.slice(0, -1));
                } else if (shouldInsertInput(input, key) && gradientHexInput.length < 6) {
                    const upperInput = input.toUpperCase();
                    if (/^[0-9A-F]$/.test(upperInput)) {
                        setGradientHexInput(gradientHexInput + upperInput);
                    }
                }
                return;
            }

            const total = GRADIENT_PRESET_NAMES.length + 1;
            if (key.escape) {
                exitGradient();
            } else if (key.upArrow) {
                setGradientIndex((gradientIndex - 1 + total) % total);
            } else if (key.downArrow) {
                setGradientIndex((gradientIndex + 1) % total);
            } else if (key.return) {
                if (gradientIndex < GRADIENT_PRESET_NAMES.length) {
                    applyGradientValue(`gradient:${GRADIENT_PRESET_NAMES[gradientIndex]}`);
                } else {
                    setGradientStartHex('');
                    setGradientHexInput('');
                    setGradientCustomStep('start');
                }
            }
        } else if (numberFormatMode) {
            if (key.escape) {
                setNumberFormatMode(false);
            } else if (key.upArrow) {
                setNumberFormatKindIndex((numberFormatKindIndex - 1 + NUMBER_KINDS.length) % NUMBER_KINDS.length);
            } else if (key.downArrow) {
                setNumberFormatKindIndex((numberFormatKindIndex + 1) % NUMBER_KINDS.length);
            } else if (key.leftArrow || key.rightArrow) {
                const kind = NUMBER_KINDS[numberFormatKindIndex];
                if (kind) {
                    onUpdate(cycleGlobalNumberStyle(settings, kind));
                }
            }
        } else {
            if (key.escape) {
                onBack();
            } else if (input === 'p' || input === 'P') {
                setEditingPadding(true);
            } else if ((input === 's' || input === 'S') && !isPowerlineEnabled && !key.ctrl) {
                setEditingSeparator(true);
            } else if ((input === 'i' || input === 'I') && !isPowerlineEnabled) {
                const newInheritColors = !inheritColors;
                setInheritColors(newInheritColors);
                const updatedSettings = {
                    ...settings,
                    inheritSeparatorColors: newInheritColors
                };
                onUpdate(updatedSettings);
            } else if ((input === 'b' || input === 'B') && !isPowerlineEnabled) {
                // Cycle through background colors
                const nextIndex = (currentBgIndex + 1) % bgColors.length;
                const nextBgColor = bgColors[nextIndex];
                const updatedSettings = {
                    ...settings,
                    overrideBackgroundColor: nextBgColor === 'none' ? undefined : nextBgColor
                };
                onUpdate(updatedSettings);
            } else if ((input === 'c' || input === 'C') && !isPowerlineEnabled) {
                // Clear override background color
                const updatedSettings = {
                    ...settings,
                    overrideBackgroundColor: undefined
                };
                onUpdate(updatedSettings);
            } else if (input === 'o' || input === 'O') {
                // Toggle global bold
                const newGlobalBold = !globalBold;
                setGlobalBold(newGlobalBold);
                const updatedSettings = {
                    ...settings,
                    globalBold: newGlobalBold
                };
                onUpdate(updatedSettings);
            } else if (input === 'm' || input === 'M') {
                // Toggle minimalist mode
                const newMinimalistMode = !minimalistMode;
                setMinimalistMode(newMinimalistMode);
                const updatedSettings = {
                    ...settings,
                    minimalistMode: newMinimalistMode
                };
                onUpdate(updatedSettings);
            } else if (input === 'n' || input === 'N') {
                setNumberFormatMode(true);
                setNumberFormatKindIndex(0);
            } else if (input === 'f' || input === 'F') {
                // Cycle through foreground colors
                const nextIndex = (currentFgIndex + 1) % fgColors.length;
                const nextFgColor = fgColors[nextIndex];
                const updatedSettings = {
                    ...settings,
                    overrideForegroundColor: nextFgColor === 'none' ? undefined : nextFgColor
                };
                onUpdate(updatedSettings);
            } else if (input === 'g' || input === 'G') {
                // Enter gradient selection mode
                setGradientMode(true);
                setGradientIndex(0);
                setGradientCustomStep(null);
                setGradientStartHex('');
                setGradientHexInput('');
            } else if (input === 'x' || input === 'X') {
                // Clear override foreground color
                const updatedSettings = {
                    ...settings,
                    overrideForegroundColor: undefined
                };
                onUpdate(updatedSettings);
            } else if (input === 'd' || input === 'D') {
                // Cycle through padding sides: both -> left -> right -> both
                const paddingSides = DefaultPaddingSideSchema.options;
                const currentIndex = paddingSides.indexOf(settings.defaultPaddingSide);
                const nextSide = paddingSides[(currentIndex + 1) % paddingSides.length] ?? 'both';
                const updatedSettings = {
                    ...settings,
                    defaultPaddingSide: nextSide
                };
                onUpdate(updatedSettings);
            }
        }
    });

    if (numberFormatMode) {
        return (
            <Box flexDirection='column'>
                <Text bold>全域性數字格式</Text>
                <Box marginTop={1}>
                    <Text dimColor>↑↓ 選擇數字類型，←→ 切換樣式，ESC 返回</Text>
                </Box>
                <Box marginTop={1} flexDirection='column'>
                    {NUMBER_KINDS.map((kind, idx) => {
                        const style = settings.numberFormat?.[kind]?.style ?? 'precise（預設）';
                        return (
                            <Text key={kind} color={idx === numberFormatKindIndex ? 'cyan' : undefined}>
                                {idx === numberFormatKindIndex ? '▶ ' : '  '}
                                {kind.padStart(NUMBER_FORMAT_KIND_WIDTH)}
                                {': '}
                                {style}
                            </Text>
                        );
                    })}
                </Box>
                <Box marginTop={1} flexDirection='column'>
                    <Text dimColor>precise = 保留末尾零 (1.0M)，compact = 去除末尾零 (1M / 1.1M)，whole = 不顯示小數 (1M)。</Text>
                    <Text dimColor>全域性樣式會強制套用到該類型的所有元件。小數位數可在各元件或 settings.json 中單獨設定。</Text>
                </Box>
            </Box>
        );
    }

    if (gradientMode) {
        const level = getColorLevelString(settings.colorLevel);

        if (gradientCustomStep) {
            return (
                <Box flexDirection='column'>
                    <Text bold>Custom Gradient - Override FG Color</Text>
                    <Box marginTop={1} flexDirection='column'>
                        <Text>{gradientCustomStep === 'start' ? 'Enter START hex color (without #):' : 'Enter END hex color (without #):'}</Text>
                        {gradientCustomStep === 'end' && (
                            <Text dimColor>
                                Start: #
                                {gradientStartHex}
                            </Text>
                        )}
                        <Text>
                            #
                            {gradientHexInput}
                            <Text dimColor>{gradientHexInput.length < 6 ? '_'.repeat(6 - gradientHexInput.length) : ''}</Text>
                        </Text>
                        <Text> </Text>
                        <Text dimColor>Press Enter when done, ESC to go back</Text>
                    </Box>
                </Box>
            );
        }

        return (
            <Box flexDirection='column'>
                <Text bold>Select Gradient - Override FG Color</Text>
                <Box marginTop={1}>
                    <Text dimColor>↑↓ to select, Enter to apply, ESC to cancel</Text>
                </Box>
                <Box marginTop={1} flexDirection='column'>
                    {GRADIENT_PRESET_NAMES.map((name, idx) => (
                        <Text key={name}>
                            {idx === gradientIndex ? '▶ ' : '  '}
                            {applyColors(name, `gradient:${name}`, undefined, idx === gradientIndex, level)}
                        </Text>
                    ))}
                    <Text key='custom'>
                        {gradientIndex === GRADIENT_PRESET_NAMES.length ? '▶ ' : '  '}
                        Custom (enter two hex stops)
                    </Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box flexDirection='column'>
            <Text bold>全域性覆蓋</Text>
            <Text dimColor>配置元件之間的自動內邊距和分隔符</Text>
            {isPowerlineEnabled && (
                <Box marginTop={1}>
                    <Text color='yellow'>⚠ Powerline 模式啟用時部分選項已禁用</Text>
                </Box>
            )}
            <Box marginTop={1} />

            {editingPadding ? (
                <Box flexDirection='column'>
                    <Box>
                        <Text>輸入預設內邊距（按“內邊距方向”設定應用）：</Text>
                        <Text color='cyan'>{paddingInput ? `"${paddingInput}"` : '（空）'}</Text>
                    </Box>
                    <Text dimColor>按 Enter 儲存，ESC 取消</Text>
                </Box>
            ) : editingSeparator ? (
                <Box flexDirection='column'>
                    <Box>
                        <Text>輸入預設分隔符（放置在元件之間）：</Text>
                        <Text color='cyan'>{separatorInput ? `"${separatorInput}"` : '（空 - 不新增分隔符）'}</Text>
                    </Box>
                    <Text dimColor>按 Enter 儲存，ESC 取消</Text>
                </Box>
            ) : confirmingSeparator ? (
                <Box flexDirection='column'>
                    <Box marginBottom={1}>
                        <Text color='yellow'>⚠ 警告：設定預設分隔符將移除狀態列中所有現有的手動分隔符。</Text>
                    </Box>
                    <Box>
                        <Text>新預設分隔符：</Text>
                        <Text color='cyan'>{separatorInput ? `"${separatorInput}"` : '（空）'}</Text>
                    </Box>
                    <Box marginTop={1}>
                        <Text>是否要繼續？</Text>
                    </Box>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            inline={true}
                            onConfirm={() => {
                                // Remove all manual separators from lines
                                const updatedSettings = {
                                    ...settings,
                                    defaultSeparator: separatorInput,
                                    lines: settings.lines.map(line => line.filter(item => item.type !== 'separator')
                                    )
                                };
                                onUpdate(updatedSettings);
                                setConfirmingSeparator(false);
                            }}
                            onCancel={() => {
                                // Cancel without applying changes
                                setSeparatorInput(settings.defaultSeparator ?? '');
                                setConfirmingSeparator(false);
                            }}
                        />
                    </Box>
                </Box>
            ) : (
                <>
                    <Box>
                        <Text>      全域性加粗: </Text>
                        <Text color={globalBold ? 'green' : 'red'}>{globalBold ? '✓ 已啟用' : '✗ 已禁用'}</Text>
                        <Text dimColor> - 按 (o) 切換</Text>
                    </Box>

                    <Box>
                        <Text>極簡模式: </Text>
                        <Text color={minimalistMode ? 'green' : 'red'}>{minimalistMode ? '✓ 已啟用' : '✗ 已禁用'}</Text>
                        <Text dimColor> - 按 (m) 切換</Text>
                    </Box>

                    <Box>
                        <Text>數字格式: </Text>
                        <Text color='cyan'>{settings.numberFormat ? '已自訂' : '（預設）'}</Text>
                        <Text dimColor> - 按 (n) 按類型配置</Text>
                    </Box>

                    <Box>
                        <Text>  預設內邊距: </Text>
                        <Text color='cyan'>{settings.defaultPadding ? `"${settings.defaultPadding}"` : '（無）'}</Text>
                        <Text dimColor> - 按 (p) 編輯</Text>
                    </Box>

                    <Box>
                        <Text>     內邊距方向: </Text>
                        <Text color='cyan'>{settings.defaultPaddingSide === 'left' ? '僅左側' : settings.defaultPaddingSide === 'right' ? '僅右側' : '兩側'}</Text>
                        <Text dimColor> - 按 (d) 切換</Text>
                    </Box>

                    <Box>
                        <Text>覆蓋前景色: </Text>
                        {(() => {
                            const fgColor = settings.overrideForegroundColor ?? 'none';
                            if (fgColor === 'none') {
                                return <Text color='gray'>(none)</Text>;
                            } else if (fgColor.startsWith('gradient:')) {
                                const body = fgColor.substring(9);
                                const displayName = GRADIENT_PRESET_NAMES.includes(body.toLowerCase())
                                    ? `Gradient: ${body.toLowerCase()}`
                                    : `Gradient: ${body}`;
                                const level = getColorLevelString(settings.colorLevel);
                                return <Text>{applyColors(displayName, fgColor, undefined, false, level)}</Text>;
                            } else {
                                const displayName = getColorDisplayName(fgColor);
                                const fgChalk = getChalkColor(fgColor, 'ansi16', false);
                                const display = fgChalk ? fgChalk(displayName) : displayName;
                                return <Text>{display}</Text>;
                            }
                        })()}
                        <Text dimColor> - (f) 切換，(g) 漸變色，(x) 清除</Text>
                    </Box>

                    <Box>
                        <Text>覆蓋背景色: </Text>
                        {isPowerlineEnabled ? (
                            <Text dimColor>[已禁用 - Powerline 啟用中]</Text>
                        ) : (
                            <>
                                {(() => {
                                    const bgColor = settings.overrideBackgroundColor ?? 'none';
                                    if (bgColor === 'none') {
                                        return <Text color='gray'>(none)</Text>;
                                    } else {
                                        const displayName = getColorDisplayName(bgColor);
                                        const bgChalk = getChalkColor(bgColor, 'ansi16', true);
                                        const display = bgChalk ? bgChalk(` ${displayName} `) : displayName;
                                        return <Text>{display}</Text>;
                                    }
                                })()}
                                <Text dimColor> - (b) 切換，(c) 清除</Text>
                            </>
                        )}
                    </Box>

                    <Box>
                        <Text>   繼承顏色: </Text>
                        {isPowerlineEnabled ? (
                            <Text dimColor>[已禁用 - Powerline 啟用中]</Text>
                        ) : (
                            <>
                                <Text color={inheritColors ? 'green' : 'red'}>{inheritColors ? '✓ 已啟用' : '✗ 已禁用'}</Text>
                                <Text dimColor> - 按 (i) 切換</Text>
                            </>
                        )}
                    </Box>

                    <Box>
                        <Text>預設分隔符: </Text>
                        {isPowerlineEnabled ? (
                            <Text dimColor>[已禁用 - Powerline 啟用中]</Text>
                        ) : (
                            <>
                                <Text color='cyan'>{settings.defaultSeparator ? `"${settings.defaultSeparator}"` : '（無）'}</Text>
                                <Text dimColor> - 按 (s) 編輯</Text>
                            </>
                        )}
                    </Box>

                    <Box marginTop={2}>
                        <Text dimColor>按 ESC 返回</Text>
                    </Box>

                    <Box marginTop={1} flexDirection='column'>
                        <Text dimColor wrap='wrap'>
                            注意：這些設定在渲染時應用，不會向元件列表中新增元件。
                        </Text>
                        <Text dimColor wrap='wrap'>
                            • 內邊距方向：選擇預設內邊距應用於兩側、僅左側或僅右側
                        </Text>
                        <Text dimColor wrap='wrap'>
                            • 繼承顏色：分隔符將使用前一個元件的顏色
                        </Text>
                        <Text dimColor wrap='wrap'>
                            • 全域性加粗：無論單個設定如何，所有文字都會加粗
                        </Text>
                        <Text dimColor wrap='wrap'>
                            • 極簡模式：去除元件的裝飾性字首和標籤
                        </Text>
                        <Text dimColor wrap='wrap'>
                            • 覆蓋顏色：所有元件將使用這些顏色而非其配置的顏色
                        </Text>
                    </Box>
                </>
            )}
        </Box>
    );
};
