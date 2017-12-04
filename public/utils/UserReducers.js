class UserReducers {

  static makeUser(user) {
    if (!user)
      return null;
    return {
      displayName: user.displayName,
      email: user.email,
      photo: user.photoURL,
      uid: user.uid
    }
  }

  /* Reducers */

  static _authChanged(state, auth) {
    state = Tools.setIn(state, ['persistent', 'user'], null);
    return Tools.setIn(state, ['session', 'auth'], UserReducers.makeUser(auth));
  }

  static _signIn(state) {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    return state;
  }

  static _signOut(state) {
    firebase.auth().signOut();
    return state;
  }

  static _userNickname(state, nickname) {
    return Tools.setIn(state, ['session', 'auth', 'nickname'], nickname);
  }

  static _newUserData(state, payload) {
    if (state.session.auth !== payload.auth)
      return Tools.setIn(state, ["session", "errorMsg"], "wtf?? loading a user not authorized??");
    state = Tools.setIn(state, ["session", "auth"], null);
    state = Tools.setIn(state, ["persistent", "user"], payload.auth);
    return Tools.setIn(state, ["persistent", "user", "nickname"], payload.nickname);
  }

  /* Computeds */

  static _makeUserObject(user, users) {
    return users && user ? users[user] : undefined;
  }

  /* Observers */

  static async _userChanged(auth) {
    if (!auth || !auth.uid)
      return;
    if (auth.nickname) {
      await AppData.addUserToDB(auth.uid, auth.nickname);
      return Tools.emit("controller-new-user-data", {
        auth: auth,
        nickname: auth.nickname
      });
    }
    let userData = await AppData.getCurrentUserData(auth.uid); //wait for the nickname to load
    if (userData)
      return Tools.emit("controller-new-user-data", {
        auth: auth,
        nickname: userData.id
      });
    return Tools.emit("ui-nickname-dialog");
  }
}