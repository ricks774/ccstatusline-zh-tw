import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getTranscriptSessionName } from '../utils/jsonl-session';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = '會話: ';

export class SessionNameWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示透過 /rename 命令設定的會話名稱'; }
    getDisplayName(): string { return '會話名稱'; }
    getCategory(): string { return '會話'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), 'my-session');
        }

        const sessionName = context.transcriptSessionName === undefined
            ? getTranscriptSessionName(context.data?.transcript_path)
            : context.transcriptSessionName;
        if (sessionName === null) {
            return null;
        }

        return formatRawOrLabeledValue(item, this.getLabelPrefix(), sessionName);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
