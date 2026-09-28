# 営業日カレンダー

営業日・定休日・臨時休業日をGoogleカレンダーで管理し、FullCalendarで月ごとに表示するReactコンポーネントです。Googleカレンダーを更新することで、カレンダー表示側にも予定を反映できます。

## 主な機能

- Googleカレンダーの予定を取得し、2つの月間カレンダーへ振り分け
- 定休日や臨時休業日をGoogleカレンダー側で管理
- 月送り、データ読み込み中の表示、取得失敗時の再試行
- 日本の祝日データを取得してカレンダーに表示
- 過去約2年から未来約1年までの予定を取得

## 使用技術

- React
- Vite / Vitest
- FullCalendar 6
- Google Calendar API
- [日本の祝日データ](https://holidays-jp.github.io/)

## ローカルでの起動

動作確認済みの環境はNode.js 22.14.0 / npm 11.6.2です。Voltaを使用する場合は `package.json` の指定が適用されます。

まず依存パッケージをインストールします。

```bash
npm ci
```

初回は設定例をコピーし、`.env.local` 内の値を実際のAPIキーと公開カレンダーIDに置き換えてください。既に `.env` または `.env.local` を設定済みの場合、コピーは不要です。

```bash
cp .env.example .env.local
```

```env
REACT_APP_GOOGLE_API_KEY=your_api_key
REACT_APP_GOOGLE_CALENDAR_ID=your_public_calendar_id
```

設定が済んだら起動します。どちらかの変数が未設定の場合は、画面に設定不足のエラーが表示されます。

```bash
npm start
```

`npm run dev` でも起動できます。既定のURLは `http://localhost:3000/` です。ポートが使用中の場合は、ターミナルに表示されたURLを開いてください。終了は `Ctrl + C` です。

このカレンダー機能はブラウザーからGoogle Calendar APIへアクセスします。そのためAPIキーはビルド後のブラウザーにも渡り、秘密情報としては扱えません。公開カレンダーを使い、Google Cloud側でAPIキーのHTTPリファラーと利用APIを制限してください。実際のAPIキーやカレンダーIDは公開リポジトリへ登録しないでください。

## ビルド・テスト

```bash
npm run build     # 本番用ファイルを build/ に出力
npm run preview   # ビルド結果のローカル確認
npm run test:run  # Vitestでテストを一度実行
npm test          # ローカルでテストを監視モードで実行
```

公開するファイルは `build/` の中身です。`npm run preview` はビルド後の確認用で、公開用サーバーとしては使用しません。ソースや環境変数を変更したら、再度ビルドしてください。

テストでは外部APIをモックし、予定の読み込み・Cafe／Barへの振り分け・月送り・環境変数がない場合のエラー表示を確認します。実際のAPIキーは不要です。公開前にはブラウザーでも実データの表示を確認してください。

## Vite移行後の設定

Create React AppからViteへ移行済みです。既存の `.env` / `.env.local` と `REACT_APP_GOOGLE_API_KEY` / `REACT_APP_GOOGLE_CALENDAR_ID` は引き続き使用できます。環境変数を変更した場合は開発サーバーを再起動してください。本番用の値はビルド時に取り込まれます。

サブディレクトリへ公開する場合は、`PUBLIC_URL=/calendar/ npm run build` のように公開先のパスを指定できます。開発ポートは `PORT=3001 npm start` で変更できます。

Viteの標準のブラウザー対応範囲を使用します。以前のCreate React Appの `browserslist` 設定は使用しません。

ビルド・開発サーバー・テストの設定は [`vite.config.mjs`](vite.config.mjs) にまとめています。旧 `config/`・`scripts/` のCreate React App用ファイルと `npm run eject` は廃止しました。HTMLの編集先は `public/index.html` からプロジェクト直下の [`index.html`](index.html) に変わりました。

## 依存関係の確認

```bash
npm outdated  # 更新可能なバージョンの確認
npm audit     # 開発用も含めた脆弱性の確認
```

依存関係を変更した際は `package.json` と `package-lock.json` を一緒に管理し、`npm run test:run` と `npm run build` を実行してください。`npm audit fix --force` は互換性を壊す変更を含むため、自動修正の内容を確認してから判断してください。

## エントリーポイント

`index.html` → `src/index.jsx` → `src/components/Calendar.jsx` の順にカレンダーを読み込みます。`src/App.jsx` は旧テンプレートのサンプルで、起動画面には使用していません。

## ライセンス

All rights reserved. 詳細は [LICENSE.md](LICENSE.md) を参照してください。
