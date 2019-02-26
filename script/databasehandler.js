let db;
let tblStocks;
let tblPurchases;
const dbrequest = indexedDB.open("stocksdb");
dbrequest.onupgradeneeded = function(){
    db = dbrequest.result;
    if (!db.objectStoreNames.contains('stocks')){
        tblStocks = db.createObjectStore('stocks', {autoIncrement: true});
    }
    if (!db.objectStoreNames.contains('snapshots')){
        tblSnapshots = db.createObjectStore('snapshots', {keyPath: 'mintime'});
    }
    if (!db.objectStoreNames.contains('purchases')) {
        tblPurchases = db.createObjectStore('purchases', {keyPath: 'currency'});
    }
};
dbrequest.onsuccess = function () {
    db = dbrequest.result;
}