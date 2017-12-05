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
    this.que = [];
  }

  bindReduce(eventName, reducer, update = true) {
    window.addEventListener(eventName, e => this._runOrAddToQue(e, reducer, update));
  }

  bindCompute(returnProp, computeFunc, argsAsStrings) {
    this.computer.bind(returnProp, computeFunc, argsAsStrings);
  }

  bindObserve(observeFunc, argsAsStrings) {
    this.observers.bind("__observableValueDoNotUseIt", observeFunc, argsAsStrings);
  }

  _runOrAddToQue(e, reducer, update) {
    if (update) {
      for (let task of this.que) {
        if (task.reducer === reducer) {
          task.event = e;
          console.log("updated task in que(" + reducer.name + "): " + e);
          return;
        }
      }
    }
    const task = {event: e, reducer: reducer};
    this.que.push(task);
    console.log("added task to que(" + this.que.length + "): " + reducer.name);
    if (this.que[0] === task)
      return this.reduceComputeObserveInner(task);
  }

  reduceComputeObserveInner(task) {
    console.log("start: ", task.reducer.name, task.event.detail);
    const reducer = task.reducer;
    const e = task.event;
    const startState = this.state;
    const reducedState = reducer(startState, e.detail);         //1. reduce
    this.state = this.computer.update(reducedState);            //2. compute
    this.observers.update(this.state);                          //3. observe
    this.history = ITObservableState.addToHistory(this.history, this.state, e.type);
    Tools.emit("state-changed", this.state);
    Tools.emit("state-history-changed", this.history);


    // if (this.state.persistent)
    //   localStorage.setItem('state', JSON.stringify(this.state.persistent));
    let taskCompleted = this.que.shift();
    console.log("stop: ", taskCompleted.reducer.name);
    if (taskCompleted !== task)
      throw new Error("completed task is not the same as the first task in the que?!");
    // if (this.que.length > 100)
    //   setTimeout(()=> this.reduceComputeObserveInner(this.que[0]), 0);
    if (this.que.length > 0)
      this.reduceComputeObserveInner(this.que[0]);
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