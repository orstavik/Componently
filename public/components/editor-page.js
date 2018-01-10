class EditorPage extends HyperHTMLElement {

  /**
   * Creates an instance of StatePath
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();

    Polymer.Gestures.addListener(this.shadowRoot.querySelector("#addFile"), "tap", this._addFile.bind(this));
    Polymer.Gestures.addListener(this.shadowRoot.querySelector("#openPreview"), "tap", this._openPreview.bind(this));
    Polymer.Gestures.addListener(this.shadowRoot.querySelector("#save"), "tap", this._saveChanges.bind(this));
    this.shadowRoot.querySelector("#changeVersion").addEventListener("change", this._changeVersion.bind(this));
    this.shadowRoot.querySelector("#editors").addEventListener("file-edited", this._fileEdited.bind(this));

    this.state._fileToEditorMap = {};
  }

  updateState(owner, project, version, versions, allFiles) {
    this.state.owner = owner;
    this.state.project = project;
    this.state.version = version;
    this.state.versions = versions;
    this.state._allFiles = allFiles;

    let res = {};
    for (let file of Object.values(allFiles||{}))
      res[file.name] = CodeEditor.makeOrUpdate(this.state._fileToEditorMap[file.name],file.name, file.value);
    this.state._fileToEditorMap = res;

    this.render();
  }

  render() {
    return this.html`
      <style>${EditorPage._style()}</style>

      <slide-bar>
        <div id="header">
          <div>
            <a id="homeLink" href="/home">&#60;</a>
          </div>
          <h2 id="title">${this.state.project}</h2>
          <div>
            <input type="text" id="newFileName" style="width: 120px;" placeholder="file">
            <button id="addFile">+</button>
            <button id="openPreview">Preview</button>
            <input hidden="${false}" type="text" id="versionComment" style="width: 120px;"
                   placeholder="version comment">
            <button id="save" hidden="${false}">Save</button>
            Version:
            <select id="changeVersion">
              ${Object.values(this.state.versions || {}).map(item => HyperHTMLElement.wire()`
                <option value="${item.name}" selected="${item.name === Tools.getInStr(this.state, "version.name")}">
                  ${item.name} ${item.comment}
                </option>
              `)}
            </select>
          </div>
        </div>
      </slide-bar>
      <resizable-boxes id="editors">
        ${Object.values(this.state._fileToEditorMap || {})}
      </resizable-boxes>
    `;
  }

  static _style() {
    //language=CSS
    return `
      :host {
          display: flex;
          height: 100vh;
          flex-direction: column;
      }
      #header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100vw;
          height: 60px;
          background-color: grey;
      }
      #homeLink {
          color: white;
          font-size: 30px;
          font-weight: bold;
          font-family: Arial;
          margin: 0 20px;
          text-decoration: none;
      }
      #title {
          color: white;
          margin: 0;
      }
      #editors {
          display: block;
          flex: 1;
      }
    `;
  }


  _fileEdited(e) {
    e.stopPropagation();
    this.$emit("controller-file-edited",
      {
        owner: this.state.owner,
        project: this.state.project,
        version: this.state.version.name,
        filename: e.detail.filename,
        value: e.detail.value
      }
    );
  }

  _changeVersion(e) {
    if (e.target.value) {
      const versionElect = {
        owner: this.state.owner,
        project: this.state.project,
        version: Number(e.target.value)
      };
      this.$emit('controller-select-version', versionElect);
    }
  }

  _addFile(e) {
    const name = this.shadowRoot.querySelector("#newFileName").value;
    if (!EditorPage.validateFileName(name))
      return alert("wrong filename!! " + name);
    this.$emit('controller-add-file', {filename: name, id: this.projectId, version: this.version});
    this.shadowRoot.querySelector("#newFileName").value = '';
  }

  static validateFileName(name) {
    if (!name)
      return false;
    const fileType = name.split(".").pop();
    return ["html", "css", "js", "json"].indexOf(fileType) !== -1;
  }

  _saveChanges() {               //todo this should be reshaped into a comment version
    alert("not implemented");
//        let comment = this.shadowRoot.querySelector("#versionComment").value;
//        this.$emit('controller-save-new-version', comment);
//        this.shadowRoot.querySelector("#versionComment").value = '';
  }

  _openPreview() {
    this.$emit("open-preview", {page: "index.html", autoload: true});
  }

  $emit(name, payload) {
    return this.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }
}

customElements.define("editor-page", EditorPage);