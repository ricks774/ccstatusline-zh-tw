import type { RenderContext } from '../types/RenderContext';
import { calculateContextPercentageMetrics } from '../utils/context-percentage';

import { ContextPercentageWidgetBase } from './shared/context-percentage-widget-base';

export class ContextPercentageWidget extends ContextPercentageWidgetBase {
    protected readonly previewUsedPercent = 9.3;

    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return '顯示上下文視窗已用或剩餘百分比'; }
    getDisplayName(): string { return '上下文 %'; }

    protected getUsedPercentage(context: RenderContext): number | null {
        return calculateContextPercentageMetrics(context)?.usedPercentage ?? null;
    }
}
