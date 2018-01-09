class AppShell extends HyperHTMLElement {

  /**
   * Creates an instance of AppShell
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    const persistent = JSON.parse(localStorage.getItem('state')) || {user: null};
    const initialState = {
      session: {
        subscriptions: {}
      },
      persistent: persistent
    };
    this.state = new ITObservableState(initialState);

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
//        this.state.bindCompute("_workingCopyVersion", AppReducers._makeWorkingCopy, ["_editProjectObject", "_actualVersion"]);
//        this.state.bindCompute("_projectObjectWithWorkingCopy", AppReducers._mergedProjectObject, ["_fullProjectObject", "_editProjectObject"]);

    this.state.bindObserve(AppReducers._addPersistentToLocalStorage, ["persistent"]);
    this.state.bindObserve(AppReducers._observeMissingFilesForVersion, ["_actualVersion", "session.route.segments.1", "session.route.segments.2", "_actualVersionNumber"]);
    this.state.bindObserve(AppReducers._updateVersionsListener, ["session.route.segments.1", "session.route.segments.2"]);
    this.state.bindObserve(AppReducers._updateProjectsListener, ["persistent.user.nickname"]);
    this.state.bindObserve(AppReducers._projectsEdited, ["session.edits", "persistent.user.nickname"]);
//        this.state.bindObserve(AppReducers._editsChanged, ["session.edits"]);

    this.render();

    const dialog = this.shadowRoot.querySelector("#nickDialog");
    dialog.addEventListener("dialog-canceled", this._signOut.bind(this));
    dialog.addEventListener("submit", this._submitNickname.bind(this));

    AppShell.initFirebase();

    window.addEventListener('ui-nickname-dialog', (e) => this.shadowRoot.querySelector("#nickDialog").open());

    window.addEventListener("state-changed", e => {
      // this.set("state", e.detail);
      if (!this.shadowRoot)
        return;
      this.shadowRoot.querySelector("home-page").updateState(e.detail.persistent ? e.detail.persistent.user : undefined, e.detail._userObject)
      this.shadowRoot.querySelector("editor-page").updateState(
        e.detail.session && e.detail.session.route && e.detail.session.route.segments ? e.detail.session.route.segments[1] : undefined,
        e.detail.session && e.detail.session.route && e.detail.session.route.segments ? e.detail.session.route.segments[2] : undefined,
        e.detail._actualVersion,
        e.detail._editActualVersion,
        e.detail._fullProjectObject ? e.detail._fullProjectObject.versions : undefined
      );
      this.shadowRoot.querySelector("code-preview").updateState(
        e.detail.session && e.detail.session.route && e.detail.session.route.segments ? e.detail.session.route.segments[1] : undefined,
        e.detail.session && e.detail.session.route && e.detail.session.route.segments ? e.detail.session.route.segments[2] : undefined,
        e.detail._editActualVersion ? e.detail._editActualVersion.files : undefined
      );
      this.shadowRoot.querySelector("app-pages").updateState(
        e.detail.session && e.detail.session.route && e.detail.session.route.segments ? e.detail.session.route.segments[0] : undefined
      );
    });
    // window.addEventListener("state-history-changed", e => console.log("history", e.detail));

    window.addEventListener('controller-select-project', AppShell._selectProject);
    window.addEventListener('controller-select-version', AppShell._selectVersion);
    window.addEventListener('open-preview', this._openPreview.bind(this));
    window.addEventListener('state-changed-debug', (e) => console.log(e.type));

    //initialize the state with route data.
    window.dispatchEvent(new Event("popstate"));
  }

  render() {
    return this.html`
      <style>${AppShell._style()}</style>
      <app-pages fallback="notfound">
        <home-page page="home"></home-page>
        <editor-page page="editor"></editor-page>
        <notfound-page page="notfound"></notfound-page>
      </app-pages>
  
      <code-preview></code-preview>
  
      <app-dialog id="nickDialog">
        <form>
          <p>Enter your nickname to register</p>
          <input type="text" id="nickname" placeholder="nickname">
          <input type="submit" value="Finish">
        </form>
      </app-dialog>
    `;
  }

  static _style() {
    //language=CSS
    return `
        :host {
            display: block;
        }
    `;
  }

  static _selectProject(e) {
    Tools.navigate(`/editor/${e.detail.owner}/${e.detail.project}`);
  }

  static _selectVersion(e) {
    Tools.navigate(`/editor/${e.detail.owner}/${e.detail.project}/${e.detail.version}`);
  }

  _openPreview(e) {
    this.shadowRoot.querySelector("code-preview").openPreview(e.detail.page, e.detail.autoload);
  }

  _submitNickname(e) {
    e.preventDefault();
    this.shadowRoot.querySelector("#nickDialog").close();
    Tools.emit('controller-user-nickname', this.shadowRoot.querySelector("#nickname").value);
    this.shadowRoot.querySelector("#nickname").value = '';
  }

  _signOut(e) {
    Tools.emit('controller-sign-out');
  }

  static initFirebase() {
    firebase.initializeApp({
      apiKey: "AIzaSyA2Bv86HdUKVodeuGON0vC7nPFikIlfzwQ",
      authDomain: "two-js-no.firebaseapp.com",
      databaseURL: "https://two-js-no.firebaseio.com",
      projectId: "two-js-no",
      storageBucket: "two-js-no.appspot.com",
      messagingSenderId: "1032974918154"
    });
    firebase.auth().onAuthStateChanged(user =>Tools.emit('controller-auth-changed', user));
  }
}

customElements.define("app-shell", AppShell);