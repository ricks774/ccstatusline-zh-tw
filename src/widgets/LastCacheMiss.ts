import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import {
    formatMissAge,
    formatMissCause,
    getPromptCache
} from './shared/prompt-cache';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = '上次未命中: ';

// Renders nothing until the session's first miss, so it needs no hide option
export class LastCacheMissWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示上次提示詞快取未命中的時間與可能原因（依 Claude Code 回報）'; }
    getDisplayName(): string { return '上次快取未命中'; }
    getCategory(): string { return '快取'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const cache = getPromptCache(context);
        if (typeof cache?.last_miss_at !== 'number') {
            return null;
        }

        const value = `${formatMissAge(cache.last_miss_at)}, ${formatMissCause(cache.last_miss_cause)}`;
        return formatRawOrLabeledValue(item, LABEL, value);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
