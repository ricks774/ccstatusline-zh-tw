import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import { isHidden } from './shared/hideable';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = '會話: ';

const ZERO_HIDEABLE_STATE: HideableState = { key: 'zero', label: '不足 1 分鐘時' };

function formatDurationFromMs(durationMs: number): string {
    const totalMinutes = Math.floor(durationMs / (1000 * 60));

    if (totalMinutes < 1) {
        return '<1分';
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}分`;
    }
    if (minutes === 0) {
        return `${hours}時`;
    }

    return `${hours}時 ${minutes}分`;
}

export class SessionClockWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示當前會話已經過的時間'; }
    getDisplayName(): string { return '會話時鐘'; }
    getCategory(): string { return '會話'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    getHideableStates(): HideableState[] {
        return [ZERO_HIDEABLE_STATE];
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), '2時 15分');
        }

        const hideZero = isHidden(item, ZERO_HIDEABLE_STATE.key);

        const durationMs = context.data?.cost?.total_duration_ms;
        if (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs >= 0) {
            if (durationMs < 60000 && hideZero) {
                return null;
            }
            const formatted = formatDurationFromMs(durationMs);
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), formatted);
        }

        const duration = context.sessionDuration ?? '0分';
        if ((duration === '0分' || duration === '<1分') && hideZero) {
            return null;
        }
        return formatRawOrLabeledValue(item, this.getLabelPrefix(), duration);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
