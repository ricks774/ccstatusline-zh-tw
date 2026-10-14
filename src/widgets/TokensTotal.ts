import type { RenderContext } from '../types/RenderContext';

import { TokenCountWidget } from './shared/token-count-widget';

export class TokensTotalWidget extends TokenCountWidget {
    protected readonly label = '合計: ';
    protected readonly previewTokens = 30600;

    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示當前會話的總 Token 數（輸入 + 輸出 + 快取）'; }
    getDisplayName(): string { return '總 Token'; }

    protected getTokenCount(context: RenderContext): number | null {
        return context.tokenMetrics?.totalTokens ?? null;
    }
}
