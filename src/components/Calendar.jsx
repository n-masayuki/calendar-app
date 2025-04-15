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
  const calendarRef1 = useRef(null);
  const calendarRef2 = useRef(null);
  const [currentDate1, setCurrentDate1] = useState(new Date());
  const [currentDate2, setCurrentDate2] = useState(new Date());
  const [showNextButton1, setShowNextButton1] = useState(true);
  const [showNextButton2, setShowNextButton2] = useState(true);

  const fetchGoogleCalendarEvents = async () => {
    try {
      setIsLoading(true); // データ取得開始時にローディング状態をtrueに設定
      setError(null); // エラー状態をリセット

      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      const calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

      if (!apiKey || !calendarId) {
        throw new Error("API key or calendar ID not provided in .env file");
      }

      // Googleカレンダーから臨時休業のイベントを取得
      const googleCalendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`
      );

      if (!googleCalendarResponse.ok) {
        throw new Error("Failed to fetch Google Calendar events");
      }

      const googleCalendarData = await googleCalendarResponse.json();
      const googleCalendarEvents = googleCalendarData.items.map((event) => ({
        title: event.summary,
        start: event.start?.dateTime || event.start?.date || "",
        end: event.end?.dateTime || event.end?.date || "",
        classNames: "temporary-event",
      }));

      // GoogleカレンダーのイベントをCafeとBarに分ける
      const cafeEvents = googleCalendarEvents.filter(
        (event) => event.title && event.title.toLowerCase().includes("cafe") // 大文字小文字を区別しない
      );
      const barEvents = googleCalendarEvents.filter(
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

      // Japanese holidays processing
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
      new Date().getFullYear(),
      new Date().getMonth() + 1,
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
