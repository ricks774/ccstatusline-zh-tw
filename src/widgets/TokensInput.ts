import type { RenderContext } from '../types/RenderContext';
import { getContextWindowInputTotalTokens } from '../utils/context-window';

import { TokenCountWidget } from './shared/token-count-widget';

export class TokensInputWidget extends TokenCountWidget {
    protected readonly label = '輸入: ';
    protected readonly previewTokens = 15200;

    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return '顯示當前會話的輸入 Token 數'; }
    getDisplayName(): string { return '輸入 Token'; }

    protected getTokenCount(context: RenderContext): number | null {
        return context.tokenMetrics?.inputTokens
            ?? getContextWindowInputTotalTokens(context.data)
            ?? null;
    }
}
