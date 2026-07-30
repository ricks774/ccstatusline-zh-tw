import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import type { Settings } from '../../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetItem,
    WidgetItemType
} from '../../types/Widget';
import { getBackgroundColorsForPowerline } from '../../utils/colors';
import { generateGuid } from '../../utils/guid';
import { canDetectTerminalWidth } from '../../utils/terminal';
import {
    filterWidgetCatalog,
    getMatchSegments,
    getWidget,
    getWidgetCatalog,
    getWidgetCatalogCategories
} from '../../utils/widgets';

import { ConfirmDialog } from './ConfirmDialog';
import {
    handleMoveInputMode,
    handleNormalInputMode,
    handlePickerInputMode,
    normalizePickerState,
    type CustomEditorWidgetState,
    type WidgetPickerAction,
    type WidgetPickerState
} from './items-editor/input-handlers';

export interface ItemsEditorProps {
    widgets: WidgetItem[];
    onUpdate: (widgets: WidgetItem[]) => void;
    onBack: () => void;
    lineNumber: number;
    settings: Settings;
}

function isMergedIntoPreviousWidget(widgets: WidgetItem[], index: number): boolean {
    if (index <= 0) {
        return false;
    }

    return Boolean(widgets[index - 1]?.merge);
}

export const ItemsEditor: React.FC<ItemsEditorProps> = ({ widgets, onUpdate, onBack, lineNumber, settings }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [moveMode, setMoveMode] = useState(false);
    const [customEditorWidget, setCustomEditorWidget] = useState<CustomEditorWidgetState | null>(null);
    const [widgetPicker, setWidgetPicker] = useState<WidgetPickerState | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const separatorChars = ['|', '-', ',', ' '];

    const widgetCatalog = getWidgetCatalog(settings);
    const widgetCategories = ['全部', ...getWidgetCatalogCategories(widgetCatalog)];

    // Get a unique background color for powerline mode
    const getUniqueBackgroundColor = (insertIndex: number): string | undefined => {
        // Only apply background colors if powerline is enabled and NOT using custom theme
        if (!settings.powerline.enabled || settings.powerline.theme === 'custom') {
            return undefined;
        }

        // Get all available background colors (excluding black for better visibility)
        const bgColors = getBackgroundColorsForPowerline();

        // Get colors of adjacent items
        const prevWidget = insertIndex > 0 ? widgets[insertIndex - 1] : null;
        const nextWidget = insertIndex < widgets.length ? widgets[insertIndex] : null;

        const prevBg = prevWidget?.backgroundColor;
        const nextBg = nextWidget?.backgroundColor;

        // Filter out colors that match neighbors
        const availableColors = bgColors.filter(color => color !== prevBg && color !== nextBg);

        // If we have available colors, pick one randomly
        if (availableColors.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableColors.length);
            return availableColors[randomIndex];
        }

        // Fallback: if somehow both neighbors use all 14 colors (impossible with 2 neighbors),
        // just pick any color that's different from the previous
        return bgColors.find(c => c !== prevBg) ?? bgColors[0];
    };

    const handleEditorComplete = (updatedWidget: WidgetItem) => {
        const newWidgets = [...widgets];
        newWidgets[selectedIndex] = updatedWidget;
        onUpdate(newWidgets);
        setCustomEditorWidget(null);
    };

    const handleEditorCancel = () => {
        setCustomEditorWidget(null);
    };

    const getCustomKeybindsForWidget = (widgetImpl: Widget, widget: WidgetItem): CustomKeybind[] => {
        if (!widgetImpl.getCustomKeybinds) {
            return [];
        }

        return widgetImpl.getCustomKeybinds(widget);
    };

    const openWidgetPicker = (action: WidgetPickerAction) => {
        if (widgetCatalog.length === 0) {
            return;
        }

        const currentType = widgets[selectedIndex]?.type;
        const selectedType = action === 'change' ? currentType ?? null : null;

        setWidgetPicker(normalizePickerState({
            action,
            level: 'category',
            selectedCategory: '全部',
            categoryQuery: '',
            widgetQuery: '',
            selectedType
        }, widgetCatalog, widgetCategories));
    };

    const applyWidgetPickerSelection = (selectedType: WidgetItemType) => {
        if (!widgetPicker) {
            return;
        }

        if (widgetPicker.action === 'change') {
            const currentWidget = widgets[selectedIndex];
            if (currentWidget) {
                const newWidgets = [...widgets];
                newWidgets[selectedIndex] = { ...currentWidget, type: selectedType };
                onUpdate(newWidgets);
            }
        } else {
            const insertIndex = widgetPicker.action === 'add'
                ? (widgets.length > 0 ? selectedIndex + 1 : 0)
                : selectedIndex;
            const backgroundColor = getUniqueBackgroundColor(insertIndex);
            const newWidget: WidgetItem = {
                id: generateGuid(),
                type: selectedType,
                ...(backgroundColor && { backgroundColor })
            };
            const newWidgets = [...widgets];
            newWidgets.splice(insertIndex, 0, newWidget);
            onUpdate(newWidgets);
            setSelectedIndex(insertIndex);
        }

        setWidgetPicker(null);
    };

    const currentWidget = widgets[selectedIndex];
    const isSeparator = currentWidget?.type === 'separator';
    const isFlexSeparator = currentWidget?.type === 'flex-separator';

    // Check if widget supports raw value using registry
    let canToggleRaw = false;
    let customKeybinds: CustomKeybind[] = [];
    if (currentWidget && !isSeparator && !isFlexSeparator) {
        const widgetImpl = getWidget(currentWidget.type);
        if (widgetImpl) {
            canToggleRaw = widgetImpl.supportsRawValue();
            // Get custom keybinds from the widget
            customKeybinds = getCustomKeybindsForWidget(widgetImpl, currentWidget);
        } else {
            canToggleRaw = false;
        }
    }

    const canMerge = currentWidget && selectedIndex < widgets.length - 1 && !isSeparator && !isFlexSeparator;
    const canExcludeAlign = Boolean(currentWidget) && !isSeparator && !isFlexSeparator
        && settings.powerline.enabled && settings.powerline.autoAlign
        && !isMergedIntoPreviousWidget(widgets, selectedIndex);
    const hasWidgets = widgets.length > 0;

    useInput((input, key) => {
        // Skip input if custom editor is active
        if (customEditorWidget) {
            return;
        }

        // Skip input handling when clear confirmation is active - let ConfirmDialog handle it
        if (showClearConfirm) {
            return;
        }

        if (widgetPicker) {
            handlePickerInputMode({
                input,
                key,
                widgetPicker,
                widgetCatalog,
                widgetCategories,
                setWidgetPicker,
                applyWidgetPickerSelection
            });
            return;
        }

        if (moveMode) {
            handleMoveInputMode({
                key,
                widgets,
                selectedIndex,
                onUpdate,
                setSelectedIndex,
                setMoveMode
            });
            return;
        }

        handleNormalInputMode({
            input,
            key,
            widgets,
            selectedIndex,
            canExcludeAlign,
            separatorChars,
            onBack,
            onUpdate,
            setSelectedIndex,
            setMoveMode,
            setShowClearConfirm,
            openWidgetPicker,
            getCustomKeybindsForWidget,
            setCustomEditorWidget,
            getUniqueBackgroundColor
        });
    });

    const getWidgetDisplay = (widget: WidgetItem) => {
        // Special handling for separators (not widgets)
        if (widget.type === 'separator') {
            const char = widget.character ?? '|';
            const charDisplay = char === ' ' ? '(空格)' : char;
            return `分隔符 ${charDisplay}`;
        }
        if (widget.type === 'flex-separator') {
            return '彈性分隔符';
        }

        // Handle regular widgets - delegate to widget for display
        const widgetImpl = getWidget(widget.type);
        if (widgetImpl) {
            const { displayText, modifierText } = widgetImpl.getEditorDisplay(widget);
            // Return plain text without colors
            return displayText + (modifierText ? ` ${modifierText}` : '');
        }
        // Unknown widget type
        return `未知: ${widget.type}`;
    };

    const hasFlexSeparator = widgets.some(widget => widget.type === 'flex-separator');
    const widthDetectionAvailable = canDetectTerminalWidth();
    const pickerCategories = widgetPicker
        ? [...widgetCategories]
        : [];
    const selectedPickerCategory = widgetPicker
        ? (widgetPicker.selectedCategory && pickerCategories.includes(widgetPicker.selectedCategory)
            ? widgetPicker.selectedCategory
            : (pickerCategories[0] ?? null))
        : null;
    const topLevelSearchEntries = widgetPicker?.level === 'category' && widgetPicker.categoryQuery.trim().length > 0
        ? filterWidgetCatalog(widgetCatalog, '全部', widgetPicker.categoryQuery)
        : [];
    const selectedTopLevelSearchEntry = widgetPicker
        ? (topLevelSearchEntries.find(entry => entry.type === widgetPicker.selectedType) ?? topLevelSearchEntries[0])
        : null;
    const pickerEntries = widgetPicker
        ? filterWidgetCatalog(widgetCatalog, selectedPickerCategory ?? '全部', widgetPicker.widgetQuery)
        : [];
    const selectedPickerEntry = widgetPicker
        ? (pickerEntries.find(entry => entry.type === widgetPicker.selectedType) ?? pickerEntries[0])
        : null;

    // Build main help text (without custom keybinds)
    let helpText = hasWidgets
        ? '↑↓ 選擇, ←→ 開啟型別選擇器'
        : '(a)新增, (i)插入';
    if (isSeparator) {
        helpText += ', 空格編輯分隔符';
    }
    if (hasWidgets) {
        helpText += ', Enter 移動, (a)新增, (i)插入, (k)克隆, (d)刪除, (c)清空行';
    }
    if (canToggleRaw) {
        helpText += ', (r)純值';
    }
    if (canMerge) {
        helpText += ', (m)合併';
    }
    if (canExcludeAlign) {
        helpText += ', (x)不參與對齊';
    }
    helpText += ', ESC 返回';

    // Build custom keybinds text
    const customKeybindsText = customKeybinds.map(kb => kb.label).join(', ');
    const pickerActionLabel = widgetPicker?.action === 'add'
        ? '新增元件'
        : widgetPicker?.action === 'insert'
            ? '插入元件'
            : '更改元件型別';

    // If custom editor is active, render it instead of the normal UI
    if (customEditorWidget?.impl.renderEditor) {
        return customEditorWidget.impl.renderEditor({
            widget: customEditorWidget.widget,
            onComplete: handleEditorComplete,
            onCancel: handleEditorCancel,
            action: customEditorWidget.action
        });
    }

    if (showClearConfirm) {
        return (
            <Box flexDirection='column'>
                <Text bold color='yellow'>⚠ 確認清空行</Text>
                <Box marginTop={1} flexDirection='column'>
                    <Text>
                        這將移除第
                        {' '}
                        {lineNumber}
                        {' '}
                        行的所有元件。
                    </Text>
                    <Text color='red'>此操作不可撤銷！</Text>
                </Box>
                <Box marginTop={2}>
                    <Text>繼續？</Text>
                </Box>
                <Box marginTop={1}>
                    <ConfirmDialog
                        inline={true}
                        onConfirm={() => {
                            onUpdate([]);
                            setSelectedIndex(0);
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

    return (
        <Box flexDirection='column'>
            <Box>
                <Text bold>
                    編輯行
                    {' '}
                    {lineNumber}
                    {' '}
                </Text>
                {moveMode && <Text color='blue'>[移動模式]</Text>}
                {widgetPicker && <Text color='cyan'>{`[${pickerActionLabel}]`}</Text>}
                {(settings.powerline.enabled || Boolean(settings.defaultSeparator)) && (
                    <Box marginLeft={2}>
                        <Text color='yellow'>
                            ⚠
                            {' '}
                            {settings.powerline.enabled
                                ? 'Powerline 模式已啟用：分隔符由 Powerline 設定控制'
                                : '預設分隔符已啟用：手動分隔符已禁用'}
                        </Text>
                    </Box>
                )}
            </Box>
            {moveMode ? (
                <Box flexDirection='column' marginBottom={1}>
                    <Text dimColor>↑↓ 移動元件，ESC 或 Enter 退出移動模式</Text>
                </Box>
            ) : widgetPicker ? (
                <Box flexDirection='column'>
                    {widgetPicker.level === 'category' ? (
                        <>
                            {widgetPicker.categoryQuery.trim().length > 0 ? (
                                <Text dimColor>↑↓ 選擇匹配元件，Enter 確認，ESC 清除/取消</Text>
                            ) : (
                                <Text dimColor>↑↓ 選擇分類，輸入搜尋所有元件，Enter 繼續，ESC 取消</Text>
                            )}
                            <Box>
                                <Text dimColor>搜尋: </Text>
                                <Text color='cyan'>{widgetPicker.categoryQuery || '（無）'}</Text>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Text dimColor>↑↓ 選擇元件，輸入搜尋，Enter 確認，ESC 返回</Text>
                            <Box>
                                <Text dimColor>
                                    分類:
                                    {' '}
                                    {selectedPickerCategory ?? '（無）'}
                                    {' '}
                                    | 搜尋:
                                    {' '}
                                </Text>
                                <Text color='cyan'>{widgetPicker.widgetQuery || '（無）'}</Text>
                            </Box>
                        </>
                    )}
                </Box>
            ) : (
                <Box flexDirection='column'>
                    <Text dimColor>{helpText}</Text>
                    <Text dimColor>{customKeybindsText || ' '}</Text>
                </Box>
            )}
            {hasFlexSeparator && !widthDetectionAvailable && (
                <Box marginTop={1}>
                    <Text color='yellow'>⚠ 注意：當前環境無法檢測終端寬度。</Text>
                    <Text dimColor>  在寬度檢測可用前，彈性分隔符將作為普通分隔符使用。</Text>
                </Box>
            )}
            {widgetPicker && (
                <Box marginTop={1} flexDirection='column'>
                    {widgetPicker.level === 'category' ? (
                        widgetPicker.categoryQuery.trim().length > 0 ? (
                            topLevelSearchEntries.length === 0 ? (
                                <Text dimColor>沒有匹配的元件。</Text>
                            ) : (
                                <>
                                    {topLevelSearchEntries.map((entry, index) => {
                                        const isSelected = entry.type === selectedTopLevelSearchEntry?.type;
                                        const segments = getMatchSegments(entry.displayName, widgetPicker.categoryQuery);
                                        return (
                                            <Box key={entry.type} flexDirection='row' flexWrap='nowrap'>
                                                <Box width={3}>
                                                    <Text color={isSelected ? 'green' : undefined}>
                                                        {isSelected ? '▶ ' : '  '}
                                                    </Text>
                                                </Box>
                                                <Text color={isSelected ? 'green' : undefined}>{`${index + 1}. `}</Text>
                                                {segments.map((seg, i) => (
                                                    <Text
                                                        key={i}
                                                        color={isSelected ? 'green' : seg.matched ? 'yellowBright' : undefined}
                                                        bold={isSelected ? true : seg.matched}
                                                    >
                                                        {seg.text}
                                                    </Text>
                                                ))}
                                            </Box>
                                        );
                                    })}
                                    {selectedTopLevelSearchEntry && (
                                        <Box marginTop={1} paddingLeft={2}>
                                            <Text dimColor>{selectedTopLevelSearchEntry.description}</Text>
                                        </Box>
                                    )}
                                </>
                            )
                        ) : (
                            pickerCategories.length === 0 ? (
                                <Text dimColor>沒有可用的分類。</Text>
                            ) : (
                                <>
                                    {pickerCategories.map((category, index) => {
                                        const isSelected = category === selectedPickerCategory;
                                        return (
                                            <Box key={category} flexDirection='row' flexWrap='nowrap'>
                                                <Box width={3}>
                                                    <Text color={isSelected ? 'green' : undefined}>
                                                        {isSelected ? '▶ ' : '  '}
                                                    </Text>
                                                </Box>
                                                <Text color={isSelected ? 'green' : undefined}>
                                                    {`${index + 1}. ${category}`}
                                                </Text>
                                            </Box>
                                        );
                                    })}
                                    {selectedPickerCategory === '全部' && (
                                        <Box marginTop={1} paddingLeft={2}>
                                            <Text dimColor>搜尋所有元件分類。</Text>
                                        </Box>
                                    )}
                                </>
                            )
                        )
                    ) : (
                        pickerEntries.length === 0 ? (
                            <Text dimColor>沒有匹配當前分類/搜尋的元件。</Text>
                        ) : (
                            <>
                                {pickerEntries.map((entry, index) => {
                                    const isSelected = entry.type === selectedPickerEntry?.type;
                                    const segments = getMatchSegments(entry.displayName, widgetPicker.widgetQuery);
                                    return (
                                        <Box key={entry.type} flexDirection='row' flexWrap='nowrap'>
                                            <Box width={3}>
                                                <Text color={isSelected ? 'green' : undefined}>
                                                    {isSelected ? '▶ ' : '  '}
                                                </Text>
                                            </Box>
                                            <Text color={isSelected ? 'green' : undefined}>{`${index + 1}. `}</Text>
                                            {segments.map((seg, i) => (
                                                <Text
                                                    key={i}
                                                    color={isSelected ? 'green' : (seg.matched ? 'yellowBright' : undefined)}
                                                    bold={seg.matched}
                                                >
                                                    {seg.text}
                                                </Text>
                                            ))}
                                        </Box>
                                    );
                                })}
                                {selectedPickerEntry && (
                                    <Box marginTop={1} paddingLeft={2}>
                                        <Text dimColor>{selectedPickerEntry.description}</Text>
                                    </Box>
                                )}
                            </>
                        )
                    )}
                </Box>
            )}
            {!widgetPicker && (
                <Box marginTop={1} flexDirection='column'>
                    {widgets.length === 0 ? (
                        <Text dimColor>暫無元件。按 'a' 新增。</Text>
                    ) : (
                        <>
                            {widgets.map((widget, index) => {
                                const isSelected = index === selectedIndex;
                                const widgetImpl = widget.type !== 'separator' && widget.type !== 'flex-separator' ? getWidget(widget.type) : null;
                                const { displayText, modifierText } = widgetImpl?.getEditorDisplay(widget) ?? { displayText: getWidgetDisplay(widget) };
                                const supportsRawValue = widgetImpl?.supportsRawValue() ?? false;

                                return (
                                    <Box key={widget.id} flexDirection='row' flexWrap='nowrap'>
                                        <Box width={3}>
                                            <Text color={isSelected ? (moveMode ? 'blue' : 'green') : undefined}>
                                                {isSelected ? (moveMode ? '◆ ' : '▶ ') : '  '}
                                            </Text>
                                        </Box>
                                        <Text color={isSelected ? (moveMode ? 'blue' : 'green') : undefined}>
                                            {`${index + 1}. ${displayText || getWidgetDisplay(widget)}`}
                                        </Text>
                                        {modifierText && (
                                            <Text dimColor>
                                                {' '}
                                                {modifierText}
                                            </Text>
                                        )}
                                        {supportsRawValue && widget.rawValue && <Text dimColor> (純值)</Text>}
                                        {widget.merge === true && <Text dimColor> (已合併→)</Text>}
                                        {widget.merge === 'no-padding' && <Text dimColor> (合併無間距→)</Text>}
                                        {widget.excludeFromAutoAlign && settings.powerline.enabled && settings.powerline.autoAlign && !isMergedIntoPreviousWidget(widgets, index) && <Text dimColor> (不參與對齊)</Text>}
                                    </Box>
                                );
                            })}
                            {/* Display description for selected widget */}
                            {currentWidget && (
                                <Box marginTop={1} paddingLeft={2}>
                                    <Text dimColor>
                                        {(() => {
                                            if (currentWidget.type === 'separator') {
                                                return '狀態列元件之間的分隔符';
                                            } else if (currentWidget.type === 'flex-separator') {
                                                return '擴充套件以填充可用終端寬度';
                                            } else {
                                                const widgetImpl = getWidget(currentWidget.type);
                                                return widgetImpl ? widgetImpl.getDescription() : '未知元件型別';
                                            }
                                        })()}
                                    </Text>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
};
