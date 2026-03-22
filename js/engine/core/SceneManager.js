(function (global) {
  class SceneManager {
    constructor(game) {
      this.game = game;
      this.scenes = {};
      this.current = null;
      this.currentKey = null;
      this._prevEscapeDown = false;
    }

    register(name, scene) {
      this.scenes[name] = scene;
      scene.game = this.game;
      scene._sceneKey = name;
    }

    switch(name) {
      if (this.current && this.current.destroy) this.current.destroy();
      const next = this.scenes[name];
      if (!next) {
        console.warn(`[SceneManager] Escena no registrada: "${name}"`);
        return false;
      }
      this.current = next;
      this.currentKey = name;
      if (this.current.init) this.current.init();
      return true;
    }

    update(dt) {
      if (!this.current) return;

      const escapeDown = !!this.game?.input?.isDown?.("Escape");
      const escapePressed = escapeDown && !this._prevEscapeDown;
      this._prevEscapeDown = escapeDown;

      if (escapePressed && this._shouldReturnToOverworld(this.current)) {
        window.MN_APP?.toOverworld?.();
        return;
      }

      this.current.update(dt);
    }

    _shouldReturnToOverworld(scene) {
      const key = scene?._sceneKey || this.currentKey || "";
      if (!key) return false;
      if (key === "title" || key === "novela") return false;
      return !key.startsWith("overworld");
    }
  }

  global.SceneManager = global.SceneManager || SceneManager;
})(window);
