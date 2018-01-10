class AppShell extends HyperHTMLElement {

  render() {
    return this.html`
      <style>
        :host {
          display: block;
        }
      </style>
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

  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this.render();

    this.state.homePage = this.shadowRoot.querySelector("home-page");
    this.state.editorPage = this.shadowRoot.querySelector("editor-page");
    this.state.codePreview = this.shadowRoot.querySelector("code-preview");
    this.state.appPages = this.shadowRoot.querySelector("app-pages");
    this.state.dialog = this.shadowRoot.querySelector("#nickDialog");
    this.state.nickName = this.shadowRoot.querySelector("#nickName");

    this.state.dialog.addEventListener("dialog-canceled", this._signOut.bind(this));
    this.state.dialog.addEventListener("submit", this._submitNickname.bind(this));

    window.addEventListener('ui-nickname-dialog', (e) => this.state.dialog.open());
    window.addEventListener("state-changed", this.stateChanged.bind(this));

    window.addEventListener('controller-select-project', AppShell._selectProject);
    window.addEventListener('controller-select-version', AppShell._selectVersion);
    window.addEventListener('open-preview', this._openPreview.bind(this));
    // window.addEventListener('state-changed-debug', (e) => console.log("debug type", e.type));
    // window.addEventListener("state-history-changed", e => console.log("history", e.detail));

    //initialize the state with route data.
    window.dispatchEvent(new Event("popstate"));
  }

  stateChanged(e) {
    const state = e.detail;
    this.state.homePage.updateState(
      Tools.getInStr(state, 'persistent.user'),
      Tools.getInStr(state, '_userObject')
    );
    this.state.editorPage.updateState(
      Tools.getInStr(state, 'session.route.segments.1'),
      Tools.getInStr(state, 'session.route.segments.2'),
      Tools.getInStr(state, '_actualVersion'),
      Tools.getInStr(state, '_fullProjectObject.versions'),
      Tools.getInStr(state, '_allFiles')
    );
    this.state.codePreview.updateState(
      Tools.getInStr(state, 'session.route.segments.1'),
      Tools.getInStr(state, 'session.route.segments.2'),
      Tools.getInStr(state, '_editActualVersion.files')             //todo not sure if this is the right files..
    );
    this.state.appPages.setAttribute("page",
      Tools.getInStr(state, 'session.route.segments.0')
    );
  }

  static _selectProject(e) {
    Tools.navigate(`/editor/${e.detail.owner}/${e.detail.project}`);
  }

  static _selectVersion(e) {
    Tools.navigate(`/editor/${e.detail.owner}/${e.detail.project}/${e.detail.version}`);
  }

  _openPreview(e) {
    this.state.codePreview.openPreview(e.detail.page, e.detail.autoload);
  }

  _submitNickname(e) {
    e.preventDefault();
    this.state.dialog.close();
    Tools.emit('controller-user-nickname', this.state.nickName.value);
    this.state.nickName.value = '';
  }

  _signOut(e) {
    Tools.emit('controller-sign-out');
  }
}

customElements.define("app-shell", AppShell);