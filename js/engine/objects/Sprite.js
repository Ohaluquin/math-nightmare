(function (global) {
  class Sprite {
    constructor(x, y, width, height, color = "black") {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
      this.vx = 0;
      this.vy = 0;
      this.gravity = 0;
      this.friction = 0;
      this.onGround = false;
      this.animations = {};
      this.currentAnim = null;
      this.collisions = { top: false, bottom: false, left: false, right: false };
      this.collisionBox = {
        x,
        y,
        width,
        height,
        offset: { x: 0, y: 0 },
      };
    }

    addAnimation(name, opts) {
      this.animations[name] = new global.Animation(opts);
    }

    play(name, reset = false) {
      if (this.currentAnim !== name) {
        this.currentAnim = name;
        if (reset) this.animations[name]?.reset();
      }
    }

    _updateAnimation(dt) {
      if (this.currentAnim) this.animations[this.currentAnim].update(dt);
    }

    update(dt) {
      this.vy += this.gravity * dt;

      this.x += this.vx * dt;
      this._handleHorizontalCollisions();

      this.y += this.vy * dt;
      this._handleVerticalCollisions();

      const f = Math.exp(-this.friction * dt);
      this.vx *= f;
      this.vy *= f;

      this._updateAnimation(dt);
    }

    _checkCollision(other) {
      const r1 = {
        x: this.x + this.collisionBox.offset.x,
        y: this.y + this.collisionBox.offset.y,
        w: this.collisionBox.width,
        h: this.collisionBox.height,
      };
      const r2 = other.collisionBox
        ? {
            x: other.x + other.collisionBox.offset.x,
            y: other.y + other.collisionBox.offset.y,
            w: other.collisionBox.width,
            h: other.collisionBox.height,
          }
        : { x: other.x, y: other.y, w: other.width, h: other.height };

      const collision = { top: false, bottom: false, left: false, right: false, hit: false };

      if (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
      ) {
        collision.hit = true;

        const dx = r1.x + r1.w / 2 - (r2.x + r2.w / 2);
        const dy = r1.y + r1.h / 2 - (r2.y + r2.h / 2);
        const wy = (r1.w + r2.w) / 2;
        const hx = (r1.h + r2.h) / 2;

        if (Math.abs(dx) <= wy && Math.abs(dy) <= hx) {
          const wyDy = wy * dy;
          const hxDx = hx * dx;

          if (wyDy > hxDx) {
            if (wyDy > -hxDx) collision.top = true;
            else collision.right = true;
          } else {
            if (wyDy > -hxDx) collision.left = true;
            else collision.bottom = true;
          }
        }
      }
      return collision;
    }

    collidesWith(other) {
      return this._intersects(other);
    }

    _intersects(other) {
      const r1x = this.x + this.collisionBox.offset.x;
      const r1y = this.y + this.collisionBox.offset.y;
      const r1w = this.collisionBox.width;
      const r1h = this.collisionBox.height;

      const r2x = other.collisionBox ? other.x + other.collisionBox.offset.x : other.x;
      const r2y = other.collisionBox ? other.y + other.collisionBox.offset.y : other.y;
      const r2w = other.collisionBox ? other.collisionBox.width : other.width;
      const r2h = other.collisionBox ? other.collisionBox.height : other.height;

      return r1x < r2x + r2w && r1x + r1w > r2x && r1y < r2y + r2h && r1y + r1h > r2y;
    }

    _handleHorizontalCollisions() {
      const oldX = this.x;
      this.collisions.left = this.collisions.right = false;

      if (!this.scene) return;

      for (const obj of this.scene.objects) {
        if (obj !== this && obj.collidesWith) {
          const col = this._checkCollision(obj);
          if (!col.hit) continue;
          if (col.left && this.vx > 0) {
            this.x = oldX;
            this.collisions.right = true;
            this.vx = 0;
          }
          if (col.right && this.vx < 0) {
            this.x = oldX;
            this.collisions.left = true;
            this.vx = 0;
          }
        }
      }
    }

    _handleVerticalCollisions() {
      const oldY = this.y;
      this.collisions.top = this.collisions.bottom = false;
      this.onGround = false;

      if (!this.scene) return;

      for (const obj of this.scene.objects) {
        if (obj !== this && obj.collidesWith) {
          const col = this._checkCollision(obj);
          if (!col.hit) continue;
          if (col.top && this.vy > 0) {
            this.y = oldY;
            this.collisions.bottom = true;
            this.vy = 0;
            this.onGround = true;
          }
          if (col.bottom && this.vy < 0) {
            this.y = oldY;
            this.collisions.top = true;
            this.vy = 0;
          }
        }
      }
    }

    draw(ctx) {
      if (!this.image) return;
      const scale = this.getVisualScale();
      const rect = this.getVisualRect(scale);
      if (this.currentAnim) {
        const { x, y, w, h } = this.animations[this.currentAnim].frame;
        ctx.drawImage(this.image, x, y, w, h, rect.x, rect.y, rect.width, rect.height);
      } else {
        ctx.drawImage(this.image, rect.x, rect.y, rect.width, rect.height);
      }
    }

    getVisualScale() {
      if (typeof this.visualScale === "number" && Number.isFinite(this.visualScale)) {
        return this.visualScale;
      }
      const sceneScale = this.scene?.getEntityDepthScale?.(this);
      if (typeof sceneScale === "number" && Number.isFinite(sceneScale)) {
        return sceneScale;
      }
      return 1;
    }

    getVisualRect(scale = this.getVisualScale()) {
      const safeScale = Math.max(0.01, scale);
      const drawWidth = this.width * safeScale;
      const drawHeight = this.height * safeScale;
      return {
        x: this.x + (this.width - drawWidth) / 2,
        y: this.y + (this.height - drawHeight),
        width: drawWidth,
        height: drawHeight,
      };
    }

    setCollisionBox(width, height, offsetX = 0, offsetY = 0) {
      this.collisionBox.width = width;
      this.collisionBox.height = height;
      this.collisionBox.offset.x = offsetX;
      this.collisionBox.offset.y = offsetY;
    }

    setGravity(gravity) {
      this.gravity = gravity;
    }

    setFriction(friction) {
      this.friction = friction;
    }

    moveLeft(speed) {
      this.vx = -speed;
    }

    moveRight(speed) {
      this.vx = speed;
    }

    jump(force) {
      if (this.onGround) {
        this.vy = -force;
        this.onGround = false;
      }
    }

    stopMovement() {
      this.vx = 0;
      this.vy = 0;
    }

    get debug() {
      return this._debug;
    }

    set debug(value) {
      this._debug = value;
    }
  }

  global.Sprite = global.Sprite || Sprite;
})(window);
