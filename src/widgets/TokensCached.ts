import type { RenderContext } from '../types/RenderContext';

import { TokenCountWidget } from './shared/token-count-widget';

export class TokensCachedWidget extends TokenCountWidget {
    protected readonly label = '快取: ';
    protected readonly previewTokens = 12000;

    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示當前會話的快取 Token 數'; }
    getDisplayName(): string { return '快取 Token'; }

    protected getTokenCount(context: RenderContext): number | null {
        return context.tokenMetrics?.cachedTokens ?? null;
    }
}
