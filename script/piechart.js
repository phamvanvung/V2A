class GeneratePieChart {
    /**
     *
     * @param {currency: 'BTC', initialValue: amt in usd, currentValue: amt in usd, previousValue: amt in usd} data
     * @param width
     * @param height
     * @param theDiv
     */
    constructor(width = 200, height = 200, theDiv, initialRadius = 50) {
        this.width = width;
        this.height = height;
        this.theDiv = theDiv;
        this.initialRadius = initialRadius;
    }

    draw(data) {
        this.data = data;
        const totalInitialValue = d3.sum(this.data.map(d => d.initialValue));
        const valueToAreaScale = d3.scaleLinear().domain([0, totalInitialValue]).range([0, Math.PI * (Math.pow(this.initialRadius, 2))]);
        this.valueToAreaScale = valueToAreaScale;
        //Creating the layout data
        const pie = d3.pie().value(d => d.initialValue);
        const arcs = pie(this.data);
        //Creating an arc (to generate path data for the pie chart)
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(this.initialRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .padAngle(0.00);

        let svg = d3.select(this.theDiv).select('svg');
        let gInitial = svg.selectAll('.initialGroup');
        let gGainLoss = svg.selectAll('.gainLossGroup');
        //If doesn't exist
        if (svg.empty()) {
            svg = d3.select(this.theDiv).append('svg').attr("width", this.width).attr("height", this.height);
            gInitial = svg.append('g').attr("transform", `translate(${this.width / 2}, ${this.height / 2})`)
                .attr('class', 'initialGroup');
            gGainLoss = svg.append('g').attr("transform", `translate(${this.width / 2}, ${this.height / 2})`)
                .attr('class', 'gainLossGroup');
        }
        //Create/Update the initial group (if there is updated data).
        let initials = gInitial.selectAll("path").data(arcs);
        initials.exit().attr("opacity", 1.0).transition().duration(transitionDuration).attr("opacity", 0.0).remove();
        initials.enter().append("path").merge(initials).call(createInitialArcs)
            .on("mouseover", d => {
                const htmlStr =
                    `Currency: ${d.data.currencyAmt.toFixed(4)} ${d.data.currency}<br/>Invested: ${d.data.initialValue.toFixed(2)} USD`
                showTip(htmlStr);
            })
            .on("mouseleave", () => {
                hideTip();
            });

        //Create/Update the gain loss group (if there is updated data).
        let currentRadius = 0;
        const gainLossArc = d3.arc()
            .innerRadius(d => {
                currentRadius = this.calculateRadius(d.data.initialValue, d.data.currentValue, d.endAngle - d.startAngle);
                return Math.min(this.initialRadius, currentRadius);
            })
            .outerRadius(d => {
                return Math.max(this.initialRadius, currentRadius);
            });
        //Draw the gain/loss part.
        let gainLosses = gGainLoss.selectAll("path").data(arcs);
        gainLosses.exit().attr("opacity", 1.0).transition().duration(transitionDuration).attr("opacity", 0).remove();
        gainLosses.enter().append("path").merge(gainLosses).call(createGainLossArcs)
            .on("mouseover", d=>{
                const diff = d.data.currentValue - d.data.initialValue;
                const htmlStr =
                    `Currency: ${d.data.currencyAmt.toFixed(4)} ${d.data.currency}<br/>${diff>=0?"Gained":"Loss"}: ${Math.abs(diff).toFixed(2)} USD`;
                showTip(htmlStr);
            })
            .on("mouseleave", d=>{
                hideTip();
            });

        function createGainLossArcs(theArc) {
            return theArc.transition().duration(transitionDuration).attr("d", gainLossArc)
                .attr("fill", d => d.data.initialValue > d.data.currentValue ? 'red' : 'green')
                .attr('stroke-width', 1).attr("stroke", "white");
        }

        function createInitialArcs(theArc) {
            return theArc.transition().duration(transitionDuration).attr("d", arc)
                .attr("fill", d=>getColor(d.data.currency))
                .attr('stroke-width', 1).attr("stroke", "white");
        }
    }

    calculateRadius(initialValue, currentValue, angle) {
        const diff = Math.abs(currentValue - initialValue);
        let areaDiff = this.valueToAreaScale(diff);
        areaDiff = (currentValue - initialValue) >= 0 ? areaDiff : -areaDiff;
        const currentRadius = Math.sqrt((2 * areaDiff / angle) + Math.pow(this.initialRadius, 2));
        return currentRadius;
    }

    update(newData) {

    }

}