class NotfoundPage extends HyperHTMLElement {

  /**
   * Creates an instance of NotfoundPage
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();
  }

  render() {
    return this.html`
      <style>${NotfoundPage._style()}</style>
      <p> 404 </p>
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
}

customElements.define("notfound-page", NotfoundPage);