import type { RenderContext } from '../types/RenderContext';
import {
    getAutoCompactConfig,
    resolveClaudeConfigCwd
} from '../utils/claude-settings';
import { getContextWindowMetrics } from '../utils/context-window';
import {
    getContextConfig,
    getModelContextIdentifier
} from '../utils/model-context';

import { ContextPercentageWidgetBase } from './shared/context-percentage-widget-base';

export class ContextPercentageUsableWidget extends ContextPercentageWidgetBase {
    protected readonly previewUsedPercent = 11.6;

    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '依預估的壓縮預算顯示上下文已用或剩餘百分比。\n遵循 Claude Code 壓縮設定與環境變數覆寫；預設為 80% 預估。'; }
    getDisplayName(): string { return '上下文 %（有效）'; }

    protected getUsedPercentage(context: RenderContext): number | null {
        const modelIdentifier = getModelContextIdentifier(context.data?.model);
        const contextWindowMetrics = getContextWindowMetrics(context.data);
        const autoCompact = getAutoCompactConfig(resolveClaudeConfigCwd(context));
        const contextConfig = getContextConfig(modelIdentifier, contextWindowMetrics.windowSize, autoCompact);
        const contextLength = contextWindowMetrics.contextLengthTokens ?? context.tokenMetrics?.contextLength ?? null;
        return contextLength === null ? null : Math.min(100, (contextLength / contextConfig.usableTokens) * 100);
    }
}
