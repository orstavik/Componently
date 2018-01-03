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

  $listener(node, events) {
    return {
      _node: node,
      _events: events.length === 1 ? [events] : events,
      subscribe: function (cb) {
        this._events.forEach((_event) => {
          this._node.addEventListener(_event, this._callback);
        });

        this._callback = cb;

        return () => {
          this._events.forEach((_event) => {
            this._node.removeEventListener(_event, this._callback);
          });

          delete this._callback;
        };
      }
    }
  }

  $debounce(callback, ms) {
    let _debouncers = window.__superSpecificPolymerDebouncerLongNameArray;
    if (!_debouncers)
      _debouncers = window.__superSpecificPolymerDebouncerLongNameArray = {};
    _debouncers[callback.name] = Polymer.Debouncer.debounce(
      _debouncers[callback.name], // initially undefined
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
