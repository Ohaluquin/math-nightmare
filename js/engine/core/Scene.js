(function (global) {
  class Scene {
    constructor(game) {
      this.game = game;
      this.camera = new global.Camera(0, 0, game.canvas.width, game.canvas.height, game);
      this.layers = new Map();
      this.groups = new Map();
      this.objects = new Set();
      this.quadTree = new global.QuadTree({
        x: 0,
        y: 0,
        w: this.game.canvas.width,
        h: this.game.canvas.height,
      });
      this._layersDirty = true;
      this._sortedLayerKeys = [];
      this._collisionIds = new WeakMap();
      this._nextCollisionId = 1;
      this.enableCollisionCallbacks = true;
    }

    init() {}

    add(obj, layer = "default", group = null) {
      obj.scene = this;
      obj._layer = layer;
      obj._group = group;

      if (!this.layers.has(layer)) this.layers.set(layer, []);
      this.layers.get(layer).push(obj);

      if (group) {
        if (!this.groups.has(group)) this.groups.set(group, []);
        this.groups.get(group).push(obj);
      }

      this.objects.add(obj);
      this._layersDirty = true;
      if (obj.init) obj.init();
    }

    remove(obj) {
      this.objects.delete(obj);
      for (const arr of this.layers.values()) {
        const i = arr.indexOf(obj);
        if (i >= 0) arr.splice(i, 1);
      }
      for (const arr of this.groups.values()) {
        const i = arr.indexOf(obj);
        if (i >= 0) arr.splice(i, 1);
      }
      this._layersDirty = true;
      if (obj.destroy) obj.destroy();
    }

    clearAll() {
      for (const obj of Array.from(this.objects)) this.remove(obj);
      this.layers.clear();
      this.groups.clear();
      this.objects.clear();
      this.quadTree.clear();
      this._layersDirty = true;
      this._sortedLayerKeys = [];
    }

    getGroup(name) {
      return this.groups.get(name) || [];
    }

    removeGroup(name) {
      const arr = this.groups.get(name);
      if (!arr || !arr.length) return 0;

      const copy = arr.slice();
      let removed = 0;
      for (const obj of copy) {
        this.remove(obj);
        removed++;
      }
      this.groups.delete(name);
      return removed;
    }

    update(dt) {
      for (const obj of this.objects) obj.update && obj.update(dt);
      this.camera.update();
      if (this.enableCollisionCallbacks) this._handleCollisions();
    }

    draw(ctx) {
      if (this._layersDirty) {
        this._sortedLayerKeys = [...this.layers.keys()].sort();
        this._layersDirty = false;
      }
      this._sortedLayerKeys.forEach((layer) => {
        this.layers.get(layer).forEach((obj) => obj.draw && obj.draw(ctx));
      });
    }

    _handleCollisions() {
      const collidables = [];
      let hasCollisionHandlers = false;
      for (const obj of this.objects) {
        if (obj.collidesWith && obj.collisionBox) collidables.push(obj);
        if (typeof obj.onCollision === "function") hasCollisionHandlers = true;
      }
      if (collidables.length < 2) return;
      if (!hasCollisionHandlers) return;

      this.quadTree.clear();
      for (const obj of collidables) this.quadTree.insert(obj);

      const checkedPairs = new Set();
      const possibles = [];

      for (const a of collidables) {
        possibles.length = 0;
        this.quadTree.retrieve(possibles, a);

        for (const b of possibles) {
          if (a === b || !b.collidesWith) continue;
          if (typeof a.onCollision !== "function" && typeof b.onCollision !== "function") continue;

          const idA = this._getCollisionId(a);
          const idB = this._getCollisionId(b);
          const pairKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);

          if (a.collidesWith(b)) {
            a.onCollision?.(b);
            b.onCollision?.(a);
          }
        }
      }
    }

    _getCollisionId(obj) {
      let id = this._collisionIds.get(obj);
      if (!id) {
        id = this._nextCollisionId++;
        this._collisionIds.set(obj, id);
      }
      return id;
    }

    setCollisionCallbacksEnabled(enabled) {
      this.enableCollisionCallbacks = !!enabled;
    }
  }

  global.Scene = global.Scene || Scene;
})(window);

