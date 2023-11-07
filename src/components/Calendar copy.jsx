import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import googleCalendarPlugin from "@fullcalendar/google-calendar";

const Calendar = () => {
  // const [events, setEvents] = useState([]);
  const [cafeEvents, setCafeEvents] = useState([]);
  const [barEvents, setBarEvents] = useState([]);
  const calendarRef1 = useRef(null);
  const calendarRef2 = useRef(null);
  const [currentDate1, setCurrentDate1] = useState(new Date());
  const [currentDate2, setCurrentDate2] = useState(new Date());

  useEffect(() => {
    const fetchGoogleCalendarEvents = async () => {
      try {
        const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
        const calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

        if (!apiKey || !calendarId) {
          console.error("API key or calendar ID not provided in .env file");
          return;
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
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          classNames: "temporary-closed", // クラスを追加
        }));

        // GoogleカレンダーのイベントをCafeとBarに分ける
        const cafeEvents = googleCalendarEvents.filter(
          (event) => event.title.toLowerCase().includes("cafe") // 大文字小文字を区別しない
          // event.title.includes("Cafe")
        );
        const barEvents = googleCalendarEvents.filter(
          (event) => event.title.toLowerCase().includes("bar") // 大文字小文字を区別しない
          // event.title.includes("Bar")
        );

        // JavaScriptで指定した定休日を作成
        const recurringHolidays = [];
        const currentDate = new Date();
        const endDate = new Date(
          currentDate.getFullYear() + 1,
          currentDate.getMonth(),
          currentDate.getDate()
        );

        // 12か月分の定休日を生成
        while (currentDate <= endDate) {
          if (currentDate.getDay() === 0 || currentDate.getDay() === 1) {
            // 日曜日と月曜日を定休日として指定
            recurringHolidays.push({
              // title: "定休日",
              start: currentDate.toISOString().split("T")[0],
              end: currentDate.toISOString().split("T")[0],
              // backgroundColor: "#FFCCBC", // 定休日の背景色を設定
              // display: "background",
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // 日本の祝日データを取得
        const japaneseHolidaysResponse = await fetch(
          "https://holidays-jp.github.io/api/v1/date.json"
        );
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
              classNames: "japanese-holiday", // クラスを追加
            };

            const substituteHolidayEvent = {
              title: "振替休日",
              start: nextDay.toISOString().split("T")[0],
              end: nextDay.toISOString().split("T")[0],
              allDay: true,
              classNames: "substitute-holiday", // クラスを追加
            };

            return [holidayEvent, substituteHolidayEvent];
          })
          .flat();

        // eslint-disable-next-line no-unused-vars
        const allEvents = [
          // ...googleCalendarEvents,
          ...cafeEvents,
          ...barEvents,
          ...recurringHolidays,
          ...japaneseHolidays,
        ];

        // setEvents(allEvents);
        // setCafeEvents と setBarEvents でそれぞれのイベントをセット
        setCafeEvents(cafeEvents);
        setBarEvents(barEvents);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchGoogleCalendarEvents();
  }, []); // 初回のみ実行

  // 月の変更時にカレンダーコンポーネントを操作
  const handlePrevMonthClick = (calendarRef, setCurrentDate) => {
    const newDate = new Date(
      calendarRef.current.getApi().getDate().getFullYear(),
      calendarRef.current.getApi().getDate().getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
    calendarRef.current.getApi().gotoDate(newDate);
  };

  const handleNextMonthClick = (calendarRef, setCurrentDate) => {
    const newDate = new Date(
      calendarRef.current.getApi().getDate().getFullYear(),
      calendarRef.current.getApi().getDate().getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
    calendarRef.current.getApi().gotoDate(newDate);
  };

  return (
    <>
      <div className="c-calendar">
        <div className="c-calendar-item c-calendar-item--cafe">
          <p className="c-calendar-shop-type">Cafe</p>
          <div className="c-calendar-header">
            <button
              className="c-calendar-header-btn c-calendar-header-prev-btn"
              onClick={() =>
                handlePrevMonthClick(calendarRef1, setCurrentDate1)
              }
            >
              <span className="c-calendar-icon material-symbols-outlined">
                chevron_left
              </span>{" "}
              {new Date(
                currentDate1.getFullYear(),
                currentDate1.getMonth() - 1,
                1
              ).toLocaleDateString("en-US", { month: "long" })}
            </button>
            <p className="c-calendar-header-month c-calendar-header-month--current">
              <span>
                {new Date(currentDate1).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
            <button
              className="c-calendar-header-btn c-calendar-header-next-btn"
              onClick={() =>
                handleNextMonthClick(calendarRef1, setCurrentDate1)
              }
            >
              {new Date(
                currentDate1.getFullYear(),
                currentDate1.getMonth() + 1,
                1
              ).toLocaleDateString("en-US", { month: "long" })}{" "}
              <span className="c-calendar-icon material-symbols-outlined">
                chevron_right
              </span>
            </button>
          </div>

          <FullCalendar
            ref={calendarRef1}
            initialDate={currentDate1}
            plugins={[dayGridPlugin, googleCalendarPlugin]}
            initialView="dayGridMonth"
            events={cafeEvents}
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
          />
        </div>

        <div className="c-calendar-item c-calendar-item--bar">
          <p className="c-calendar-shop-type">Bar</p>
          <div className="c-calendar-header">
            <button
              className="c-calendar-header-btn c-calendar-header-prev-btn"
              onClick={() =>
                handlePrevMonthClick(calendarRef2, setCurrentDate2)
              }
            >
              <span className="c-calendar-icon material-symbols-outlined">
                chevron_left
              </span>{" "}
              {new Date(
                currentDate2.getFullYear(),
                currentDate2.getMonth() - 1,
                1
              ).toLocaleDateString("en-US", { month: "long" })}
            </button>
            <p className="c-calendar-header-month c-calendar-header-month--current">
              <span>
                {new Date(currentDate2).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
            <button
              className="c-calendar-header-btn c-calendar-header-next-btn"
              onClick={() =>
                handleNextMonthClick(calendarRef2, setCurrentDate2)
              }
            >
              {new Date(
                currentDate2.getFullYear(),
                currentDate2.getMonth() + 1,
                1
              ).toLocaleDateString("en-US", { month: "long" })}{" "}
              <span className="c-calendar-icon material-symbols-outlined">
                chevron_right
              </span>
            </button>
          </div>

          <FullCalendar
            ref={calendarRef2}
            initialDate={currentDate2}
            plugins={[dayGridPlugin, googleCalendarPlugin]}
            initialView="dayGridMonth"
            events={barEvents}
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
          />
        </div>
      </div>
    </>
  );
};

export default Calendar;
