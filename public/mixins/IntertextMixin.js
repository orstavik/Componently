const IntertextMixin = (superClass) => class extends superClass {

  $emit(name, payload) {
    return new Promise((resolve, reject) => {
      this.dispatchEvent(new CustomEvent(name, {
        composed: true,
        bubbles: true,
        detail: {
          payload: payload,
          resolve: resolve,
          reject: reject
        }
      }));
    });
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

  $navigate(path) {
    history.pushState({}, null, path);
    window.dispatchEvent(new CustomEvent('location-changed'));
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
}