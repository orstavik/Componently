class ITObservableState {

  constructor(initial) {
    this.state = {};
    this.history = [];
    this.computer = new MicroObserver();
    this.observer = new MicroObserver();

    this.state = Tools.deepFreeze(initial);
    this.history = ITObservableState.addToHistory([], this.state, "init");
    this.que = [];
  }

  bindReduce(eventName, reducer, throttle = true) {
    window.addEventListener(eventName, e => this._runOrAddToQue(e, reducer, throttle));
  }

  bindCompute(returnProp, computeFunc, argsAsStrings) {
    this.computer.bind(returnProp, computeFunc, argsAsStrings);
  }

  bindObserve(observeFunc, argsAsStrings) {
    this.observer.bind("__resultFromObserver__ifYouNeedThisBindToComputeNotObserve", observeFunc, argsAsStrings);
  }

  _runOrAddToQue(e, reducer, throttle) {
    if (throttle) {                          //todo make this a bit prettier
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
    const startQueLength = this.que.length - 1;              //for debug
    const e = task.event;
    let startState = this.state;
    let reducedState = reducer(startState, e.detail);         //1. reduce
    let computedState = this.computer.update(reducedState); //2. compute
    this.observer.update(computedState);                    //3. observe
    this.state = computedState;
    this.history = ITObservableState.addToHistory(this.history, this.state, e.type);
    this.que.shift();
    if (ITObservableState.debug)
      Tools.emit("state-changed-debug", {
        start,
        stop: performance.now(),
        startState,
        reducedState,
        computedState,
        task,
        newState: this.state,
        computerInfo: this.computer.getDebugInfo(),
        observerInfo: this.observer.getDebugInfo(),
        startQueLength,
        que: this.que.splice()
      });
    Tools.emit("state-changed", this.state);
    Tools.emit("state-history-changed", this.history);


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

  static testAll(debugInfo) {
    let compared = ITObservableState.compareObjects2("state", debugInfo.startState, debugInfo.reducedState, debugInfo.computedState);
    // let visualizedData = ITObservableState.visualizeComparedObj(compared);
    const printTest = ITObservableState.printTest(compared, 0);
    // console.log(printTest);
  }

  static printTest(visualVersion, depth) {
    let res = "";
    for (let i = 0; i < depth; i++) res += "  ";
    res += visualVersion.name;
    res += " (";
    res += visualVersion.style.join(", ");
    res += ")";
    res += " = " + visualVersion.values.startState;
    res += " / " + visualVersion.values.reducedState;
    res += " / " + visualVersion.values.computedState;
    // console.log(res);
    for (let childName in visualVersion.children)
      res += "\n" + ITObservableState.printTest(visualVersion.children[childName], depth + 1);
    return res;
  }

  static getStyle(diffs) {
    return ["reduce" + ITObservableState.typeOfChange(diffs[0]), "compute" + ITObservableState.typeOfChange(diffs[1])];
  }

  static typeOfChange(code) {
    if (code === 0)
      return "NoChange";
    if (code === 1)
      return "Altered";
    if (code === 2)
      return "Added";
    if (code === 3)
      return "Deleted";
  }

  //.diff, .values, .children
  static compareObjects2(name, startState, reducedState, computedState) {
    let res = {};
    res.name = name;
    res.diff = [ITObservableState.diff(startState, reducedState), ITObservableState.diff(reducedState, computedState)];
    res.values = {
      startState,
      reducedState,
      computedState
    };
    res.style = ITObservableState.getStyle(res.diff);
    res.children = {};

    for (let prop of ITObservableState.getAllObjectKeys(computedState, reducedState, startState)) {
      let start = startState ? startState[prop] : undefined;
      let reduced = reducedState ? reducedState[prop] : undefined;
      let computed = computedState ? computedState[prop] : undefined;
      res.children[prop] = ITObservableState.compareObjects2(prop, start, reduced, computed);
    }
    return res;
  }

  static getAllObjectKeys(computedState, reducedState, startState) {
    let allKeys = [];
    if (computedState && typeof computedState === "object")
      allKeys = Object.keys(computedState);
    if (reducedState && typeof reducedState === "object")
      for (let key in reducedState)
        if (allKeys.indexOf(key) === -1)
          allKeys.push(key);
    if (startState && typeof startState === "object")
      for (let key in startState)
        if (allKeys.indexOf(key) === -1)
          allKeys.push(key);
    return allKeys;
  }

//returns
  //0 = no changes from a to b
  //1 = a changed to b, from something to something
  //2 = b is new
  //3 = b is deleted
  static diff(a, b) {
    if (a === b)
      return 0;
    if (a === undefined)
      return 2;
    if (b === undefined)
      return 3;
    return 1;
  }
}

ITObservableState.debug = true;

window.addEventListener("state-changed-debug", e => ITObservableState.testAll(e.detail));