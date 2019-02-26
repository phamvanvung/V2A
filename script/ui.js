let mousemoveTimeout = undefined;
const steps = 120;
let maSteps = 1;
let colorScheme = d3.schemeCategory10.filter((d, i) => i !== 2 && i !== 3);
let selectedCoins = ['BTC', 'XRP', 'ETH', 'LTC', 'EOS'];
let xAxis = null;
let circleData = undefined;
const bisector = d3.bisector((d, x) => {
    return d.time - x;
}).right;

selectedCoins = selectedCoins.sort();
let coins = null;
d3.csv('data/digital_currency_list.csv', (error, data) => {
    coins = data.map(d => d['currency code']);
    coins = coins.sort((a, b) => {
        const ai = selectedCoins.indexOf(a);
        const bi = selectedCoins.indexOf(b);
        if (
            (ai >= 0 && bi >= 0) ||
            (ai < 0 && bi < 0)
        ) {
            return a.localeCompare(b);
        } else if (ai >= 0) {
            return -1;
        } else {
            return 1;
        }
    });
    generateCheckBoxes(coins, selectedCoins);
    setSearchEvent();
});

const transitionDuration = 1000;
const width = 1100;
const margin = {left: 0, top: 20, right: 20, bottom: 40};
const lineGraphMargin = {left: 70, top: 16, right: 16, bottom: 16},
    contentWidth = width - margin.left - margin.right,
    lineGraphWidth = contentWidth,
    lineGraphContentWidth = lineGraphWidth - lineGraphMargin.left - lineGraphMargin.right;

const lineGraphHeight = 110,
    lineGraphContentHeight = lineGraphHeight - lineGraphMargin.top - lineGraphMargin.bottom;

let height = selectedCoins.length * lineGraphHeight + margin.top + margin.bottom,
    contentHeight = height - margin.top - margin.bottom;


//Build tooltip
let theToolTipDiv = d3.select("body").append("div").attr("class", "tooltip w3-card-4 w3-light-gray w3-container").attr("opacity", 0);

const svg = d3.select("#leftContent").append("svg").attr('width', width).attr("height", height);

svg.append("defs").append("clipPath").attr("id", "theClipPath").append("rect")
    .attr("x", 0).attr("y", -lineGraphMargin.top)
    .attr("width", lineGraphWidth).attr("height", lineGraphHeight+2*lineGraphMargin.top);


const content = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
const graphGroup = content.append("g");
const xAxisGroup = svg.append("g").attr("transform", `translate(${lineGraphMargin.left}, ${margin.top + contentHeight})`);
const lineGen = d3.line();

//Draw the X Label.
const theXAxisLabel = svg.append("text").attr("transform", `translate(${width / 2}, ${height})`).attr("text-anchor", "middle").text("Time");
//Draw the Y Label
const theYAxisLabel = svg.append("text").attr("transform", `translate(${25}, ${height / 2})rotate(-90)`).attr("text-anchor", "middle").text("USD");


function changeLayout(transitionDuration) {
    theXAxisLabel.transition().duration(transitionDuration).attr("transform", `translate(${width / 2}, ${height})`);
    theYAxisLabel.transition().duration(transitionDuration).attr("transform", `translate(${20}, ${height / 2})rotate(-90)`);

    xAxisGroup.transition().duration(transitionDuration).attr("transform", `translate(${lineGraphMargin.left}, ${margin.top + contentHeight})`);
    svg.transition().duration(transitionDuration).attr("height", height);

    xAxisGroup.transition().duration(transitionDuration).attr("transform", `translate(${lineGraphMargin.left}, ${margin.top + contentHeight})`);
    svg.transition().duration(transitionDuration).attr("height", height);
}

function resetSVGSize() {
    //Reset the svg height
    height = selectedCoins.length * lineGraphHeight + margin.top + margin.bottom,
        contentHeight = height - margin.top - margin.bottom;

    //Check if there is an active transition for xGroup or not?
    if (d3.active(xAxisGroup.node()) !== null) {
        //There is an active transition, then we wait for transition duration before starting this transition
        setTimeout(() => {
            changeLayout(transitionDuration / 2);//Should do it quicker
        }, transitionDuration);
    } else {
        changeLayout(transitionDuration);
    }
}


function drawMouseMoveSelections(circleData) {
    if(maSteps==1){
        if(mousemoveTimeout!==undefined){
            clearTimeout(mousemoveTimeout);
        }
        let lineX = undefined;
        const theLineGroup = graphGroup.selectAll(".graph").selectAll('.lineGroup').each(function (d) {
            if(circleData[d].x!==undefined){
                lineX = circleData[d].x;
            }
            const circleSelection = d3.select(this).selectAll(".mousemoveCircles").data([circleData[d]]);
            circleSelection.enter()
                .append("circle").attr('class', 'mousemoveCircles');

            circleSelection.attr("opacity", 1.0).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", 4).attr("fill", "red")
                .raise();

            const textSelection = d3.select(this).selectAll(".mousemoveTexts").data([circleData[d]]);
            textSelection.enter()
                .append("text").attr('class', 'mousemoveTexts');
            textSelection.attr("opacity", 1.0).attr("x", d => d.x).attr("y", d => d.y).text(d => d.rate.toFixed(2))
                .attr("dx", "0.5em")
                .raise();
        });

        const theLine = graphGroup.selectAll(".timeLine").data([lineX]);//This one use graphGroup since we draw only one line, not a line for every line graph (currency)
        theLine.enter().append("line").attr("class", "timeLine");
        theLine.attr("x1", d => d + lineGraphMargin.left ).attr("y1", lineGraphMargin.top).attr("x2", d => d + lineGraphMargin.left).attr("y2", contentHeight).attr("stroke", "black").raise();

        mousemoveTimeout = setTimeout(()=>{
            d3.selectAll(".mousemoveCircles").transition().duration(transitionDuration).attr("opacity", 0).remove();
            d3.selectAll(".mousemoveTexts").transition().duration(transitionDuration).attr("opacity", 0).remove();
            d3.selectAll(".timeLine").transition().duration(transitionDuration).attr("opacity", 0).remove();
        }, 5000);
    }
}

function draw() {

    //Draw the xAxis
    const xScale = getXScale();
    if (xAxis === null) {
        //Only have to draw if xAxis is null
        xAxis = d3.axisBottom(xScale).tickFormat(d => d.getMinutes() % 15 === 0 ? d3.timeFormat('%H:%M')(d) : "")
            .ticks(steps + 1).tickPadding(5);
        xAxisGroup.transition().duration(transitionDuration).call(xAxis);
        formatXAxisTicks();
    }

    lineGen.x(d => xScale(d.time));

    const graphs = graphGroup.selectAll(".graph").data(selectedCoins, d => d);
    graphs.enter().append("g").attr("class", "graph").attr("id", d => d)
        .attr("transform", (d, i) => `translate(${0}, ${i * lineGraphHeight})`);

    graphs.exit().attr("opacity", 1).transition().duration(transitionDuration).attr("opacity", 0).remove();
    //Update the position.
    graphs.transition().duration(transitionDuration).attr("transform", (d, i) => `translate(${0}, ${i * lineGraphHeight})`);

    graphGroup.selectAll(".graph").each(drawGraph);

    //Shifting and redrawing x axis if needed
    //If the data is greather than the max domain=> shift it.
    let maxTime = d3.max(data.map(d => d.time));
    let minTime = d3.min(data.map(d => d.time));
    const maxDomain = xScale.domain()[1];
    svg.on("mousemove", function () {
        const svgX = d3.select(this).node().getBoundingClientRect().x;
        const mouseXVal = d3.event.pageX - svgX - lineGraphMargin.left;
        const mouseDateVal = xScale.invert(mouseXVal);
        const circleData = {};
        selectedCoins.forEach(theCurrency => {
            let theData = data.filter(d => d.currency === theCurrency);
            let i = bisector(theData, mouseDateVal);
            if(maxTime > maxDomain){
                d3.selectAll('.mousemoveCircles').attr("transform", `translate(${xScale(maxDomain) - xScale(maxTime)})`);
                d3.selectAll('.mousemoveTexts').attr("transform", `translate(${xScale(maxDomain) - xScale(maxTime)})`);
                d3.selectAll('.timeLine').attr("transform", `translate(${xScale(maxDomain) - xScale(maxTime)})`);
            }
            if (i >= theData.length) {
                i = theData.length - 1;
            }
            //Recalculate the y scale (coz new set of data)
            const yScale = getYScale(theData);
            let yVal = yScale(theData[i].rate);
            let xVal = xScale(theData[i].time);
            circleData[theCurrency] = ({x: xVal, y: yVal, rate: theData[i].rate});
        });
        drawMouseMoveSelections(circleData);
    });
    if (maxTime > maxDomain) {
        //Shift all the data items with time which is smaller than minTime -1 minutes.
        const nextMinTime = new Date(minTime.getTime() + 1000 * 60);
        // const stocksToSave = data.filter(d => d.time < nextMinTime);

        //Remove them out from our visualization
        data = data.filter(d => d.time >= nextMinTime);
        //Recalculate teh scale
        const xScale = getXScale();
        xAxis.scale(xScale);
        xAxisGroup.transition().duration(transitionDuration).call(xAxis);
        formatXAxisTicks();
        //Set event on the axis
        d3.selectAll('.line').attr("transform", null).transition().duration(1000).attr("transform", `translate(${xScale(maxDomain) - xScale(maxTime)})`);

    }

}

//Draw pie chart
function drawPieChart() {
    const tblPurchase = new TblPurchaseHandler(db);
    tblPurchase.loadAll(data => {
        //Filter for monitored currencies only
        data = data.filter(d => selectedCoins.indexOf(d.currency) >= 0);
        //Convert to the formatted data
        data = data.map(d => {
            const latestRate = takeLatestRate(d.currency);
            const item = {
                'currency': d.currency,
                'currencyAmt': d.currencyAmt,
                'initialValue': d.usdAmt,
                'currentValue': d.currencyAmt * latestRate,
                'previousValue': d.currencyAmt * latestRate
            };
            return item;
        });
        const pieGenerator = new GeneratePieChart(200, 200, "#pieChart", 75);
        pieGenerator.draw(data);
    });
}

function setMASteps() {
    const txtMASteps = document.getElementById("txtMASteps");
    const maStepsInput = txtMASteps.value;
    if (!maStepsInput || +maStepsInput < 1) {
        toast("Please input a positive integer!");
    } else {
        maSteps = parseInt(maStepsInput);
        txtMASteps.value = `${maSteps}`;
    }
    draw();
}

function drawGraph(d) {
    let theCurrency = d;
    let theData = data.filter(d => d.currency === theCurrency);

    //Recalculate the y scale (coz new set of data)
    const yScale = getYScale(theData);
    lineGen.y(d => yScale(d.rate));
    //Average the data if needed.
    if (maSteps > 1) {
        if (maSteps >= data.length) {
            toast("The number of MA steps is too high");
        } else {
            for (let i = maSteps - 1; i < theData.length; i++) {
                let total = 0;
                for (let j = 0; j < maSteps; j++) {
                    total += theData[i - j].rate;
                }
                theData[i].marate = total / maSteps;
            }
        }
        //Filter out the undefined data
        theData = theData.filter(d => d.marate !== undefined);
        lineGen.y(d => yScale(d.marate));
    }


    let theGraphGroup = d3.select(this);
    const theLabel = theGraphGroup.selectAll(".label").data([d], d => d);
    theLabel.enter().append("text").attr("class", "label").text(d => d)
        .attr("transform", `translate(${lineGraphMargin.left + 5}, ${lineGraphMargin.top - 5})`);
    //Create the line group if needed
    const theLineGroup = theGraphGroup.selectAll(".lineGroup").data([d]);
    theLineGroup.enter().append("g")
        .attr("class", "lineGroup").attr("transform", `translate(${lineGraphMargin.left}, ${lineGraphMargin.top})`)
        .attr("clip-path", "url(#theClipPath)");

    const newSelection = theLineGroup.selectAll(".line").data([theData]);
    //Enter
    newSelection.enter().append("path").attr("class", "line");
    //Update
    newSelection.attr("d", lineGen).attr("fill", "none").attr("stroke", getColor(theCurrency)).attr("stroke-width", 3);

    //Create the yAxis group; if needed
    const theYAxisGroup = theGraphGroup.selectAll(".yAxisGroup").data([d]);
    theYAxisGroup.enter().append("g").attr("class", "yAxisGroup").attr("transform", `translate(${lineGraphMargin.left}, ${lineGraphMargin.top})`);
    const theYAxis = d3.axisLeft(yScale).tickFormat(d => d.toFixed(2)).ticks(5);
    theYAxisGroup.transition().duration(transitionDuration).call(theYAxis)

}

function getYScale(data) {
    return d3.scaleLinear().domain(d3.extent(data.map(d => d.rate))).range([lineGraphContentHeight, 0]);
}

function getXScale() {
    let minTime = data.length > 0 ? d3.min(data.map(d => d.time)) : new Date();
    //Convert it back to minutes
    minTime = new Date(minTime.getTime() - minTime.getSeconds() * 1000 - minTime.getMilliseconds());
    return d3.scaleTime().domain([minTime, new Date(minTime.getTime() + 1000 * 60 * steps)]).range([0, lineGraphContentWidth]);
}

function insertBuySellButton(theInput) {
    if (theInput.value) {
        const theCheckBox = d3.select(theInput.parentElement);
        if (theCheckBox.select(".theButtons").empty()) {
            const theButtons = theCheckBox.append("div");
            theButtons.attr("class", "w3-container w3-cell-row theButtons");

            const theBuyBtn = theButtons.append("button").attr("class", 'w3-button w3-white w3-border w3-border-red w3-round-small w3-center w3-cell menuButton');
            theBuyBtn.html('<span>BUY</span>');


            const theSellBtn = theButtons.append("button").attr("class", 'w3-button w3-white w3-border w3-border-red w3-round-small w3-center w3-cell  menuButton');
            theSellBtn.html('<span>SELL</span>');

            const theCancelBtn = theButtons.append("button").attr("class", 'w3-button w3-white w3-border w3-border-red w3-round-small w3-center w3-cell menuButton');
            theCancelBtn.html('<span>CANCEL</span>');


            theBuyBtn.on("click", () => {
                buy(theInput.name, +theInput.value);
                clearPurchase();
            });
            theSellBtn.on("click", () => {
                sell(theInput.name, +theInput.value);
                clearPurchase();
            });
            theCancelBtn.node().addEventListener('click', () => {
                clearPurchase();
            });

            function clearPurchase() {
                theButtons.remove();
                theInput.value = "";
            }
        }
    }
}

function buy(currency, amount) {
    const tblPurchase = new TblPurchaseHandler(db);
    //Take the latest price
    const latestRate = takeLatestRate(currency);
    if (!latestRate) {
        toast("You need to monitor this stock in order to buy/sell.");
        return;
    }
    const currencyAmt = amount / latestRate;
    const onsuccess = () => {
        toast("Bought " + currencyAmt.toFixed(4) + " " + currency + ", for $" + amount, 3000);
        //Redraw the pie chart
        drawPieChart();
    }
    tblPurchase.put(currency, currencyAmt, amount, onsuccess);

}

function takeLatestRate(currency) {
    const theCurrency = data.filter(s => s.currency === currency);
    const latestTime = d3.max(theCurrency.map(d => d.time));
    const latestRate = theCurrency.filter(d => d.time === latestTime)[0].rate;
    return latestRate;
}

function sell(currency, currencyAmt) {
    const tblPurchase = new TblPurchaseHandler(db);
    tblPurchase.get(currency, purchase => {
        if (purchase === undefined) {
            toast('No ' + currency + ' to sell.');
            return;
        } else {
            if (purchase.currencyAmt < currencyAmt) {
                toast('No sufficient ' + currency + ' amount to sell.', 3000);
                return;
            }
            //Amt of original purchase extracted from usd.
            let usdAmt = (purchase.usdAmt / purchase.currencyAmt) * currencyAmt;
            //Take the latest price
            const latestRate = takeLatestRate(currency);
            if (!latestRate) {
                toast("You need to monitor this stock in order to buy/sell.");
                return;
            }
            const gainedUsdAmt = currencyAmt * latestRate;
            tblPurchase.put(currency, -currencyAmt, -usdAmt, () => {
                toast("Sold " + currencyAmt + " " + currency + ", for $" + gainedUsdAmt, 3000);
                //Redraw the pie chart
                drawPieChart();
            });
        }
    });


}

function generateCheckBoxes(options, selectedOptions) {
    const theOuterDiv = d3.select("#checkBoxes");
    theOuterDiv.selectAll("*").remove();

    options.forEach(o => {
        const theDiv = theOuterDiv.append("div").attr("class", "w3-cell-row w3-display-container");
        const theCheckbox = theDiv.append("input").attr("type", "checkbox").attr("value", o).attr("name", "type");
        theCheckbox.attr("class", "w3-cell")
        if (selectedOptions.indexOf(o) >= 0) {
            theCheckbox.attr("checked", "true");
        }
        theDiv.append("text").attr("class", "stock-text").text(o);
        //Section for the buy/sell
        const theInput = theDiv.append("input").attr("placeholder", "buy/sell amt.").attr("title", `Input amount of USD to buy ${o} or amount of ${o} to sell.`).attr("type", "number").attr("id", "input" + o)
            .attr("class", "w3-cell w3-margin-left w3-display-topright inputNumber")
            .attr("name", o);

        theInput.node().addEventListener("keyup", e => {
            insertBuySellButton(e.target);
        });

        //Add the event listener.
        theCheckbox.node().addEventListener("change", e => {
            let timeOut = 0;
            if (e.target.checked) {
                selectedOptions.push(e.target.value);
            } else {
                selectedOptions.splice(selectedOptions.indexOf(e.target.value), 1);
                //Remove all the data from that coin
                data = data.filter(d => d.currency !== e.target.value);
                timeOut = transitionDuration;

            }
            selectedOptions = selectedOptions.sort();
            setTimeout(resetSVGSize, timeOut);
            draw();
        });
    });

}

function setSearchEvent() {
    const theSearchInput = document.getElementById("searchKey");
    theSearchInput.onkeyup = (e) => {
        if (!e.target.value) {
            generateCheckBoxes(coins, selectedCoins);
        } else if (e.target.value === "is:checked") {
            generateCheckBoxes(selectedCoins, selectedCoins);
        } else {
            let filteredCoins = coins.filter(c => c.indexOf(e.target.value) >= 0);
            generateCheckBoxes(filteredCoins, selectedCoins);
        }

    }
}

function formatXAxisTicks() {
    xAxisGroup.selectAll('g').filter(d => d.getMinutes() % 15 === 0).classed("major", true);
    xAxisGroup.selectAll('g').filter(d => d.getMinutes() % 15 !== 0).classed("minor", true);
}

function getColor(currency) {
    const currencyIndex = selectedCoins.indexOf(currency);
    if (currencyIndex < colorScheme.length) {
        return colorScheme[currencyIndex];
    } else {
        return "black";
    }
}

function showTip(htmlStr) {
    theToolTipDiv.style('left', (d3.event.pageX + 5) + "px").style("top", (d3.event.pageY - 12) + "px");
    theToolTipDiv.transition().duration(1000).style("opacity", 1);
    theToolTipDiv.html(htmlStr);
}

function hideTip() {
    theToolTipDiv.transition().duration(1000).style("opacity", 0);
}
