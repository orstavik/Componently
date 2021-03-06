class HomePage extends HyperHTMLElement {

  /**
   * update a computed trigger
   * @param {HyperHTMLElement} el
   * @param {Object} user
   * @param {Object} userData
   */
  static makeOrUpdate(el, user, userData) {
    el = el || new HomePage(true);
    el.updateState(user, userData);
    return el;
  }

  /**
   * Creates an instance of StatePath
   */
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.render();

    this.shadowRoot.querySelector("#signIn").addEventListener("click", this._signIn.bind(this));
    this.shadowRoot.querySelector("#signOut").addEventListener("click", this._signOut.bind(this));
    this.shadowRoot.querySelector("#gridContainer").addEventListener("click", this._selectProject.bind(this));
    this.shadowRoot.querySelector("#addProject").addEventListener("click", this._addProject.bind(this));
  }

  updateState(user, userData) {
    this.state.user = user;
    this.state.userData = userData;
    this.render();
  }

  render() {
    return this.html`
      <style>${HomePage._style()}</style>
      <header>
        <a href="/home">Code2JS</a>
        <div class="userBox" hidden="${!!this.state.user}">
          <button id="signIn">Sign In</button>
        </div>
        <div class="userBox" hidden="${!this.state.user}">
          <span>Let's code, ${this.state.user ? this.state.user.nickname : "anonymous"}!</span>
          <img src="${this.state.user ? this.state.user.photo : ''}" alt="user photo">
          <button id="signOut" area-label="Sign out">
            <svg class="signout-icon">
              <path
                  d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"/>
            </svg>
          </button>
        </div>
      </header>
      <main>
        <h2>Projects</h2>
        <hr>
        <ul id="gridContainer">
          ${this.getProjects().map(item => HyperHTMLElement.wire()`
            <li class="projectItem" data-id="${item}">
              <div style="flex: 1"></div>
              <div class="description">
                <h4>${item}</h4>
                <!-- <button on-tap="_removeProject">X</button> -->
              </div>
            </li>
          `)}
          <li id="addProject">
            <input type="text" id="newProjectName" placeholder="project">
            <button>Add project</button>
          </li>
        </ul>
      </main>
    `;
  }

  static _style() {
    //language=CSS
    return `
        :host {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        button:focus,
        input:focus {
            outline: none;
        }
        header {
            display: flex;
            position: relative;
            padding: 0 24px;
            background: #333333;
            align-items: center;
            box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14),
            0 1px 10px 0 rgba(0, 0, 0, 0.12),
            0 2px 4px -1px rgba(0, 0, 0, 0.4);
        }
        header a {
            flex: 1;
            margin: 12px 0;
            color: #00E676;
            text-decoration: none;
            font-family: 'Vollkorn SC';
            font-size: 48px;
            /*  animation: Pulse 1s ease-in-out alternate infinite;*/
        }
        .userBox {
            display: flex;
            align-items: center;
        }
        .userBox img {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            box-shadow: 0 0 3px 1px #000;
            filter: brightness(110%) contrast(120%);
            margin: 0 12px;
        }
        .userBox span {
            color: rgba(255, 255, 255, 0.7);
        }
        #signIn,
        #addProject button {
            background-color: rgba(0, 0, 0, 0);
            color: #00E676;
            padding: 6px 12px;
            border: 1px solid #00E676;
            border-radius: 4px;
            font-family: Quicksand;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.1s;
            cursor: pointer;
        }
        #signIn:active,
        #addProject button:active {
            background-color: #00E676;
            color: black;
            box-shadow: 0 0 8px 0px #00E676;
        }
        #signOut {
            border: none;
            background: transparent;
            transition: 0.1s;
            cursor: pointer;
        }
        #signOut:active {
            color: #00E676;
            filter: drop-shadow(0 0 3px);
        }
        #signOut .signout-icon {
            width: 32px;
            height: 32px;
            fill: rgba(255, 255, 255, 0.4);
            transition: 0.1s;
        }
        #signOut:hover .signout-icon {
            fill: rgba(255, 255, 255, 0.6);
        }
        #signOut:active .signout-icon {
            fill: #00E676;
        }
        main {
            flex: 1;
            padding: 24px;
            background-color: #555;
            color: #fff;
        }
        main h2 {
            letter-spacing: -1px;
            margin: 0;
        }
        main hr {
            border: 1px solid #fff;
            opacity: 0.3;
        }
        #gridContainer {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            grid-auto-rows: 200px;
            grid-gap: 16px;
            list-style: none;
            padding: 0;
        }
        #gridContainer li {
            display: flex;
            flex-direction: column;
            border-radius: 3px;
            background-color: #fff;
            transition: 0.28s cubic-bezier(0.4, 0, 0.2, 1);;
            box-shadow: 0 3px 4px 0 rgba(0, 0, 0, 0.14),
            0 1px 8px 0 rgba(0, 0, 0, 0.12),
            0 3px 3px -2px rgba(0, 0, 0, 0.4);
            cursor: pointer;
        }
        #gridContainer li:hover:not(#addProject) {
            box-shadow: 0 8px 10px 1px rgba(0, 0, 0, 0.14),
            0 3px 14px 2px rgba(0, 0, 0, 0.12),
            0 5px 5px -3px rgba(0, 0, 0, 0.4);
        }
        #gridContainer li:first-child {
            grid-row: 1 / 3;
            grid-column: 1 / 3;
        }
        #gridContainer li h4 {
            color: black;
            margin: 12px;
        }
        li#addProject {
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.2);
            box-shadow: inset 0 3px 4px 0 rgba(0, 0, 0, 0.14),
            inset 0 1px 8px 0 rgba(0, 0, 0, 0.12),
            inset 0 3px 3px -2px rgba(0, 0, 0, 0.4);
        }
        #addProject input {
            border: 1px solid #777;
            border-radius: 3px;
            padding: 8px;
            margin-bottom: 16px;
            background-color: rgba(0, 0, 0, 0.5);
            font-family: Quicksand;
            font-size: 16px;
            text-align: center;
            color: #00E676;
            text-shadow: 0 0 2px #00E676;
        }
        #addProject input::placeholder {
            text-shadow: none;
        }
        @keyframes Pulse {
            from {
                text-shadow: 0 0 4px #000,
                0 0 8px #00E676;
            }
            to {
                text-shadow: 0 0 4px #000,
                0 0 24px #00E676;
            }
        }
        *[hidden] {
            display: none !important;
        }
    `;
  }

  getProjects() {
    if (this.state.userData && this.state.userData.projects)
      return Object.keys(this.state.userData.projects);
    return [];
  }

  _signIn() {
    this.$emit('controller-sign-in');
  }

  _signOut() {
    this.$emit('controller-sign-out');
  }

  _addProject() {
    const name = this.shadowRoot.querySelector("#newProjectName").value;
    if (name) {
      this.$emit('controller-add-project', name);
      this.shadowRoot.querySelector("#newProjectName").value = '';
    }
  }

  _removeProject(e) {
    alert("not yet implemented");
    // this.$emit('controller-remove-project', e.target.previousElementSibling.textContent);
  }

  _selectProject(e) {
    let target;
    for (let item of e.path) {
      if (item.classList && item.classList.contains("projectItem"))
        target = item;
    }
    const project = target.dataset.id;
    this.$emit('controller-select-project', {owner: this.state.user.nickname, project: project});
  }

  $emit(name, payload) {
    return this.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }
}

customElements.define("home-page", HomePage);