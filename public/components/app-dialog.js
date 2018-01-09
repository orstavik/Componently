class AppDialog extends HyperHTMLElement {

  /**
   * Creates an instance of AppDialog
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();

    this.shadowRoot.querySelector("#overlay").addEventListener('click', this.cancel);
  }

  render() {
    return this.html`
      <style>${AppDialog._style()}</style>

      <css-animation id="body">
        <slot></slot>
      </css-animation>
      <css-animation id="overlay"> </css-animation>
    `;
  }

  static _style() {
    //language=CSS
    return `
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        align-items: center;
        justify-content: center;
        z-index: 999;
      }
      :host(:not([opened])) {
        display: none;
      }
      #overlay {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: -1;
      }
      #overlay.animation-enter-active {
        animation: OverflowIn 0.2s ease-out;
      }
      #overlay.animation-leave-active {
        animation: OverflowIn 0.2s reverse ease-in;
      }
      #body {
        display: inline-block;
        max-width: 80vw;
        max-height: 80vh;
        border-radius: 3px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        box-shadow: var(--shadow-elevation-24dp);
      }
      #body.animation-enter-active {
        animation: WindowIn 0.2s ease-out;
      }
      #body.animation-leave-active {
        animation: WindowIn 0.2s reverse ease-in;
      }
      #body:not([active]) {
        opacity: 0;
      }
      @keyframes OverflowIn {
        from { opacity: 0 }
        to { opacity: 1 }
      }
      @keyframes WindowIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(1.2);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
    `;
  }


  open() {
    this.setAttribute("opened", "");
    this.shadowRoot.querySelector("#overlay").enter();
    this.shadowRoot.querySelector("#body").enter();
    this.$emit('dialog-opened');
  }

  async cancel() {
    await this.close();
    this.$emit('dialog-canceled');
  }

  close() {
    const closeAnimations = [
      this.shadowRoot.querySelector("#overlay").leave(),
      this.shadowRoot.querySelector("#body").leave()
    ];
    return Promise.all(closeAnimations).then(() => {
      this.removeAttribute("opened");
      this.$emit('dialog-closed');
    });
  }

  $emit(name, payload) {
    return this.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }
}

customElements.define("app-dialog", AppDialog);