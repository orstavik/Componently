class FunctionalComputer {

  constructor() {
    this.functionsRegister = {};
    this.uniquePathsAsArray = {};
    this.props = {};
  }

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
    this.functionsRegister[func.name] = {
      returnProp: propName,
      func: func,
      argsPaths: pathsAsArray,
      argsValue: pathsAsArray.map(p => undefined)    //here we store the values of the last time we ran the function
    };
  }

  get(propName) {
    return this.props[propName];
  }

  set(propName, newValue) {
    let newProps = Tools.setIn(this.props, [propName], newValue);
    //todo change props into just a table of the actual values. This table is the same as the pathsCache. And then we actually don't need to send in newProps to __compute.
    // let pathsCache = getTheCurrentValuesOfAllPathsIn(this.props);
    // pathsCache = FunctionalComputer.__compute(0, this.functionsRegister, pathsCache);
    // this.props = copyAllTheNewCachedValuesIntoTheCurrentPropsState(this.props, pathsCache);
    let res = FunctionalComputer.__compute(newProps, 0, this.functionsRegister, {});
    this.props = res.props;
    this.functionsRegister = res.functions;
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(props, count, functions, pathsCache) {
    if (count > 100)
      throw new Error("More than 100 __compute cycles. Possible infinite loop. And if not, too complex computes.");

    for (let funcName in functions) {           //todo, here we could prioritize the functions with the most changed input properties. That could make the functions quicker
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
      return FunctionalComputer.__compute(newProps, count++, functions, pathsCache);
    }
    return {props: props, functions: functions};
  }
}