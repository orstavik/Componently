class AppData {

  /**
   * USER
   */
  static async getCurrentUserData(username) {
    const db = firebase.firestore();
    return db.doc(`users/${username}`).get();
  }

  static async setCurrentProject(username, projectId){
    const db = firebase.firestore();
    try {
      await db.doc(`users/${username}`).update({
        currentProject: projectId
      });
    } catch (e){
      console.log(e);
    }
  }

  static async setCurrentVersion(username, versionNum){
    const db = firebase.firestore();
    try {
      await db.doc(`users/${username}`).update({
        currentVersion: Number(versionNum)
      });
    } catch (e){
      console.log(e);
    }
  }
  /**
   * PROJECT
   */
  static async addProject(username, id) {
    const db = firebase.firestore();
    await db.doc(`users/${username}/projects/${id}`).set({
      name: id
    });
  }

  static async getProjects(user) {
    return AppData.getCollectionIds(`users/${user.name}/projects`);
  }

  static async listenToProjects(username, cb) {
    return AppData.listenCollectionIds(`users/${username}/projects`, cb);
  }

  static async removeProject(user, id) {
    const db = firebase.firestore();
    const deleteDoc = db.doc(`users/${user.name}/projects/${id}`).delete();
    const deleteCollections = AppData.deleteCollection(db, db.collection(
      `users/${user.name}/projects/${id}/versions`));
    await deleteDoc;
    await deleteCollections;
  }


  /**
   * VERSIONS
   */
  static async getVersions(user, projectId) {
    return AppData.getCollectionIds(`users/${user.name}/projects/${projectId}/versions`);
  }

  /**
   * FILES
   */
  static async addFile(username, id, version, filename) {
    const db = firebase.firestore();
    await db.doc(`users/${username}/projects/${id}/versions/${version}/files/${filename}`).set({
      name: id,
      value: "new file value"
    });
  }

  static async getFiles(user, projectId, version) {
    return AppData.getCollectionIds(`users/${user.name}/projects/${projectId}/versions/${version}/files`);
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
    return db.collection(query).onSnapshot(snap =>{
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