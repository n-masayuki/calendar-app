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
- FullCalendar 6
- Google Calendar API
- [日本の祝日データ](https://holidays-jp.github.io/)

## ローカルでの起動

Node.js 22.14.0 と npm 11.6.2 を使用しています。

```bash
npm ci
npm start
```

Google Calendar APIを使う場合は、プロジェクト直下に `.env.local` を作成し、次の変数を設定してください。

```env
REACT_APP_GOOGLE_API_KEY=your_api_key
REACT_APP_GOOGLE_CALENDAR_ID=your_public_calendar_id
```

このカレンダー機能はブラウザーからGoogle Calendar APIへアクセスします。そのためAPIキーはビルド後のブラウザーにも渡り、秘密情報としては扱えません。公開カレンダーを使い、Google Cloud側でAPIキーのHTTPリファラーと利用APIを制限してください。実際のAPIキーやカレンダーIDは公開リポジトリへ登録しないでください。

## 現在の状態

カレンダーUIの実装は [`src/components/Calendar.jsx`](src/components/Calendar.jsx) にあります。現在の [`src/App.js`](src/App.js) はCreate React Appの初期画面で、このコンポーネントを単体アプリに組み込んでいません。そのため、`npm start` で起動する画面と、ここで紹介しているカレンダーUIは現時点では一致しません。

カレンダーを表示するには、ホストアプリから `Calendar` コンポーネントを読み込み、必要なスタイルとGoogle Calendar APIの設定を用意してください。

## ライセンス

All rights reserved. 詳細は [LICENSE.md](LICENSE.md) を参照してください。
