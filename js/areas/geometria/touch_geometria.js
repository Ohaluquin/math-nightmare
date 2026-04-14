(function () {
  if (!window.MN_TOUCH_CONTROLS?.registerProfiles) return;

  const numericScenes = [
    "angulos",
    "isosceles",
    "angulos_ecuaciones",
    "poligonos",
    "areas",
    "graficas",
    "problemas",
  ];

  const confirmScenes = [
    "cartesiano",
    "congruencia",
    "deduccion",
    "regla_y_compas",
  ];

  const profiles = {};
  const integerNumpadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0", "Backspace", "Enter"];
  const decimalNumpadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "-", "0", "Backspace", "Enter"];

  numericScenes.forEach((sceneKey) => {
    profiles[sceneKey] = {
      movement: false,
      actions: true,
      actionKeys: ["Escape"],
      numpad: true,
      numpadKeys: integerNumpadKeys,
      layout: "split",
      variant: "quick-numpad",
      expanded: { numpad: true },
    };
  });

  profiles.problemas.numpadKeys = decimalNumpadKeys;

  confirmScenes.forEach((sceneKey) => {
    profiles[sceneKey] = {
      movement: false,
      actions: true,
      actionKeys: ["Enter", "Escape"],
      numpad: false,
      layout: "default",
    };
  });

  window.MN_TOUCH_CONTROLS.registerProfiles(profiles);
})();
