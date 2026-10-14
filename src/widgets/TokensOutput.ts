import type { RenderContext } from '../types/RenderContext';
import { getContextWindowOutputTotalTokens } from '../utils/context-window';

import { TokenCountWidget } from './shared/token-count-widget';

export class TokensOutputWidget extends TokenCountWidget {
    protected readonly label = '輸出: ';
    protected readonly previewTokens = 3400;

    getDefaultColor(): string { return 'white'; }
    getDescription(): string { return '顯示當前會話的輸出 Token 數'; }
    getDisplayName(): string { return '輸出 Token'; }

    protected getTokenCount(context: RenderContext): number | null {
        return context.tokenMetrics?.outputTokens
            ?? getContextWindowOutputTotalTokens(context.data)
            ?? null;
    }
}
