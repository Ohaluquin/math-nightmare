// motor2D.js - facade retrocompatible del motor modular en js/engine/*
(function (global) {
  const required = [
    "EventEmitter",
    "Animation",
    "StateMachine",
    "AssetLoader",
    "InputManager",
    "Camera",
    "QuadTree",
    "Scene",
    "SceneManager",
    "Sprite",
    "SheetAnimator",
    "Game",
    "makeGridAnim",
  ];

  const missing = required.filter((k) => typeof global[k] === "undefined");
  if (missing.length) {
    console.error(
      "[motor2D facade] Faltan módulos del engine. Carga primero js/engine/*:",
      missing
    );
  }
})(window);

