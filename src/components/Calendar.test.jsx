import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Calendar from "./Calendar";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("loads calendar events with the existing environment names and changes month", async () => {
  vi.stubEnv("REACT_APP_GOOGLE_API_KEY", "test-api-key");
  vi.stubEnv("REACT_APP_GOOGLE_CALENDAR_ID", "test@example.com");
  vi.spyOn(console, "log").mockImplementation(() => {});
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
  const fetchMock = vi.fn(async (url) => ({
    ok: true,
    json: async () => String(url).includes("holidays-jp") ? {} : {
      items: [
        { id: "cafe", summary: "Cafe closed", start: { date } },
        { id: "bar", summary: "Bar closed", start: { date } },
      ],
    },
  }));
  vi.stubGlobal("fetch", fetchMock);
  const { container } = render(<Calendar />);
  expect(screen.getByText("カレンダーデータを読み込んでいます...")).toBeInTheDocument();
  await screen.findByText("Cafe closed");
  expect(screen.getByText("Bar closed")).toBeInTheDocument();
  expect(container.querySelector(".c-calendar-item--cafe")).toHaveTextContent("Cafe closed");
  expect(container.querySelector(".c-calendar-item--cafe")).not.toHaveTextContent("Bar closed");
  const request = new URL(fetchMock.mock.calls[0][0]);
  expect(request.searchParams.get("key")).toBe("test-api-key");
  expect(decodeURIComponent(request.pathname)).toContain("test@example.com");

  const header = container.querySelector(".c-calendar-item--cafe .c-calendar-header-month");
  const initialMonth = header.textContent;
  fireEvent.click(container.querySelector(".c-calendar-item--cafe .c-calendar-header-next-btn"));
  await waitFor(() => expect(header.textContent).not.toBe(initialMonth));
  fireEvent.click(container.querySelector(".c-calendar-item--cafe .c-calendar-header-prev-btn"));
  await waitFor(() => expect(header.textContent).toBe(initialMonth));
});

test("shows the existing error and retry UI when environment variables are missing", async () => {
  vi.stubEnv("REACT_APP_GOOGLE_API_KEY", "");
  vi.stubEnv("REACT_APP_GOOGLE_CALENDAR_ID", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<Calendar />);
  expect(await screen.findByText(/API key or calendar ID not provided/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "再試行する" })).toBeInTheDocument();
});
