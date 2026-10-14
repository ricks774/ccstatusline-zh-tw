import type { RenderContext } from '../types/RenderContext';
import type {
    CustomKeybind,
    WidgetEditorProps,
    WidgetItem
} from '../types/Widget';
import { getJjChangeCounts } from '../utils/jj';

import { JjWidgetBase } from './shared/jj-widget-base';
import {
    getSlotSymbol,
    getSymbolKeybind,
    renderSymbolSlotsEditor,
    type SymbolSlot
} from './shared/symbol-override';

const DELETIONS_SLOT: SymbolSlot = { id: 'symbolDeletions', label: '刪除', defaultSymbol: '-' };

export class JjDeletionsWidget extends JjWidgetBase<number> {
    protected readonly previewValue = 10;
    protected readonly noJjText = '(無 JJ)';

    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return '顯示 Jujutsu 刪除行數'; }
    getDisplayName(): string { return 'JJ 刪除行數'; }

    protected getValue(context: RenderContext): number {
        return getJjChangeCounts(context).deletions;
    }

    protected formatValue(item: WidgetItem, deletions: number): string {
        return `${getSlotSymbol(item, DELETIONS_SLOT)}${deletions}`;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [getSymbolKeybind()];
    }

    renderEditor(props: WidgetEditorProps) {
        return renderSymbolSlotsEditor(props, [DELETIONS_SLOT]);
    }

    supportsRawValue(): boolean { return false; }
}
