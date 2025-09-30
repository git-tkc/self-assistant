# サーバーサイドのみのシンプルなイメージ
FROM node:20-alpine AS production

# curlをインストール（ヘルスチェック用）
RUN apk add --no-cache curl

# 作業ディレクトリ設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係インストール
RUN npm ci --only=production && npm cache clean --force

# サーバーコードをコピー
COPY server ./server

# ポート54321を公開
EXPOSE 54321

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:54321/api/tasks || exit 1

# サーバー起動
ENV NODE_ENV=production
CMD ["npm", "run", "server"]
