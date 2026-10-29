import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Dropdown } from "osrs-sdk-react";

const MENU_WIDTH = 150;
const SQUEEZED_WIDTH = 61;

function openedMenuLeft(triggerLeft: number): string {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const width = jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.style.position === "fixed" ? MENU_WIDTH : SQUEEZED_WIDTH;
  });
  const box = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: triggerLeft,
    y: 100,
    left: triggerLeft,
    top: 100,
    right: triggerLeft + 44,
    bottom: 144,
    width: 44,
    height: 44,
    toJSON: () => ({}),
  });
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  try {
    act(() =>
      root.render(
        <Dropdown trigger="slot">
          <button type="button">Empty</button>
        </Dropdown>,
      ),
    );
    const trigger = container.querySelector("button");
    if (!trigger) throw new Error("no trigger");
    act(() => trigger.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const menu = trigger.nextElementSibling;
    if (!(menu instanceof HTMLElement)) throw new Error("no menu");
    return menu.style.left;
  } finally {
    width.mockRestore();
    box.mockRestore();
    act(() => root.unmount());
    container.remove();
  }
}

describe("Dropdown", () => {
  test("opens its menu right of the trigger when it fits, and left of it at the window's right edge, by the width it opens at", () => {
    expect({ room: openedMenuLeft(100), edge: openedMenuLeft(1200) }).toEqual({
      room: "148px",
      edge: `${1200 - 4 - MENU_WIDTH}px`,
    });
  });
});
