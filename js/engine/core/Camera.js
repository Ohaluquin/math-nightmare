(function (global) {
  class Camera {
    constructor(x, y, width, height, game = null) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.target = null;
      this.bounds = null;
      this.followLerp = 0.1;
      this.lockX = false;
      this.lockY = false;
      this.offsetX = 0;
      this.offsetY = 0;
      this.game = game;
    }

    follow(
      target,
      lerp = 0.1,
      offsetX = 0,
      offsetY = 0,
      lockX = false,
      lockY = false
    ) {
      this.target = target;
      this.followLerp = lerp;
      this.offsetX = offsetX;
      this.offsetY = offsetY;
      this.lockX = lockX;
      this.lockY = lockY;
    }

    centerOn(target) {
      const zoom = this.game?.zoom || 1;
      const vw = this.game.canvas.width / zoom;
      const vh = this.game.canvas.height / zoom;
      this.offsetX = -vw / 2 + target.width / 2;
      this.offsetY = -vh / 2 + target.height / 2;
    }

    setBounds(minX, minY, maxX, maxY) {
      this.bounds = { minX, minY, maxX, maxY };
    }

    updateDimensionsFromZoom() {
      const zoom = this.game?.zoom || 1;
      this.width = this.game.canvas.width / zoom;
      this.height = this.game.canvas.height / zoom;
    }

    setDeadZone(factorX = 0.25, factorY = 0.25) {
      this.deadZoneX = this.width * factorX;
      this.deadZoneY = this.height * factorY;
    }

    update() {
      if (!this.target) return;

      const deadZoneX = this.deadZoneX ?? this.width * 0.25;
      const deadZoneY = this.deadZoneY ?? this.height * 0.25;

      const targetCenterX = this.target.x + this.target.width / 2;
      const targetCenterY = this.target.y + this.target.height / 2;

      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      let desiredX = this.x;
      let desiredY = this.y;

      if (!this.lockX) {
        if (targetCenterX < centerX - deadZoneX) {
          desiredX = this.x - (centerX - deadZoneX - targetCenterX) + this.offsetX;
        } else if (targetCenterX > centerX + deadZoneX) {
          desiredX = this.x + (targetCenterX - (centerX + deadZoneX)) + this.offsetX;
        }
      }

      if (!this.lockY) {
        if (targetCenterY < centerY - deadZoneY) {
          desiredY = this.y - (centerY - deadZoneY - targetCenterY) + this.offsetY;
        } else if (targetCenterY > centerY + deadZoneY) {
          desiredY = this.y + (targetCenterY - (centerY + deadZoneY)) + this.offsetY;
        }
      }

      this.x += (desiredX - this.x) * this.followLerp;
      this.y += (desiredY - this.y) * this.followLerp;

      if (this.bounds) {
        this.x = Math.max(this.bounds.minX, Math.min(this.x, this.bounds.maxX - this.width));
        this.y = Math.max(this.bounds.minY, Math.min(this.y, this.bounds.maxY - this.height));
      }
    }
  }

  global.Camera = global.Camera || Camera;
})(window);

