class ITObservableState {

  constructor(initial) {
    this.state = {};
    this.history = [];
    this.computer = new MicroObserver();
    this.observer = new MicroObserver();

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
    this.observer.bind("__resultFromObserver__ifYouNeedThisBindToComputeNotObserve", observeFunc, argsAsStrings);
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
    let start = performance.now();
    const reducer = task.reducer;
    const e = task.event;
    let oldState = this.state;
    let reducedState = reducer(oldState, e.detail);         //1. reduce
    let computedState = this.computer.update(reducedState); //2. compute
    this.state = this.observer.update(computedState);       //3. observe
    this.history = ITObservableState.addToHistory(this.history, this.state, e.type);
    this.que.shift();
    let stop = performance.now();
    this.debugInfo = {
      start,
      stop,
      oldState,
      reducedState,
      computedState,
      task,
      newState: this.state,
      computerInfo: this.computer.getDebugInfo(),
      observerInfo: this.observer.getDebugInfo(),
      que: this.que.splice()
    };
    Tools.emit("state-changed", this.state);
    Tools.emit("state-history-changed", this.history);
    Tools.emit("state-debug-info", this.debugInfo);


    // if (this.state.persistent)
    //   localStorage.setItem('state', JSON.stringify(this.state.persistent));
    // let lastCompletedTask = this.que.shift();
    // if (lastCompletedTask !== task)                                                                //todo unnecessary
    //   throw new Error("completed task is not the same as the first task in the que?!");            //todo unnecessary
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