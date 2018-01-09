class RouterReducer {

  // this.state.bindReducer("popstate", RouterReducer._changeRoute);

  static _changeRoute(state, noParameterUsed) {
    if (state.session.route && state.session.route.location === location)
      return state;
    let route = RouterReducer.parseUrl(location);
    const newR = route.segments;
    if (state.session.route) {
      const oldR = state.session.route.segments;
      if (newR[0] === oldR[0] && newR[1] === oldR[1] && newR[2] === oldR[2] && newR[3] === oldR[3])
        return state;
    }
    //check for invalid route, and if so, redirect /home
    if (newR[0] === "editor" && !newR[2]) {
      newR[0] = "home";                         //correct the route
      history.pushState({}, null, "/" + newR.join("/"));
    }
    //default route
    if (location.pathname === "/"){
      newR[0] = "home";                         //default route
      history.pushState({}, null, "/" + newR.join("/"));
    }
    return Tools.setIn(state, ['session', 'route'], route);
  }

  static parseUrl(location) {
    let res = {
      path: location.pathname.substr(1),
      search: location.search.substr(1),
      hash: location.hash.substr(1),
      segments: [],
      url: RouterReducer.pathSearchHashToURL(location.pathname, location.search, location.hash)
    };
    if (res.path)
      res.segments = res.path.split("/").filter(item => item !== "").map(seg => decodeURI(seg));
    if (res.search) {
      res.queries = {};
      res.search.split("&").map(function (q) {
        let pair = q.split("=");
        res.queries[pair[0]] = pair[1];
      });
    }
    return res;
  }

  static pathSearchHashToURL(path, search, hash) {
    return (path || "") + (search || "") + (hash || "");
  }

}