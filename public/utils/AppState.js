class AppState {
  static makeUser(nick, user) {
    return {
      name: nick,
      displayName: user.displayName,
      email: user.email,
      photo: user.photoURL,
      uid: user.uid
    }
  }

  static getLatestVersionNumber(persistent, username, project) {
    if (!username ||
      !project ||
      !Tools.testPath(persistent, ["users", username, "projects", project, "versions"])) {
      return undefined;
    }
    let versions = persistent.users[username].projects[project].versions;
    return AppState.getLatestVersionNumberFromVersionObject(versions);
  }

  static getLatestVersionNumberFromVersionObject(versions) {
    return Object.keys(versions).map(n => Number(n)).sort((a, b) => b - a)[0];
  }

  constructor() {
    this.state = {};
    this.history = [];
    this.bindToReduce('state-change-route', AppState._changeRoute);          //select-project

    //auth
    this.bindToReduce('controller-auth-changed', AppState._authChanged);
    this.bindToReduce('controller-sign-in', AppState._signIn);
    this.bindToReduce('controller-sign-out', AppState._signOut);
    //user
    this.bindToReduce('controller-add-project', AppState._addProject);
    this.bindToReduce('controller-remove-project', AppState._removeProject);
    this.bindToReduce('controller-select-project', AppState._selectProject);
    this.bindToReduce('controller-select-version', AppState._selectVersion);
    this.bindToReduce('controller-add-file', AppState._addFile);
    this.bindToReduce('controller-remove-file', AppState._removeFile);
    this.bindToReduce('controller-file-edited', AppState._fileEdited);
    //db
    this.bindToReduce('controller-new-user-data', AppState._newUserData);
    this.bindToReduce('controller-new-projects', AppState._newProjects);
    this.bindToReduce('controller-new-versions', AppState._newVersions);
    this.bindToReduce('controller-new-files', AppState._newFiles);
    this.bindToReduce('controller-new-version-subscription', AppState._newVersionSubscription);
    this.bindToReduce('controller-new-projects-subscription', AppState._newProjectsSubscription);

    firebase.auth().onAuthStateChanged((user) => this.$emit('controller-auth-changed', user));

    this._updateState(AppState.init(), 'init');

  }

  bindToReduce(eventName, reducer) {
    window.addEventListener(eventName, e => { this._updateState(reducer(this.state, e.detail), e.type); });
  }

  _updateState(newState, action) {
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
    AppState.$emit("state-changed", {state: this.state, history: this.history});
  }

  static $emit(name, payload) {
    return window.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }


  /**
   * INIT AND ROUTE
   */
  static init() {
    const initial = Tools.deepFreeze({
      session: {
        subscriptions: {}
      },
      persistent: {
        user: null
      }
    });
    let stored = Tools.deepFreeze(JSON.parse(localStorage.getItem('state')));
    if (stored)
      return Tools.setIn(initial, ["persistent"]);
    return initial;
  }

  static _changeRoute(state, payload) {
    const newR = payload.segments;
    if (state.session.route) {
      const oldR = state.session.route.segments;
      if (newR[0] === oldR[0] && newR[1] === oldR[1] && newR[2] === oldR[2] && newR[3] === oldR[3])
        return state;
    }
    //check for invalid route, and if so, redirect /home
    if (newR[0] === "editor" && !newR[2]) {
      Tools.navigate("/home/" + newR[1]);
      return state;
    }
    state = Tools.setIn(state, ['session', 'route'], payload);

    let actualVersion = newR[3];
    if (!actualVersion)
      actualVersion = AppState.getLatestVersionNumber(state.persistent, newR[1], newR[2]);
    return Tools.setIn(state, ['session', 'actualVersion'], actualVersion);
  }

  /**
   * AUTH
   */
  static _authChanged(state, user) {
    state = Tools.setIn(state, ['persistent', 'user'], null);
//        return state;
    return Tools.setIn(state, ['session', 'auth'], AppState.makeUser(null, user));
  }

  static _signIn(state) {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    return state;
  }

  static _signOut(state) {
    firebase.auth().signOut();
    return state;
  }

  /**
   * DB INITIATED EVENTS
   */
  static _newUserData(state, payload) {
    if (state.session.auth !== payload.user)
      return Tools.setIn(state, ["session", "errorMsg"], "wtf?? loading a user not authorized??");
    return Tools.setIn(state, ["persistent", "user"], AppState.makeUser(payload.data.id, payload.user));
  }

  static _newVersionSubscription(state, subscription) {
    if (state.session.subscriptions.versions)
      state.session.subscriptions.versions.unsubscribe();
    return Tools.setIn(state, ['session', 'subscriptions', 'versions'], subscription);
  }

  static _newProjectsSubscription(state, subscription) {
    if (state.session.subscriptions.projects)
      state.session.subscriptions.projects.unsubscribe();
    return Tools.setIn(state, ['session', 'subscriptions', 'projects'], subscription);
  }

  static _newProjects(state, payload) {
    return Tools.filterFirestore(state, ["persistent", "users", payload.username, "projects"], payload.ids);
  }

  static _newVersions(state, payload) {
    let project = payload.project;
    let owner = payload.owner;
    let versionsShallow = payload.versions;
    const segments = state.session.route.segments;
    state = Tools.filterFirestore(state, ["persistent", "users", owner, "projects", project, "versions"], versionsShallow);
    const latestVersionNumber = AppState.getLatestVersionNumber(state.persistent, segments[1], segments[2]);
    state = Tools.filterFirestore(state, ["persistent", "users", owner, "projects", project, "latestVersion"], latestVersionNumber);

    if (!segments[3] && segments[1] === owner && segments[2] === project)
      state = Tools.setIn(state, ['session', 'actualVersion'], latestVersionNumber);
    return state;
  }

  static _newFiles(state, payload) {
    let owner = payload.owner;
    let project = payload.project;
    let version = payload.version;
    let files = payload.files;
    state = Tools.setIn(state, ['persistent', 'users', owner, 'projects', project, 'versions', version, 'files'], files);


//        debugger;
    //todo here we should test if the new files are the same as the editFiles,
    //todo and if so update version and remove the parts of the editFiles from the
    //todo if there are no conflict, only other files that are updated,
    //todo then the version we are working on can be updated seamlessly.
    if (
      state.session.route.segments[1] === owner &&
      state.session.route.segments[1] === project &&
      state.session.actualVersion < version &&
      state.session.edits
    ) {
      let newEdits = Object.assign({}, state.session.edits);

    }
    return state;
    //todo remove from edits if the update file(s) are the same as the edits
//        let cp = state.persistent.currentProject;
//        if (cp.owner !== res.owner || cp.project !== res.project)
//          return;
//
//        let latestVersion = AppState.getLatestVersionNumber(state.persistent, cp.owner, cp.project);
//        if ((cp.version && cp.version === res.version) || (latestVersion === res.version)) {
//          persistent = Tools.setIn(persistent, ['currentProject', 'files'], res.files);
//          persistent = Tools.setIn(persistent, ['currentProject', 'actualVersion'], res.version);
//          this._update(persistent, state.session, e.type);
//        }
  }

  /**
   * USER INITIATED EVENTS
   */
  static _selectProject(state, id) {
    Tools.navigate(`/editor/${state.persistent.user.name}/${id}`);
    return state;
  }

  static _selectVersion(state, data) {
    Tools.navigate(`/editor/${data.owner}/${data.project}/${data.version}`);
    return state;
  }

  static _addProject(state, payload) {
    return Tools.setIn(state, ["session", "edits", state.persistent.user.name, "projects", payload], {created: new Date().getTime()});
  }

  static _removeProject(state, payload) {
    return Tools.setIn(state, ["session", "edits", state.persistent.user.name, "projects", payload], {deleted: new Date().getTime()});
  }

  static _fileEdited(state, payload) {
    const filename = payload.name;
    const value = payload.value;
    const owner = state.session.route.segments[1];
    const project = state.session.route.segments[2];
    return Tools.setIn(state, ["session", "edits", owner, "projects", project, "versions", "workingCopy", "files", filename], {
      name: filename,
      value: value,
      timestamp: new Date().getTime()
    });
  }

  static _addFile(state, payload) {
    const filename = payload.filename;
    const username = state.persistent.user.name;
    const owner = state.session.route.segments[1];
    const project = state.session.route.segments[2];
    return Tools.setIn(state, ["session", "edits", owner, "projects", project, "versions", "workingCopy", "files", filename], {
      name: filename,
      value: AppState.getDefaultText(filename, username),
      timestamp: new Date().getTime()
    });
//        let makeView = AppState.makeView(state.persistent.edits, state.persistent.currentProject, state.persistent.users);
//        persistent = Tools.setIn(persistent, ["view"], makeView);
  }

  static _removeFile(state, payload) {
    const filename = payload;
    const owner = state.session.route.segments[1];
    const project = state.session.route.segments[2];
    return Tools.setIn(state, ["session", "edits", owner, "projects", project, "versions", "workingCopy", "files", filename], null);
  }

  static getDefaultText(filename, username) {
    const ext = filename.split('.').pop();
    if (ext === 'html')
      return "<!-- created at " + new Date() + " by " + username + "-->"; //annoying bug in webstorm crashes on these backtick quotes
    if (ext === 'css')
      return `/* created at ${new Date()} by ${username} */`;
    if (ext === 'js')
      return `// created at ${new Date()} by ${username}`;
  }
}