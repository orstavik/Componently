class AppReducers {

  /**
   * DB INITIATED EVENTS
   */

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
    // let projects = Tools.getIn(state, ["persistent", "users", payload.username, "projects"]);
    // projects = Tools.mergeDeepWithNullToDelete(projects, payload.ids);
    // return Tools.setIn(state, ["persistent", "users", payload.username, "projects"], projects);
  }

  static _newVersions(state, payload) {
    let project = payload.project;
    let owner = payload.owner;
    let versionsShallow = payload.versions;
    return Tools.filterFirestore(state, ["persistent", "users", owner, "projects", project, "versions"], versionsShallow);
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
//        let latestVersion = AppReducers.getLatestVersionNumber(state.persistent, cp.owner, cp.project);
//        if ((cp.version && cp.version === res.version) || (latestVersion === res.version)) {
//          persistent = Tools.setIn(persistent, ['currentProject', 'files'], res.files);
//          persistent = Tools.setIn(persistent, ['currentProject', 'actualVersion'], res.version);
//          this._update(persistent, state.session, e.type);
//        }
  }

  /**
   * USER INITIATED EVENTS
   */

  static _addProject(state, payload) {
    return Tools.setIn(state, ["session", "edits", state.persistent.user.nickname, "projects", payload], {created: new Date().getTime()});
  }

  static _removeProject(state, payload) {
    return Tools.setIn(state, ["session", "edits", state.persistent.user.nickname, "projects", payload], {deleted: new Date().getTime()});
  }

  static _fileEdited(state, payload) {
    const owner = payload.owner;
    const project = payload.project;
    const version = payload.version;
    const filename = payload.filename;
    const value = payload.value;
    return Tools.setIn(state, ["session", "edits", owner, "projects", project, "versions", version, "files", filename], {
      name: filename,
      value: value,
      timestamp: new Date().getTime()
    });
  }

  static _addFile(state, payload) {
    const filename = payload.filename;
    const username = state.persistent.user.nickname;
    const owner = state.session.route.segments[1];
    const project = state.session.route.segments[2];                                       //todo
    return Tools.setIn(state, ["session", "edits", owner, "projects", project, "versions", "workingCopy", "files", filename], {
      name: filename,
      value: AppReducers.getDefaultText(filename, username),
      timestamp: new Date().getTime()
    });
//        let makeView = AppReducers.makeView(state.persistent.edits, state.persistent.currentProject, state.persistent.users);
//        persistent = Tools.setIn(persistent, ["view"], makeView);
  }

  static _removeFile(state, payload) {
    const filename = payload;
    const owner = state.session.route.segments[1];
    const project = state.session.route.segments[2];                                       //todo
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

  /**
   * COMPUTE FUNCTIONS
   */

  static _makeActualVersionNumber(selected, project) {
    try {
      return selected ? selected : Object.keys(project.versions).map(n => Number(n)).sort((a, b) => b - a)[0];
    } catch (propertyOnNullObjectError) {
      return undefined;
    }
  }

  static _makeActualVersion(actualVersion, project) {
    try {
      return project.versions[actualVersion];
    } catch (propertyOnNullObjectError) {
      return undefined;
    }
  }

  static _makeProjectObject(owner, project, users) {
    try {
      return users[owner].projects[project];
    } catch (propertyOnNullObjectError) {
      return undefined;
    }
  }

  static _makeWorkingCopy(_editProjectObject, _actualVersion) {
    try {
      if (!_editProjectObject)
        return _actualVersion;
      let wcv = _editProjectObject.versions["workingCopy"];
      let mergedFiles = {};
      const workingCopyVersionFiles = wcv.files;
      if (workingCopyVersionFiles) {
        for (let filename in workingCopyVersionFiles) {
          if (workingCopyVersionFiles[filename].deleted)
            mergedFiles = Tools.setIn(mergedFiles, [filename], null);
          else
            mergedFiles = Tools.setIn(mergedFiles, [filename], workingCopyVersionFiles[filename]);
        }
      }
      return Tools.setIn(wcv, ["files"], mergedFiles);
    } catch (propertyOnNullObjectError) {
      return undefined;
    }
  }

  static _mergedProjectObject(savedProject, editedProject) {
    if (!savedProject)
      return editedProject;
    if (!editedProject)
      return savedProject;

  }

  /**
   * OBSERVE FUNCTIONS
   */
  static _addPersistentToLocalStorage(persistent) {
    localStorage.setItem('state', JSON.stringify(persistent));
  }

  static _projectsEdited(edits, name) {
    if (!edits || !name)
      return;
    let newProjects = edits[name].projects;
    for (let projectName in newProjects) {
      let proj = newProjects[projectName];
      const keys = Object.keys(proj);
      if (keys.length !== 1)
        continue;
      if (keys[0] === created)
        AppData.addProject(name, projectName);              //todo here we could await the result and throw an event
      else if (keys[0] === deleted)
        AppData.removeProject(name, projectName);           //todo here we could await the result and throw an event
    }
  }

  static _updateProjectsListener(username) {
    if (!username)
      return Tools.emit("controller-new-projects-subscription", null);
    const cb = ids => Tools.emit("controller-new-projects", {username: username, ids: ids});
    const unsubscribe = AppData.listenToProjects(username, cb);
    Tools.emit("controller-new-projects-subscription", {username: username, unsubscribe: unsubscribe});
  }

  static _updateVersionsListener(owner, project) {
    let subscription = null;
    if (owner && project) {
      const cb = data => Tools.emit("controller-new-versions", {owner: owner, project: project, versions: data});
      const unsubscribe = AppData.listenToVersions(owner, project, cb);
      subscription = {owner: owner, project: project, unsubscribe: unsubscribe};
    }
    Tools.emit("controller-new-version-subscription", subscription);
  }

  static async _observeMissingFilesForVersion(version, owner, project, versionNumber) {
    if (version && versionNumber && !version.files) {
      const files = await AppData.getFiles(owner, project, versionNumber);
      Tools.emit("controller-new-files", {owner: owner, project: project, version: versionNumber, files: files});
    }
  }

  static _editsChanged(edits) {
    Tools.debounce(AppDb._saveEdits.bind(null, edits), 5000);
  }

  static _saveEdits(edits) {
    if (!edits)
      return;
    for (let owner in edits) {
      let ownerObj = edits[owner];
      for (let project in ownerObj) {
        let latestVersionNumber = this.state.persistent.users[owner].projects[project].latestVersion;
        let latestFiles = this.state.persistent.users[owner].projects[project].versions[latestVersionNumber].files;
        AppData.addVersion({
          owner: owner,
          project: project,
          files: Tools.mergeDeepWithNullToDelete(latestFiles, ownerObj[project], this._frozen)
        });
      }
    }
  }
}