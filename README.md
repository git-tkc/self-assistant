# 🤖 My Personal Assistant

複数のサービス（サイボウズOffice、Gmail、Asana）からタスクを統合して、一つのダッシュボードで管理できるフルスタック Webアプリケーション。

## ✨ 主な機能

- **🔗 マルチサービス統合**: サイボウズOffice、Gmail、Asanaに対応
- **🎯 統一ダッシュボード**: 全てのタスクを一箇所で確認
- **🔍 スマートフィルタリング**: サービス、ステータス、優先度で絞り込み
- **🔄 リアルタイム同期**: 全サービスからタスクを最新状態で取得
- **🌙 ダークテーマ**: 目に優しいモダンなデザイン
- **📱 レスポンシブ対応**: デスクトップ・モバイル両対応
- **🔐 OAuth認証**: Gmail・Asanaの安全な認証
- **🏢 サイボウズ通知統合**: 通知ページから直接タスク取得

## 🎨 デザイン特徴

- **グラスモーフィズム**: 半透明カード + ぼかし効果
- **グラデーション背景**: ダークグレーからブラックへの美しいグラデーション
- **ホバーエフェクト**: マウスオーバーでスケールアップ + 影効果
- **日本語UI**: 完全日本語対応のユーザーインターフェース

## 🏗️ 技術スタック

- **フロントエンド**: React + TypeScript + Tailwind CSS
- **バックエンド**: Node.js + Express
- **API**: REST API によるタスク統合
- **統合サービス**: サイボウズOffice、Gmail API、Asana API

## 🚀 セットアップガイド

### 🐋 Docker を使用（推奨）

#### 本番環境
```bash
# 1. 環境変数設定
cp .env.docker .env
# .envファイルを編集して実際の認証情報を入力

# 2. コンテナ起動
npm run docker:up-prod

# アクセス
# フロントエンド: http://localhost:3000
# バックエンドAPI: http://localhost:5000
```

#### 開発環境（ホットリロード）
```bash
# 1. 環境変数設定
cp .env.docker .env
# .envファイルを編集

# 2. 開発用コンテナ起動
npm run docker:up-dev

# アクセス
# フロントエンド: http://localhost:3001
# バックエンドAPI: http://localhost:5001
```

#### Docker コマンド一覧
```bash
npm run docker:build     # イメージビルド
npm run docker:up        # 本番用起動
npm run docker:up-dev    # 開発用起動
npm run docker:down      # コンテナ停止
npm run docker:logs      # ログ確認
npm run docker:clean     # 完全クリーンアップ
```

### 💻 ローカル開発

#### 前提条件
- Node.js 20.x以上
- npm

#### インストール・起動
```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env
# .envファイルを編集して実際の認証情報を入力

# 3. 開発サーバー起動
npm run dev

# アクセス
# フロントエンド: http://localhost:3000
# バックエンドAPI: http://localhost:5000
```

### 前提条件

- Node.js (v18以上)
- npm または yarn
- 各サービスのAPI認証情報

### 1. クローンとセットアップ

```bash
git clone <repository-url>
cd self-assistant
npm install
```

### 2. 環境変数設定

プロジェクトルートに `.env` ファイルを作成：

```env
# サーバー設定
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# サイボウズOffice設定
CYBOZU_OFFICE_URL=http://cybozu/cgi-bin/cbag/ag.exe
CYBOZU_USERNAME=あなたのユーザー名
CYBOZU_PASSWORD=あなたのパスワード

# Google OAuth (Gmail)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:5000/api/auth/gmail/callback

# Asana OAuth
ASANA_CLIENT_ID=your-asana-client-id
ASANA_CLIENT_SECRET=your-asana-client-secret
ASANA_REDIRECT_URL=http://localhost:5000/api/auth/asana/callback

# Asana Personal Access Token (推奨)
ASANA_PERSONAL_ACCESS_TOKEN=your-personal-access-token
```

### 3. サービス別セットアップ

#### 🏢 サイボウズOffice
1. 社内のサイボウズOfficeサーバーにアクセス可能であることを確認
2. `.env` ファイルに `CYBOZU_OFFICE_URL`、`CYBOZU_USERNAME`、`CYBOZU_PASSWORD` を設定
3. 通知ページ (`page=NotificationIndex`) へのアクセス権限を確認

**実装詳細:**
- フォーム認証による自動ログイン
- セッションCookie管理
- HTML解析による通知取得 (`div.notificationRows > div.notificationRow > div.notificationSubject > a`)
- URL補完機能 (`http://cybozu/cgi-bin/cbag/ag.exe` へのパス自動生成)

#### 📧 Gmail (Google API)
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択
3. Gmail API を有効化
4. OAuth 2.0 認証情報を作成
5. 認証リダイレクト URI を設定: `http://localhost:5000/api/auth/gmail/callback`
6. `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` を設定

#### 📊 Asana
**方法1: Personal Access Token (推奨)**
1. [Asana Personal Access Tokens](https://app.asana.com/0/my-apps) にアクセス
2. 新しいPersonal Access Tokenを作成
3. `.env` ファイルに `ASANA_PERSONAL_ACCESS_TOKEN` を設定

**方法2: OAuth App**
1. [Asana Developer Apps](https://app.asana.com/0/my-apps) にアクセス
2. 新しいアプリを作成
3. リダイレクトURL を設定: `http://localhost:5000/api/auth/asana/callback`
4. `ASANA_CLIENT_ID` と `ASANA_CLIENT_SECRET` を設定

### 4. アプリケーション起動

```bash
# 開発モード (フロントエンド・バックエンド同時起動)
npm run dev

# または個別起動:
npm run server:dev  # バックエンドのみ
npm run client:dev  # フロントエンドのみ
```

アクセス先:
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000

## 📁 プロジェクト構成

```
self-assistant/
├── server/                     # バックエンド (Node.js/Express)
│   ├── index.js               # メインサーバーファイル
│   ├── routes/                # API ルート
│   │   ├── tasks.js          # タスク統合エンドポイント
│   │   ├── auth.js           # 認証エンドポイント
│   │   └── services.js       # サービス設定エンドポイント
│   └── services/             # サービス統合
│       ├── TaskService.js    # メインタスク統合ロジック
│       ├── CybozuService.js  # サイボウズOffice統合
│       ├── GmailService.js   # Gmail API統合
│       ├── AsanaService.js   # Asana API統合
│       └── AuthService.js    # 認証管理
├── client/                   # フロントエンド (React/TypeScript)
│   ├── public/
│   └── src/
│       ├── components/       # Reactコンポーネント
│       │   ├── TaskDashboard.tsx  # メインダッシュボード
│       │   ├── TaskCard.tsx       # タスクカード
│       │   ├── TaskFilter.tsx     # フィルター機能
│       │   └── AuthStatus.tsx     # 認証状態表示
│       ├── services/         # フロントエンドAPIサービス
│       │   ├── TaskService.ts
│       │   └── AuthService.ts
│       ├── types/            # TypeScript型定義
│       │   └── types.ts
│       └── App.tsx
├── package.json              # メインpackage.json
├── .env                     # 環境変数
└── README.md
```

## 🔧 API エンドポイント

### タスク関連
- `GET /api/tasks` - 全サービスから全タスクを取得
- `GET /api/tasks/:service` - 特定サービスからタスクを取得
- `POST /api/tasks/refresh` - 全サービスのタスクを更新

### 認証関連
- `GET /api/auth/status` - 認証状態をチェック
- `GET /api/auth/urls` - OAuth URLを取得
- `GET /api/auth/gmail/callback` - Gmail OAuth コールバック
- `GET /api/auth/asana/callback` - Asana OAuth コールバック

### サービス関連
- `GET /api/services/config` - サービス設定を取得
- `POST /api/services/test/:service` - サービス接続をテスト

## 📊 タスクデータ形式

全サービスのタスクは以下の統一形式に正規化されます：

```typescript
interface Task {
  id: string;              // 一意識別子
  title: string;           // タスクタイトル
  description: string;     // 説明
  dueDate?: string;        // 期限日 (ISO形式)
  priority: number;        // 優先度 (1: 低, 2: 中, 3: 高)
  status: 'open' | 'in_progress' | 'completed'; // ステータス
  assignee?: string;       // 担当者
  createdDate?: string;    // 作成日
  updatedDate?: string;    // 更新日
  url?: string;           // 元サービスへのリンク
  service: 'cybozu' | 'gmail' | 'asana'; // サービス名
}
```

## 🎯 各サービスの実装詳細

### 🏢 サイボウズOffice統合
- **認証方式**: フォーム認証 (username/password)
- **データ取得**: 通知ページのHTML解析
- **対象URL**: `?page=NotificationIndex&Sort=&Rev=&APP=&MENT=0`
- **セレクター**: `div.notificationRows > div.notificationRow > div.notificationSubject > a`
- **URL補完**: `ag.exe?page=...` → `http://cybozu/cgi-bin/cbag/ag.exe?page=...`

### 📊 Asana統合
- **認証方式**: Personal Access Token
- **取得データ**: ワークスペース内の自分の担当タスク
- **自動検出**: ワークスペース自動取得
- **フィールドマッピング**: Asanaの複雑な構造を統一形式に変換

### 📧 Gmail統合
- **認証方式**: OAuth 2.0
- **取得データ**: ラベル付きメール（タスク扱い）
- **スコープ**: Gmail読み取り専用

## 🛠️ 開発ガイド

### 新しいサービスの追加

1. `server/services/` に新しいサービスクラスを作成
2. 必要メソッドを実装: `getTasks()`、`testConnection()`
3. `TaskService.js` にサービスを追加
4. 必要に応じて認証フローを追加
5. `AuthStatus.tsx` にフロントエンド設定を追加

### タスクフィールドのカスタマイズ

`TaskService.js` の `normalizeTask()` メソッドを修正して、特定のサービス設定からフィールドをマッピングしてください。

### デザインのカスタマイズ

現在のダークテーマは以下の要素で構成されています：
- **背景**: `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`
- **カード**: `bg-gray-800/50 backdrop-blur-md border border-gray-700`
- **アクセント**: `bg-gradient-to-r from-blue-600 to-purple-600`

## 🌙 ダークテーマ仕様

### カラーパレット
- **プライマリ背景**: Gray-900 → Gray-800 グラデーション
- **カード背景**: Gray-800/50 (半透明) + ブラー効果
- **テキスト**: White (メイン) / Gray-300 (セカンダリ)
- **アクセント**: Blue-400 → Purple-400 グラデーション
- **境界線**: Gray-700 (半透明)

### エフェクト
- **グラスモーフィズム**: `backdrop-blur-md`
- **ホバー**: `hover:scale-105 transition-all duration-300`
- **影**: `shadow-xl`

## 🚀 本番環境デプロイ

### 本番用環境変数

本番環境では以下を更新してください：

```env
NODE_ENV=production
CLIENT_URL=https://your-domain.com
GOOGLE_REDIRECT_URL=https://your-domain.com/api/auth/gmail/callback
ASANA_REDIRECT_URL=https://your-domain.com/api/auth/asana/callback
```

### ビルドとデプロイ

```bash
npm run build
npm start
```

## � パフォーマンス最適化

- **タイムアウト設定**: API呼び出し90秒タイムアウト
- **エラーハンドリング**: サービス障害時も他サービス継続
- **レスポンシブ**: Tailwind CSSによる最適化
- **コード分割**: React lazy loading 対応

## 🔧 トラブルシューティング

### よくある問題

1. **サイボウズ接続エラー**
   - ネットワーク設定を確認
   - ユーザー名・パスワードを確認
   - 通知ページへのアクセス権限を確認

2. **Asana認証エラー**
   - Personal Access Tokenの有効性を確認
   - ワークスペースへのアクセス権限を確認

3. **Gmail認証エラー**
   - Google Cloud Console での OAuth設定を確認
   - リダイレクトURIの設定を確認

## 📝 ライセンス

MIT License

## 🤝 貢献

1. プロジェクトをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📧 サポート

統合設定やその他のご質問については、このリポジトリにイシューを作成してください。

---

## 🎉 完成機能一覧

✅ **サイボウズOffice完全統合** - 通知取得・URL補完  
✅ **Asana Personal Access Token** - 13タスク取得成功  
✅ **ダークテーマUI** - グラスモーフィズム + グラデーション  
✅ **日本語完全対応** - 全UI日本語化済み  
✅ **レスポンシブデザイン** - モバイル・デスクトップ対応  
✅ **リアルタイム統合** - 90秒タイムアウト対応  
✅ **エラーハンドリング** - 堅牢なエラー処理  
✅ **フィルタリング機能** - サービス・ステータス・優先度別  

---

❤️ より良いマルチプラットフォームタスク管理のために作成
