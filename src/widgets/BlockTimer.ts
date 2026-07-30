import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    formatUsageDuration,
    resolveUsageWindowWithFallback
} from '../utils/usage';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';
import {
    cycleUsageDisplayMode,
    getUsageDisplayMode,
    getUsageDisplayModifierText,
    getUsageProgressBarWidth,
    getUsageTimerCustomKeybinds,
    isUsageCompact,
    isUsageInverted,
    isUsageProgressMode,
    toggleUsageCompact,
    toggleUsageInverted
} from './shared/usage-display';

function makeTimerProgressBar(percent: number, width: number): string {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const filledWidth = Math.floor((clampedPercent / 100) * width);
    const emptyWidth = width - filledWidth;
    return '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
}

export class BlockTimerWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示當前 5 時時段的已用時間或進度'; }
    getDisplayName(): string { return '時段計時器'; }
    getCategory(): string { return '用量'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return {
            displayText: this.getDisplayName(),
            modifierText: getUsageDisplayModifierText(item, { includeCompact: true })
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-progress') {
            return cycleUsageDisplayMode(item, ['compact']);
        }

        if (action === 'toggle-invert') {
            return toggleUsageInverted(item);
        }

        if (action === 'toggle-compact') {
            return toggleUsageCompact(item);
        }

        return null;
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const displayMode = getUsageDisplayMode(item);
        const inverted = isUsageInverted(item);
        const compact = isUsageCompact(item);

        if (context.isPreview) {
            const previewPercent = inverted ? 26.1 : 73.9;

            if (isUsageProgressMode(displayMode)) {
                const barWidth = getUsageProgressBarWidth(displayMode);
                const progressBar = makeTimerProgressBar(previewPercent, barWidth);
                return formatRawOrLabeledValue(item, '時段 ', `[${progressBar}] ${previewPercent.toFixed(1)}%`);
            }

            return formatRawOrLabeledValue(item, '時段: ', compact ? '3時45分' : '3時 45分');
        }

        const usageData = context.usageData ?? {};
        const window = resolveUsageWindowWithFallback(usageData, context.blockMetrics);

        if (!window) {
            if (isUsageProgressMode(displayMode)) {
                const barWidth = getUsageProgressBarWidth(displayMode);
                const emptyBar = '░'.repeat(barWidth);
                return formatRawOrLabeledValue(item, '時段 ', `[${emptyBar}] 0.0%`);
            }

            return formatRawOrLabeledValue(item, '時段: ', compact ? '0時' : '0時 0分');
        }

        if (isUsageProgressMode(displayMode)) {
            const barWidth = getUsageProgressBarWidth(displayMode);
            const percent = inverted ? window.remainingPercent : window.elapsedPercent;
            const progressBar = makeTimerProgressBar(percent, barWidth);
            const percentage = percent.toFixed(1);
            return formatRawOrLabeledValue(item, '時段 ', `[${progressBar}] ${percentage}%`);
        }

        const elapsedTime = formatUsageDuration(window.elapsedMs, compact);
        return formatRawOrLabeledValue(item, '時段: ', elapsedTime);
    }

    getCustomKeybinds(item?: WidgetItem): CustomKeybind[] {
        return getUsageTimerCustomKeybinds(item);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
