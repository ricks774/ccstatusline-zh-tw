import {
    Box,
    Text,
    useInput
} from 'ink';
import React from 'react';

import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetEditorProps,
    WidgetItem
} from '../types/Widget';

import { MERGE_TARGET_HIDDEN_HIDEABLE_STATE } from './shared/hideable';
import { useTextCursor } from './shared/text-cursor';

export class CustomTextWidget implements Widget {
    getDefaultColor(): string { return 'white'; }
    getDescription(): string { return '顯示使用者自定義文字'; }
    getDisplayName(): string { return '自定義文字'; }
    getCategory(): string { return '自定義'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const text = item.customText ?? '空';
        return { displayText: `${this.getDisplayName()} (${text})` };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        return item.customText ?? '';
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [{
            key: 'e',
            label: '(e)編輯文字',
            action: 'edit-text'
        }];
    }

    // The actual hiding happens in the renderer, which resolves the merge
    // target's rendered output (see applyMergeTargetHiding)
    getHideableStates(): HideableState[] {
        return [MERGE_TARGET_HIDDEN_HIDEABLE_STATE];
    }

    renderEditor(props: WidgetEditorProps): React.ReactElement {
        return <CustomTextEditor {...props} />;
    }

    supportsRawValue(): boolean { return false; }
    supportsColors(item: WidgetItem): boolean { return true; }
}

const CustomTextEditor: React.FC<WidgetEditorProps> = ({ widget, onComplete, onCancel }) => {
    const { getText, display, handleInput } = useTextCursor(widget.customText ?? '');

    useInput((input, key) => {
        if (key.return) {
            onComplete({ ...widget, customText: getText() });
        } else if (key.escape) {
            onCancel();
        } else {
            handleInput(input, key);
        }
    });

    return (
        <Box flexDirection='column'>
            <Text>{`輸入自定義文字：${display}`}</Text>
            <Text dimColor>←→ 移動游標，Ctrl+←→ 跳到首/尾，Enter 儲存，ESC 取消</Text>
        </Box>
    );
};
