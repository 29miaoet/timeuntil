/**
 * Handles all menu operations, eliminates a lot of repeated code, has three
 * methods, addExpandCollapse, which takes no arguments, and adds events listeners
 * for expanding and collapsing the menu, and addFunction, which adds a callback
 * in response to a selection.
 */

class MenuError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MenuError";
  }
}

export default class Menu {
  private readonly _button: HTMLElement | null;
  private readonly _menu: HTMLElement | null;

  constructor(buttonSelector: string, menuSelector: string) {
    this._button = document.querySelector(buttonSelector);
    this._menu = document.querySelector(menuSelector);

    if (!this._button) {
      throw new MenuError(`Bad button selector ${buttonSelector}`);
    }

    if (!this._menu) {
      throw new MenuError(`Bad menu selector ${menuSelector}`);
    }
  }

  get button(): HTMLElement {
    if (this._button === null) {
      throw new MenuError("Button not found!");
    }
    return this._button;
  }

  get menu(): HTMLElement {
    if (this._menu === null) {
      throw new MenuError("Menu not found!");
    }
    return this._menu;
  }

  addExpandCollapse(): void {
    this.button.addEventListener("click", () => {
      if (this.menu.hidden) {
        this.menu.hidden = false;
        this.button.classList.add("open");
        this.button.setAttribute("aria-expanded", "true");
      } else {
        this.menu.hidden = true;
        this.button.classList.remove("open");
        this.button.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", (event) => {
      // Stop tsc from complaining
      const target = event.target as Node;
      if (!this.menu.contains(target) && !this.button.contains(target)) {
        this.menu.hidden = true;
        this.button.classList.remove("open");
        this.button.setAttribute("aria-expanded", "false");
      }
    });
  }

  addFunction(callback: (event: MouseEvent) => void): void {
    this.menu.addEventListener("click", (event) => callback(event));
  }
}
