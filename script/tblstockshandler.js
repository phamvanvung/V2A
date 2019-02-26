class TblStockHandler{
    constructor(theDb){
        const tx = theDb.transaction('stocks', 'readwrite');
        this.stocks = tx.objectStore('stocks');
    }
    add(stock){
        try {
            this.stocks.put(stock);
            return true;
        }catch(ex){
            throw ex;
            console.log('Error inserting the stock: ');
            console.log(stock);
            return false;
        }
    }
    addStocks(stocks){
        stocks.forEach(stock=>{
            this.add(stock);
        });
    }
}