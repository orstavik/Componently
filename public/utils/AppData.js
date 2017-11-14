class AppData {

  /**
   * APP SPECIFIC
   */
  static async getCurrentUserData(username) {
    const db = firebase.firestore();
    return db.doc(`users/${username}`).get();
  }

  static async setCurrentProject(username, currentProject) {
    const db = firebase.firestore();
    currentProject = Tools.removeUndefinedFields(currentProject);
    try {
      await db.doc(`users/${username}`).update({
        currentProject: currentProject
      });
    } catch (e) {
      console.log(e);
    }
  }

  static async addProject(username, id) {
    const db = firebase.firestore();
    await db.doc(`users/${username}/projects/${id}`).set({
      name: id
    });
  }

  static listenToProjects(username, cb) {
    return AppData.listenCollectionIds(`users/${username}/projects`, cb);
  }

  static async removeProject(user, id) {
    const db = firebase.firestore();
    const deleteDoc = db.doc(`users/${user.name}/projects/${id}`).delete();
    const deleteCollections = AppData.deleteCollection(db, db.collection(
      `users/${user.name}/projects/${id}/versions`));
    //todo do we need to remove all the /versions/version/files too?
    await deleteDoc;
    await deleteCollections;
  }

  static listenToVersions(username, projectId, cb) {
    return AppData.listenCollectionIds(`users/${username}/projects/${projectId}/versions`, cb);
  }

  //todo, a little unsafe, get the next version number inside a transaction in AppData
  static async addVersion(username, project, version, files, comment) {
    const db = firebase.firestore();

    let versionsRef = db.collection(`users/${username}/projects/${project}/versions/`)
                        .orderBy("name", "desc")
                        .limit(1);
    let latestVersions = await versionsRef.get();
    if (latestVersions.empty)
      throw new Error("wtf?!");
    version = latestVersions.docs[0].data().name + 1;

    const batch = db.batch();
    const newVersionRef = db.doc(`users/${username}/projects/${project}/versions/${version}`);
    batch.set(newVersionRef, {name: version, comment: comment});
    for (let key in files) {
      let file = files[key];
      let fileRef = db.doc(`users/${username}/projects/${project}/versions/${version}/files/${file.name}`);
      batch.set(fileRef, file);
    }
    await batch.commit();
    return version;
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