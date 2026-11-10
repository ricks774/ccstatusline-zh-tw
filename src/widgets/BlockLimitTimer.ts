import type { RenderContext } from '../types/RenderContext';

import { LimitTimerWidget } from './shared/limit-timer-widget';

export class BlockLimitTimerWidget extends LimitTimerWidget {
    protected readonly label = '距上限: ';
    protected readonly previewLimitInMs = 73 * 60 * 1000;

    getDescription(): string { return '依目前速度預估距離 5 小時時段上限的時間；僅在上限早於重置時顯示'; }
    getDisplayName(): string { return '時段上限計時'; }

    protected getLimitInMs(context: RenderContext): number | null {
        return context.sessionForecast?.limitInMs ?? null;
    }
}
