// titleScene.js - Pantalla de titulo de Math Nightmare con efecto neon animado
(function () {
  class TitleScene extends Scene {
    constructor(game) {
      super(game);
      this.bgKey = "title_bg";
      this.bgImage = null;
      this.time = 0;
      this.neonIntensity = 1;
      this._flickerCooldown = 0;
      this._flickerFactor = 1;
    }

    init() {
      const assets = this.game.assets;

      if (assets && typeof assets.getImage === "function") {
        this.bgImage = assets.getImage(this.bgKey) || null;
      }
    }

    update(dt) {
      this.time += dt;

      const base = 0.75 + 0.25 * Math.sin(this.time * 3);

      if (this._flickerCooldown <= 0 && Math.random() < 0.04) {
        this._flickerCooldown = 0.18 + Math.random() * 0.12;
        this._flickerFactor = 0.2 + Math.random() * 0.5;
      }

      if (this._flickerCooldown > 0) {
        this._flickerCooldown -= dt;
        this.neonIntensity = Math.max(0.15, base * this._flickerFactor);
      } else {
        this.neonIntensity = base;
      }
    }

    draw(ctx) {
      const { canvas } = this.game;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (this.bgImage) {
        const scale = Math.max(w / this.bgImage.width, h / this.bgImage.height);
        const dw = this.bgImage.width * scale;
        const dh = this.bgImage.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(this.bgImage, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = "#101020";
        ctx.fillRect(0, 0, w, h);
      }

      const intensity = this.neonIntensity;
      const glow = 18 + 25 * intensity;

      ctx.save();
      ctx.textAlign = "center";
      ctx.shadowColor = `rgba(255, 70, 90, ${0.7 * intensity})`;
      ctx.shadowBlur = glow;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      const baseY = h * 0.1;
      ctx.font = "48px 'Impact', 'Arial Black', system-ui";
      ctx.lineWidth = 3;
      ctx.fillStyle = `rgba(255, 80, 80, ${0.4 * intensity})`;
      ctx.fillText("MATH NIGHTMARE", w / 2 + 15, baseY);
      ctx.restore();
    }
  }

  window.TitleScene = TitleScene;
})();
