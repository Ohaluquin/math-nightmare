// router.js – Enrutador de escenas para Math Nightmare
(function () {
  class SceneRouter {
    constructor(game) {
      this.game = game;
      this.stack = [];
      this._id = 0;
    }

    _findKeyByValue(scene) {
      const sm = this.game.sceneManager;
      for (const [k, v] of Object.entries(sm.scenes)) {
        if (v === scene) return k;
      }
      return null;
    }

    // Apila una escena nueva
    push(name, scene) {
      const sm = this.game.sceneManager;
      if (sm.current) {
        const currentName =
          this._findKeyByValue(sm.current) || `__anon_${this._id++}`;
        this.stack.push({ name: currentName, scene: sm.current });
      }
      const key = name || `scene_${this._id++}`;
      sm.register(key, scene);
      sm.switch(key);
      return key;
    }

    // Vuelve a la escena anterior
    pop() {
      const sm = this.game.sceneManager;
      const prev = this.stack.pop();
      if (!prev) return;
      const key = this._findKeyByValue(prev.scene) || prev.name;
      if (!sm.scenes[key]) sm.register(key, prev.scene);
      sm.switch(key);
    }

    // Reemplaza la escena actual (sin tocar la pila)
    replace(name, scene) {
      const sm = this.game.sceneManager;
      const key = name || `scene_${this._id++}`;
      sm.register(key, scene);
      sm.switch(key);
      return key;
    }

    // ---------- NOVELA ----------
    pushNovela(story, assets, opts = {}) {
      const router = this;

      // ✅ Evento único por instancia (evita colisiones y "acumulación")
      const novelaEvent = `novela:end:${Date.now()}_${Math.random()}`;
      let ended = false;

      // Guardamos un "handle" para poder cerrar la novela desde fuera (skipMode exit)
      this._currentNovela = this._currentNovela || null;

      // Subclase que detecta cuándo terminó la novela
      class NovelaSceneMN extends NovelaScene {
        constructor(game, story, assets, options = {}) {
          super(game, story, assets, options); // ✅ pasar opciones a Novela
          this._finished = false;
        }
        gotoNextNarrative() {
          super.gotoNextNarrative();
          const box = document.getElementById("dialog-box");
          if (box && box.classList.contains("hidden") && !this._finished) {
            this._finished = true;
            try {
              router.game.events.emit(novelaEvent); // ✅ evento único
            } catch (_) {}
          }
        }
      }

      const scene = new NovelaSceneMN(this.game, story, assets, opts);
      const key = this.push("novela", scene);

      const off = this.game.events.on(novelaEvent, () => {
        if (ended) return;
        ended = true;
        off();

        // Limpiar handle actual si coincide
        if (this._currentNovela && this._currentNovela.key === key) {
          this._currentNovela = null;
        }

        // 1) volvemos a la escena anterior
        this.pop();

        // 2) ejecutamos callback opcional
        if (typeof opts.onExit === "function") {
          opts.onExit();
        }
      });

      // ✅ método para salir anticipadamente sin dejar listeners colgados
      this._currentNovela = {
        key,
        end: () => this.game.events.emit(novelaEvent), // dispara el mismo flujo de fin
        off,
      };

      return key;
    }

    // ✅ Nuevo: cierre explícito (lo que tu NovelaScene ya intenta llamar)
    popNovela() {
      const cur = this._currentNovela;
      if (!cur) {
        // fallback: al menos intenta pop normal
        this.pop();
        return;
      }
      // dispara fin de novela de forma segura (limpia listener + pop + onExit)
      try {
        cur.end();
      } catch (_) {
        try {
          cur.off?.();
        } catch (_) {}
        this._currentNovela = null;
        this.pop();
      }
    }
  }

  window.SceneRouter = SceneRouter;
})();
