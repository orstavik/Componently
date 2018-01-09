class CssAnimation extends HyperHTMLElement {

  /**
   * TODO add observer for attributes
   * Creates an instance of CssAnimation
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();
  }

  connectedCallback() {
    // super.connectedCallback();
    if (this.getAttribute("appear"))
      this.animate('appear');
  }

  render() {
    return this.html`
      <slot></slot>
    `;
  }

  toggle() {
    this.getAttribute("active") ? this.leave() : this.enter();
  }

  async enter() {
    await this.animate('enter');
    this.setAttribute("active", "");
  }

  leave() {
    this.removeAttribute("active");
    return this.animate('leave');
  }

  async animate(name) {
    this.$emit('animation-before-' + name);
    this.classList.add('animation-' + name + '-active');
    await this.$once('animationend');
    this.classList.remove('animation-' + name + '-active');
    this.$emit('animation-after-' + name);
  }

  $emit(name, payload) {
    return this.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }

  $once(name) {
    return new Promise((resolve, reject) => {
      const callback = (e) => {
        this.removeEventListener(name, callback);
        resolve(e);
      };
      this.addEventListener(name, callback);
    });
  }
}

customElements.define("css-animation", CssAnimation);