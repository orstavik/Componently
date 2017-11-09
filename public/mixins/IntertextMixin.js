const IntertextMixin = (superClass) => class extends superClass {

  $emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: detail
    }));
  }

  $commit(name, detail) {
    this.dispatchEvent(new CustomEvent('state-'+name, {
      composed: true,
      bubbles: true,
      detail: detail
    }));
  }
  
  $action(name, detail) {
    return new Promise((resolve, reject) => {
      this.dispatchEvent(new CustomEvent('controller-'+name, {
        composed: true,
        bubbles: true,
        detail: {
          payload: detail,
          promise: {
            resolse: resolve,
            reject: reject
          }
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
  
}