class AppData {

  /**
   * PROJECT
   */
  static async addProject(user, id) {
    const db = firebase.firestore();
    await db.doc(`users/${user.name}/projects/${id}`).set({
      name: id
    });
  }

  static async getProjects(user) {
    return AppData.getCollectionIds(`users/${user.name}/projects`);
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
  static async getVersions(user, projectId){
    return AppData.getCollectionIds(`users/${user.name}/projects/${projectId}/versions`);
  }

  /**
   * FILES
   */
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
      collection[doc.id] = {};
    return collection;
  }

  static async deleteCollection(db, collectionRef, batchSize) {
    batchSize = batchSize || 3;
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    function deleteQueryBatch(db, query, batchSize, resolve, reject) {
      query.get()
        .then((snapshot) => {
          // When there are no documents left, we are done
          if (snapshot.size == 0) {
            return 0;
          }
          // Delete documents in a batch
          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          return batch.commit().then(() => snapshot.size);
        })
        .then(function (numDeleted) {
          if (numDeleted <= batchSize) {
            resolve();
            return;
          }
          // Recurse on the next process tick, to avoid
          // exploding the stack.
          process.nextTick(() => deleteQueryBatch(db, query, batchSize, resolve, reject));
        })
        .catch(reject);
    }
    return new Promise((resolve, reject) => {
      deleteQueryBatch(db, query, batchSize, resolve, reject);
    })
  }
}