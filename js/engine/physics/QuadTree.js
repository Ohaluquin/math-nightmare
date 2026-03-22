(function (global) {
  class QuadTree {
    constructor(bounds, maxObjects = 8, maxLevels = 4, level = 0) {
      this.bounds = bounds;
      this.maxObjects = maxObjects;
      this.maxLevels = maxLevels;
      this.level = level;
      this.objects = [];
      this.nodes = [];
    }

    clear() {
      this.objects.length = 0;
      for (const n of this.nodes) n.clear();
      this.nodes.length = 0;
    }

    _split() {
      const { x, y, w, h } = this.bounds;
      const hw = w / 2;
      const hh = h / 2;
      const nl = this.level + 1;
      this.nodes[0] = new QuadTree({ x: x + hw, y, w: hw, h: hh }, this.maxObjects, this.maxLevels, nl);
      this.nodes[1] = new QuadTree({ x, y, w: hw, h: hh }, this.maxObjects, this.maxLevels, nl);
      this.nodes[2] = new QuadTree({ x, y: y + hh, w: hw, h: hh }, this.maxObjects, this.maxLevels, nl);
      this.nodes[3] = new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.maxObjects, this.maxLevels, nl);
    }

    _index(obj) {
      const verticalMid = this.bounds.x + this.bounds.w / 2;
      const horizontalMid = this.bounds.y + this.bounds.h / 2;

      const ox = obj.collisionBox ? obj.x + obj.collisionBox.offset.x : obj.x;
      const oy = obj.collisionBox ? obj.y + obj.collisionBox.offset.y : obj.y;
      const ow = obj.collisionBox ? obj.collisionBox.width : obj.width;
      const oh = obj.collisionBox ? obj.collisionBox.height : obj.height;

      const top = oy + oh <= horizontalMid;
      const bottom = oy >= horizontalMid;
      const left = ox + ow <= verticalMid;
      const right = ox >= verticalMid;

      if (top && right) return 0;
      if (top && left) return 1;
      if (bottom && left) return 2;
      if (bottom && right) return 3;
      return -1;
    }

    insert(obj) {
      if (this.nodes.length) {
        const i = this._index(obj);
        if (i !== -1) return this.nodes[i].insert(obj);
      }

      this.objects.push(obj);
      if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
        if (!this.nodes.length) this._split();
        let j = 0;
        while (j < this.objects.length) {
          const idx = this._index(this.objects[j]);
          if (idx !== -1) this.nodes[idx].insert(this.objects.splice(j, 1)[0]);
          else j++;
        }
      }
    }

    retrieve(list, obj) {
      const i = this._index(obj);
      if (i !== -1 && this.nodes.length) this.nodes[i].retrieve(list, obj);
      list.push(...this.objects);
      return list;
    }
  }

  global.QuadTree = global.QuadTree || QuadTree;
})(window);

