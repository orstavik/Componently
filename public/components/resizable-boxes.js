class ResizableBoxes extends HyperHTMLElement {

  /**
   * Creates an instance of ResizableBoxes
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();

    this._grid = this.shadowRoot.querySelector("#grid");
    this._slot = this.shadowRoot.querySelector("#slot");
    this._slot.addEventListener('slotchange', this._setUpBoxes.bind(this));

    this._setUpBoxes();
    this.state.minWidth = 120;
    this.state.sepWidth = 6;
  }

  render() {
    return this.html`
      <style>${ResizableBoxes._style()}</style>
      <div id="grid">
        <slot id="slot"></slot>
      </div>
    `;
  }

  _setUpBoxes() {
    const slottedChildren = ResizableBoxes.getResizeableSlottedChildren(this._slot.assignedNodes());
    if (ResizableBoxes.noChangeInSlottedChildren(this.state._boxes, slottedChildren))
      return;
    for (let node of this._slot.assignedNodes()) {
      if (node.classList && node.classList.contains('separator'))
        node.remove();
    }
    this.state._boxes = slottedChildren;
    for (let i = this.state._boxes.length - 1; i > 0; i--)
      this.insertBefore(this._makeDraggableSeparator(), this.state._boxes[i].node);
    this._applyStyle();
  }

  static getResizeableSlottedChildren(assignedNodes) {
    let _boxes = [];
    for (let node of assignedNodes) {
      if (node.nodeType === 1 && !(node.classList && node.classList.contains('separator')))
        _boxes.push({node: node, width: 1});
    }
    return _boxes;
  }

  _makeDraggableSeparator() {
    let div = draggable(ResizableBoxes._separatorTemplate.cloneNode());
    div.addEventListener('draggingstart', (e) => {
      this._grid.classList.add('unselectable');
    });
    div.addEventListener('dragging', (e) => {
      this._separatorDraged(e);
    });
    div.addEventListener('draggingend', (e) => {
      this._grid.classList.remove('unselectable');
      //todo, this should fire an event instead probably.
      for (let box of this.state._boxes)
        box.node.state.editor.refresh();
    });
    return div;
  }

  _separatorDraged(e) {
    const fr = ResizableBoxes.calcFraction(this.getBoundingClientRect().width, this.state._boxes.length, this.state.sepWidth);
    const prevBox = e.srcElement.previousElementSibling;
    const nextBox = e.srcElement.nextElementSibling;
    const prevIndex = this.state._boxes.findIndex((box) => box.node === prevBox);
    const nextIndex = this.state._boxes.findIndex((box) => box.node === nextBox);
    const frSum = this.state._boxes[prevIndex].width + this.state._boxes[nextIndex].width;
    this.state._boxes[prevIndex].width += e.detail.movementX / fr;
    this.state._boxes[nextIndex].width -= e.detail.movementX / fr;
    const min = this.state.minWidth;
    if (this.state._boxes[prevIndex].width < min / fr) {
      this.state._boxes[prevIndex].width = min / fr;
      this.state._boxes[nextIndex].width = frSum - min / fr;
    }
    if (this.state._boxes[nextIndex].width < min / fr) {
      this.state._boxes[nextIndex].width = min / fr;
      this.state._boxes[prevIndex].width = frSum - min / fr;
    }
    this._applyStyle();
  }

  _applyStyle() {
    this._grid.style.gridTemplateColumns = ResizableBoxes.boxesToCssGridStyleText(this.state._boxes);
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

  static calcFraction(w, n, s) {
    return (w - ((n - 1) * s)) / n;
  }

  static boxesToCssGridStyleText(boxes) {
    return boxes.map(box => box.width).map(width => `minmax(120px, ${width}fr)`).join(" 6px ");
  }

  static createSeparatorElement() {
    const div = document.createElement('div');
    div.classList.add('separator');
    return div;
  }

  static noChangeInSlottedChildren(old, nevv) {
    if (!old || !nevv || old.length !== nevv.length)
      return false;
    for (let i = 0; i < old.length; i++) {
      if (old[i].node !== nevv[i].node)
        return false;
    }
    return true;
  }
}

ResizableBoxes._separatorTemplate = ResizableBoxes.createSeparatorElement();

customElements.define("resizable-boxes", ResizableBoxes);