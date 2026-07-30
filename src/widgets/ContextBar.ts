import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';
import {
    getContextConfig,
    getModelContextIdentifier
} from '../utils/model-context';
import { formatTokens } from '../utils/renderer';
import { makeUsageProgressBar } from '../utils/usage';

import { makeSliderBar } from './shared/usage-display';

type DisplayMode = 'progress' | 'progress-short' | 'slider' | 'slider-only';

function getDisplayMode(item: WidgetItem): DisplayMode {
    const mode = item.metadata?.display;
    if (mode === 'progress' || mode === 'slider' || mode === 'slider-only') {
        return mode;
    }
    return 'progress-short';
}

function isBarSliderMode(mode: DisplayMode): boolean {
    return mode === 'slider' || mode === 'slider-only';
}

export class ContextBarWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return '以進度條形式顯示上下文用量'; }
    getDisplayName(): string { return '上下文進度條'; }
    getCategory(): string { return '上下文'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const mode = getDisplayMode(item);
        const modifiers: string[] = [];

        if (mode === 'progress-short') {
            modifiers.push('中進度條');
        } else if (mode === 'slider') {
            modifiers.push('短進度條');
        } else if (mode === 'slider-only') {
            modifiers.push('僅短進度條');
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action !== 'toggle-progress') {
            return null;
        }

        const currentMode = getDisplayMode(item);
        const nextMode: DisplayMode = currentMode === 'progress-short'
            ? 'progress'
            : currentMode === 'progress'
                ? 'slider'
                : currentMode === 'slider'
                    ? 'slider-only'
                    : 'progress-short';

        return {
            ...item,
            metadata: {
                ...(item.metadata ?? {}),
                display: nextMode
            }
        };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const displayMode = getDisplayMode(item);

        if (context.isPreview) {
            if (isBarSliderMode(displayMode)) {
                const slider = makeSliderBar(25);
                const sliderDisplay = displayMode === 'slider' ? `${slider} 50k/200k (25%)` : slider;
                return item.rawValue ? sliderDisplay : `上下文: ${sliderDisplay}`;
            }
            const barWidth = displayMode === 'progress' ? 32 : 16;
            const previewDisplay = `${makeUsageProgressBar(25, barWidth)} 50k/200k (25%)`;
            return item.rawValue ? previewDisplay : `上下文: ${previewDisplay}`;
        }

        const contextWindowMetrics = getContextWindowMetrics(context.data);

        let total = contextWindowMetrics.windowSize;
        let used = contextWindowMetrics.contextLengthTokens;

        if (used === null && context.tokenMetrics) {
            used = context.tokenMetrics.contextLength;
        }

        if (total === null && context.tokenMetrics) {
            const modelIdentifier = getModelContextIdentifier(context.data?.model);
            total = getContextConfig(modelIdentifier).maxTokens;
        }

        if (used === null || total === null || total <= 0) {
            return null;
        }

        const percent = (used / total) * 100;
        const clampedPercent = Math.max(0, Math.min(100, percent));
        const usedDisplay = formatTokens(used, 0);
        const totalDisplay = formatTokens(total, 0);

        if (isBarSliderMode(displayMode)) {
            const slider = makeSliderBar(clampedPercent);
            const sliderDisplay = displayMode === 'slider' ? `${slider} ${usedDisplay}/${totalDisplay} (${Math.round(clampedPercent)}%)` : slider;
            return item.rawValue ? sliderDisplay : `上下文: ${sliderDisplay}`;
        }

        const barWidth = displayMode === 'progress' ? 32 : 16;
        const display = `${makeUsageProgressBar(clampedPercent, barWidth)} ${usedDisplay}/${totalDisplay} (${Math.round(clampedPercent)}%)`;

        return item.rawValue ? display : `上下文: ${display}`;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'p', label: '(p)進度條切換', action: 'toggle-progress' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
