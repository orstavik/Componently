class CodeEditor extends HyperHTMLElement {

  /**
   * Creates an instance of StatePath
   */
  static makeOrUpdate(el, name, value) {
    el = el || new CodeEditor(true);
    el.updateState(name, value);
    return el;
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this.render();

    window.addEventListener('resize', (e) => {
      this.$throttle(() => this._refreshEditor(), 1000 / 30);
    });
    this.shadowRoot.querySelector("#remove").addEventListener("click", this._removeFile.bind(this));

    CodeEditor.loadExternalCss().then(cssText => {
      this.state.externalStyle = cssText;
      this.render();
    });
  }

  setUpEditor(parent, value, type) {
    const theme = "material";

    let editor = CodeMirror(parent, {
      value: value,
      mode: CodeEditor.modeFrom(type),
      htmlMode: type === 'html',
      autoCloseTags: type === 'html',
      autoCloseBrackets: true,
      theme: theme,
      tabSize: 2,
      lineNumbers: true,
      lineWrapping: true
    });
    editor.on('change', (e) => {
      this.$emit('file-edited', {filename: this.getAttribute("filename"), value: e.getValue()});
    });
    return editor;
  }

  updateState(name, value) {
    this.setAttribute("filename", name);
    this.setAttribute("mode", name.split(".").pop());
    this.updateEditor(value);
    this.render();
    this._refreshEditor();
  }

  render() {
    return this.html`
      <style>${this.state.externalStyle || ""}</style>
      <style>${CodeEditor._style()}</style>
      <div id="title">
        ${this.getAttribute("filename")}
        <span id="remove">x</span>
      </div>
    `;
  }

  static async loadExternalCss() {
    const a = fetch("/libs/codemirror.css");
    const b = fetch("/libs/material.css");
    const A = await a;
    const B = await b;
    return (await A.text()) + "\n" + (await B.text());
  }

  static _style() {
    //language=CSS
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
        .CodeMirror-vscrollbar::-webkit-scrollbar-track {
            -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            background-color: transparent;
        }
        .CodeMirror-vscrollbar::-webkit-scrollbar {
            width: 8px;
            background-color: transparent;
        }
        .CodeMirror-vscrollbar::-webkit-scrollbar-thumb {
            border-radius: 10px;
            background-color: rgba(255, 255, 255, 0.2);
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
    this.state.editor.refresh();
  }

  updateEditor(value) {
    if (!this.state.editor) {
      this.state.editor = this.setUpEditor(this.shadowRoot, value, this.getAttribute("mode"));
    }
    if (this.state.editor && value !== this.state.editor.getValue())
      console.log("we have a different text in editor and state!!");
  }

  _removeFile() {
    this.$emit('controller-remove-file', this.getAttribute("filename"));
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