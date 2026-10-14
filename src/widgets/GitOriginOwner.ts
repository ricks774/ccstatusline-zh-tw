import type { RemoteInfo } from '../utils/git-remote';

import { GitRemoteWidgetBase } from './shared/git-remote-widget-base';

export class GitOriginOwnerWidget extends GitRemoteWidgetBase {
    protected readonly remote = 'origin';
    protected readonly previewText = 'owner';
    protected readonly previewUrl = 'https://github.com/owner/repo';

    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示 origin 遠端的所有者/組織'; }
    getDisplayName(): string { return 'Git Origin 所有者'; }

    protected formatRemote(remote: RemoteInfo): string {
        return remote.owner;
    }
}
