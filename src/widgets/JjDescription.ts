import type { RenderContext } from '../types/RenderContext';
import type { WidgetItem } from '../types/Widget';
import { runJjArgs } from '../utils/jj';

import { JjWidgetBase } from './shared/jj-widget-base';

export class JjDescriptionWidget extends JjWidgetBase {
    protected readonly previewValue = '(無描述)';
    protected readonly noJjText = '無 JJ';

    getDefaultColor(): string { return 'white'; }
    getDescription(): string { return '顯示當前 Jujutsu 變更描述'; }
    getDisplayName(): string { return 'JJ 變更描述'; }

    protected getValue(context: RenderContext): string | null {
        return runJjArgs([
            'log',
            '--no-graph',
            '-r',
            '@',
            '-T',
            'description.first_line()'
        ], context, true);
    }

    protected formatValue(_item: WidgetItem, description: string): string {
        return description.length > 0 ? description : '(無描述)';
    }

    supportsRawValue(): boolean { return false; }
}
