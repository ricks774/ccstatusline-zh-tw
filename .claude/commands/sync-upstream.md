---
description: 同步上游 sirmalloc/ccstatusline 新 release 到 fork 並完成中文化
argument-hint: "<upstream-tag, e.g. v2.2.17>"
---

# Sync upstream ccstatusline release

把上游 sirmalloc/ccstatusline 的新 release `$ARGUMENTS` 同步到當前 fork，
保持 fork 的中文化風格、包名重新命名、測試全綠，最後開 PR。

**不要自動 merge PR，不要自動 npm publish——這兩步由使用者人工執行。**

## 硬約束（每次 sync 不變）

### Fork 與上游的差異點

包名 `ccstatusline` → `ccstatusline-zh-tw`，觸點：

| 檔案 | 改什麼 |
| --- | --- |
| `package.json` | `name`, `bin`, `description`, `repository`, `keywords` |
| `src/utils/claude-settings.ts` | `CCSTATUSLINE_COMMANDS`、`PINNED_INSTALL_COMMANDS` 所有字串 |
| `src/utils/update-checker.ts` | `NPM_REGISTRY_LATEST_URL`、`User-Agent`、安裝 args |
| `src/utils/global-package-manager.ts` | 二進位制路徑模板（`appendPathSegment(..., 'ccstatusline-zh-tw${ext}')`）、根目錄查詢、`'ccstatusline'` 字面量 |
| `src/utils/global-command-resolution.ts` | `getCommandResolutionPaths('ccstatusline-zh-tw', ...)`、bunx transient regex |

### 中文化範圍

**翻譯**：
- Widget 的 `getDisplayName()` / `getCategory()` / `getDescription()`
- Widget render 輸出的 label（如 `'Session: '` → `'會話: '`，`'周 Opus: '`）
- TUI 元件裡的選單項、screen 標題、prompt 文字、錯誤/警告
- ConfirmDialog 訊息、FlashMessage 文字、FlowNotice
- 測試斷言裡 expectedModifierText / expectedTime / 文案匹配

**保留英文**：
- Widget type ID 字串字面量（`'voice-status'`, `'session-usage'`, `'weekly-opus-usage'` 等）
- config 鍵名、JSON 欄位名
- 內部 API 函式名、型別名、commit message keys
- rawValue 輸出（如 VoiceStatus 的 `'on'` / `'off'` 給 shell 指令碼消費者用）
- 檔案路徑、import paths、所有 .ts/.tsx 檔名

### Fork 已採用的術語表

| 英文 | 中文 |
| --- | --- |
| Install / Uninstall | 安裝 / 解除安裝 |
| Update / Check for Updates | 更新 / 檢查更新 |
| Pinned global install | 固定全域性安裝 |
| Auto-update | 自動更新 |
| Manage Installation | 管理安裝 |
| Configure Status Line | 配置狀態行 |
| Continue / Cancel | 繼續 / 取消 |
| Loading settings... | 正在載入設定... |
| (install first) | （請先安裝） |
| (npm/bun/npx/bunx not installed) | （未檢測到 npm/bun/npx/bunx） |
| Press Enter to select, ESC to go back | 按 Enter 選擇，ESC 返回 |
| voice / Voice | 語音 |
| enabled / disabled | 啟用 / 關閉 |
| Install Complete / Update Complete | 安裝完成 / 更新完成 |
| Installed to Claude Code | 已安裝到 Claude Code |
| Global package updated | 全域性包已更新 |
| Install/Update/Uninstall failed | 安裝/更新/解除安裝失敗 |
| Self-managed/global install | 自管理 / 全域性安裝 |
| Unknown installation / Unknown or not installed | 未知安裝方式 / 未知或未安裝 |
| Choose what to remove | 請選擇要移除的內容 |
| package manager | 包管理器 |
| Active PATH match | 當前 PATH 匹配 |
| ccstatusline（使用者可見時） | ccstatusline-zh-tw |

## 工作流

### 步驟 0：核對引數

確認 `$ARGUMENTS` 是合法的上游 tag（形如 `v2.2.17`）。如果使用者傳的是版本號沒帶 `v`，加上。

> **為什麼用 git cherry-pick 而不是 jj rebase**：本 fork 的歷史是「每次同步
> squash 成一個 `feat: 同步上游 …` 提交」，與上游的 merge-base 停在很早的位置。
> 直接 `jj rebase -d main@upstream` / `git rebase` 會把 fork 全部歷史重放到上游
> 之上，產生大量虛假衝突。正確做法是隻 cherry-pick 上游「上次同步點 → 目標 tag」
> 這一段增量。

### 步驟 1：拉上游 + 起 sync 分支

```bash
git remote get-url upstream >/dev/null 2>&1 || \
  git remote add upstream https://github.com/sirmalloc/ccstatusline.git
git fetch upstream --tags
git checkout -b sync/upstream-$(date +%Y-%m-%d) origin/main
```

### 步驟 2：定位增量並 cherry-pick

fork 的 `package.json` version 對應上游某個版本。在 `upstream/main` 歷史裡按
package.json version 找到 fork 上次同步到的那個上游 commit，作為 cherry-pick 起點：

```bash
# 逐個 commit 看 package.json version，找到等於 fork 當前版本的最後一個 commit
git log --oneline <range> -- package.json
git show <commit>:package.json | grep '"version"'
```

確定起點 `<base>` 後取增量（注意上游 PR 多為 squash，一般沒有 merge commit）：

```bash
git log --oneline --reverse <base>..$ARGUMENTS   # 先看清這次要同步哪些提交
git cherry-pick <base>..$ARGUMENTS
```

### 步驟 3：解衝突

cherry-pick 在每個有衝突的 commit 停下。決策規則：

1. **檔案 fork 僅改了 UI 字串，上游也只改了同一處字串** → 保留 fork 中文版
2. **檔案上游加了新邏輯 + fork 僅改了字串** → 合併：保留新邏輯 + 把新加的英文按術語表翻譯
3. **檔案是上游新增的（fork 還沒有）** → 取上游版本，掃描其中所有使用者可見字串翻譯
4. **大規模重構衝突**（上游把整個檔案結構改了）→ 停下來問使用者

`package.json` 的版本衝突：保留 fork 的 `name` / `description`，只取上游的 `version`。
`README.md` 衝突：fork 的 README 是全中文自定義結構，一律保留 fork 側
（`git checkout --ours README.md`），版本相關資訊在步驟 6 手動更新。

解完一個檔案 `git add`，繼續 `git cherry-pick --continue`（用 `-c core.editor=true`
跳過編輯器）。cherry-pick 乾淨落地後，再去翻譯那些「無衝突但是上游新增的英文」。

### 步驟 4：包名一致化掃描

```bash
grep -rn --include="*.ts" --include="*.tsx" --include="*.json" \
  "['\"]ccstatusline['\"\\$]" src/ package.json
```

逐項判斷：
- 使用者可見路徑（command、shell args、URL、display text）→ 改成 `ccstatusline-zh-tw`
- 內部程式碼引用、檔案路徑、source 註釋 → 不改

### 步驟 5：測試

```bash
bun install
bun run lint                 # typecheck + eslint，必須透過
env -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY \
    -u https_proxy -u http_proxy -u all_proxy \
    bun test                 # 期望全綠
```

測試失敗常見原因：
- 測試斷言裡有英文 UI 字串沒翻譯 → 翻成中文
- 測試期望 `ccstatusline@x.y.z` → 改成 `ccstatusline-zh-tw@x.y.z`
- `usage-fetch.test.ts` 超時 → 是本地代理 flake，單獨再跑一次確認

### 步驟 6：README + 版本號一致

- `package.json` version 應該已經被上游 rebase 同步
- `README.md`：
  - 頂部「同步至上游 vX.Y.Z」一行
  - 「關於本專案」章節裡如果有版本特性列表，補一行 `$ARGUMENTS` 新增功能
  - 「與上游的差異」表格中「同步版本」單元格
  - 「可用元件」表格：如果上游加了新 widget，補到對應類別
  - 「TUI 主選單功能」：如果加了新選單項，補充
  - 元件總數：`grep -l "implements Widget" src/widgets/*.ts | wc -l` 拿實際數

### 步驟 7：push + 開 PR

```bash
git push -u origin sync/upstream-$(date +%Y-%m-%d)
gh pr create --base main \
  --head "sync/upstream-$(date +%Y-%m-%d)" \
  --title "feat: 同步上游 ccstatusline $ARGUMENTS 並完成中文化" \
  --body-file /tmp/sync-pr-body.md
```

PR body 模板（寫到 `/tmp/sync-pr-body.md`）：

```markdown
## Summary
- 同步上游 sirmalloc/ccstatusline 至 `$ARGUMENTS`
- 中文化新增內容（具體列項）
- 包名同步（如有）
- bun run lint / bun test 全綠

## 上游新增功能
（按 release notes 摘 3-5 條 highlight，每條一句中文）

## 中文化處理
（具體翻了哪些元件/選單/widget，按 widget/TUI/error 分組）

## Test plan
- [x] bun run lint 透過
- [x] bun test 全綠（X 個測試）
- [ ] 真機 TUI 驗證（merge 後使用者跑）
- [ ] settings.json 相容性

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

CI 自動同步場景（`upstream-sync.yml` 呼叫）：開完 PR 直接
`gh pr merge --auto --squash` 開啟自動合併，CI 綠後自動合，釋出交給 `release.yml`。

### 步驟 8：交接

PR 開好後：

- **CI 自動同步**（`upstream-sync.yml`）：已 `gh pr merge --auto --squash`，到此為止。
  CI 綠 → 自動合併 → `release.yml` 檢測到版本號變化 → 在 `npm-publish`
  Environment 暫停等使用者審批 → 批准後釋出。
- **手動跑**：`gh pr checks <PR#> --watch` 看 CI，綠後把 PR URL 給使用者，
  由使用者 review + `gh pr merge --squash`。合併後釋出同樣交給 `release.yml`。

## 注意事項

- **用 git cherry-pick 取增量，不要 jj rebase / git rebase** —— 見步驟 1 上方說明
- **不要自己 merge PR，不要手動 npm publish** —— 合併交給 auto-merge + CI，
  釋出交給 `release.yml`（含人工審批 gate）
- 遇到不知道怎麼翻譯的術語 → 查 fork 已有翻譯先（`grep -rn '關鍵詞' src/`）
- 遇到上游大規模重構 → 停下來：手動場景問使用者，CI 場景開 issue 通知後停止
- lint 錯誤不要用 `eslint-disable` 註釋繞過 —— 專案 CLAUDE.md 硬約束，改原始碼
- typecheck + lint 統一跑 `bun run lint`，不要直接 `bun tsc` / `npx eslint`
