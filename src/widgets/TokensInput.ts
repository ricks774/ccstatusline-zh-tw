import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowInputTotalTokens } from '../utils/context-window';
import { resolveNumberFormat } from '../utils/number-format';
import { formatTokens } from '../utils/renderer';

import { isHidden } from './shared/hideable';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const ZERO_HIDEABLE_STATE: HideableState = { key: 'zero', label: 'Token 數為零時' };

export class TokensInputWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return '顯示當前會話的輸入 Token 數'; }
    getDisplayName(): string { return '輸入 Token'; }
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
            return formatRawOrLabeledValue(item, '輸入: ', formatTokens(15200, format));
        }

        const inputTotalTokens = context.tokenMetrics?.inputTokens
            ?? getContextWindowInputTotalTokens(context.data)
            ?? null;
        if (inputTotalTokens === null) {
            return null;
        }

        if (inputTotalTokens === 0 && isHidden(item, ZERO_HIDEABLE_STATE.key)) {
            return null;
        }

        return formatRawOrLabeledValue(item, '輸入: ', formatTokens(inputTotalTokens, format));
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
