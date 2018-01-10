class CodeEditor extends HyperHTMLElement {

  /**
   * Creates an instance of StatePath
   */
  static makeOrUpdate(el, name, mode, value, theme) {
    el = el || new CodeEditor(true);
    el.updateState(name, mode, value, theme);
    return el;
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this.state.editor = CodeMirror(this.shadowRoot, {
      value: this.state.value,
      mode: CodeEditor.modeFrom(this.state.mode),
      htmlMode: this.state.mode === 'html',
      autoCloseTags: this.state.mode === 'html',
      autoCloseBrackets: true,
      theme: this.state.theme,
      tabSize: 2,
      lineNumbers: true,
      lineWrapping: true
    });
    this.state.editor.on('change', (e) => {
      this.$emit('file-edited', {filename: this.state.name, value: e.getValue()});
    });
    this.shadowRoot.querySelector("#remove").addEventListener("click", this._removeFile.bind(this));
    window.addEventListener('resize', (e) => {
      this.$throttle(() => this._refreshEditor(), 1000/30);
    });
    setTimeout(() => {
      this._refreshEditor();
    }, 0);

    this.render();
  }

  updateState(name, mode, value, theme) {
    this.state.name = name;
    this.state.mode = mode;
    this.state.theme = 'material';
    this.state.value = value;

    this._updateEditor(value);
    this.render();
  }

  render() {
    return this.html`
      ${CodeEditor._style()}
      <div id="title">
        ${name}
        <span id="remove">x</span>
      </div>
    `;
  }

  static _style() {
    return `
    :host {
      display: inline-flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    #title {
      position: relative;
      padding: 4px;
      text-align: center;
      background: black;
      color: lightgray;
    }
    #remove {
      position: absolute;
      font-weight: bold;
      font-family: Arial;
      color: red;
      right: 6px;
      cursor: pointer;
    }
    .CodeMirror {
      flex: 1;
    }
    .CodeMirror-vscrollbar::-webkit-scrollbar-track
    {
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
      border-radius: 4px;
      background-color: transparent;
    }
    
    .CodeMirror-vscrollbar::-webkit-scrollbar
    {
      width: 8px;
      background-color: transparent;
    }
    
    .CodeMirror-vscrollbar::-webkit-scrollbar-thumb
    {
      border-radius: 10px;
      background-color: rgba(255,255,255,0.2);
    }`;
  }

  static modeFrom(type) {
    return ({
      css: 'css',
      html: 'text/html',
      js: 'javascript',
      json: 'javascript'
    })[type];
  }

  _refreshEditor() {
    this.state.editor.refresh()
  }

  _updateEditor(value) {
//        if (this.editor)
//          this.editor.setValue(this.value);
    if (this.state.editor && value !== this.state.editor.getValue())
      console.log("we have a different text in editor and state!!");
  }

  _removeFile() {
    this.$emit('controller-remove-file', this.state.name)
  }

  $emit(name, payload) {
    return this.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }

  $throttle(callback, ms) {
    this._throttleTimeout = this._throttleTimeout || null;
    if (!this._throttleTimeout)
      this._throttleTimeout = setTimeout(() => {
        this._throttleTimeout = null;
        callback();
      }, ms);
  }
}

customElements.define("code-editor", CodeEditor);