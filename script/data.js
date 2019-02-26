let data = [];
let numOfSeconds = 60;

request(processBatch);

function doRequest(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then(function (response) {
            return response.json();
        }).then(function (data) {
            if (typeof data['Error Message'] !== 'undefined') {
                console.log(url);
                throw new Error(data['Error Message']);
            }
            return resolve(data);
        });
    });
}

// Let's get the stock data of Tesla Inc for the last 10 minutes
async function request(onCompleteRequests) {
    const batchData = [];
    for (let i = 0; i < selectedCoins.length; i++) {
        const coin = selectedCoins[i];
        // const baseurl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${coin}&to_currency=USD&apikey=5NUNY4AW5MG41CV7`;
        // try{
        //     let result = await doRequest(baseurl);
        //     batchData.push(result);
        // }catch(ex){
        //     console.log('Skipped this step');
        // }
        batchData.push({
            'Realtime Currency Exchange Rate': {
                '1. From_Currency Code': coin,
                // '5. Exchange Rate': i===0?(10 + new Date().getSeconds() + d3.randomNormal(0, 10)()) + (data.length/5)*3:d3.randomUniform(50, 100)(),
                '5. Exchange Rate': d3.randomUniform(50, 100)(),
                '6. Last Refreshed': d3.timeFormat('%Y-%m-%d %H:%M:%S')(data.length>0?new Date(d3.max(data.map(d=>d.time)).getTime()+1000*60):new Date())
            }
        });
    }
    // numOfSeconds = 60;
    numOfSeconds = 5;
    onCompleteRequests(batchData);
    setTimeout(() => {
        request(processBatch);
    }, 1000 * numOfSeconds);
}

function processBatch(batchData) {
    if (batchData.length <= 0) {
        return;
    }
    batchData = batchData.map(d => {
        const v = d['Realtime Currency Exchange Rate'];
        let theTime = d3.timeParse('%Y-%m-%d %H:%M:%S')(v['6. Last Refreshed']);
        //Remove the seconds and milliseconds parts.
        theTime = new Date(theTime.getTime() - theTime.getSeconds()*1000 - theTime.getMilliseconds());
        return {
            currency: v['1. From_Currency Code'],
            rate: +v['5. Exchange Rate'],
            time: theTime
        }
    });
    data = data.concat(batchData);
    draw();
    drawPieChart();
}