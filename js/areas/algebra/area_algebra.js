(function () {
  window.MN_AREA = {
    getOverworldKey() {
      return "overworld_algebra";
    },

    getIntroEntry() {
      return (
        window.MN_REGISTRY?.areas?.algebra?.intro ||
        window.MN_REGISTRY?.intro_algebra ||
        null
      );
    },

    register(game, router) {
      const overworld = new OverworldAlgebraScene(
        game,
        window.MN_STATE.nivelActual || 0,
      );

      game.sceneManager.register("overworld_algebra", overworld);
      game.sceneManager.register("overworld", overworld);

      game.sceneManager.register(
        "balanceo_ecuaciones",
        new ResolverEcuacionesScene(game),
      );
      game.sceneManager.register("balanza", new BalanzaScene(game));
      game.sceneManager.register(
        "algebra_sustitucion_laberinto",
        new SustituirYEvaluarScene(game),
      );
      game.sceneManager.register("despejes", new DespejesScene(game));
      game.sceneManager.register(
        "brahmagupta_enigmas",
        new EnigmasDelNumeroScene(game),
      );
      game.sceneManager.register(
        "lenguaje_natural",
        new LenguajeNaturalScene(game),
      );
      game.sceneManager.register("incrementos", new TerminosSemejantesScene(game));
      game.sceneManager.register("modelar", new ModelarScene(game));
      game.sceneManager.register("anagrama", new ConceptosAlgebraicosScene(game));
    },
  };
})();
