class MicroObserver {

  constructor(maxStackSize) {
    this.maxStackSize = maxStackSize || 100;
    this.functionsRegister = {};
    this.uniquePathsAsArray = {};
    this.state = {};
  }

  //todo, here we could reorder the functionsRegister so that the functions with fewest arguments are listed before the functions with more arguments,
  //todo, this could make the functions faster.
  bind(propName, func, pathsAsStrings) {
    let pathsAsArray = pathsAsStrings.map(path => path.split(".").map(p => p.trim()));
    //make sure you use the same object for all identical paths
    pathsAsArray = pathsAsArray.map(path => {
      let existing = Tools.getIn(this.uniquePathsAsArray, path);
      if (existing)
        return existing;
      this.uniquePathsAsArray = Tools.setInNoCheck(this.uniquePathsAsArray, path, path);
      return path;
    });
    this.functionsRegister[propName + '__' + func.name] = {
      returnProp: propName,
      func: func,
      funcName: func.name,
      argsPaths: pathsAsArray,
      argsValue: pathsAsArray.map(p => undefined)    //here we store the values of the last time we ran the function
    };
  }

  update(newValue) {
    let res = MicroObserver.__compute(newValue, this.maxStackSize, this.functionsRegister, {});
    this.oldFunctionsRegister = this.functionsRegister;
    this.functionsRegister = res.functions;
    return this.state = res.state;
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(props, stackRemainderCount, functions, pathsCache) {
    if (stackRemainderCount < 0)
      throw new Error(
        "StackOverFlowError in MicroObserver (ITObservableState).\n " +
        "More than " + this.maxStackSize + " __compute cycles. Likely infinite loop.\n " +
        "Tip: Even if it is not an infinite loop, you should still simplify your compute structure.");

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
      if (newComputedValue === props[propName])    //we changed the arguments, but the result didn't change.
        continue;                                 //Therefore, we don't need to recheck any of the previous functions run.
      pathsCache[propName] = newComputedValue;
      const newProps = Tools.setIn(props, [propName], newComputedValue);
      return MicroObserver.__compute(newProps, stackRemainderCount--, functions, pathsCache);
    }
    return {state: props, functions: functions};
  }

  getStartStopRegisters() {
    return {start: this.oldFunctionsRegister, stop: this.functionsRegister};
  }

  //todo not implemented
  newUpdate(newValue){
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
  static copyAllTheNewCachedValuesIntoTheCurrentPropsState(state, pathsCache){
    for (let path in pathsCache)
      state = Tools.setIn(state, path, pathsCache[path]);
    return state;
  }
}