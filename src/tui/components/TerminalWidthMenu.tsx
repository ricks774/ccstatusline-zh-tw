import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import type { FlexMode } from '../../types/FlexMode';
import type { Settings } from '../../types/Settings';
import { shouldInsertInput } from '../../utils/input-guards';

import {
    List,
    type ListEntry
} from './List';

export const TERMINAL_WIDTH_OPTIONS: FlexMode[] = ['full', 'full-minus-40', 'full-until-compact'];

export function getTerminalWidthSelectionIndex(selectedOption: FlexMode): number {
    const selectedIndex = TERMINAL_WIDTH_OPTIONS.indexOf(selectedOption);

    return selectedIndex >= 0 ? selectedIndex : 0;
}

export function validateCompactThresholdInput(value: string): string | null {
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
        return 'Please enter a valid number';
    }

    if (parsedValue < 1 || parsedValue > 99) {
        return `Value must be between 1 and 99 (you entered ${parsedValue})`;
    }

    return null;
}

export function buildTerminalWidthItems(
    selectedOption: FlexMode,
    compactThreshold: number
): ListEntry<FlexMode>[] {
    return [
        {
            value: 'full',
            label: '始終全寬',
            sublabel: selectedOption === 'full' ? '（當前）' : undefined,
            description: '使用完整終端寬度減去 4 個字元的終端內邊距。如果出現自動壓縮訊息，可能導致行換行。\n\n注意：如果啟用了 /ide 整合，不建議使用此模式。'
        },
        {
            value: 'full-minus-40',
            label: '全寬減 40',
            sublabel: selectedOption === 'full-minus-40' ? '（當前）' : '（預設）',
            description: '在狀態列右側留出空間以容納自動壓縮訊息。這可以防止換行但可能留下未使用的空間。此限制存在是因為我們無法檢測訊息何時出現。'
        },
        {
            value: 'full-until-compact',
            label: '上下文壓縮前全寬',
            sublabel: selectedOption === 'full-until-compact'
                ? `（閾值 ${compactThreshold}%，當前）`
                : `（閾值 ${compactThreshold}%）`,
            description: `根據上下文使用情況動態調整寬度。當上下文達到 ${compactThreshold}% 時，切換為留出自動壓縮訊息空間。\n\n注意：如果啟用了 /ide 整合，不建議使用此模式。`
        }
    ];
}

export interface TerminalWidthMenuProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
}

export const TerminalWidthMenu: React.FC<TerminalWidthMenuProps> = ({
    settings,
    onUpdate,
    onBack
}) => {
    const [selectedOption, setSelectedOption] = useState<FlexMode>(settings.flexMode);
    const [compactThreshold, setCompactThreshold] = useState(settings.compactThreshold);
    const [editingThreshold, setEditingThreshold] = useState(false);
    const [thresholdInput, setThresholdInput] = useState(String(settings.compactThreshold));
    const [validationError, setValidationError] = useState<string | null>(null);

    useInput((input, key) => {
        if (editingThreshold) {
            if (key.return) {
                const error = validateCompactThresholdInput(thresholdInput);

                if (error) {
                    setValidationError(error);
                } else {
                    const value = parseInt(thresholdInput, 10);
                    setCompactThreshold(value);

                    const updatedSettings = {
                        ...settings,
                        flexMode: selectedOption,
                        compactThreshold: value
                    };
                    onUpdate(updatedSettings);
                    setEditingThreshold(false);
                    setValidationError(null);
                }
            } else if (key.escape) {
                setThresholdInput(String(compactThreshold));
                setEditingThreshold(false);
                setValidationError(null);
            } else if (key.backspace) {
                setThresholdInput(thresholdInput.slice(0, -1));
                setValidationError(null);
            } else if (key.delete) {
                // For simple number inputs, forward delete does nothing since there's no cursor position
            } else if (shouldInsertInput(input, key) && /\d/.test(input)) {
                const newValue = thresholdInput + input;
                if (newValue.length <= 2) {
                    setThresholdInput(newValue);
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
            <Text bold>終端寬度</Text>
            <Text color='white'>這些設定影響長行的截斷位置，以及使用彈性分隔符時的右對齊位置</Text>
            <Text dimColor wrap='wrap'>Claude Code 目前未提供狀態列可用寬度變數，IDE 整合、自動壓縮通知等功能都可能導致狀態列換行（如果不進行截斷）</Text>

            {editingThreshold ? (
                <Box marginTop={1} flexDirection='column'>
                    <Text>
                        輸入壓縮閾值（1-99）：
                        {' '}
                        {thresholdInput}
                        %
                    </Text>
                    {validationError ? (
                        <Text color='red'>{validationError}</Text>
                    ) : (
                        <Text dimColor>按 Enter 確認，ESC 取消</Text>
                    )}
                </Box>
            ) : (
                <List
                    marginTop={1}
                    items={buildTerminalWidthItems(selectedOption, compactThreshold)}
                    initialSelection={getTerminalWidthSelectionIndex(selectedOption)}
                    onSelect={(value) => {
                        if (value === 'back') {
                            onBack();
                            return;
                        }

                        setSelectedOption(value);

                        const updatedSettings = {
                            ...settings,
                            flexMode: value,
                            compactThreshold
                        };
                        onUpdate(updatedSettings);

                        if (value === 'full-until-compact') {
                            setEditingThreshold(true);
                        }
                    }}
                    showBackButton={true}
                />
            )}
        </Box>
    );
};
