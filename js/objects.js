// game.js - version limpia y unificada (requiere motor2D.js)
// -----------------------------------------------------------------------------
// NOTA: este archivo asume que las clases Game, Scene, Sprite, etc. del motor2D
// ya estan disponibles en el ambito global (cargadas desde motor2D.js).

/* --------------------------------------------------------------------------- */
/*  CONFIGURACION GLOBAL                                                       */
/* --------------------------------------------------------------------------- */
const KEY_LEFT = "ArrowLeft";
const KEY_RIGHT = "ArrowRight";
const KEY_UP = "ArrowUp";
const KEY_DOWN = "ArrowDown";
const gameState = {
  gameOver: false,
  win: false,
};

/* --------------------------------------------------------------------------- */
/* 1. CLASE PLAYER                                                             */
/* --------------------------------------------------------------------------- */
class Player extends Sprite {
  constructor(x = 0, y = 0) {
    super(x, y, 120, 120, "#ffffff00");

    this.speed = 5;
    this.score = 0;
    this.lives = 3;
    this.zoom = 1;
    this.moving = false;

    /* Estado */
    this.state = "idle"; // idle | walk | dead
    this.facing = "right";
    this.isDying = false;
    this.deathAnimationComplete = false;

    // Nuevo: animaciones con motor2D
    this._animsReady = false;
    this._stateImage = {}; // state -> Image

    const footH = 18;
    const footW = Math.floor(this.width * 0.45);
    this.setCollisionBox(
      footW,
      footH,
      Math.floor((this.width - footW) / 2),
      this.height - footH
    );
  }

  /* ----------------- Helpers para sheets ----------------- */

  _getImg(key) {
    const A = this.scene?.game?.assets;
    if (!A || typeof A.getImage !== "function") return null;
    const img = A.getImage(key);
    if (img) return img;
    return null;
  }

  _gridFrames(img, rows, cols) {
    // Asumimos que ya esta cargada (AssetLoader la cargo antes de entrar a la escena)
    const fw = img.width / cols;
    const fh = img.height / rows;
    const frames = [];
    for (let i = 0; i < rows * cols; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      frames.push({ x: c * fw, y: r * fh, w: fw, h: fh });
    }
    return frames;
  }

  _ensureAnimations() {
    if (this._animsReady) return;

    const idleImg = this._getImg("pl_idle");
    const walkImg = this._getImg("pl_walk");
    const deadImg = this._getImg("pl_dead");

    // Si todavia no estan cargadas, salimos y reintentamos en el siguiente update/draw
    if (!idleImg || !walkImg || !deadImg) return;

    const def = {
      idle: { img: idleImg, rows: 3, cols: 7, fps: 12, loop: true },
      walk: { img: walkImg, rows: 3, cols: 6, fps: 14, loop: true },
      dead: { img: deadImg, rows: 3, cols: 4, fps: 10, loop: false },
    };

    for (const [name, d] of Object.entries(def)) {
      const frames = this._gridFrames(d.img, d.rows, d.cols);
      this.addAnimation(name, { frames, fps: d.fps, loop: d.loop });
      this._stateImage[name] = d.img;
    }

    this._setState("idle", true);
    this._animsReady = true;
  }

  _setState(name, reset = false) {
    if (!this._animsReady) return;
    const img = this._stateImage[name];
    if (img) this.image = img;
    this.play(name, reset);
    this.state = name;
  }

  /* ----------------------------------------------------------------------- */
  /*  Actualizacion                                                          */
  /* ----------------------------------------------------------------------- */
  update(dt) {
    this._ensureAnimations();

    const input = this.scene.game.input;
    this.prevX = this.x;
    this.prevY = this.y;

    let moving = false;

    if (this.isDying) {
      if (this.currentAnim) this.animations[this.currentAnim]?.update(dt);

      const anim = this.animations.dead;
      if (anim && !anim.loop && anim.index === anim.frames.length - 1) {
        this.deathAnimationComplete = true;
        this.scene._gameOver();
      }
      return;
    }

    if (this.lives <= 0 && !this.isDying) {
      this.isDying = true;
      this._setState("dead", true);
      return;
    }

    if (input.isDown(KEY_LEFT) && this.x > 0) {
      this.x -= this.speed;
      this.facing = "left";
      moving = true;
    }
    if (input.isDown(KEY_RIGHT) && this.x < 6000) {
      this.x += this.speed;
      this.facing = "right";
      moving = true;
    }
    if (input.isDown(KEY_UP) && this.y > 270) {
      this.y -= this.speed;
      moving = true;
    }
    if (input.isDown(KEY_DOWN) && this.y < 480) {
      this.y += this.speed;
      moving = true;
    }

    if (moving) this._setState("walk");
    else this._setState("idle");

    if (this.currentAnim) this.animations[this.currentAnim]?.update(dt);
  }

  draw(ctx) {
    if (!this._animsReady || !this.image || !this.currentAnim) return;

    const frame = this.animations[this.currentAnim].frame;
    if (!frame) return;

    const scale = this.getVisualScale() * this.zoom;
    const rect = this.getVisualRect(scale);

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height - 10,
      rect.width * 0.2,
      10,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (this.facing === "left") {
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.image,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        -rect.x - rect.width,
        rect.y,
        rect.width,
        rect.height
      );
    } else {
      ctx.drawImage(
        this.image,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        rect.x,
        rect.y,
        rect.width,
        rect.height
      );
    }

    ctx.restore();
  }
}

// === NPC - Entidad con interaccion (tecla E) ===
const INTERACT_KEY = "e";

class FootSprite extends Sprite {
  constructor(
    x,
    y,
    w = 60,
    h = 80,
    {
      color = "#55ccff",
      spriteKey = null,
      footWidthRatio = 0.55,
      footHeight = 18,
      footOffsetX = null,
      footOffsetY = null,
      shadowAlpha = 0.35,
      shadowScale = 0.4,
      shadowHeight = 8,
      shadowOffsetY = 6,
      blocksPlayer = true,
    } = {}
  ) {
    super(x, y, w, h, color);
    this.spriteKey = spriteKey;
    this.image = null;
    this.blocksPlayer = blocksPlayer;
    this.shadowAlpha = shadowAlpha;
    this.shadowScale = shadowScale;
    this.shadowHeight = shadowHeight;
    this.shadowOffsetY = shadowOffsetY;

    const footH = Math.max(1, footHeight | 0);
    const footW = Math.max(1, Math.floor(this.width * footWidthRatio));
    this.setCollisionBox(
      footW,
      footH,
      footOffsetX == null ? Math.floor((this.width - footW) / 2) : footOffsetX,
      footOffsetY == null ? this.height - footH : footOffsetY,
    );
  }

  _ensureImage() {
    if (!this.image && this.spriteKey && this.scene?.game?.assets) {
      this.image = this.scene.game.assets.getImage(this.spriteKey);
    }
  }

  _drawShadow(ctx, rect) {
    ctx.fillStyle = `rgba(0, 0, 0, ${this.shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height - this.shadowOffsetY,
      rect.width * this.shadowScale,
      this.shadowHeight,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  draw(ctx) {
    this._ensureImage();
    const scale = this.getVisualScale();
    const rect = this.getVisualRect(scale);

    ctx.save();
    this._drawShadow(ctx, rect);

    if (this.image) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(this.image, rect.x, rect.y, rect.width, rect.height);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    ctx.restore();
  }
}

class NPC extends FootSprite {
  constructor(
    x,
    y,
    w = 60,
    h = 80,
    {
      name = "NPC",
      color = "#55ccff",
      spriteKey = null,
      onInteract = null,
      getLabelInfo = null,
      ...rest
    } = {}
  ) {
    super(x, y, w, h, { color, spriteKey, ...rest });
    this.name = name;
    this.onInteract = onInteract;
    this.getLabelInfo = getLabelInfo;
    this.promptVisible = false;
  }

  update(dt) {
    const player = this.scene?.player;
    if (!player) return;

    const inflate = 16;
    const near = !(
      player.x > this.x + this.width + inflate ||
      player.x + player.width < this.x - inflate ||
      player.y > this.y + this.height + inflate ||
      player.y + player.height < this.y - inflate
    );

    this.promptVisible = near;

    const hud = document.getElementById("hint");
    if (hud) {
      hud.textContent = near ? `Pulsa "E" para hablar con ${this.name}` : "";
    }

    if (near && this.scene.game.input.isDown(INTERACT_KEY)) {
      if (typeof this.onInteract === "function") {
        this.onInteract(this, player, this.scene);
      }
    }
  }

  draw(ctx) {
    super.draw(ctx);
    const rect = this.getVisualRect();
    this._drawNameplate(ctx, rect);
  }

  _drawNameplate(ctx, rect) {
    const labelInfo =
      typeof this.getLabelInfo === "function" ? this.getLabelInfo(this) || {} : {};
    const title = labelInfo.title || this.name;
    const subtitle = labelInfo.subtitle || "";
    const leafTotal = Math.max(0, labelInfo.leafTotal | 0);
    const leafEarned = Math.max(0, Math.min(leafTotal, labelInfo.leafEarned | 0));
    const leafDisplayMode = labelInfo.leafDisplayMode || "default";
    const centerX = this.x + this.width / 2;
    const panelPadX = 10;
    const hasExtendedLeafRow = leafDisplayMode === "iconsOnly" && subtitle && leafTotal > 0;
    const panelY = rect.y - (hasExtendedLeafRow ? 54 : subtitle || leafTotal ? 40 : 28);
    const panelH = hasExtendedLeafRow ? 48 : subtitle || leafTotal ? 34 : 22;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 14px Georgia";
    const titleWidth = ctx.measureText(title).width;

    ctx.font = "11px Arial";
    const subtitleWidth = subtitle ? ctx.measureText(subtitle).width : 0;
    const leafBlockWidth = leafTotal > 0 ? leafTotal * 15 - 3 : 0;
    const contentWidth = Math.max(titleWidth, subtitleWidth, leafBlockWidth);
    const panelW = Math.max(74, Math.ceil(contentWidth + panelPadX * 2));
    const panelX = centerX - panelW / 2;

    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "rgba(8, 12, 18, 0.86)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(244, 224, 163, 0.95)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    ctx.fillStyle = "#fff7df";
    ctx.font = "bold 14px Georgia";
    ctx.fillText(title, centerX, panelY + 10);

    if (subtitle || leafTotal) {
      if (subtitle) {
        ctx.fillStyle = "#d6e1ef";
        ctx.font = "11px Arial";
        ctx.fillText(subtitle, centerX, panelY + 24);
      }

      if (leafTotal > 0) {
        const leafImg = this.scene?.game?.assets?.getImage?.("ui_leaf");
        const iconSize = 12;
        const gap = 3;
        const totalWidth = leafTotal * iconSize + (leafTotal - 1) * gap;
        const startX = centerX - totalWidth / 2;
        const iconY = hasExtendedLeafRow ? panelY + 31 : panelY + 18;

        for (let i = 0; i < leafTotal; i++) {
          const earned = i < leafEarned;
          const x = startX + i * (iconSize + gap);
          if (leafImg) {
            if (earned) {
              ctx.drawImage(leafImg, x, iconY, iconSize, iconSize);
            } else if (leafDisplayMode === "iconsOnly") {
              const silhouette = this._getLeafSilhouetteImage(leafImg, iconSize);
              ctx.drawImage(silhouette, x, iconY, iconSize, iconSize);
            } else {
              ctx.save();
              ctx.globalAlpha = 0.3;
              ctx.drawImage(leafImg, x, iconY, iconSize, iconSize);
              ctx.restore();
            }
          } else {
            ctx.fillStyle = earned ? "#b6ff84" : "rgba(182,255,132,0.28)";
            ctx.beginPath();
            ctx.arc(x + iconSize / 2, iconY + iconSize / 2, iconSize / 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  }

  _getLeafSilhouetteImage(leafImg, iconSize) {
    NPC._leafSilhouetteCache = NPC._leafSilhouetteCache || new WeakMap();
    let sizeCache = NPC._leafSilhouetteCache.get(leafImg);
    if (!sizeCache) {
      sizeCache = new Map();
      NPC._leafSilhouetteCache.set(leafImg, sizeCache);
    }

    if (sizeCache.has(iconSize)) {
      return sizeCache.get(iconSize);
    }

    const canvas = document.createElement("canvas");
    canvas.width = iconSize;
    canvas.height = iconSize;
    const iconCtx = canvas.getContext("2d");

    iconCtx.drawImage(leafImg, 0, 0, iconSize, iconSize);
    iconCtx.globalCompositeOperation = "source-in";
    iconCtx.fillStyle = "rgba(214, 225, 239, 0.38)";
    iconCtx.fillRect(0, 0, iconSize, iconSize);

    sizeCache.set(iconSize, canvas);
    return canvas;
  }
}

class WorldObject extends FootSprite {
  constructor(
    x,
    y,
    w = 60,
    h = 80,
    {
      name = "Objeto",
      color = "#8a6f53",
      spriteKey = null,
      shadowAlpha = 0,
      ...rest
    } = {},
  ) {
    super(x, y, w, h, { color, spriteKey, shadowAlpha, ...rest });
    this.name = name;
  }
}

window.WorldObject = window.WorldObject || WorldObject;
