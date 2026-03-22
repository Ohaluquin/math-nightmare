(function (global) {
  class Game {
    constructor(canvasId, width, height, fps = 60) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext("2d");
      this.canvas.width = width;
      this.canvas.height = height;
      this.fps = fps;
      this.interval = 1000 / fps;
      this.accumulator = 0;
      this.lastTime = 0;
      this.sceneManager = new global.SceneManager(this);
      this.input = new global.InputManager(this.canvas);
      this.assets = new global.AssetLoader();
      this._boundLoop = this.loop.bind(this);
      this.paused = false;
      this.zoom = 1;
      this.events = new global.EventEmitter();
      this.maxSubSteps = 5;
      this.maxFrameTime = 250;
    }

    async start(assetList = []) {
      if (assetList.length) {
        await Promise.all(assetList.map((a) => this.assets.loadAsset(a)));
      }
      this.lastTime = performance.now();
      requestAnimationFrame(this._boundLoop);
    }

    loop(timestamp) {
      if (this.paused) return;
      const frameTime = Math.min(timestamp - this.lastTime, this.maxFrameTime);
      this.lastTime = timestamp;
      this.accumulator += frameTime;
      let subSteps = 0;

      while (this.accumulator >= this.interval && subSteps < this.maxSubSteps) {
        this.update(this.interval / 1000);
        this.accumulator -= this.interval;
        subSteps++;
      }
      if (subSteps === this.maxSubSteps) this.accumulator = 0;

      this.render();
      requestAnimationFrame(this._boundLoop);
    }

    update(dt) {
      this.input.update();
      this.sceneManager.update(dt);
    }

    render() {
      const scene = this.sceneManager.current;
      if (!scene) return;

      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.imageSmoothingEnabled = false;
      const camX = Math.round(scene.camera.x || 0);
      const camY = Math.round(scene.camera.y || 0);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.translate(-camX, -camY);
      scene.draw(this.ctx);
      this.ctx.restore();
    }

    pause() {
      this.paused = true;
    }

    resume() {
      if (!this.paused) return;
      this.paused = false;
      this.lastTime = performance.now();
      this.accumulator = 0;
      requestAnimationFrame(this._boundLoop);
    }

    setZoom(factor) {
      this.zoom = factor;
    }
  }

  global.Game = global.Game || Game;
})(window);
