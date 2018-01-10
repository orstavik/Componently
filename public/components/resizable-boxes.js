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
    this.state._gridColumns = [];
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
    this.state._boxes = this.shadowRoot.querySelector("#slot").assignedNodes().filter((node) => {
      return node.nodeType === 1 && ['dom-repeat', 'template'].indexOf(node.localName) === -1 && !node.classList.contains('separator')
    });
    this._boxesChange();
  }

  _boxesChange() {
    this._makeGridColumns();
    this._makeSeparators();
  }

  _makeGridColumns() {
    this.state._gridColumns = this.state._boxes.map((node, i) => this.state._gridColumns[i] || 1);
    this._applyStyle();
  }

  _makeSeparators() {
    if (this.state._boxes.length > 1) {
      const divTemplate = document.createElement('div');
      divTemplate.classList.add('separator');
      for (let i = 1; i < this.state._boxes.length; i++) {
        let box = this.state._boxes[i];
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
    const n = this.state._gridColumns.length;
    const fr = (width - ((n - 1) * 6)) / n;
    const px = e.detail.movementX / fr;
    const py = e.detail.movementY / fr;
    const prevBox = e.srcElement.previousElementSibling;
    const nextBox = e.srcElement.nextElementSibling;
    const prevIndex = this.state._boxes.indexOf(prevBox);
    const nextIndex = this.state._boxes.indexOf(nextBox);
    const frSum = this.state._gridColumns[prevIndex] + this.state._gridColumns[nextIndex];
    this.state._gridColumns[prevIndex] += px;
    this.state._gridColumns[nextIndex] -= px;
    if (this.state._gridColumns[prevIndex] < 120 / fr) {
      this.state._gridColumns[prevIndex] = 120 / fr;
      this.state._gridColumns[nextIndex] = frSum - 120 / fr;
    }
    if (this.state._gridColumns[nextIndex] < 120 / fr) {
      this.state._gridColumns[nextIndex] = 120 / fr;
      this.state._gridColumns[prevIndex] = frSum - 120 / fr;
    }
    this._applyStyle();
  }

  _applyStyle() {
    let gridColumns = '';
    for (let i = 0; i < this.state._gridColumns.length; i++) {
      gridColumns += `minmax(120px, ${this.state._gridColumns[i]}fr)`;
      if (i < this.state._boxes.length - 1)
        gridColumns += ' 6px ';
    }
    this.shadowRoot.querySelector("#grid").style.gridTemplateColumns = gridColumns;
  }

  _refreshEditors() {
    for (let box of this.state._boxes)
      box.state.editor.refresh();
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