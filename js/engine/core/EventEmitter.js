(function (global) {
  class EventEmitter {
    constructor() {
      this._evt = {};
    }

    on(evt, fn) {
      (this._evt[evt] ||= []).push(fn);
      return () => this.off(evt, fn);
    }

    off(evt, fn) {
      const list = this._evt[evt];
      if (!list) return;
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    }

    emit(evt, ...args) {
      const list = this._evt[evt];
      if (list) [...list].forEach((cb) => cb(...args));
    }
  }

  global.EventEmitter = global.EventEmitter || EventEmitter;
})(window);

