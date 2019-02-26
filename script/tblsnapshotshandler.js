class TblSnapshotHandler {
    constructor(theDb) {
        this.theDb = theDb;
    }
    add(snapshot) {
        const tx = this.theDb.transaction('snapshots', 'readwrite');
        const snapshots = tx.objectStore('snapshots');
        try {
            snapshots.put(snapshot);
            return tx.complete;
        } catch (ex) {
            throw ex;
            console.log('Error inserting the snapshot: ');
            console.log(snapshot);
            return false;
        }
    }
    addSnapshotAsStocks(key, stocks) {
        const snapshot = {
            'mintime': key,
            'stocks': stocks
        }
        this.add(snapshot);
    }
}