import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { resolveNumberFormat } from '../utils/number-format';
import { formatTokens } from '../utils/renderer';

import { isHidden } from './shared/hideable';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const ZERO_HIDEABLE_STATE: HideableState = { key: 'zero', label: 'Token 數為零時' };

export class TokensCachedWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示當前會話的快取 Token 數'; }
    getDisplayName(): string { return '快取 Token'; }
    getCategory(): string { return 'Token'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    getHideableStates(): HideableState[] {
        return [ZERO_HIDEABLE_STATE];
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const format = resolveNumberFormat('token', item, settings);
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, '快取: ', formatTokens(12000, format));
        }

        if (context.tokenMetrics) {
            if (context.tokenMetrics.cachedTokens === 0 && isHidden(item, ZERO_HIDEABLE_STATE.key)) {
                return null;
            }
            return formatRawOrLabeledValue(item, '快取: ', formatTokens(context.tokenMetrics.cachedTokens, format));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
