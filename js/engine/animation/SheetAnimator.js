(function (global) {
  function makeGridAnim(img, rows, cols) {
    const fw = img.width / cols;
    const fh = img.height / rows;
    const frames = [];
    for (let i = 0; i < rows * cols; i++) {
      frames.push({
        x: (i % cols) * fw,
        y: Math.floor(i / cols) * fh,
        w: fw,
        h: fh,
      });
    }
    return frames;
  }

  class SheetAnimator {
    constructor(sprite, assets, def) {
      this.sprite = sprite;
      this.assets = assets;
      this.def = def;
      this.anims = {};

      for (const [name, d] of Object.entries(def)) {
        const img = assets.getImage(d.key);
        if (!img) {
          console.warn("[SheetAnimator] Imagen no encontrada:", d.key);
          continue;
        }
        const frames = makeGridAnim(img, d.rows, d.cols);
        this.anims[name] = {
          img,
          anim: new global.Animation({
            frames,
            fps: d.fps ?? 12,
            loop: d.loop ?? true,
          }),
        };
      }
    }

    play(name, force = false) {
      const a = this.anims[name];
      if (!a) return;
      if (force || this.sprite._mnAnimName !== name) {
        this.sprite.image = a.img;
        this.sprite.animations[name] = a.anim;
        this.sprite.play(name, true);
        this.sprite._mnAnimName = name;
      }
    }
  }

  global.makeGridAnim = global.makeGridAnim || makeGridAnim;
  global.SheetAnimator = global.SheetAnimator || SheetAnimator;
})(window);

