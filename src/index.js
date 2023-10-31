import { createRoot } from "react-dom/client";
import Calendar from "./components/Calendar";
import "./App.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Calendar />);

// // 以下、一般公開しないファイル、チェック用
// console.log("API Key:", process.env.REACT_APP_GOOGLE_API_KEY);
// console.log("Calendar ID:", process.env.REACT_APP_GOOGLE_CALENDAR_ID);
