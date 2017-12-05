class ObservableState {

  constructor(initial) {
    this.state = {};
    this.history = [];
    this.computer = new MicroObserver();
    this.observers = new MicroObserver();
    this.listeners = [];

    let stored = JSON.parse(localStorage.getItem('state'));
    if (stored)
      initial = Tools.setIn(initial, ["persistent"], stored);
    initial = Tools.deepFreeze(initial);
    this._updateState(initial, 'init');
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
}