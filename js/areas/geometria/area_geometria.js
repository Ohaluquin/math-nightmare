(function () {
  window.MN_AREA = {
    getOverworldKey() {
      return "overworld_geometria";
    },

    getIntroEntry() {
      return (
        window.MN_REGISTRY?.areas?.geometria?.intro ||
        window.MN_REGISTRY?.intro_geometria ||
        null
      );
    },

    register(game, router) {
      const params = new URLSearchParams(window.location.search);
      const problemasReviewMode =
        window.MN_PAGE_CONFIG?.problemasReviewMode === true ||
        window.MN_DEBUG_PROBLEMAS_REVIEW === true ||
        params.get("problemasReview") === "1";
      const reglaYCompasReviewMode =
        window.MN_PAGE_CONFIG?.reglaYCompasReviewMode === true ||
        window.MN_DEBUG_REGLA_Y_COMPAS_REVIEW === true ||
        params.get("reglaYCompasReview") === "1";

      const overworld = new OverworldGeometriaScene(
        game,
        window.MN_STATE.nivelActual || 0,
      );

      game.sceneManager.register("overworld_geometria", overworld);
      game.sceneManager.register("overworld", overworld);

      game.sceneManager.register("angulos", new AngulosScene(game));
      game.sceneManager.register("isosceles", new IsoscelesScene(game));
      game.sceneManager.register(
        "angulos_ecuaciones",
        new AngulosEcuacionesScene(game),
      );
      game.sceneManager.register(
        "congruencia",
        new (window.TangramScene || window.CongruenciaScene)(game),
      );
      game.sceneManager.register("deduccion", new DeduccionScene(game));
      game.sceneManager.register("poligonos", new PoligonosScene(game));
      game.sceneManager.register("areas", new AreasScene(game));
      game.sceneManager.register("cartesiano", new CartesianoScene(game));
      game.sceneManager.register("graficas", new GraficasScene(game));
      game.sceneManager.register(
        "problemas",
        new ProblemasScene(game, { reviewMode: problemasReviewMode }),
      );
      game.sceneManager.register(
        "regla_y_compas",
        new ReglaYCompasScene(game, { reviewMode: reglaYCompasReviewMode }),
      );
    },
  };
})();
