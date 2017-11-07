const IntertextMixin = (superClass) => class extends superClass {

  $emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: detail
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

  $navigate(path) {
    history.pushState({}, null, path);
    window.dispatchEvent(new CustomEvent('location-changed'));
  }
  
}