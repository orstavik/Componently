class ITObservableState {

  constructor(initial) {
    this.state = {};
    this.history = [];
    this.computer = new MicroObserver();
    this.observers = new MicroObserver();

    // let stored = JSON.parse(localStorage.getItem('state'));
    // if (stored)
    //   initial = Tools.setIn(initial, ["persistent"], stored);
    this.state = Tools.deepFreeze(initial);
    this.history = ITObservableState.addToHistory([], this.state, "init");
  }

  bindReduce(eventName, reducer) {
    this.owner.addEventListener(eventName, e => this._reduceComputeObserve(e, reducer));
  }

  bindCompute(returnProp, computeFunc, argsAsStrings) {
    this.computer.bind(returnProp, computeFunc, argsAsStrings);
  }

  bindObserve(observeFunc, argsAsStrings) {
    this.observers.bind("__observableValueDoNotUseIt", observeFunc, argsAsStrings);
  }

  _reduceComputeObserve(e, reducer) {
    const startState = this.state;
    const reducedState = reducer(startState, e.detail);         //1. reduce
    const computedState = this.computer.update(reducedState);   //2. compute
    this.state = this.observers.update(computedState);          //3. observe
    this.history = ITObservableState.addToHistory(this.history, this.state, e.type);
    Tools.emit("state-changed", this.state);
    Tools.emit("state-history-changed", this.history);

    // if (this.state.persistent)
    //   localStorage.setItem('state', JSON.stringify(this.state.persistent));
  }

  static addToHistory(history, newState, action) {
    const snap = {
      action: action,
      snapshot: newState,
      timestamp: new Date().getTime(),
      apptime: performance.now()
    };
    return [snap].concat(history);
  }
}