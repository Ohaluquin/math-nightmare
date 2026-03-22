(function (global) {
  class Animation {
    constructor({ frames, fps = 12, loop = true }) {
      this.frames = frames;
      this.fps = fps;
      this.loop = loop;
      this.index = 0;
      this._elapsed = 0;
      this._delay = 1 / fps;
    }

    update(dt) {
      this._elapsed += dt;
      while (this._elapsed >= this._delay) {
        this._elapsed -= this._delay;
        this.index++;
        if (this.index >= this.frames.length) {
          this.index = this.loop ? 0 : this.frames.length - 1;
        }
      }
    }

    reset() {
      this.index = 0;
      this._elapsed = 0;
    }

    get frame() {
      return this.frames[this.index];
    }
  }

  // Evita colisión con la API nativa `window.Animation` del navegador.
  // Guardamos referencia nativa por si se necesita en el futuro.
  if (!global.__MN_NATIVE_Animation) {
    global.__MN_NATIVE_Animation = global.Animation;
  }
  global.MNAnimation = Animation;
  global.Animation = Animation;
})(window);
