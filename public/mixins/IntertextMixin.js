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

  $commit(name, payload, method) {
    this[method]({type: name, detail: {payload: payload}});
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
}