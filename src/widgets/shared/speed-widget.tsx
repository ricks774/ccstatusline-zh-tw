import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import type { RenderContext } from '../../types/RenderContext';
import type { SpeedMetrics } from '../../types/SpeedMetrics';
import type {
    CustomKeybind,
    WidgetEditorDisplay,
    WidgetEditorProps,
    WidgetItem
} from '../../types/Widget';
import { shouldInsertInput } from '../../utils/input-guards';
import {
    calculateInputSpeed,
    calculateOutputSpeed,
    calculateTotalSpeed,
    formatSpeed
} from '../../utils/speed-metrics';
import {
    DEFAULT_SPEED_WINDOW_SECONDS,
    MAX_SPEED_WINDOW_SECONDS,
    MIN_SPEED_WINDOW_SECONDS,
    getWidgetSpeedWindowSeconds,
    isWidgetSpeedWindowEnabled,
    withWidgetSpeedWindowSeconds
} from '../../utils/speed-window';

import { makeModifierText } from './editor-display';
import { formatRawOrLabeledValue } from './raw-or-labeled';

export type SpeedWidgetKind = 'input' | 'output' | 'total';

const WINDOW_EDITOR_ACTION = 'edit-window';

interface SpeedWidgetKindConfig {
    label: string;
    displayName: string;
    description: string;
    sessionPreview: string;
    windowedPreview: string;
}

const SPEED_WIDGET_CONFIG: Record<SpeedWidgetKind, SpeedWidgetKindConfig> = {
    input: {
        label: '輸入: ',
        displayName: '輸入速度',
        description: '顯示會話平均輸入 Token 速度（tokens/sec）。可選視窗：0-120 秒（0 = 全會話平均）。',
        sessionPreview: '85.2 t/s',
        windowedPreview: '31.5 t/s'
    },
    output: {
        label: '輸出: ',
        displayName: '輸出速度',
        description: '顯示會話平均輸出 Token 速度（tokens/sec）。可選視窗：0-120 秒（0 = 全會話平均）。',
        sessionPreview: '42.5 t/s',
        windowedPreview: '26.8 t/s'
    },
    total: {
        label: '合計: ',
        displayName: '總速度',
        description: '顯示會話平均總 Token 速度（tokens/sec）。可選視窗：0-120 秒（0 = 全會話平均）。',
        sessionPreview: '127.7 t/s',
        windowedPreview: '58.3 t/s'
    }
};

function getSpeedMetricsForWidget(item: WidgetItem, context: RenderContext): SpeedMetrics | null {
    if (!isWidgetSpeedWindowEnabled(item)) {
        return context.speedMetrics ?? null;
    }

    const windowSeconds = getWidgetSpeedWindowSeconds(item);
    return context.windowedSpeedMetrics?.[windowSeconds.toString()] ?? null;
}

function calculateSpeed(kind: SpeedWidgetKind, metrics: SpeedMetrics): number | null {
    if (kind === 'input') {
        return calculateInputSpeed(metrics);
    }
    if (kind === 'output') {
        return calculateOutputSpeed(metrics);
    }
    return calculateTotalSpeed(metrics);
}

export function getSpeedWidgetDisplayName(kind: SpeedWidgetKind): string {
    return SPEED_WIDGET_CONFIG[kind].displayName;
}

export function getSpeedWidgetDescription(kind: SpeedWidgetKind): string {
    return SPEED_WIDGET_CONFIG[kind].description;
}

export function getSpeedWidgetEditorDisplay(kind: SpeedWidgetKind, item: WidgetItem): WidgetEditorDisplay {
    const windowSeconds = getWidgetSpeedWindowSeconds(item);
    const modifiers = windowSeconds > 0
        ? [`${windowSeconds}秒視窗`]
        : ['全會話平均'];

    return {
        displayText: getSpeedWidgetDisplayName(kind),
        modifierText: makeModifierText(modifiers)
    };
}

export function renderSpeedWidgetValue(
    kind: SpeedWidgetKind,
    item: WidgetItem,
    context: RenderContext
): string | null {
    const config = SPEED_WIDGET_CONFIG[kind];
    const previewValue = isWidgetSpeedWindowEnabled(item)
        ? config.windowedPreview
        : config.sessionPreview;

    if (context.isPreview) {
        return formatRawOrLabeledValue(item, config.label, previewValue);
    }

    const metrics = getSpeedMetricsForWidget(item, context);
    if (!metrics) {
        return null;
    }

    const speed = calculateSpeed(kind, metrics);
    return formatRawOrLabeledValue(item, config.label, formatSpeed(speed));
}

export function getSpeedWidgetCustomKeybinds(): CustomKeybind[] {
    return [{
        key: 'w',
        label: '(w)時間視窗',
        action: WINDOW_EDITOR_ACTION
    }];
}

export function renderSpeedWidgetEditor(props: WidgetEditorProps): React.ReactElement {
    return <SpeedWindowEditor {...props} />;
}

const SpeedWindowEditor: React.FC<WidgetEditorProps> = ({ widget, onComplete, onCancel, action }) => {
    const [windowInput, setWindowInput] = useState(getWidgetSpeedWindowSeconds(widget).toString());

    useInput((input, key) => {
        if (action !== WINDOW_EDITOR_ACTION) {
            return;
        }

        if (key.return) {
            const parsedWindow = Number.parseInt(windowInput, 10);
            const nextWindow = Number.isFinite(parsedWindow)
                ? parsedWindow
                : DEFAULT_SPEED_WINDOW_SECONDS;

            onComplete(withWidgetSpeedWindowSeconds(widget, nextWindow));
            return;
        }

        if (key.escape) {
            onCancel();
            return;
        }

        if (key.backspace) {
            setWindowInput(windowInput.slice(0, -1));
            return;
        }

        if (shouldInsertInput(input, key) && /\d/.test(input)) {
            setWindowInput(windowInput + input);
        }
    });

    if (action !== WINDOW_EDITOR_ACTION) {
        return <Text>未知編輯模式</Text>;
    }

    return (
        <Box flexDirection='column'>
            <Box>
                <Text>
                    輸入時間視窗（秒，
                    {MIN_SPEED_WINDOW_SECONDS}
                    -
                    {MAX_SPEED_WINDOW_SECONDS}
                    ）：
                    {' '}
                </Text>
                <Text>{windowInput}</Text>
                <Text backgroundColor='gray' color='black'>{' '}</Text>
            </Box>
            <Text dimColor>0 表示禁用視窗模式並使用全會話平均值。按 Enter 儲存，ESC 取消。</Text>
        </Box>
    );
};
