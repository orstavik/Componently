class AppData {

  /**
   * APP SPECIFIC
   */
  static async getCurrentUserData(uid) {
    const db = firebase.firestore();
    const coll = await db.collection("users").where("uids." + uid, "==", true).get();
    // return new Promise((resolve, reject) => {
    //   setTimeout(function(){
    //     resolve(coll.docs[0]);
    //   }, 30000);
    // });
    return coll.docs[0];
  }

  // static async saveCurrentProject(username, currentProject) {
  //   const db = firebase.firestore();
  //   currentProject = Tools.removeUndefinedFields(currentProject);
  //   try {
  //     await db.doc(`users/${username}`).update({
  //       currentProject: currentProject
  //     });
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  static async addProject(username, id) {
    const db = firebase.firestore();
    const batch = db.batch();
    let ref = db.doc(`users/${username}/projects/${id}`);
    batch.set(ref, {name: id});
    ref = db.doc(`users/${username}/projects/${id}/versions/0`);
    batch.set(ref, {name: 0});
    ref = db.doc(`users/${username}/projects/${id}/versions/0/files/index.html`);
    batch.set(ref, {
      name: 'index.html',
      value: `<!-- created at ${new Date()} by ${username} -->`
    });
    await batch.commit();
  }

  static listenToProjects(username, cb) {
    return AppData.listenCollectionIds(`users/${username}/projects`, cb);
  }

  static async removeProject(username, id) {
    const db = firebase.firestore();
    const deleteDoc = db.doc(`users/${username}/projects/${id}`).delete();
    const deleteCollections = AppData.deleteCollection(db, db.collection(
      `users/${username}/projects/${id}/versions`));
    //todo do we need to remove all the /versions/version/files too?
    await deleteDoc;
    await deleteCollections;
  }

  static listenToVersions(username, projectId, cb) {
    return AppData.listenCollectionIds(`users/${username}/projects/${projectId}/versions`, cb);
  }

  //todo, a little unsafe, get the next version number inside a transaction in AppData
  static async addVersion(cp) {
    let username = cp.owner, project = cp.project, files = cp.files;
    const db = firebase.firestore();

    let versionsRef = db.collection(`users/${username}/projects/${project}/versions/`)
                        .orderBy("name", "desc")
                        .limit(1);
    let latestVersions = await versionsRef.get();
    if (latestVersions.empty)
      throw new Error("wtf?!");
    const version = latestVersions.docs[0].data().name + 1;

    const batch = db.batch();
    const newVersionRef = db.doc(`users/${username}/projects/${project}/versions/${version}`);
    batch.set(newVersionRef, {name: version});
    for (let key in files) {
      let file = files[key];
      if (file.sameAsVersion === null)
        file = Tools.setIn(file, ["sameAsVersion"], version, false);
      let fileRef = db.doc(`users/${username}/projects/${project}/versions/${version}/files/${file.name}`);
      batch.set(fileRef, file);
    }
    /*await */batch.commit();
    // let res = {};
    // res[username] = {};
    // res[username][versions] = {};
    // res[username][versions][version] = {name: version, files: files};
    // return res;
  }

  static async getFiles(username, projectId, version) {
    return AppData.getCollectionIds(`users/${username}/projects/${projectId}/versions/${version}/files`);
  }

  /**
   * GENERIC METHODS
   */
  static async getCollectionIds(queryPath) {
    const db = firebase.firestore();
    const querySnap = await db.collection(queryPath).get();
    const collection = {};
    for (let doc of querySnap.docs)
      collection[doc.id] = doc.data();
    return collection;
  }

  static listenCollectionIds(query, cb) {
    const db = firebase.firestore();
    return db.collection(query).onSnapshot(snap => {
      let res = {};
      for (let doc of snap.docs)
        res[doc.id] = doc.data();
      cb(res);
    });
  }

  static async deleteCollection(db, collectionRef, batchSize) {
    batchSize = batchSize || 2;
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    async function deleteQueryBatch(db, query, batchSize) {
      const snapshot = await query.get();
      // When there are no documents left, we are done
      if (snapshot.size === 0)
        return 0;
      // Delete documents in a batch
      const batch = db.batch();
      for (let doc of snapshot.docs)
        batch.delete(doc.ref);
      await batch.commit();
      const numDeleted = snapshot.size;
      // Recurse on the next process tick, to avoid exploding the stack.
      if (numDeleted >= batchSize)
        setTimeout(() => deleteQueryBatch(db, query, batchSize), 0);
    }

    return await deleteQueryBatch(db, query, batchSize);
  }
}