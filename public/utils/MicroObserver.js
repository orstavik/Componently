class MicroObserver {

  constructor(maxStackSize, observeOnly) {
    this.maxStackSize = maxStackSize || 100;
    this.functionsRegister = {};
    this.pathRegister = new PathRegister();
    this.state = {};
    this.observeOnly = observeOnly;
  }

  //todo, here we could reorder the functionsRegister so that the functions with fewest arguments are listed before the functions with more arguments,
  //todo, this could make the functions faster.
  bind(func, pathsAsStrings, returnName) {
    const res = {
      func: func,
      funcName: func.name,
      argsPaths: pathsAsStrings.map(path => this.pathRegister.getUniqueForString(path)),
      argsValue: pathsAsStrings.map(p => undefined)
    };
    if (this.observeOnly)
      return this.functionsRegister[func.name] = res;
    res.returnProp = returnName;
    res.returnPath = this.pathRegister.getUniqueForString(returnName);
    res.returnValue = undefined;
    return this.functionsRegister[returnName] = res;
  }

  update(newValue) {
    let res = MicroObserver.__compute(newValue, this.maxStackSize, this.functionsRegister, {}, this.observeOnly);
    this.oldFunctionsRegister = this.functionsRegister;
    this.functionsRegister = res.functions;
    return this.state = res.state;
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(props, stackRemainderCount, functions, pathsCache, observeOnly) {
    stackRemainderCount = MicroObserver.checkStackCount(stackRemainderCount);
    for (let funcName in functions) {
      const funcObj = functions[funcName];
      const func = funcObj.func;
      const propName = funcObj.returnProp;
      const argsValues = funcObj.argsValue;
      const newArgsValues = funcObj.argsPaths.map(path => pathsCache[path] || (pathsCache[path] = Tools.getIn(props, path)));

      const isEqual = argsValues.every((v, i) => v === newArgsValues[i]);
      if (isEqual)                      //none of the arguments have changed, then we do nothing.
        continue;

      functions = Tools.setIn(functions, [funcName, "argsValue"], newArgsValues);
      let newComputedValue = func.apply(null, newArgsValues);
      if (observeOnly)
        continue;
      if (newComputedValue === funcObj.returnValue)    //we changed the arguments, but the result didn't change.
        continue;                                 //Therefore, we don't need to recheck any of the previous functions run.
      functions = Tools.setIn(functions, [funcName, "returnValue"], newComputedValue);
      pathsCache[propName] = newComputedValue;
      const newProps = Tools.setIn(props, [propName], newComputedValue);
      return MicroObserver.__compute(newProps, stackRemainderCount, functions, pathsCache, observeOnly/*is always false here*/);
    }
    return {state: props, functions: functions};
  }

  static checkStackCount(stackRemainderCount) {
    if (stackRemainderCount >= 0)
      return stackRemainderCount - 1;
    throw new Error(
      "StackOverFlowError in MicroObserver (ITObservableState). Probably an infinite loop.\n " +
      "Tip: Even if it is not an infinite loop, you should still simplify your compute structure.");
  }

  getStartStopRegisters() {
    return {start: this.oldFunctionsRegister, stop: this.functionsRegister};
  }

  //todo not implemented
  newUpdate(newValue) {
    let pathsCache = ITObservableState.getAllFunctionPathValues(this.functionsRegister, this.state);
    let res = MicroObserver.__compute(0, this.functionsRegister, pathsCache);   //with a complete pathsCache, no props need to be sent in.
    this.state = ITObservableState.copyAllTheNewCachedValuesIntoTheCurrentPropsState(this.state, res.pathsCache);
    this.oldFunctionsRegister = this.functionsRegister;
    this.functionsRegister = res.functions;
  }

  //todo not implemented
  static getAllFunctionPathValues(functions, obj) {
    let pathsCache = {};
    for (let funcName in functions) {
      const funcObj = functions[funcName];
      pathsCache[funcObj.returnProp] = undefined;
      funcObj.argsPaths.map(path => pathsCache[path] = Tools.getIn(obj, path));
    }
    return pathsCache;
  }

  //todo not implemented
  static copyAllTheNewCachedValuesIntoTheCurrentPropsState(state, pathsCache) {
    for (let path in pathsCache)
      state = Tools.setIn(state, path, pathsCache[path]);
    return state;
  }
}

class PathRegister {
  constructor() {
    this.register = [];
  }

  getUnique(path) {
    if (!Array.isArray(path) || path.length === 0)
      throw new Error("Cannot use this as path in ITObservableState: " + path);
    for (let pathB of this.register) {
      if (path.length !== pathB.length)
        continue;
      if (path.every((path_i, i) => path_i === pathB[i]))
        return pathB;
    }
    this.register.push(path);
    return path;
  }

  getUniqueForString(path) {
    const ar = path.split(".").map(p => p.trim());
    return this.getUnique(ar);
  }
}
