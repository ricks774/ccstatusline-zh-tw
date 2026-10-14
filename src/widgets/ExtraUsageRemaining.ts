import type { RenderUsageData } from '../types/RenderContext';

import { ExtraUsageAmountWidget } from './shared/extra-usage-amount-widget';

export class ExtraUsageRemainingWidget extends ExtraUsageAmountWidget {
    protected readonly label = '超額剩餘: ';
    protected readonly previewDollars = 3894;

    getDescription(): string { return '顯示本月超額用量上限的剩餘額度（Pro/Max 超額或 Enterprise 支出）'; }
    getDisplayName(): string { return '超額用量剩餘'; }

    protected getDollars(data: RenderUsageData): number | null {
        if (data.extraUsageLimit === undefined || data.extraUsageUsed === undefined) {
            return null;
        }
        // Both extraUsageLimit and extraUsageUsed are in cents
        return Math.max(0, data.extraUsageLimit / 100 - data.extraUsageUsed / 100);
    }
}
