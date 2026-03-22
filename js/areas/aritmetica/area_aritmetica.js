(function () {
  // MN_AREA: plugin del área actual (aritmética)
  window.MN_AREA = {
    getOverworldKey() {
      return "overworld_aritmetica"; 
    },
    getIntroEntry() {      
      return window.MN_REGISTRY?.intro;
    },
    register(game, router) {
      const overworld = new OverworldScene(game, window.MN_STATE.nivelActual || 0);
      game.sceneManager.register("overworld_aritmetica", overworld);

      game.sceneManager.register("escriba_muescas", new EscribaScene(game));
      game.sceneManager.register("caja_rapida", new CajaRapidaScene(game));
      game.sceneManager.register("escalera_sumas", new SumasScene(game));
      game.sceneManager.register("restas_luciernagas", new RestasScene(game));
      game.sceneManager.register("mineros_division", new ElevadorScene(game));
      game.sceneManager.register("galileo_tablas", new TablasScene(game));
      game.sceneManager.register("armonia_division", new ArmoniaScene(game));
      game.sceneManager.register("chaman_jerarquia", new JerarquiaScene(game));
      game.sceneManager.register("general_signos", new GeneralSignosScene(game));
      game.sceneManager.register("eratostenes_divisores", new DivisoresScene(game));
      game.sceneManager.register("leonardo_razonamiento", new RazonamientoScene(game));
    },
  };
})();
