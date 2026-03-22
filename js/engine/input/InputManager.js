(function (global) {
  class InputManager {
    constructor(canvas) {
      this.keys = {};
      this.physicalKeys = {};
      this.virtualKeys = {};
      this.mouse = { x: 0, y: 0, down: false };

      const BLOCK = new Set([
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        " ",
        "Space",
        "Spacebar",
      ]);
      const opts = { passive: false };

      window.addEventListener(
        "keydown",
        (e) => {
          if (BLOCK.has(e.key) || BLOCK.has(e.code)) e.preventDefault();
          if (e.repeat) return;
          this.physicalKeys[e.key] = true;
          this.physicalKeys[e.code] = true;
          this._syncKeyState(e.key);
          this._syncKeyState(e.code);
        },
        opts
      );

      window.addEventListener(
        "keyup",
        (e) => {
          if (BLOCK.has(e.key) || BLOCK.has(e.code)) e.preventDefault();
          this.physicalKeys[e.key] = false;
          this.physicalKeys[e.code] = false;
          this._syncKeyState(e.key);
          this._syncKeyState(e.code);
        },
        opts
      );

      canvas.addEventListener("mousedown", (e) => {
        this.mouse.down = true;
        this._setMousePos(e);
      });
      canvas.addEventListener("mouseup", (e) => {
        this.mouse.down = false;
        this._setMousePos(e);
      });
      canvas.addEventListener("mousemove", (e) => this._setMousePos(e));

      canvas.addEventListener("pointerdown", (e) => {
        this.mouse.down = true;
        this._setMousePos(e);
      });
      canvas.addEventListener("pointermove", (e) => this._setMousePos(e));
      canvas.addEventListener("pointerup", (e) => {
        this.mouse.down = false;
        this._setMousePos(e);
      });
      canvas.addEventListener("pointercancel", (e) => {
        this.mouse.down = false;
        this._setMousePos(e);
      });
      canvas.addEventListener("pointerleave", () => {
        this.mouse.down = false;
      });
    }

    isDown(key) {
      return !!this.keys[key] || !!this.virtualKeys[key];
    }

    setVirtualKey(key, isDown) {
      this.virtualKeys[key] = !!isDown;
      this._syncKeyState(key);
    }

    tapVirtualKeys(keys, duration = 120) {
      const list = Array.isArray(keys) ? keys : [keys];
      list.forEach((key) => this.setVirtualKey(key, true));
      window.setTimeout(() => {
        list.forEach((key) => this.setVirtualKey(key, false));
      }, duration);
    }

    _setMousePos(e) {
      const rect = e.target.getBoundingClientRect();
      const canvasWidth = e.target.width;
      const canvasHeight = e.target.height;
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      const scaleX = canvasWidth / displayWidth;
      const scaleY = canvasHeight / displayHeight;

      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    }

    _syncKeyState(key) {
      this.keys[key] = !!this.physicalKeys[key] || !!this.virtualKeys[key];
    }

    update() {}
  }

  global.InputManager = global.InputManager || InputManager;
})(window);
