import {
    Box,
    Text,
    useInput
} from 'ink';
import * as os from 'os';
import * as path from 'path';
import React, { useState } from 'react';

import { shouldInsertInput } from '../../utils/input-guards';

interface ExportConfigDialogProps {
    onExport: (filePath: string) => void;
    onCancel: () => void;
}

const DEFAULT_EXPORT_PATH = path.join(os.homedir(), 'ccstatusline-config.json');

export function ExportConfigDialog({ onExport, onCancel }: ExportConfigDialogProps): React.JSX.Element {
    const [inputValue, setInputValue] = useState(DEFAULT_EXPORT_PATH);

    useInput((input, key) => {
        if (key.return) {
            onExport(inputValue);
        } else if (key.escape) {
            onCancel();
        } else if (key.backspace) {
            setInputValue(inputValue.slice(0, -1));
        } else if (shouldInsertInput(input, key)) {
            setInputValue(inputValue + input);
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>匯出設定</Text>
            <Text dimColor>請輸入要匯出設定的檔案路徑：</Text>
            <Box marginTop={1}>
                <Text>路徑: </Text>
                <Text>{inputValue}</Text>
                <Text inverse> </Text>
            </Box>
            <Box marginTop={1}>
                <Text dimColor>按 Enter 確認，ESC 取消</Text>
            </Box>
        </Box>
    );
}
