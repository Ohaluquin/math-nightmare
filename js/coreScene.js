// coreScene.js — Escena base compartida (cámara, fondo, player básico)
// Requiere: motor2D.js, objects.js (Player), assets cargados en this.game.assets

(function () {
  class CoreScene extends Scene {
    constructor(game, nivelIndex = 0) {
      super(game);

      // Estado básico
      this.player = null;
      this.nivelIndex = nivelIndex;

      // Datos de nivel (si existen)
      const niveles = typeof NIVELES !== "undefined" ? NIVELES : null;
      this.nivelData = niveles && niveles[nivelIndex] ? niveles[nivelIndex] : {};

      // Ancho del nivel (fallback: 11 pantallas)
      this.levelWidth =
        this.nivelData.longitudNivel || 11 * this.game.canvas.width;

      // Fondo (parallax suave)
      const bgBase =
        this.game.assets.getImage("mn_bg_arit") ||
        this.game.assets.getImage("mn_bg");

      this.backgroundImage = bgBase || null;
      this.bgReady = !!bgBase;
      this.bgSpeedFactor = 0.5;
      this.bgWidth = 0;
      this.bgScale = 1;

      if (bgBase) {
        this.bgScale = (this.game.canvas.height) / bgBase.height; // 100%
        this.bgWidth = 3 * bgBase.width;
      }

      this.bgOffsetX = -200;
      this.bgOffsetY = 0;
    }

    // -------------------------------------------------------------------
    // Inicialización común
    // -------------------------------------------------------------------
    init() {
      // Crear player por defecto si la escena no lo ha creado
      if (!this.player) {        
        this.player = new Player(0, 350);                
        this.add(this.player, "actors", "player");
      }

      // Configurar cámara para seguir al jugador
      const margin = this.camera.width * 0.13;
      this.camera.setBounds(0, 0, this.levelWidth, this.game.canvas.height);
      this.camera.follow(this.player, 0.1, margin, 0, false, true);

      // HUD básico: aquí no reseteamos score, Player.update ya lo maneja.
      const scoreDisplay = document.getElementById("score");
      if (scoreDisplay) {
        // Podrías poner un texto inicial si quieres        
      }
    }

    // -------------------------------------------------------------------
    // Ciclo principal
    // -------------------------------------------------------------------
    update(dt) {
      // Lógica común de sprites, input, etc.
      super.update(dt);

      // Parallax del fondo según la cámara
      if (this.bgReady && this.backgroundImage) {
        const cam = this.camera;
        this.bgOffsetX = -cam.x * this.bgSpeedFactor;
      }
    }

    draw(ctx) {
      // Dibujar fondo parallax (si existe)
      if (this.bgReady && this.backgroundImage) {
        const img = this.backgroundImage;
        const scale = this.bgScale;
        const imgW = img.width * scale;
        const imgH = img.height * scale;

        // Repetir la imagen a lo largo del ancho de la cámara
        const startX = Math.floor(this.bgOffsetX % imgW) - imgW;
        const baseY = this.game.canvas.height - imgH;

        for (let x = startX; x < this.camera.width + imgW; x += imgW) {
          ctx.drawImage(img, x, baseY, imgW, imgH);
        }
      }

      // Luego, todas las layers (actors, fx, etc.)
      super.draw(ctx);
    }

    // Helper opcional para centrar cámara manualmente
    centerCameraOnPlayer() {
      if (!this.player) return;
      const cam = this.camera;
      const targetX = this.player.x - cam.width / 2;
      cam.x = Math.max(0, Math.min(targetX, this.levelWidth - cam.width));
    }
  }

  // Exportar al ámbito global
  window.CoreScene = CoreScene;
})();
