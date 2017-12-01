const IntertextMixin = (superClass) => class extends superClass {

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

  $throttle(callback, ms) {
    this._throttleTimeout = this._throttleTimeout || null;
    if (!this._throttleTimeout)
      this._throttleTimeout = setTimeout(() => {
        this._throttleTimeout = null;
        callback();
      }, ms);
  }

  $debounce(callback, ms) {
    this._polymerDebouncer = Polymer.Debouncer.debounce(
      this._polymerDebouncer, // initially undefined
      Polymer.Async.timeOut.after(ms),
      callback);
  }

  $fullPathCheck(key, ar) {
    if (!this.__polymerPatch_CheckFullPath)
      this.__polymerPatch_CheckFullPath = {};
    let theSame = true;
    for (let i = 0; i< ar.length; i++) {
      let path = key + "." + i;
      let obj = ar[i];
      if (this.__polymerPatch_CheckFullPath[path] !== obj) {
        this.__polymerPatch_CheckFullPath[path] = obj;
        theSame = false;
      }
    }
    return theSame;
  }
  //when we do fullPathCheck, we want to skip the initial execution when the value being checked is undefined.
  //that is why we dont run the extra check below
  // && (obj !== undefined || Object.keys(this.__polymerPatch_CheckFullPath).indexOf(path) !== -1)
};