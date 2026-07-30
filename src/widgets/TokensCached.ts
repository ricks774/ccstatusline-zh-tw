import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { formatTokens } from '../utils/renderer';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class TokensCachedWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示當前會話的快取 Token 數'; }
    getDisplayName(): string { return '快取 Token'; }
    getCategory(): string { return 'Token'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, '快取: ', '12k');
        }

        if (context.tokenMetrics) {
            return formatRawOrLabeledValue(item, '快取: ', formatTokens(context.tokenMetrics.cachedTokens));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
