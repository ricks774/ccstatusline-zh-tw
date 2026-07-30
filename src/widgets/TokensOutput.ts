import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowOutputTotalTokens } from '../utils/context-window';
import { formatTokens } from '../utils/renderer';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class TokensOutputWidget implements Widget {
    getDefaultColor(): string { return 'white'; }
    getDescription(): string { return '顯示當前會話的輸出 Token 數'; }
    getDisplayName(): string { return '輸出 Token'; }
    getCategory(): string { return 'Token'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, '輸出: ', '3.4k');
        }

        if (context.tokenMetrics) {
            return formatRawOrLabeledValue(item, '輸出: ', formatTokens(context.tokenMetrics.outputTokens));
        }

        const outputTotalTokens = getContextWindowOutputTotalTokens(context.data);
        if (outputTotalTokens !== null) {
            return formatRawOrLabeledValue(item, '輸出: ', formatTokens(outputTotalTokens));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
