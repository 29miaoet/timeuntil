// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import Menu from "./menu";

describe("Menu class", () => {
  let button: HTMLElement;
  let menuElement: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="test-btn" aria-expanded="false">Toggle</button>
      <div id="test-menu" hidden>
        <ul>
          <li>
            <input type="checkbox" id="check-1" />
            <span aria-label="Item 1">Item 1</span>
          </li>
        </ul>
      </div>
      <div id="outside-area">Outside</div>
    `;

    button = document.querySelector("#test-btn") as HTMLElement;
    menuElement = document.querySelector("#test-menu") as HTMLElement;
  });

  it("throws MenuError if button or menu selector does not match elements", () => {
    expect(() => new Menu("#missing-btn", "#test-menu")).toThrow(
      "Bad button selector #missing-btn"
    );
    expect(() => new Menu("#test-btn", "#missing-menu")).toThrow("Bad menu selector #missing-menu");
  });

  it("returns the corresponding button and menu elements via getters", () => {
    const menuInstance = new Menu("#test-btn", "#test-menu");
    expect(menuInstance.button).toBe(button);
    expect(menuInstance.menu).toBe(menuElement);
  });

  it("toggles hidden and open states on button click", () => {
    const menuInstance = new Menu("#test-btn", "#test-menu");
    menuInstance.addExpandCollapse();

    // Click to open
    button.click();
    expect(menuElement.hidden).toBe(false);
    expect(button.classList.contains("open")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");

    // Click to close
    button.click();
    expect(menuElement.hidden).toBe(true);
    expect(button.classList.contains("open")).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("collapses menu when clicking outside", () => {
    const menuInstance = new Menu("#test-btn", "#test-menu");
    menuInstance.addExpandCollapse();

    button.click();
    expect(menuElement.hidden).toBe(false);

    const outsideArea = document.querySelector("#outside-area") as HTMLElement;
    outsideArea.click();

    expect(menuElement.hidden).toBe(true);
    expect(button.classList.contains("open")).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("executes registered callback on menu interaction", () => {
    let clicked = false;
    const menuInstance = new Menu("#test-btn", "#test-menu");
    menuInstance.addFunction((event) => {
      clicked = true;
    });

    menuElement.click();
    expect(clicked).toBe(true);
  });
});
