import chalk from 'chalk';
import {
    Box,
    Text,
    useInput
} from 'ink';
import SelectInput from 'ink-select-input';
import React, { useState } from 'react';

import { getColorLevelString } from '../../types/ColorLevel';
import type { Settings } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import {
    applyColors,
    getAvailableBackgroundColorsForUI,
    getAvailableColorsForUI
} from '../../utils/colors';
import { GRADIENT_PRESET_NAMES } from '../../utils/gradient';
import {
    getPlainInput,
    shouldInsertInput
} from '../../utils/input-guards';
import {
    getWidget,
    widgetColorsOnlyItsRuns
} from '../../utils/widgets';

import { ConfirmDialog } from './ConfirmDialog';
import { PalettePicker } from './color-menu/PalettePicker';
import {
    clearAllWidgetStyling,
    cycleWidgetColor,
    cycleWidgetDim,
    resetWidgetStyling,
    setWidgetColor,
    toggleWidgetBold
} from './color-menu/mutations';
import {
    colorToPaletteIndex,
    paletteIndexToColor
} from './color-menu/palette';

export interface ColorMenuProps {
    widgets: WidgetItem[];
    lineIndex?: number;
    settings: Settings;
    onUpdate: (widgets: WidgetItem[]) => void;
    onBack: () => void;
}

// The keys for entering a color: hex at truecolor, and the 256-color grid from
// 256 colors up
function getColorEntryKeys(colorLevel: number): string {
    if (colorLevel === 3) {
        return ' (h)十六進位制，(a)nsi256，';
    }
    return colorLevel === 2 ? ' (a)nsi256，' : '';
}

// The color the menu shows for a widget: its own setting, else the widget's default
function getEffectiveColor(widget: WidgetItem, editingBackground: boolean): string {
    if (editingBackground) {
        return widget.backgroundColor ?? '';  // Empty string for 'none'
    }
    if (widget.color !== undefined) {
        return widget.color;
    }
    if (widget.type !== 'separator' && widget.type !== 'flex-separator') {
        return getWidget(widget.type)?.getDefaultColor() ?? 'white';
    }
    return 'white';
}

interface PaletteSession {
    widgets: WidgetItem[];  // as they were when the grid opened; ESC restores them
    widgetId: string;
    startColor: string;
    startIndex: number;
}

export const ColorMenu: React.FC<ColorMenuProps> = ({ widgets, lineIndex, settings, onUpdate, onBack }) => {
    const [showSeparators, setShowSeparators] = useState(false);
    const [hexInputMode, setHexInputMode] = useState(false);
    const [hexInput, setHexInput] = useState('');
    const [palette, setPalette] = useState<PaletteSession | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [gradientMode, setGradientMode] = useState(false);
    const [gradientIndex, setGradientIndex] = useState(0);
    const [gradientCustomStep, setGradientCustomStep] = useState<'start' | 'end' | null>(null);
    const [gradientStartHex, setGradientStartHex] = useState('');
    const [gradientHexInput, setGradientHexInput] = useState('');

    const powerlineEnabled = settings.powerline.enabled;

    const colorableWidgets = widgets.filter((widget) => {
        // Include separators only if showSeparators is true
        if (widget.type === 'separator') {
            return showSeparators;
        }
        // Use the widget's supportsColors method
        const widgetInstance = getWidget(widget.type);
        // Include unknown widgets (they might support colors, we just don't know)
        return widgetInstance ? widgetInstance.supportsColors(widget) : true;
    });
    const [highlightedItemId, setHighlightedItemId] = useState(colorableWidgets[0]?.id ?? null);
    const [editingBackground, setEditingBackground] = useState(false);

    const applyPaletteColor = (session: PaletteSession, index: number) => {
        const color = paletteIndexToColor(index);
        // Landing back on the color the grid opened on leaves the settings as they were
        onUpdate(color === session.startColor ? session.widgets : setWidgetColor(session.widgets, session.widgetId, color, editingBackground));
    };

    // Handle keyboard input
    const hasNoItems = colorableWidgets.length === 0;
    useInput((input, key) => {
        const shortcut = getPlainInput(input, key);
        // If no items, any key goes back
        if (hasNoItems) {
            onBack();
            return;
        }

        // Skip input handling when confirmation is active - let ConfirmDialog handle it
        if (showClearConfirm) {
            return;
        }

        // The 256-color grid handles its own input
        if (palette) {
            return;
        }

        // Handle hex input mode
        if (hexInputMode) {
            // Disable arrow keys in input mode
            if (key.upArrow || key.downArrow) {
                return;
            }
            if (key.escape) {
                setHexInputMode(false);
                setHexInput('');
            } else if (key.return) {
                // Validate and apply the hex color
                if (hexInput.length === 6) {
                    const hexColor = `hex:${hexInput}`;
                    const selectedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
                    if (selectedWidget) {
                        const newItems = setWidgetColor(widgets, selectedWidget.id, hexColor, editingBackground);
                        onUpdate(newItems);
                    }
                    setHexInputMode(false);
                    setHexInput('');
                }
            } else if (key.backspace || key.delete) {
                setHexInput(hexInput.slice(0, -1));
            } else if (shouldInsertInput(input, key) && hexInput.length < 6) {
                // Only accept hex characters (0-9, A-F, a-f)
                const upperInput = input.toUpperCase();
                if (/^[0-9A-F]$/.test(upperInput)) {
                    setHexInput(hexInput + upperInput);
                }
            }
            return;
        }

        // Handle gradient selection mode
        if (gradientMode) {
            const exitGradient = () => {
                setGradientMode(false);
                setGradientCustomStep(null);
                setGradientStartHex('');
                setGradientHexInput('');
            };

            const applyGradientValue = (value: string) => {
                const selectedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
                if (selectedWidget) {
                    onUpdate(setWidgetColor(widgets, selectedWidget.id, value, false));
                }
                exitGradient();
            };

            // Custom start/end hex entry
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

            // Preset list navigation (last item is the "Custom" entry)
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
            return;
        }

        // Ignore number keys to prevent SelectInput numerical navigation
        if (input && /^[0-9]$/.test(input)) {
            return;
        }

        // Normal keyboard handling when there are items
        if (key.escape) {
            if (editingBackground) {
                setEditingBackground(false);
            } else {
                onBack();
            }
        } else if (key.return) {
            // Back is chosen here rather than through SelectInput's onSelect, which
            // number keys fire too
            if (highlightedItemId === 'back') {
                onBack();
            }
        } else if (shortcut === 'h' || shortcut === 'H') {
            // Enter hex input mode (only in truecolor mode)
            if (highlightedItemId && highlightedItemId !== 'back' && settings.colorLevel === 3) {
                setHexInputMode(true);
                setHexInput('');
            }
        } else if (shortcut === 'a' || shortcut === 'A') {
            // Open the 256-color grid (256-color and truecolor modes)
            const selectedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
            if (selectedWidget && settings.colorLevel >= 2) {
                const startColor = getEffectiveColor(selectedWidget, editingBackground);
                const startIndex = colorToPaletteIndex(startColor, getColorLevelString(settings.colorLevel));
                // The widget keeps its color until the cursor moves: a named or
                // hex color may only be near the color the cursor starts on
                setPalette({ widgets, widgetId: selectedWidget.id, startColor, startIndex });
            }
        } else if (shortcut === 'g' || shortcut === 'G') {
            // Enter gradient selection mode (foreground only, needs a real color palette)
            if (highlightedItemId && highlightedItemId !== 'back' && !editingBackground && settings.colorLevel >= 2) {
                setGradientMode(true);
                setGradientIndex(0);
                setGradientCustomStep(null);
                setGradientStartHex('');
                setGradientHexInput('');
            }
        } else if (shortcut === 's' || shortcut === 'S') {
            // Toggle show separators (only if not in powerline mode and no default separator)
            if (!settings.powerline.enabled && !settings.defaultSeparator) {
                setShowSeparators(!showSeparators);
                // The highlighted item ID is kept, and the SelectInput recalculates its
                // initial index. Hiding the highlighted separator takes it off the list,
                // so the highlight moves to the first widget instead.
                const highlightedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
                if (showSeparators && highlightedWidget?.type === 'separator') {
                    setHighlightedItemId(colorableWidgets.find(widget => widget.type !== 'separator')?.id ?? null);
                }
            }
        } else if (shortcut === 'f' || shortcut === 'F') {
            if (colorableWidgets.length > 0) {
                setEditingBackground(!editingBackground);
            }
        } else if (shortcut === 'b' || shortcut === 'B') {
            if (highlightedItemId && highlightedItemId !== 'back') {
                // Toggle bold for the highlighted item
                const selectedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
                if (selectedWidget) {
                    const newItems = toggleWidgetBold(widgets, selectedWidget.id);
                    onUpdate(newItems);
                }
            }
        } else if (shortcut === 'd' || shortcut === 'D') {
            if (highlightedItemId && highlightedItemId !== 'back') {
                // Cycle dim for the highlighted item: off -> whole -> parens -> off
                const selectedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
                if (selectedWidget) {
                    const newItems = cycleWidgetDim(widgets, selectedWidget.id);
                    onUpdate(newItems);
                }
            }
        } else if (shortcut === 'r' || shortcut === 'R') {
            if (highlightedItemId && highlightedItemId !== 'back') {
                // Reset all styling (color, background, and bold) for the highlighted item
                const selectedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
                if (selectedWidget) {
                    const newItems = resetWidgetStyling(widgets, selectedWidget.id);
                    onUpdate(newItems);
                }
            }
        } else if (shortcut === 'c' || shortcut === 'C') {
            // Show clear all confirmation
            setShowClearConfirm(true);
        } else if (key.leftArrow || key.rightArrow) {
            // Cycle through colors with arrow keys
            if (highlightedItemId && highlightedItemId !== 'back') {
                const selectedWidget = colorableWidgets.find(widget => widget.id === highlightedItemId);
                if (selectedWidget) {
                    const newItems = cycleWidgetColor({
                        widgets,
                        widgetId: selectedWidget.id,
                        direction: key.rightArrow ? 'right' : 'left',
                        editingBackground,
                        colors,
                        backgroundColors: bgColors
                    });
                    onUpdate(newItems);
                }
            }
        }
    });

    if (hasNoItems) {
        return (
            <Box flexDirection='column'>
                <Text bold>
                    配置顏色
                    {lineIndex !== undefined ? ` - 第 ${lineIndex + 1} 行` : ''}
                </Text>
                <Box marginTop={1}><Text dimColor>狀態列中沒有可著色的元件。</Text></Box>
                <Text dimColor>請先新增一個元件再繼續。</Text>
                <Box marginTop={1}><Text>按任意鍵返回...</Text></Box>
            </Box>
        );
    }

    const getItemLabel = (widget: WidgetItem) => {
        if (widget.type === 'separator') {
            const char = widget.character ?? '|';
            return `分隔符: ${char === ' ' ? '空格' : char}`;
        }
        if (widget.type === 'flex-separator') {
            return '彈性分隔符';
        }

        const widgetImpl = getWidget(widget.type);
        return widgetImpl ? widgetImpl.getDisplayName() : `未知: ${widget.type}`;
    };

    // Color list for cycling
    // Get available colors from colors.ts
    const colorOptions = getAvailableColorsForUI();
    const colors = colorOptions.map(c => c.value || '');

    // For background, get background colors
    const bgColorOptions = getAvailableBackgroundColorsForUI();
    const bgColors = bgColorOptions.map(c => c.value || '');

    // Create menu items with colored labels
    const menuItems = colorableWidgets.map((widget, index) => {
        const label = `${index + 1}: ${getItemLabel(widget)}`;
        // Apply both foreground and background colors
        const level = getColorLevelString(settings.colorLevel);
        let defaultColor = 'white';
        if (widget.type !== 'separator' && widget.type !== 'flex-separator') {
            const widgetImpl = getWidget(widget.type);
            if (widgetImpl) {
                defaultColor = widgetImpl.getDefaultColor();
            }
        }
        const styledLabel = applyColors(label, widget.color ?? defaultColor, widget.backgroundColor, widget.bold, level, widget.dim);
        return {
            label: styledLabel,
            value: widget.id
        };
    });
    menuItems.push({ label: '← Back', value: 'back' });

    const handleHighlight = (item: { value: string }) => {
        setHighlightedItemId(item.value);
    };

    // Get current color for highlighted item
    const selectedWidget = highlightedItemId && highlightedItemId !== 'back'
        ? colorableWidgets.find(widget => widget.id === highlightedItemId)
        : null;
    // With no widget highlighted: no background, and the default foreground
    const noWidgetColor = editingBackground ? '' : 'white';
    const currentColor = selectedWidget ? getEffectiveColor(selectedWidget, editingBackground) : noWidgetColor;

    const colorList = editingBackground ? bgColors : colors;
    const colorIndex = colorList.indexOf(currentColor);
    const colorNumber = colorIndex === -1 ? 'custom' : colorIndex + 1;

    let colorDisplay;
    if (editingBackground) {
        if (!currentColor || currentColor === '') {
            colorDisplay = chalk.gray('(no background)');
        } else {
            // Determine display name based on format
            let displayName;
            if (currentColor.startsWith('ansi256:')) {
                displayName = `ANSI ${currentColor.substring(8)}`;
            } else if (currentColor.startsWith('hex:')) {
                displayName = `#${currentColor.substring(4)}`;
            } else {
                const colorOption = bgColorOptions.find(c => c.value === currentColor);
                displayName = colorOption ? colorOption.name : currentColor;
            }

            // Apply the color using our applyColors function with the current colorLevel
            const level = getColorLevelString(settings.colorLevel);
            colorDisplay = applyColors(` ${displayName} `, undefined, currentColor, false, level);
        }
    } else {
        if (!currentColor || currentColor === '') {
            colorDisplay = chalk.gray('(default)');
        } else {
            // Determine display name based on format
            let displayName;
            if (currentColor.startsWith('ansi256:')) {
                displayName = `ANSI ${currentColor.substring(8)}`;
            } else if (currentColor.startsWith('hex:')) {
                displayName = `#${currentColor.substring(4)}`;
            } else if (currentColor.startsWith('gradient:')) {
                const body = currentColor.substring(9);
                if (GRADIENT_PRESET_NAMES.includes(body.toLowerCase())) {
                    displayName = `Gradient: ${body.toLowerCase()}`;
                } else {
                    displayName = `Gradient: ${body}`;
                }
            } else {
                const colorOption = colorOptions.find(c => c.value === currentColor);
                displayName = colorOption ? colorOption.name : currentColor;
            }

            // Apply the color using our applyColors function with the current colorLevel
            const level = getColorLevelString(settings.colorLevel);
            colorDisplay = applyColors(displayName, currentColor, undefined, false, level);
        }
    }
    const styleIndicators = [
        selectedWidget?.bold ? '[加粗]' : null,
        selectedWidget?.dim === true ? '[暗淡]' : null,
        selectedWidget?.dim === 'parens' ? '[括號暗淡]' : null
    ].filter(indicator => indicator !== null).join(' ');

    // The 256-color grid takes over the whole view
    if (palette) {
        const paletteWidget = palette.widgets.find(widget => widget.id === palette.widgetId);
        return (
            <PalettePicker
                title={`選擇 ANSI 256 顏色 - ${paletteWidget ? getItemLabel(paletteWidget) : ''} (${editingBackground ? '背景色' : '前景色'})`}
                initialIndex={palette.startIndex}
                onHighlight={(index) => {
                    applyPaletteColor(palette, index);
                }}
                onSelect={() => {
                    // Moving the cursor already applied its color
                    setPalette(null);
                }}
                onCancel={() => {
                    onUpdate(palette.widgets);
                    setPalette(null);
                }}
            />
        );
    }

    // Gradient selection mode takes over the whole view
    if (gradientMode) {
        const level = getColorLevelString(settings.colorLevel);
        const widgetName = selectedWidget ? getItemLabel(selectedWidget) : '';

        if (gradientCustomStep) {
            return (
                <Box flexDirection='column'>
                    <Text bold>
                        Custom Gradient
                        {widgetName ? ` - ${widgetName}` : ''}
                    </Text>
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
                <Text bold>
                    Select Gradient
                    {widgetName ? ` - ${widgetName}` : ''}
                </Text>
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

    // Show confirmation dialog if clearing all colors
    if (showClearConfirm) {
        return (
            <Box flexDirection='column'>
                <Text bold color='yellow'>⚠ 確認清除所有顏色</Text>
                <Box marginTop={1} flexDirection='column'>
                    <Text>這將把所有元件的顏色重置為預設值。</Text>
                    <Text color='red'>此操作不可撤銷！</Text>
                </Box>
                <Box marginTop={2}>
                    <Text>是否繼續？</Text>
                </Box>
                <Box marginTop={1}>
                    <ConfirmDialog
                        inline={true}
                        onConfirm={() => {
                            const newItems = clearAllWidgetStyling(widgets);
                            onUpdate(newItems);
                            setShowClearConfirm(false);
                        }}
                        onCancel={() => {
                            setShowClearConfirm(false);
                        }}
                    />
                </Box>
            </Box>
        );
    }

    // Check for global overrides
    // Note: When powerline is enabled, background override doesn't affect the display
    // since powerline uses item-specific backgrounds for segments
    const hasGlobalFgOverride = !!settings.overrideForegroundColor;
    const hasGlobalBgOverride = !!settings.overrideBackgroundColor && !powerlineEnabled;
    const globalOverrideMessage = hasGlobalFgOverride && hasGlobalBgOverride
        ? '⚠ Global override for FG and BG active'
        : hasGlobalFgOverride
            ? '⚠ Global override for FG active'
            : hasGlobalBgOverride
                ? '⚠ Global override for BG active'
                : null;

    return (
        <Box flexDirection='column'>
            <Box>
                <Text bold>
                    配置顏色
                    {lineIndex !== undefined ? ` - 第 ${lineIndex + 1} 行` : ''}
                    {editingBackground && chalk.yellow(' [背景色模式]')}
                </Text>
                {globalOverrideMessage && (
                    <Text color='yellow' dimColor>
                        {'.  '}
                        {globalOverrideMessage}
                    </Text>
                )}
            </Box>
            {hexInputMode ? (
                <Box flexDirection='column'>
                    <Text>輸入 6 位十六進位制顏色程式碼（不含 #）：</Text>
                    <Text>
                        #
                        {hexInput}
                        <Text dimColor>{hexInput.length < 6 ? '_'.repeat(6 - hexInput.length) : ''}</Text>
                    </Text>
                    <Text> </Text>
                    <Text dimColor>按 Enter 確認，ESC 取消</Text>
                </Box>
            ) : (
                <>
                    <Text dimColor>
                        ↑↓ 選擇，←→ 切換
                        {' '}
                        {editingBackground ? '背景色' : '前景色'}
                        ，(f) 前景/背景切換，(b)加粗，(d)暗淡，
                        {getColorEntryKeys(settings.colorLevel)}
                        {!editingBackground && settings.colorLevel >= 2 ? ' (g)漸變色，' : ''}
                        {' '}
                        (r)重置，(c)清除全部，ESC 返回
                    </Text>
                    {!settings.powerline.enabled && !settings.defaultSeparator && (
                        <Text dimColor>
                            (s)顯示分隔符：
                            {showSeparators ? chalk.green('ON') : chalk.gray('OFF')}
                        </Text>
                    )}
                    {selectedWidget ? (
                        <Box marginTop={1} flexDirection='column'>
                            <Text>
                                當前
                                {' '}
                                {editingBackground ? '背景色' : '前景色'}
                                {' '}
                                (
                                {colorNumber === 'custom' ? '自定義' : `${colorNumber}/${colorList.length}`}
                                ):
                                {' '}
                                {colorDisplay}
                                {styleIndicators && ` ${styleIndicators}`}
                            </Text>
                            {/* Widgets that fully own their colors are filtered out
                                above; this one colors only some runs itself */}
                            {!editingBackground && widgetColorsOnlyItsRuns(selectedWidget) && (
                                <Text dimColor>  此元件自行設定部分顏色（見編輯行中的選項）；此前景色用於其餘部分。</Text>
                            )}
                        </Box>
                    ) : (
                        <Box marginTop={1}>
                            <Text> </Text>
                        </Box>
                    )}
                </>
            )}
            <Box marginTop={1}>
                {hexInputMode ? (
                    // Static list when in input mode - no keyboard interaction
                    <Box flexDirection='column'>
                        {menuItems.map(item => (
                            <Text
                                key={item.value}
                                color={item.value === highlightedItemId ? 'cyan' : 'white'}
                                bold={item.value === highlightedItemId}
                            >
                                {item.value === highlightedItemId ? '▶ ' : '  '}
                                {item.label}
                            </Text>
                        ))}
                    </Box>
                ) : (
                    // Interactive SelectInput when not in input mode
                    <SelectInput
                        key={`${showSeparators}-${highlightedItemId}`}
                        items={menuItems}
                        onHighlight={handleHighlight}
                        initialIndex={Math.max(0, menuItems.findIndex(item => item.value === highlightedItemId))}
                        indicatorComponent={({ isSelected }) => (
                            <Text>{isSelected ? '▶' : '  '}</Text>
                        )}
                        itemComponent={({ isSelected, label }) => (
                            // The label already has ANSI codes applied via applyColors()
                            // We need to pass it directly as a single Text child to preserve the codes
                            <Text>{` ${label}`}</Text>
                        )}
                    />
                )}
            </Box>
            <Box marginTop={1} flexDirection='column'>
                <Text color='yellow'>⚠ VSCode 使用者注意: </Text>
                <Text dimColor wrap='wrap'>如果 VSCode 整合終端中顏色顯示不正確，可能是"Terminal › Integrated: Minimum Contrast Ratio"（`terminal.integrated.minimumContrastRatio`）設定強制了前景色和背景色之間的最低對比度。你可以將該設定調整為 1 來禁用對比度強制，或者使用獨立終端以獲得準確的顏色顯示。</Text>
            </Box>
        </Box>
    );
};
