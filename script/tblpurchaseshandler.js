class TblPurchaseHandler {
    constructor(theDb) {
        this.theDb = theDb;
    }
    put(currency, currencyAmt, usdAmt, onSuccess) {
        const tx = this.theDb.transaction('purchases', 'readwrite');
        const purchases = tx.objectStore('purchases');
        let purchaseRequest = purchases.get(currency);
        purchaseRequest.onsuccess = () =>{
            let purchase = purchaseRequest.result;
            if(purchase!==undefined){
                purchase.currencyAmt += currencyAmt;
                purchase.usdAmt += usdAmt;
            }else{
                purchase = {
                    'currency': currency,
                    'currencyAmt': currencyAmt,
                    'usdAmt': usdAmt
                };
            }
            const updatePurchaseRequest = purchases.put(purchase);
            updatePurchaseRequest.onsuccess = onSuccess;
        };
    }
    loadAll(onSuccess){
        const tx = this.theDb.transaction('purchases', 'readonly');
        const purchases = tx.objectStore("purchases");
        let purchaseRequest = purchases.getAll();
        purchaseRequest.onsuccess = ()=>{
            let purchases = purchaseRequest.result;
            onSuccess(purchases);
        }
    }
    get(currency, onsuccess){
        const tx = this.theDb.transaction('purchases', 'readwrite');
        const purchases = tx.objectStore('purchases');
        let purchaseRequest = purchases.get(currency);
        purchaseRequest.onsuccess = () =>{
            let purchase = purchaseRequest.result;
            onsuccess(purchase);
        };
    }
}