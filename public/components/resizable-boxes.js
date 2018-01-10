class ResizableBoxes extends HyperHTMLElement {

  /**
   * Creates an instance of ResizableBoxes
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();

    this.shadowRoot.querySelector("#slot").addEventListener('slotchange', this._detectBoxes.bind(this));
    setTimeout(this._detectBoxes.bind(this), 0);

    this.state._boxes = [];
  }

  render() {
    return this.html`
      <style>${ResizableBoxes._style()}</style>
      <div id="grid">
        <slot id="slot"></slot>
      </div>
    `;
  }

  _detectBoxes() {
    let i = 0;
    this.shadowRoot.querySelector("#slot").assignedNodes().forEach((node) => {
      if (
        node.nodeType === 1 && 
        ['dom-repeat', 'template'].indexOf(node.localName) === -1 && 
        !node.classList.contains('separator')
      ) {
        this.state._boxes[i++] = {node: node};
      }
    });
    this._boxesChange();
  }

  _boxesChange() {
    this._makeGridColumns();
    this._makeSeparators();
  }

  _makeGridColumns() {
    this.state._boxes = this.state._boxes.map((node, i) => {
      node.width = node.width || 1;
      return node;
    });
    this._applyStyle();
  }

  _makeSeparators() {
    if (this.state._boxes.length > 1) {
      const divTemplate = document.createElement('div');
      divTemplate.classList.add('separator');
      for (let i = 1; i < this.state._boxes.length; i++) {
        let box = this.state._boxes[i].node;
        if (!box.previousElementSibling.classList.contains('separator')) {
          let div = draggable(divTemplate.cloneNode());
          div.addEventListener('draggingstart', (e) => {
            this.shadowRoot.querySelector("#grid").classList.add('unselectable');
          })
          div.addEventListener('dragging', (e) => {
            this._separatorDraged(e);
          })
          div.addEventListener('draggingend', (e) => {
            this.shadowRoot.querySelector("#grid").classList.remove('unselectable');
            this._refreshEditors();
          })
          this.insertBefore(div, box);
        }
      }
    } else {
      this.querySelectorAll('.separator').forEach((sep) => sep.remove());
    }
    const lastBox = this.state._boxes[this.state._boxes.length - 1];
    if (lastBox && lastBox.nextElementSibling.classList.contains('separator'))
      lastBox.nextElementSibling.remove()
  }

  _separatorDraged(e) {
    const width = this.getBoundingClientRect().width;
    const n = this.state._boxes.length;
    const fr = (width - ((n - 1) * 6)) / n;
    const px = e.detail.movementX / fr;
    const py = e.detail.movementY / fr;
    const prevBox = e.srcElement.previousElementSibling;
    const nextBox = e.srcElement.nextElementSibling;
    const prevIndex = this.state._boxes.findIndex((box) => box.node === prevBox);
    const nextIndex = this.state._boxes.findIndex((box) => box.node === nextBox);
    const frSum = this.state._boxes[prevIndex].width + this.state._boxes[nextIndex].width;
    this.state._boxes[prevIndex].width += px;
    this.state._boxes[nextIndex].width -= px;
    if (this.state._boxes[prevIndex].width < 120 / fr) {
      this.state._boxes[prevIndex].width = 120 / fr;
      this.state._boxes[nextIndex].width = frSum - 120 / fr;
    }
    if (this.state._boxes[nextIndex].width < 120 / fr) {
      this.state._boxes[nextIndex].width = 120 / fr;
      this.state._boxes[prevIndex].width = frSum - 120 / fr;
    }
    this._applyStyle();
  }

  _applyStyle() {
    let gridColumns = '';
    for (let i = 0; i < this.state._boxes.length; i++) {
      gridColumns += `minmax(120px, ${this.state._boxes[i].width}fr)`;
      if (i < this.state._boxes.length - 1)
        gridColumns += ' 6px ';
    }
    this.shadowRoot.querySelector("#grid").style.gridTemplateColumns = gridColumns;
  }

  _refreshEditors() {
    for (let box of this.state._boxes)
      box.node.state.editor.refresh();
  }

  static _style() {
//language=CSS
    return `
      :host {
        display: flex;
        position: relative;
      }
      #grid {
        display: grid;
        height: 100%;
      }
      #grid.unselectable ::slotted(*) {
        user-select: none;
      }
      ::slotted(.separator) {
        display: inline-block;
        background-color: black;
        cursor: col-resize;
      }
    `;
  }
}
customElements.define("resizable-boxes", ResizableBoxes);