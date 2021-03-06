class MicroObserver {

  constructor(maxStackSize, observeOnly) {
    this.maxStackSize = maxStackSize || 100;
    this.functionsRegister = {};
    this.pathRegister = new PathRegister();
    this.observeOnly = observeOnly;
    this.stack = [];
  }

  //here we could reorder the functionsRegister so that the functions with fewest arguments are listed before the functions with more arguments,
  //this could make the functions faster.
  bind(func, pathsAsStrings, returnName) {
    const res = {
      func: func,
      funcName: func.name,
      argsPaths: pathsAsStrings.map(path => this.pathRegister.getUniqueForString(path)),
      argsValue: pathsAsStrings.map(p => undefined)
    };
    if (this.observeOnly)
      return this.functionsRegister[func.name] = res;
    res.returnPath = this.pathRegister.getUniqueForString(returnName);
    res.returnValue = undefined;
    return this.functionsRegister[returnName] = res;
  }

  //this.functionsRegister remember the last situation of the stack run, between updates(!),
  //via argumentValues and returnValues of its functions. Not sure if that is a good thing..
  //but we must have this "between update memory" to avoid running observers and computers when things do not change.
  //the pathsCache is refreshed for every update.
  update(newValue) {
    const start = {functions: this.functionsRegister, pathsCache: this.pathRegister.getPathsCache(newValue)};
    this.stack = MicroObserver.__compute(this.maxStackSize, start, this.observeOnly);
    this.functionsRegister = this.stack[0].functions;
    return MicroObserver.copyAllTheNewCachedValuesIntoTheCurrentPropsState(newValue, this.stack[0].pathsCache);
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(stackRemainderCount, startingPoint, observeOnly) {
    stackRemainderCount = MicroObserver.checkStackCount(stackRemainderCount);

    let workingPoint = startingPoint;
    for (let funcName in workingPoint.functions) {
      const funcObj = workingPoint.functions[funcName];
      const func = funcObj.func;
      const propName = funcObj.returnPath;
      const argsValues = funcObj.argsValue;
      const newArgsValues = funcObj.argsPaths.map(path => workingPoint.pathsCache[path].value);

      const isEqual = argsValues.every((v, i) => v === newArgsValues[i]);
      if (isEqual)                      //none of the arguments have changed, then we do nothing.
        continue;

      //todo When we change the workingPoint, we can make a mark in a list which function has triggered a change.
      workingPoint = Tools.setIn(workingPoint, ["functions", funcName, "argsValue"], newArgsValues);
      let newComputedValue = func.apply(null, newArgsValues);
      if (observeOnly)
        continue;
      if (newComputedValue === funcObj.returnValue)    //we changed the arguments, but the result didn't change.
        continue;                                      //Therefore, we don't need to recheck any of the previous functions run.
      workingPoint = Tools.setIn(workingPoint, ["functions", funcName, "returnValue"], newComputedValue);      //todo, we are storing the returnValue in the function as well.. this is not necessary..
      workingPoint = Tools.setIn(workingPoint, ["pathsCache", propName, "value"], newComputedValue);
      return MicroObserver.__compute(stackRemainderCount, workingPoint, false).concat([workingPoint]);
    }
    return [workingPoint];
  }

  static checkStackCount(stackRemainderCount) {
    if (stackRemainderCount >= 0)
      return stackRemainderCount - 1;
    throw new Error(
      "StackOverFlowError in MicroObserver (ITObservableState). Probably an infinite loop.\n " +
      "Tip: Even if it is not an infinite loop, you should still simplify your compute structure.");
  }

  getStartStopRegisters() {
    return {start: this.stack[this.stack.length-1].functions, stop: this.stack[0].functions};
  }

  static copyAllTheNewCachedValuesIntoTheCurrentPropsState(state, pathsCache) {
    for (let pathString in pathsCache) {
      let pathValue = pathsCache[pathString];
      state = Tools.setIn(state, pathValue.path, pathValue.value);
    }
    return state;
  }
}

class PathRegister {
  constructor() {
    this.register = [];
  }

  getPathsCache(obj) {
    let res = {};
    for (let path of this.register)
      res[path] = {value: Tools.getIn(obj, path), path: path};
    return res;
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
    if (this.register[path])
      throw new Error("Illegal path name! You have probably used a string with comma as a pathname somehow. " + path);
    this.register.push(path);
    return path;
  }

  getUniqueForString(path) {
    const ar = path.split(".").map(p => p.trim());
    return this.getUnique(ar);
  }
}
