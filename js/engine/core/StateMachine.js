(function (global) {
  class StateMachine {
    constructor({ initial, states = {} }) {
      this.states = states;
      this.current = initial;
      this.previous = null;

      if (this.states[this.current]?.onEnter) {
        this.states[this.current].onEnter();
      }
    }

    transition(newState) {
      if (newState === this.current) return;
      if (!this.states[newState]) return;

      if (this.states[this.current]?.onExit) {
        this.states[this.current].onExit();
      }

      this.previous = this.current;
      this.current = newState;

      if (this.states[this.current]?.onEnter) {
        this.states[this.current].onEnter();
      }
    }

    get state() {
      return this.current;
    }

    get last() {
      return this.previous;
    }
  }

  global.StateMachine = global.StateMachine || StateMachine;
})(window);

