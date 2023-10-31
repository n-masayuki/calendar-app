import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import googleCalendarPlugin from "@fullcalendar/google-calendar";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  // const today = useMemo(() => new Date(), []);

  // // 今月の最初の日を取得
  // const firstDayOfCurrentMonth = useMemo(
  //   () => new Date(today.getFullYear(), today.getMonth(), 1),
  //   [today]
  // );

  // // 前の月の日付を計算
  // const prevMonth = useMemo(() => {
  //   const prevMonthDate = new Date(
  //     today.getFullYear(),
  //     today.getMonth() - 1,
  //     1
  //   );
  //   const options = { month: "2-digit" };
  //   return prevMonthDate.toLocaleDateString("en-US", options);
  // }, [today]);

  // // 次の月の日付を計算
  // const nextMonth = useMemo(() => {
  //   const nextMonthDate = new Date(
  //     today.getFullYear(),
  //     today.getMonth() + 1,
  //     1
  //   );
  //   const options = { month: "2-digit" };
  //   return nextMonthDate.toLocaleDateString("en-US", options);
  // }, [today]);

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

        // japaneseHolidaysをカレンダーのイベントに追加
        const allEvents = [
          ...googleCalendarEvents,
          ...recurringHolidays,
          ...japaneseHolidays,
        ];

        setEvents(allEvents);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchGoogleCalendarEvents();
  }, []);

  // const handleCalendarPrevNextClick = (info) => {
  //   const newDate = info.view.currentStart;
  //   const options = { year: "numeric", month: "long" };
  //   const newMonth = newDate.toLocaleDateString("en-US", options);
  //   // ここで新しい月をセットするか、APIを呼び出して新しいイベントを取得するなどの処理を行います。

  //   console.log("新しい月:", newMonth);
  // };

  const handlePrevMonthClick = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
    calendarRef.current.getApi().gotoDate(newDate);
  };

  const handleNextMonthClick = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
    calendarRef.current.getApi().gotoDate(newDate);
  };

  return (
    <>
      <div>
        <button onClick={handlePrevMonthClick}>
          ＜{" "}
          {new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            1
          ).toLocaleDateString("en-US", { month: "long" })}
        </button>
        <span>
          {new Date(currentDate).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button onClick={handleNextMonthClick}>
          {new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            1
          ).toLocaleDateString("en-US", { month: "long" })}{" "}
          ＞
        </button>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, googleCalendarPlugin]}
        initialView="dayGridMonth"
        events={events}
        // headerToolbar={{
        //   left: "shopNameButton,prev",
        //   center: "title",
        //   right: "next",
        // }}
        footerToolbar={{
          right: "noteButton",
        }}
        // titleFormat={{
        //   year: "numeric",
        //   month: "long",
        // }}
        customButtons={{
          // shopNameButton: {
          //   text: "BAR",
          // },
          noteButton: {
            text: "定休・臨時休業日",
          },
        }}
        datesSet={(info) => {
          setCurrentDate(info.view.currentStart);
        }}
      />
    </>
  );
};

export default Calendar;
