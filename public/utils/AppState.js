class AppState {
  constructor() {
    this.state = {};
    this.history = [];
  }

  bindReducer(eventName, reducer) {
    window.addEventListener(eventName, e => { this._updateState(reducer(this.state, e.detail), e.type); });
  }

  _updateState(newState, action) {
    this.state = newState;
    console.log(action, performance.now());
    const snap = {
      action: action,
      snapshot: newState,
      timestamp: new Date().getTime(),
      apptime: performance.now()
    };
    this.history = [snap].concat(this.history);
//        if (newState.persistent)
//          localStorage.setItem('state', JSON.stringify(newState.persistent));
    Tools.emit("state-changed", {state: this.state, history: this.history});
  }

  init(initial) {
    let stored = JSON.parse(localStorage.getItem('state'));
    let res;
    if (stored)
      res = Tools.deepFreeze(Tools.setIn(initial, ["persistent"], stored));
    res = Tools.deepFreeze(initial);
    this._updateState(res, 'init');
  }
}