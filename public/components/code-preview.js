class CodePreview extends HyperHTMLElement {

  /**
   * Creates an instance of CodePreview
   */
  constructor() {
    super();
  }

  updateState(owner, project, files) {
    if (
      this.state.owner === owner &&
      this.state.project === project &&
      this.state.files === files
    )
      return;
    this.state.owner = owner;
    this.state.project = project;
    this.state.files = files;

    CodePreview._updatePreviewCache(owner, project, files);
  }

  static async _updatePreviewCache(owner, project, files) {
    if (!owner || !project || !files)
      return;
    let path = "/" + owner + "/" + project + "/";
    let cache = await caches.open("preview");
    for (let filename in files) {
      let file = files[filename];
      let filetype = CodePreview.getType(filename);
      let myResponse = CodePreview._makeCacheableResponse(file.value, filetype);
      cache.put(path + filename, myResponse);
      if (filetype === "text/html") {
        let autoUpdater = `<script>window.addEventListener('storage',function(e) { if(e.key === '${path}') {window.location.reload();} });</scr` + `ipt>`;
        let reloadResponse = CodePreview._makeCacheableResponse(file.value + autoUpdater, filetype);
        cache.put(path + filename + "?autoload", reloadResponse);
      }
    }
    localStorage.setItem(path, new Date().getTime());
  }

  static _makeCacheableResponse(content, filetype) {
    let myBlob = new Blob([content], {type: filetype});
    let init = {"status": 200, "statusText": "SuperSmashingGreat!"};
    return new Response(myBlob, init);
  }

  static getType(filename) {
    let ext = filename.split(".").pop();
    let types = {
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json'
    };
    return types[ext];
  }

  openPreview(entry, autoload) {
    let path = "/preview/" + this.owner + "/" + this.project + "/" + entry + (autoload ? "?autoload" : "");
    window.open(path, 'Preview', "noopener,menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes");
  }
}
customElements.define("code-preview", CodePreview);