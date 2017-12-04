class AppState {

  constructor() {
    this.state = {};
    this.history = [];
    this.computer = new FunctionalComputer();
    this.observers = new FunctionalComputer();
    this.listeners = [];
  }

  bindReducer(eventName, reducer) {
    window.addEventListener(eventName, e => {
      this._updateState(reducer(this.state, e.detail), e.type);
    });
  }

  bindCompute(returnPropertyInState, stateFunctionToCall, parametersAsDotSeparatedStrings) {
    this.computer.bind(returnPropertyInState, stateFunctionToCall, parametersAsDotSeparatedStrings);
  }

  bindObserve(stateFunctionToCall, parametersAsDotSeparatedStrings) {
    this.observers.bind("__observableValueDoNotUseIt", stateFunctionToCall, parametersAsDotSeparatedStrings);
  }

  _updateState(newState, action) {
    newState = this.computer.update(newState);
    this.observers.update(newState);
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
    for (let cb of this.listeners)
      cb({state: newState, history: this.history});
  }

  onChange(cb) {
    this.listeners.push(cb);
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