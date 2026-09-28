import { createRoot } from "react-dom/client";
import Calendar from "./components/Calendar";
import "./App.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Calendar />);
