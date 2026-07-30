import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class SessionCostWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '顯示當前會話總費用（美元）'; }
    getDisplayName(): string { return '會話費用'; }
    getCategory(): string { return '會話'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '$2.45' : '費用: $2.45';
        }

        const totalCost = context.data?.cost?.total_cost_usd;
        if (totalCost === undefined) {
            return null;
        }

        // Format the cost to 2 decimal places
        const formattedCost = `$${totalCost.toFixed(2)}`;

        return item.rawValue ? formattedCost : `費用: ${formattedCost}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
