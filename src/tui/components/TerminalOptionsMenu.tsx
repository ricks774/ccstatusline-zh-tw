import chalk from 'chalk';
import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import type { Settings } from '../../types/Settings';
import {
    hasCustomWidgetColors,
    sanitizeLinesForColorLevel
} from '../../utils/color-sanitize';

import { ConfirmDialog } from './ConfirmDialog';
import {
    List,
    type ListEntry
} from './List';

type TerminalOptionsValue = 'width' | 'colorLevel';

export function getNextColorLevel(level: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
    return ((level + 1) % 4) as 0 | 1 | 2 | 3;
}

export function shouldWarnOnColorLevelChange(
    currentLevel: 0 | 1 | 2 | 3,
    nextLevel: 0 | 1 | 2 | 3,
    hasCustomColors: boolean
): boolean {
    return hasCustomColors
        && ((currentLevel === 2 && nextLevel !== 2)
            || (currentLevel === 3 && nextLevel !== 3));
}

export function buildTerminalOptionsItems(
    colorLevel: 0 | 1 | 2 | 3
): ListEntry<TerminalOptionsValue>[] {
    return [
        {
            label: '◱ 終端寬度',
            value: 'width',
            description: '配置狀態列如何使用可用的終端寬度以及何時應該壓縮顯示。'
        },
        {
            label: '▓ 顏色級別',
            sublabel: `(${getColorLevelLabel(colorLevel)})`,
            value: 'colorLevel',
            description: [
                '顏色級別影響顏色的渲染方式：',
                '• Truecolor：完整 24 位 RGB 顏色（1670 萬色）',
                '• 256 色：擴充套件調色盤（256 色）',
                '• Basic：標準 16 色終端調色盤',
                '• 無顏色：禁用所有顏色輸出'
            ].join('\n')
        }
    ];
}

export interface TerminalOptionsMenuProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: (target?: string) => void;
}

export const TerminalOptionsMenu: React.FC<TerminalOptionsMenuProps> = ({
    settings,
    onUpdate,
    onBack
}) => {
    const [showColorWarning, setShowColorWarning] = useState(false);
    const [pendingColorLevel, setPendingColorLevel] = useState<0 | 1 | 2 | 3 | null>(null);

    const handleSelect = (value: TerminalOptionsValue | 'back') => {
        if (value === 'back') {
            onBack();
            return;
        }

        if (value === 'width') {
            onBack('width');
            return;
        }

        const hasCustomColors = hasCustomWidgetColors(settings.lines);
        const currentLevel = settings.colorLevel;
        const nextLevel = getNextColorLevel(currentLevel);

        if (shouldWarnOnColorLevelChange(currentLevel, nextLevel, hasCustomColors)) {
            setShowColorWarning(true);
            setPendingColorLevel(nextLevel);
            return;
        }

        chalk.level = nextLevel;

        const cleanedLines = sanitizeLinesForColorLevel(settings.lines, nextLevel);

        onUpdate({
            ...settings,
            lines: cleanedLines,
            colorLevel: nextLevel
        });
    };

    const handleColorConfirm = () => {
        if (pendingColorLevel !== null) {
            chalk.level = pendingColorLevel;

            const cleanedLines = sanitizeLinesForColorLevel(settings.lines, pendingColorLevel);

            onUpdate({
                ...settings,
                lines: cleanedLines,
                colorLevel: pendingColorLevel
            });
        }
        setShowColorWarning(false);
        setPendingColorLevel(null);
    };

    const handleColorCancel = () => {
        setShowColorWarning(false);
        setPendingColorLevel(null);
    };

    useInput((_, key) => {
        if (key.escape && !showColorWarning) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>終端選項</Text>
            {showColorWarning ? (
                <Box flexDirection='column' marginTop={1}>
                    <Text color='yellow'>⚠ 警告：檢測到自定義顏色！</Text>
                    <Text>切換顏色模式將會把自定義的 ansi256 或十六進位制顏色重置為預設值。</Text>
                    <Box marginTop={1}>
                        <ConfirmDialog
                            message='繼續？'
                            onConfirm={handleColorConfirm}
                            onCancel={handleColorCancel}
                            inline
                        />
                    </Box>
                </Box>
            ) : (
                <>
                    <Text color='white'>配置終端特定設定以獲得最佳顯示效果</Text>
                    <List
                        marginTop={1}
                        items={buildTerminalOptionsItems(settings.colorLevel)}
                        onSelect={handleSelect}
                        showBackButton={true}
                    />
                </>
            )}
        </Box>
    );
};

export const getColorLevelLabel = (level?: 0 | 1 | 2 | 3): string => {
    switch (level) {
        case 0: return '無顏色';
        case 1: return '基礎';
        case 2:
        case undefined: return '256 色（預設）';
        case 3: return 'Truecolor';
        default: return '256 色（預設）';
    }
};
