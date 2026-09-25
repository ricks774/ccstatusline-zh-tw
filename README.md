# ccstatusline-zh-tw

**🎨 Claude Code CLI 高度可定製狀態列格式化工具 — 繁體中文化版**

_在終端中顯示模型資訊、Git 分支、Token 用量及其他實時指標_

> 本專案是 [ccstatusline](https://github.com/sirmalloc/ccstatusline) 的**繁體中文化 Fork**，當前同步至上游 v2.2.30 版本（含自定義命令輸出快取 TTL、終端寬度探測快取與效能優化、Git／Jujutsu 增刪元件符號自定義）。所有使用者可見的介面文字（元件名稱、分類、描述、選單標籤、提示資訊等）均已翻譯為中文，方便中文使用者使用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/ricks774/ccstatusline-zh-tw/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/ccstatusline.svg)](https://nodejs.org)

## 📚 目錄

- [關於本專案](#-關於本專案)
- [功能特性](#-功能特性)
- [快速開始](#-快速開始)
- [Windows 支援](#-windows-支援)
- [使用方法](#-使用方法)
- [可用元件](#-可用元件)
- [配置介面（TUI）](#-配置介面tui)
- [API 文件](#-api-文件)
- [開發指南](#️-開發指南)
- [致謝](#-致謝)
- [許可證](#-許可證)

---

## 🌏 關於本專案

**ccstatusline-zh-tw** 是 [ccstatusline](https://github.com/sirmalloc/ccstatusline) 的繁體中文化版本。

ccstatusline 是一個優秀的 Claude Code CLI 狀態列格式化工具，支援 80+ 種可定製元件、Powerline 主題、互動式 TUI 配置介面等豐富功能。本專案在其基礎上，將所有使用者可見的英文文字直接替換為中文，包括：

- **88 個元件**的名稱、描述、分類標籤（含 v2.2.13 新增的 Voice Status / 周 Sonnet 用量 / 周 Opus 用量，v2.2.17 新增的超額用量佔比 / 超額用量剩餘，v2.2.20 新增的 Remote Control Status，v2.2.22 新增的快取命中率 / 快取讀取 / 快取寫入 / 超額已用，v2.2.24 新增的快取計時器 / Git CI 狀態 / 沙箱狀態，v2.2.26 新增的周 Fable 用量，v2.2.29 新增的 Claude 狀態）
- **TUI 配置介面**的全部選單項、幫助文字、提示資訊、對話方塊
- **佈局元件**（分隔符、彈性分隔符）的名稱和描述
- **極簡模式 / Minimalist Mode**、**模糊搜尋元件選擇器**、**Powerline 主題色延續**（v2.2.8）
- **上下文視窗**、**Git 檔案狀態系列**（已暫存 / 未暫存 / 未跟蹤 / 乾淨）、**短條形百分比模式**、**GitLab 支援**、**Reset Timer 時區/IANA 選擇**、**TUI 環繞導航**、**`refreshInterval` 配置**（v2.2.10）
- **Jujutsu VCS 系列**（書籤 / 工作區 / 根目錄 / 變更 / 增刪 / 描述 / 修訂）、**CompactionCounter 壓縮計數**、**用量時間遊標**、**Reset Timer 絕對時間戳**、**Powerline 端帽數量解鎖**、**思考力度元件 xhigh 等級**（v2.2.12）
- **Voice Status 語音狀態元件**、**周 Sonnet / 周 Opus 用量元件**、**Timer 短進度條**、**Hook 輸出靜默**（v2.2.13）
- **版本固定全域性安裝**（Pinned global install）、**管理安裝 / 檢查更新選單**、**npm 倉庫更新檢測**、**固定安裝版本不一致防錯螢幕**（v2.2.14–v2.2.16）
- **超額用量佔比 / 超額用量剩餘元件**（按量付費月度超額額度，支援禁用時隱藏）、**用量 API 空值桶相容**、**Git 命令舊版本相容與 `--no-optional-locks` 鎖規避**（v2.2.17–v2.2.18）
- **Git 子程序輸出持久化快取**（可配置 TTL，按 `.git/HEAD` / `.git/index` mtime 失效）、**`CCSTATUSLINE_WIDTH` 終端寬度覆蓋**、**固定全域性安裝設為預設安裝項**、**Windows 隱藏輔助程序視窗**（v2.2.19）
- **Remote Control Status 遠端控制狀態元件**、**漸變色前景色支援**、**周重置計時器星期顯示模式**、**Windows npm shim 執行修復**、**超額用量單位換算修正**、**Input/Output Token 元件優先使用累計轉錄指標**、**UsageFetch 快取隔離改進**（v2.2.20）
- **快取命中率 / 快取讀取 / 快取寫入**（Cache Hit Rate / Cache Read / Cache Write）、**超額已用元件**（Extra Usage Used）、**壓縮計數改用 compact_boundary 標記精準檢測**（不再依賴上下文百分比推斷）、**彈性分隔符 Powerline 路徑修復**、**可覆蓋字元字形（Glyph override）**、**每元件暗淡樣式**（整體暗淡 / 括號暗淡）、**invalid settings.json 非破壞性恢復與警告**（v2.2.21–v2.2.22）
- **快取計時器 / Git CI 狀態 / 沙箱狀態元件**、**單側預設內邊距**、**選擇性 Powerline 對齊**、**Git 分支與根目錄寬度限制**、**當前目錄字元**、**可配置上下文視窗兜底值**、**可組合壓縮指標**、**`--version` 引數**、**用量快取與載入態修復**、**非同步 Git PR/CI 檢查重新整理**（v2.2.23–v2.2.25）
- **周 Fable 用量元件**、**設定匯入/匯出**（含變更預覽與全部取代/合併模式）、**用量 API `limits[]` 陣列解析**（相容遷移帳戶）、**每模型周用量改讀 `limits[]`**、**壓縮後上下文長度改由 `compact_boundary` 回報**、**渲染器隱藏元件後分隔符保留修復**（v2.2.26–v2.2.27）
- **Claude 狀態元件**（讀取 status.claude.com 服務狀態，含可選 48 小時事件歷史條）、**統一的隱藏狀態系統**（各元件的隱藏條件整合為單一 `(h)隱藏…` 檢查清單，v3→v4 設定自動遷移）、**可設定數值精度**（`precise` / `compact` / `whole`，可全域性或按類型/按元件設定）、**JSONL 串流讀取**（大型轉錄檔也能正確計算 Token）、**Git 衝突數為 0 時可隱藏**、**每次 render 只讀一次轉錄檔的效能優化**、**usage lock 永不過期修復**、**Git 快取寫入失敗時的暫存檔洩漏修復**（v2.2.28–v2.2.29）
- **自定義命令輸出快取**（可配置 TTL，逾時終止整個子程序樹）、**終端寬度探測快取**（僅快取「未偵測到 TTY」結果，減少重複探測開銷）、**Git／Jujutsu 增刪元件符號自定義**（Git 新增 / Git 刪除 / Git 乾淨狀態 / JJ 新增 / JJ 刪除）、**周期重置計時器隱藏無資料狀態**、**用量百分比元件共用渲染模組**（v2.2.30）
- **確認對話方塊** "是 / 否"
- **分類篩選** "全部" 等介面元素

內部識別符號（如 settings.json 中的 widget type ID `"model"`、`"git-branch"` 等）保持英文不變，確保與上游版本的配置檔案完全相容。

### 與上游的差異

| 專案       | ccstatusline | ccstatusline-zh-tw           |
| ---------- | ------------ | ------------------------- |
| 介面語言   | 英文         | 中文                      |
| 配置相容性 | —            | ✅ 共用相同 settings.json |
| 功能差異   | —            | 無，功能完全一致          |
| 同步版本   | 最新         | v2.2.30（+ 自定義命令快取 TTL / 終端寬度探測快取 / Git・JJ 符號自定義 / 中文化覆蓋） |

---

## ✨ 功能特性

- **88 種可定製元件** — 模型、Git（含 PR / CI / 衝突 / 暫存 / Origin / Upstream / 工作樹等細分元件）、Token、上下文、會話、費用、速度等
- **互動式 TUI 配置** — 按 `ccstatusline-zh-tw setup` 啟動視覺化配置介面
- **Powerline 風格** — 內建多款 Powerline 主題，支援自定義分隔符，支援主題色跨行延續
- **極簡模式** — 一鍵讓所有元件切換到"無標籤"模式，狀態列更精簡
- **模糊搜尋元件** — 新增元件時支援子串 / 首字母 / 模糊匹配，帶實時高亮
- **Claude 賬戶郵箱** — 狀態列顯示當前登入的 Claude 賬戶郵箱
- **多行佈局** — 支援多行狀態列配置
- **實時預覽** — 配置時即時預覽效果
- **自定義顏色** — 每個元件支援獨立的前景色和背景色設定
- **自定義命令 & 文字 & 符號** — 可嵌入自定義 Shell 命令輸出、靜態文字或單字元符號/Emoji
- **可點選連結** — 支援 OSC8 終端超連結（Git 分支、Git PR、倉庫根目錄等可配置）
- **跨平臺** — 支援 macOS、Linux、Windows

---

## 🚀 快速開始

### 安裝

本 fork 不發布到 npm，僅供自用或從 GitHub clone 後自行建置安裝。

#### 方式一：Clone 後全域連結（推薦，安裝完可直接打指令）

```bash
git clone https://github.com/ricks774/ccstatusline-zh-tw.git
cd ccstatusline-zh-tw
bun install       # 或 npm install
bun run build      # 產生 dist/ccstatusline.js
npm link           # 或 bun link，註冊全域指令 ccstatusline-zh-tw
```

之後任何地方都能直接執行 `ccstatusline-zh-tw` 指令。日後拉新版只需要：

```bash
git pull
bun run build
```

不用重新 `npm link`。若要移除，執行 `npm unlink -g ccstatusline-zh-tw`。

#### 方式二：不註冊全域指令，直接指到本機建置檔案

跳過 `npm link`，在 Claude Code 設定裡直接指向 clone 下來的 `dist/ccstatusline.js` 路徑（見下方「配置 Claude Code」）。適合只在單一機器上使用、不想動到全域指令的情況。

### 啟動配置介面

方式一（已全域連結）：

```bash
ccstatusline-zh-tw setup
```

方式二（本機建置檔案）：

```bash
node /path/to/ccstatusline-zh-tw/dist/ccstatusline.js setup
```

這將開啟互動式 TUI 配置介面，你可以：

- 新增、刪除、重新排列元件
- 設定顏色和樣式
- 選擇 Powerline 主題
- 實時預覽狀態列效果

### 配置 Claude Code（推薦：用 TUI 自動安裝）

進入 TUI 後，在主選單選擇 **「📦 安裝到 Claude Code」**，會自動偵測 Claude Code 安裝狀態、幫你把 `statusLine` 設定寫入 `~/.claude/settings.json`，並可選擇「自動更新」或「固定版本全域安裝」。不需要手動編輯 JSON。

#### 手動配置（備用方案）

如果不想用 TUI 安裝，也可以自行編輯 `~/.claude/settings.json`：

**若採用方式一（已 `npm link` / `bun link`）：**

```json
{
  "statusLine": {
    "type": "command",
    "command": "ccstatusline-zh-tw",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

**若採用方式二（直接指到本機建置檔案）：**

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/ccstatusline-zh-tw/dist/ccstatusline.js",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

Windows 路徑範例（注意反斜線要跳脫）：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"D:\\github\\ccstatusline-zh-tw\\dist\\ccstatusline.js\"",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

> `refreshInterval` 僅在 Claude Code ≥ 2.1.97 時生效，TUI 中可設定為 `1-60` 秒，留空則不寫入該欄位。

---

## 🪟 Windows 支援

ccstatusline-zh-tw 完整支援 Windows 系統，安裝方式與上方「安裝」章節相同（clone + `bun run build` + `npm link`，或直接指向本機建置檔案）。

Windows 下 Claude Code 的配置路徑為 `%USERPROFILE%\.claude\settings.json`。

---

## 📖 使用方法

### 基本用法

安裝並配置 statusLine 後，ccstatusline-zh-tw 會在每次 Claude Code 更新狀態時自動執行。狀態資料透過 stdin 以 JSON 格式傳入。

### 手動測試

```bash
cat scripts/payload.example.json | ccstatusline-zh-tw
```

### 自定義配置檔案路徑

```bash
ccstatusline-zh-tw --config /path/to/custom-settings.json
```

### 命令列引數

| 引數              | 說明                    |
| ----------------- | ----------------------- |
| `setup`           | 啟動互動式 TUI 配置介面 |
| `--config <path>` | 指定自定義配置檔案路徑  |
| `--version`       | 顯示版本號              |

---

## 🧩 可用元件

### 核心

| 元件     | 說明                                                  |
| -------- | ----------------------------------------------------- |
| 模型     | 顯示當前 Claude 模型名稱                              |
| 風格     | 顯示當前輸出風格                                      |
| 版本     | 顯示 ccstatusline-zh-tw 版本號                           |
| 思考力度 | 顯示當前思考力度等級                                  |
| Vim 模式 | 顯示當前 Vim 模式                                     |
| 語音狀態 | 顯示 Claude Code 語音輸入是否啟用（4 種格式 + Nerd 字型） |
| 沙箱狀態 | 顯示 Claude Code Bash 沙箱模式是否啟用                |
| Claude 狀態 | 讀取 status.claude.com 服務狀態，含可選 48 小時事件歷史條 |

### Git

| 元件                    | 說明                                           |
| ----------------------- | ---------------------------------------------- |
| Git 分支                | 顯示當前 Git 分支名，支援 GitHub 連結          |
| Git PR                  | 顯示當前分支的 PR 資訊（連結、狀態、標題）     |
| Git CI 狀態             | 顯示當前分支 PR 的 GitHub CI 檢查狀態          |
| Git 變更                | 顯示未提交的檔案變更統計                       |
| Git 新增                | 顯示未提交的新增行數                           |
| Git 刪除                | 顯示未提交的刪除行數                           |
| Git 狀態                | 彙總狀態指示：+暫存 / *未暫存 / ?未跟蹤 / !衝突 |
| Git 已暫存              | 存在已暫存變更時顯示 +                         |
| Git 未暫存              | 存在未暫存變更時顯示 *                         |
| Git 未跟蹤              | 存在未跟蹤檔案時顯示 ?                         |
| Git 衝突                | 顯示合併衝突數量                               |
| Git 超前/滯後           | 顯示相對 upstream 的提交領先/落後數            |
| Git SHA                 | 顯示簡短提交雜湊                               |
| Git Origin 所有者/倉庫  | 顯示 origin 遠端的 owner / repo                |
| Git Upstream 所有者/倉庫 | 顯示 upstream 遠端的 owner / repo             |
| Git 是否 Fork           | 當倉庫是 upstream 的 fork 時顯示標識           |
| Git 根目錄              | 顯示 Git 倉庫根目錄名                          |
| Git 工作樹              | 顯示 Git 工作樹資訊                            |
| Git 工作樹模式/名稱/分支 | 工作樹模式指示與詳細資訊                      |

### Token

| 元件       | 說明                |
| ---------- | ------------------- |
| 輸入 Token | 顯示輸入 Token 數量 |
| 輸出 Token | 顯示輸出 Token 數量 |
| 快取 Token | 顯示快取 Token 數量 |
| 總 Token   | 顯示 Token 合計     |

### Token 速度

| 元件     | 說明                        |
| -------- | --------------------------- |
| 輸入速度 | 顯示輸入 Token 速度 (tok/s) |
| 輸出速度 | 顯示輸出 Token 速度 (tok/s) |
| 總速度   | 顯示總 Token 速度 (tok/s)   |

### 上下文

| 元件             | 說明                       |
| ---------------- | -------------------------- |
| 上下文長度       | 顯示當前上下文 Token 數    |
| 上下文 %         | 顯示上下文使用百分比       |
| 上下文 %（可用） | 顯示可用上下文百分比       |
| 上下文進度條     | 以進度條形式顯示上下文用量 |

### 會話

| 元件           | 說明                          |
| -------------- | ----------------------------- |
| 會話時鐘       | 顯示當前會話持續時間          |
| 會話費用       | 顯示當前會話預估費用          |
| 會話名稱       | 顯示 Claude Code 會話名稱     |
| 會話用量       | 顯示會話 API 用量             |
| 周用量         | 顯示本週 API 用量             |
| 周 Sonnet 用量 | 顯示本週 Sonnet 模型 API 用量 |
| 周 Opus 用量   | 顯示本週 Opus 模型 API 用量   |
| 周 Fable 用量  | 顯示本週 Fable 模型 API 用量  |
| 超額用量佔比   | 顯示超額用量（按量付費）佔比       |
| 超額用量剩餘   | 顯示每月超額用量額度的剩餘金額（美元） |
| 時段計時器     | 顯示當前 5 小時時段已用時間   |
| 時段重置計時   | 顯示時段重置視窗剩餘時間      |
| 周重置計時     | 顯示周重置剩餘時間            |
| Claude 會話 ID | 顯示當前 Claude 會話 ID       |
| Claude 賬戶郵箱 | 顯示當前登入的 Claude 賬戶郵箱 |
| 技能           | 顯示 Claude Code 技能呼叫資訊 |
| 快取計時器     | 顯示提示詞快取 TTL 的剩餘時間  |

### 環境

| 元件     | 說明                 |
| -------- | -------------------- |
| 當前目錄 | 顯示當前工作目錄     |
| 終端寬度 | 顯示終端列數         |
| 記憶體用量 | 顯示系統記憶體使用情況 |

### 自定義

| 元件       | 說明                      |
| ---------- | ------------------------- |
| 自定義文字 | 顯示使用者自定義文字        |
| 自定義命令 | 執行 Shell 命令並顯示輸出 |
| 自定義符號 | 顯示自定義單字元符號或 Emoji |
| 連結       | 顯示可點選的終端超連結    |

### 佈局

| 元件       | 說明                         |
| ---------- | ---------------------------- |
| 分隔符     | 元件之間的固定分隔符         |
| 彈性分隔符 | 自動填充剩餘空間的彈性分隔符 |

---

## 🖥️ 配置介面（TUI）

執行 `ccstatusline-zh-tw setup` 開啟互動式配置介面。

### 主選單功能

- **編輯狀態列** — 新增、刪除、移動、配置元件；支援隱藏條件的元件會提供統一的 `(h)隱藏…` 檢查清單，並可按元件設定數值精度（`(.) 精度`）
- **Powerline 設定** — 選擇主題和自定義分隔符
- **全域性樣式覆蓋** — 設定全域性顏色、樣式、預設內邊距方向及全域性數字格式化（精度 precise / compact / whole）
- **終端選項** — 配置終端寬度和顏色級別
- **配置狀態行** — 配置 Claude Code 狀態行重新整理間隔（Claude Code ≥ 2.1.97），以及 Git／自定義命令／終端寬度快取 TTL
- **匯出設定** — 將目前設定儲存為 JSON 檔案以便備份或分享
- **匯入設定** — 從先前匯出的 JSON 檔案載入設定，套用前可預覽差異並選擇全部取代或合併
- **安裝到 Claude Code** — 選擇自動更新 / 固定全域性安裝兩種方式
- **管理安裝** — 已固定安裝時可檢查 npm 更新、執行全域性更新命令、解除安裝
- **檢查更新** — 查詢 npm 倉庫最新版本並對比當前版本

### 快捷鍵

| 按鍵    | 功能      |
| ------- | --------- |
| `↑` `↓` | 導航      |
| `Enter` | 選擇/確認 |
| `a`     | 新增元件  |
| `d`     | 刪除元件  |
| `e`     | 編輯元件  |
| `w`     | 元件選項  |
| `/`     | 搜尋      |
| `q`     | 退出      |

---

## 📡 API 文件

詳細的 API 文件和 JSON Payload 格式說明請參考上游專案：

👉 [ccstatusline API Documentation](https://github.com/sirmalloc/ccstatusline#-api-documentation)

---

## 🛠️ 開發指南

### 環境要求

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 14.0.0

### 本地開發

```bash
# 克隆倉庫
git clone https://github.com/ricks774/ccstatusline-zh-tw.git
cd ccstatusline-zh-tw

# 安裝依賴
bun install

# 執行示例
bun run example

# 啟動 TUI
bun run start setup

# 構建
bun run build

# 程式碼檢查
bun run lint
```

### 專案結構

```
src/
├── ccstatusline.ts          # 入口檔案
├── widgets/                 # 元件目錄（88 個元件）
│   ├── Model.ts
│   ├── GitBranch.ts
│   ├── TokensInput.ts
│   ├── shared/              # 共享工具函式
│   └── ...
├── tui/                     # TUI 配置介面
│   ├── App.tsx
│   └── components/          # 介面元件
├── utils/                   # 工具函式
└── types/                   # 型別定義
```

---

## 🙏 致謝

- [ccstatusline](https://github.com/sirmalloc/ccstatusline) — 原始專案，由 [sirmalloc](https://github.com/sirmalloc) 開發維護
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Anthropic 的 CLI 編碼助手
- [Ink](https://github.com/vadimdemedes/ink) — React 終端渲染框架

---

## 📄 許可證

本專案遵循 [MIT 許可證](LICENSE)，與上游專案保持一致。

---

<div align="center">

**如果這個漢化版對你有幫助，歡迎 ⭐ Star！**

[上游專案](https://github.com/sirmalloc/ccstatusline) · [問題反饋](https://github.com/ricks774/ccstatusline-zh-tw/issues)

</div>
