(function (global) {
  class AssetLoader {
    constructor() {
      this.images = {};
      this.sounds = {};
      this.videos = {};
      this.masterVolume = 1;
      this.currentMusic = null;
    }

    loadAsset({ type, key, src }) {
      if (type === "image") return this.loadImage(key, src);
      if (type === "audio") return this.loadAudio(key, src);
      if (type === "video") return this.loadVideo(key, src);
    }

    loadImage(key, src) {
      const sources = this.getImageSources(src);
      let index = 0;

      return new Promise((resolve) => {
        const tryNext = () => {
          if (index >= sources.length) {
            console.warn("[AssetLoader] No se pudo cargar imagen:", key, src);
            resolve(null);
            return;
          }

          const currentSrc = sources[index++];
          const img = new Image();
          img.decoding = "async";
          img.onload = () => {
            this.images[key] = img;
            resolve(img);
          };
          img.onerror = () => {
            tryNext();
          };
          img.src = currentSrc;
        };

        tryNext();
      });
    }

    getImageSources(src) {
      if (Array.isArray(src)) return src.filter(Boolean);
      if (typeof src !== "string" || !src) return [];
      if (/\.webp(\?.*)?$/i.test(src)) return [src];

      const webpSrc = src.replace(
        /\.(png|jpg|jpeg)(\?.*)?$/i,
        ".webp$2"
      );
      if (webpSrc !== src) return [webpSrc, src];
      return [src];
    }

    loadAudio(key, src) {
      return new Promise((resolve) => {
        const audio = new Audio(src);
        const timeout = setTimeout(() => {
          console.warn("[AssetLoader] Timeout cargando audio:", key, src);
          resolve(null);
        }, 10000);

        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          this.sounds[key] = audio;
          resolve(audio);
        };
        audio.onerror = () => {
          clearTimeout(timeout);
          console.warn("[AssetLoader] No se pudo cargar audio:", key, src);
          resolve(null);
        };
        audio.load();
      });
    }

    loadVideo(key, src) {
      return new Promise((resolve) => {
        const v = document.createElement("video");
        v.preload = "auto";
        v.src = src;
        v.onloadedmetadata = () => {
          this.videos[key] = src;
          resolve(src);
        };
        v.onerror = () => {
          console.warn("[AssetLoader] No se pudo cargar video:", key, src);
          resolve(null);
        };
        v.load();
      });
    }

    getImage(key) {
      return this.images[key];
    }

    getVideo(key) {
      return this.videos[key];
    }

    getSound(key) {
      return this.sounds[key];
    }

    playSound(key, { volume = 1, loop = false, restart = true } = {}) {
      const original = this.sounds[key];
      if (!original) return;
      const s = original.cloneNode();
      s.volume = Math.max(0, Math.min(1, volume)) * this.masterVolume;
      s.loop = loop;
      if (restart) s.currentTime = 0;
      s.play().catch(() => {});
    }

    stopSound(key) {
      const s = this.sounds[key];
      if (s) {
        s.pause();
        s.currentTime = 0;
      }
    }

    setMasterVolume(v) {
      this.masterVolume = Math.max(0, Math.min(1, v));
      for (const s of Object.values(this.sounds)) {
        s.volume = Math.min(s.volume, 1) * this.masterVolume;
      }
    }

    playMusic(key, { loop = true, volume = 1 } = {}) {
      if (this.currentMusic) {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      }
      const original = this.sounds[key];
      if (!original) return;
      const music = original.cloneNode();
      music.loop = loop;
      music.volume = volume * this.masterVolume;
      music.play().catch(() => {});
      this.currentMusic = music;
    }

    stopMusic() {
      if (this.currentMusic) {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
      }
    }
  }

  global.AssetLoader = global.AssetLoader || AssetLoader;
})(window);
