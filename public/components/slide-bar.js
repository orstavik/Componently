class SlideBar extends HyperHTMLElement {

  /**
   * Creates an instance of StatePath
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();

    this.shadowRoot.querySelector("#trigger").addEventListener("mouseenter", this._slideIn.bind(this));
    this.shadowRoot.querySelector("#container").addEventListener("mouseleave", this._slideOut.bind(this));
  }

  render() {
    return this.html`
      <style>${SlideBar._style()}</style>
      <div id="trigger"></div>
      <div id="container">
        <slot></slot>
      </div>
    `;
  }

  _slideIn() {
    this.setAttribute("opened", "");
  }

  _slideOut() {
    this.removeAttribute("opened");
  }

  static _style() {
    //language=CSS
    return `
        :host {
            display: block;
            position: relative;
            z-index: 10;
        }
        :host #container {
            position: absolute;
            transition: 0.4s;
            transform: translateY(-100%);
        }
        :host([opened]) #container {
            transform: translateY(0);
        }
        #trigger {
            display: block;
            position: fixed;
            z-index: 1;
            top: 0;
            width: 100vw;
            height: 6px;
        }
    `;
  }
}

customElements.define("slide-bar", SlideBar);

