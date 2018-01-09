class AppPages extends HyperHTMLElement {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();
  }

  static get observedAttributes() {
    return [
      'page'
    ];
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (attr == 'page')
      this._pageChanged(newValue);
  }

  updateState(page){
    this._pageChanged(page);
    this.setAttribute("page", page);
  }

  render() {
    return this.html`
      <style>${AppPages._style()}</style>
      <slot></slot>
    `;
  }

  static _style() {
    //language=CSS
    return `
      :host {
        display: block;
      }
      :host > ::slotted(:not(slot):not(.page-selected)) {
        display: none !important;
      }
    `;
  }

  _pageChanged(page) {
    if (['home','editor'].indexOf(page) === -1)
      page = 'notfound';
    const pages = this.shadowRoot.querySelector("slot").assignedNodes();
    for (let slotPage of pages) {
      if (slotPage.nodeName == '#text')
        continue;
      if (slotPage.getAttribute("page") === page){
        slotPage.classList.add("page-selected");
      }
      else
        slotPage.classList.remove("page-selected");
    }
  }
}

customElements.define("app-pages", AppPages);