import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

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
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '2時 15分' : '會話: 2時 15分';
        }

        const durationMs = context.data?.cost?.total_duration_ms;
        if (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs >= 0) {
            const formatted = formatDurationFromMs(durationMs);
            return item.rawValue ? formatted : `會話: ${formatted}`;
        }

        const duration = context.sessionDuration ?? '0分';
        return item.rawValue ? duration : `會話: ${duration}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
