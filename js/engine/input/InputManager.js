(function (global) {
  class InputManager {
    constructor(canvas) {
      this.keys = {};
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
          this.keys[e.key] = true;
          this.keys[e.code] = true;
        },
        opts
      );

      window.addEventListener(
        "keyup",
        (e) => {
          if (BLOCK.has(e.key) || BLOCK.has(e.code)) e.preventDefault();
          this.keys[e.key] = false;
          this.keys[e.code] = false;
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
    }

    isDown(key) {
      return !!this.keys[key];
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

    update() {}
  }

  global.InputManager = global.InputManager || InputManager;
})(window);

