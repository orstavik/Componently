class AppState {

  constructor() {
    const persistent = JSON.parse(localStorage.getItem('state')) || {user: null};
    const initialState = {
      session: {
        subscriptions: {}
      },
      persistent: persistent
    };
    this.state = new JoiState(initialState);

    //router
    this.state.bindReduce("popstate", RouterReducer._changeRoute, true);

    //auth
    this.state.bindReduce('controller-auth-changed', UserReducers._authChanged, true);
    this.state.bindReduce('controller-sign-in', UserReducers._signIn, true);
    this.state.bindReduce('controller-sign-out', UserReducers._signOut, true);
    this.state.bindReduce('controller-user-nickname', UserReducers._userNickname, false);
    this.state.bindReduce('controller-new-user-data', UserReducers._newUserData, false);
    this.state.bindCompute("_userObject", UserReducers._makeUserObject, ["persistent.user.nickname", "persistent.users"]);
    this.state.bindObserve(UserReducers._userChanged, ["session.auth"]);

    this.state.bindReduce('controller-add-project', AppReducers._addProject, false);
    this.state.bindReduce('controller-remove-project', AppReducers._removeProject, false);
    this.state.bindReduce('controller-add-file', AppReducers._addFile, false);
    this.state.bindReduce('controller-remove-file', AppReducers._removeFile, false);
    this.state.bindReduce('controller-file-edited', AppReducers._fileEdited, false);
    //db
    this.state.bindReduce('controller-new-projects', AppReducers._newProjects, false);
    this.state.bindReduce('controller-new-versions', AppReducers._newVersions, false);
    this.state.bindReduce('controller-new-files', AppReducers._newFiles, false);
    this.state.bindReduce('controller-new-version-subscription', AppReducers._newVersionSubscription, false);
    this.state.bindReduce('controller-new-projects-subscription', AppReducers._newProjectsSubscription, false);

    this.state.bindCompute("_fullProjectObject", AppReducers._makeProjectObject, ["session.route.segments.1", "session.route.segments.2", "persistent.users"]);
    this.state.bindCompute("_actualVersionNumber", AppReducers._makeActualVersionNumber, ["session.route.segments.3", "_fullProjectObject"]);
    this.state.bindCompute("_actualVersion", AppReducers._makeActualVersion, ["_actualVersionNumber", "_fullProjectObject"]);
    this.state.bindCompute("_editProjectObject", AppReducers._makeProjectObject, ["session.route.segments.1", "session.route.segments.2", "session.edits"]);
    this.state.bindCompute("_editActualVersion", AppReducers._makeActualVersion, ["_actualVersionNumber", "_editProjectObject"]);
    this.state.bindCompute("_allFiles", AppReducers._mergeFilesAndEditedFiles, ["_actualVersion", "_editActualVersion"]);
    //todo fix this critical bug!
    // this.state.bindCompute("_allFiles", AppReducers._mergeFilesAndEditedFiles, ["_actualVersion.files", "_editActualVersion.files"]);
//        this.state.bindCompute("_workingCopyVersion", AppReducers._makeWorkingCopy, ["_editProjectObject", "_actualVersion"]);
//        this.state.bindCompute("_projectObjectWithWorkingCopy", AppReducers._mergedProjectObject, ["_fullProjectObject", "_editProjectObject"]);

    this.state.bindObserve(AppReducers._addPersistentToLocalStorage, ["persistent"]);
    this.state.bindObserve(AppReducers._observeMissingFilesForVersion, ["_actualVersion", "session.route.segments.1", "session.route.segments.2", "_actualVersionNumber"]);
    this.state.bindObserve(AppReducers._updateVersionsListener, ["session.route.segments.1", "session.route.segments.2"]);
    this.state.bindObserve(AppReducers._updateProjectsListener, ["persistent.user.nickname"]);
    this.state.bindObserve(AppReducers._projectsEdited, ["session.edits", "persistent.user.nickname"]);
//        this.state.bindObserve(AppReducers._editsChanged, ["session.edits"]);
  }
}