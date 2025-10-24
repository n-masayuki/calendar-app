import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import googleCalendarPlugin from "@fullcalendar/google-calendar";

const Calendar = () => {
  const [cafeEvents, setCafeEvents] = useState([]);
  const [barEvents, setBarEvents] = useState([]);
  const [japaneseHolidays, setJapaneseHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // ローディング状態の追加
  const [error, setError] = useState(null); // エラー状態の追加
  const calendarRef1 = useRef(null); // Cafeカレンダー用のref
  const calendarRef2 = useRef(null); // Barカレンダー用のref
  const [currentDate1, setCurrentDate1] = useState(new Date()); // Cafeカレンダー用で、初期値は今日の日付
  const [currentDate2, setCurrentDate2] = useState(new Date()); // Barカレンダー用で、初期値は今日の日付
  const [showNextButton1, setShowNextButton1] = useState(true); // Cafeカレンダー用で、次へボタンの表示状態
  const [showNextButton2, setShowNextButton2] = useState(true); // Barカレンダー用で、次へボタンの表示状態

  const fetchGoogleCalendarEvents = async () => {
    try {
      setIsLoading(true); // データ取得開始時にローディング状態をtrueに設定
      setError(null); // エラー状態をリセット

      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      const calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

      if (!apiKey || !calendarId) {
        throw new Error("API key or calendar ID not provided in .env file");
      }

      const calendarBaseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events`;

      const now = new Date();

      // 過去のイベント取得範囲を2年に拡大
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1);
      twoYearsAgo.setHours(0, 0, 0, 0);

      // 未来のイベントを1年後まで拡大
      const oneYearLater = new Date(
        now.getFullYear() + 1,
        now.getMonth(),
        now.getDate()
      );

      let googleCalendarEvents = [];

      // 1. まず今日から未来のイベントを取得（新しいイベントを優先）
      const futureParams = new URLSearchParams({
        key: apiKey,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "1000", // 未来1年分に対応
        timeMin: now.toISOString(), // 今日から
        timeMax: oneYearLater.toISOString(),
      });

      const futureResponse = await fetch(
        `${calendarBaseUrl}?${futureParams.toString()}`
      );

      if (futureResponse.ok) {
        const futureData = await futureResponse.json();
        const futureEvents = (futureData.items || []).map((event) => ({
          title: event.summary,
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          classNames: "temporary-event",
          id: event.id, // 重複チェック用のID
        }));
        googleCalendarEvents = [...googleCalendarEvents, ...futureEvents];
      }

      // 2. 過去のイベントを取得（2年分）
      const pastParams = new URLSearchParams({
        key: apiKey,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "1500", // 過去2年分に対応
        timeMin: twoYearsAgo.toISOString(),
        timeMax: now.toISOString(), // 今日まで
      });

      let pageToken = null;
      do {
        const params = new URLSearchParams(pastParams);

        if (pageToken) {
          params.set("pageToken", pageToken);
        }

        const googleCalendarResponse = await fetch(
          `${calendarBaseUrl}?${params.toString()}`
        );

        if (!googleCalendarResponse.ok) {
          console.warn("Failed to fetch past Google Calendar events");
          break; // 過去のイベント取得に失敗しても、未来のイベントがあれば継続
        }

        const googleCalendarData = await googleCalendarResponse.json();

        const fetchedEvents = (googleCalendarData.items || []).map((event) => ({
          title: event.summary,
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          classNames: "temporary-event",
          id: event.id, // 重複チェック用のID
        }));

        googleCalendarEvents = [...googleCalendarEvents, ...fetchedEvents];
        pageToken = googleCalendarData.nextPageToken || null;

        // 過去のイベントは最大2000件で打ち切り（2年分に対応）
        if (googleCalendarEvents.length >= 2500) {
          console.log("過去のイベント取得を制限により停止");
          break;
        }
      } while (pageToken);

      // 重複を除去（IDが同じイベントを削除）
      const uniqueEvents = googleCalendarEvents.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id)
      );

      // デバッグ用ログ出力
      console.log("=== GoogleカレンダーAPI取得結果 ===");
      console.log(
        "取得期間: ",
        twoYearsAgo.toISOString().split("T")[0],
        " 〜 ",
        oneYearLater.toISOString().split("T")[0]
      );
      console.log("Total events fetched:", googleCalendarEvents.length);
      console.log("Unique events after deduplication:", uniqueEvents.length);

      // 時期別の取得状況
      const pastEvents = uniqueEvents.filter(
        (event) => new Date(event.start) < new Date().setHours(0, 0, 0, 0)
      );
      const futureEvents = uniqueEvents.filter(
        (event) => new Date(event.start) >= new Date().setHours(0, 0, 0, 0)
      );
      console.log("過去のイベント:", pastEvents.length, "件");
      console.log("今日以降のイベント:", futureEvents.length, "件");

      // 最新のイベントを5件表示
      const sortedEvents = uniqueEvents.sort(
        (a, b) => new Date(b.start) - new Date(a.start)
      );
      console.log(
        "Latest 5 events:",
        sortedEvents
          .slice(0, 5)
          .map((e) => ({ title: e.title, start: e.start }))
      );
      console.log("=================================");

      // GoogleカレンダーのイベントをCafeとBarに分ける
      const cafeEvents = uniqueEvents.filter(
        (event) => event.title && event.title.toLowerCase().includes("cafe") // 大文字小文字を区別しない
      );
      const barEvents = uniqueEvents.filter(
        (event) => event.title && event.title.toLowerCase().includes("bar") // 大文字小文字を区別しない
      );

      // 日本の祝日データを取得
      const japaneseHolidaysResponse = await fetch(
        "https://holidays-jp.github.io/api/v1/date.json"
      );

      if (!japaneseHolidaysResponse.ok) {
        throw new Error("Failed to fetch Japanese holidays");
      }

      const holidaysData = await japaneseHolidaysResponse.json();

      //　日本の祝日とその翌日をイベント形式に変換
      const japaneseHolidays = Object.keys(holidaysData)
        .map((date) => {
          const holidayDate = new Date(date);
          const nextDay = new Date(holidayDate);
          nextDay.setDate(holidayDate.getDate() + 1);

          const holidayEvent = {
            title: holidaysData[date],
            start: date,
            end: date,
            allDay: true,
            classNames: "japanese-holiday",
          };

          const substituteHolidayEvent = {
            title: "祝日の翌日",
            start: nextDay.toISOString().split("T")[0],
            end: nextDay.toISOString().split("T")[0],
            allDay: true,
            classNames: "substitute-holiday",
          };

          return [holidayEvent, substituteHolidayEvent];
        })
        .flat();

      setJapaneseHolidays(japaneseHolidays);
      setCafeEvents(cafeEvents);
      setBarEvents(barEvents);
      setIsLoading(false); // データ取得完了時にローディング状態をfalseに設定
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message); // エラーメッセージを設定
      setIsLoading(false); // エラー発生時もローディング状態を終了
    }
  };

  useEffect(() => {
    fetchGoogleCalendarEvents();
  }, []); // 初回のみ実行

  // カレント月の1ヶ月先まで表示する
  const handleMonthChange = (
    calendarRef,
    setCurrentDate,
    delta,
    calendarIndex
  ) => {
    const currentView = calendarRef.current.getApi().view;
    const currentDateInView = currentView.currentStart;
    const newDate = new Date(
      currentDateInView.getFullYear(),
      currentDateInView.getMonth() + delta,
      1
    );

    // 未来の表示を1ヶ月までに制限
    const maxFutureDate = new Date(
      new Date().getFullYear(), // 今年
      new Date().getMonth() + 1, // 来月
      1
    );

    if (newDate > maxFutureDate) {
      setCurrentDate(maxFutureDate);
      calendarRef.current.getApi().gotoDate(maxFutureDate);

      // カレンダーごとのボタン表示状態を更新
      if (calendarIndex === 0) {
        setShowNextButton1(false);
      } else if (calendarIndex === 1) {
        setShowNextButton2(false);
      }
    } else {
      setCurrentDate(newDate);
      calendarRef.current.getApi().gotoDate(newDate);

      // カレンダーごとのボタン表示状態を更新
      if (calendarIndex === 0) {
        setShowNextButton1(newDate < maxFutureDate);
      } else if (calendarIndex === 1) {
        setShowNextButton2(newDate < maxFutureDate);
      }
    }
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="c-calendar-loading">
        <div className="c-calendar-loading-spinner"></div>
        <p>カレンダーデータを読み込んでいます...</p>
      </div>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <div className="c-calendar-error">
        <p>エラーが発生しました: {error}</p>
        <button
          className="c-calendar-error-retry-btn"
          onClick={() => fetchGoogleCalendarEvents()}
        >
          再試行する
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="c-calendar">
        <div className="c-calendar-item c-calendar-item--cafe">
          <p className="c-calendar-shop-type">Cafe</p>
          <div className="c-calendar-header">
            <button
              className="c-calendar-header-btn c-calendar-header-prev-btn"
              onClick={() =>
                handleMonthChange(calendarRef1, setCurrentDate1, -1, 0)
              }
            >
              <span className="c-calendar-icon c-calendar-icon--prev"></span>{" "}
              {new Date(
                currentDate1.getFullYear(),
                currentDate1.getMonth() - 1,
                1
              ).toLocaleDateString("jp", { month: "long" })}
            </button>
            <p className="c-calendar-header-month c-calendar-header-month--current">
              <span>
                {new Date(currentDate1).toLocaleDateString("en-US", {
                  year: "numeric",
                })}
              </span>
              <span>
                {new Date(currentDate1).toLocaleDateString("jp", {
                  month: "long",
                })}
              </span>
            </p>
            <button
              className={`c-calendar-header-btn c-calendar-header-next-btn ${
                !showNextButton1 ? "is-none" : "is-show"
              }`}
              onClick={() =>
                handleMonthChange(calendarRef1, setCurrentDate1, 1, 0)
              }
            >
              {new Date(
                currentDate1.getFullYear(),
                currentDate1.getMonth() + 1,
                1
              ).toLocaleDateString("jp", { month: "long" })}{" "}
              <span className="c-calendar-icon c-calendar-icon--next"></span>
            </button>
          </div>

          <FullCalendar
            ref={calendarRef1}
            initialDate={currentDate1}
            plugins={[dayGridPlugin, googleCalendarPlugin]}
            initialView="dayGridMonth"
            events={[...cafeEvents, ...japaneseHolidays]}
            headerToolbar={false}
            footerToolbar={{
              right: "noteButton",
            }}
            customButtons={{
              noteButton: {
                text: "定休・臨時休業日",
              },
            }}
            datesSet={(info) => {
              setCurrentDate1(info.view.currentStart);
            }}
            eventContent={(arg) => {
              const eventTitle = arg.event.title;
              return {
                html: `<div class="fc-event-title fc-sticky" data-event="${eventTitle}">${eventTitle}</div>`,
              };
            }}
          />
        </div>

        <div className="c-calendar-item c-calendar-item--bar">
          <p className="c-calendar-shop-type">Bar</p>
          <div className="c-calendar-header">
            <button
              className="c-calendar-header-btn c-calendar-header-prev-btn"
              onClick={() =>
                handleMonthChange(calendarRef2, setCurrentDate2, -1, 1)
              }
            >
              <span className="c-calendar-icon c-calendar-icon--prev"></span>{" "}
              {new Date(
                currentDate2.getFullYear(),
                currentDate2.getMonth() - 1,
                1
              ).toLocaleDateString("jp", { month: "long" })}
            </button>
            <p className="c-calendar-header-month c-calendar-header-month--current">
              <span>
                {new Date(currentDate2).toLocaleDateString("en-US", {
                  year: "numeric",
                })}
              </span>
              <span>
                {new Date(currentDate2).toLocaleDateString("jp", {
                  month: "long",
                })}
              </span>
            </p>
            <button
              className={`c-calendar-header-btn c-calendar-header-next-btn ${
                !showNextButton2 ? "is-none" : "is-show"
              }`}
              onClick={() =>
                handleMonthChange(calendarRef2, setCurrentDate2, 1, 1)
              }
            >
              {new Date(
                currentDate2.getFullYear(),
                currentDate2.getMonth() + 1,
                1
              ).toLocaleDateString("jp", { month: "long" })}{" "}
              <span className="c-calendar-icon c-calendar-icon--next"></span>
            </button>
          </div>

          <FullCalendar
            ref={calendarRef2}
            initialDate={currentDate2}
            plugins={[dayGridPlugin, googleCalendarPlugin]}
            initialView="dayGridMonth"
            events={[...barEvents, ...japaneseHolidays]}
            headerToolbar={false}
            footerToolbar={{
              right: "noteButton",
            }}
            customButtons={{
              noteButton: {
                text: "定休・臨時休業日",
              },
            }}
            datesSet={(info) => {
              setCurrentDate2(info.view.currentStart);
            }}
            eventContent={(arg) => {
              const eventTitle = arg.event.title;
              return {
                html: `<div class="fc-event-title fc-sticky" data-event="${eventTitle}">${eventTitle}</div>`,
              };
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Calendar;
