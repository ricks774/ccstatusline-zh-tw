import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    formatCost,
    resolveNumberFormat
} from '../utils/number-format';

import { isHidden } from './shared/hideable';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = '費用: ';

const ZERO_HIDEABLE_STATE: HideableState = { key: 'zero', label: '費用為 $0.00 時' };

export class SessionCostWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '顯示當前會話總費用（美元）'; }
    getDisplayName(): string { return '會話費用'; }
    getCategory(): string { return '會話'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    getHideableStates(): HideableState[] {
        return [ZERO_HIDEABLE_STATE];
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const format = resolveNumberFormat('cost', item, settings);
        if (context.isPreview) {
            const value = formatCost(2.45, format);
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), value);
        }

        const totalCost = context.data?.cost?.total_cost_usd;
        if (totalCost === undefined) {
            return null;
        }

        // Keep the zero-state threshold tied to the baseline cent precision,
        // independent of the selected display style or decimal override.
        const roundsToZeroCents = totalCost >= 0 && totalCost < 0.005;
        if (roundsToZeroCents && isHidden(item, ZERO_HIDEABLE_STATE.key)) {
            return null;
        }

        const formattedCost = formatCost(totalCost, format);
        return formatRawOrLabeledValue(item, this.getLabelPrefix(), formattedCost);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
