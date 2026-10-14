import type { RenderUsageData } from '../types/RenderContext';

import { ExtraUsageAmountWidget } from './shared/extra-usage-amount-widget';

export class ExtraUsageUsedWidget extends ExtraUsageAmountWidget {
    protected readonly label = '超額已用: ';
    protected readonly previewDollars = 106;

    getDescription(): string { return '顯示已使用的超額用量：超出 Pro/Max 方案上限的部分，或 Enterprise 的支出'; }
    getDisplayName(): string { return '超額已用'; }

    protected getDollars(data: RenderUsageData): number | null {
        // extraUsageUsed is in cents
        return data.extraUsageUsed === undefined ? null : data.extraUsageUsed / 100;
    }
}
