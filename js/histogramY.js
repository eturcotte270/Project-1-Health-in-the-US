class HistogramY {

     /**
     * Class constructor with basic chart configuration
     */
        constructor(_config, _data) {
            this.config = {
              parentElement: _config.parentElement,
              containerWidth: _config.containerWidth || 400,
              containerHeight: _config.containerHeight || 250,
              margin: _config.margin || {top: 25, right: 25, bottom: 35, left: 55},
              tooltipPadding: _config.tooltipPadding || 15
            }
            this.data = _data;
            this.initVis();
        }

        initVis() {
            let vis = this;
            
            vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
            vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        
            vis.xScale = d3.scaleLinear()
                .range([0, vis.width]);

            vis.yScale = d3.scaleLinear()
                .range([vis.height, 0]);

            vis.xAxis = d3.axisBottom(vis.xScale);
            
            vis.yAxis = d3.axisLeft(vis.yScale);

            vis.svg = d3.select(vis.config.parentElement)
                .attr('width', vis.config.containerWidth)
                .attr('height', vis.config.containerHeight);

            vis.chart = vis.svg.append('g')
                .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

            vis.xAxisG = vis.chart.append('g')
                .attr('class', 'axis')
                .attr('transform', `translate(0, ${vis.height})`);

            vis.yAxisG = vis.chart.append('g')
                .attr('class', 'axis y-axis');

            vis.chart.append('text')
                .attr('class', 'text1')
                .attr('y', vis.height + 20)
                .attr('x', vis.width + 10)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text(yAxisLabel);
            
            vis.svg.append('text')
                .attr('class', 'text2')
                .attr('x', 0)
                .attr('y', 0)
                .attr('dy', '.71em')
                .text('Number of Counties');

            vis.xValue = d => d.properties.y;

            vis.xScale.domain(d3.extent(vis.data.objects.counties.geometries, vis.xValue));

            vis.brushG = vis.svg.append('g')
                .attr('class', 'brush');

            vis.brush = d3.brushX()
                    .extent([[vis.config.margin.left, vis.config.margin.top], [vis.config.containerWidth, vis.config.containerHeight]])
                    .on("end", function({selection}) {
                        if (selection) vis.brushed(selection);
                        if (!selection) vis.brushed(null);
                    });

            vis.updateVis();
        }

        updateVis() {
            let vis = this;

            vis.data.objects.counties.geometries = vis.data.objects.counties.geometries.filter((d) => ((vis.xValue(d) != -1)));

            if (brushedSelection.length == 0) {
                vis.xScale.domain(d3.extent(vis.data.objects.counties.geometries, vis.xValue));

                vis.xAxisG                
                    .call(vis.xAxis
                    .ticks(vis.width / 80)
                    .tickSizeOuter(0));
            }
                var histogram = d3.histogram()
                    .value(d => d.properties.y)
                    .domain(vis.xScale.domain())
                    .thresholds(vis.xScale.ticks(40));
    
            vis.bins = histogram(vis.data.objects.counties.geometries);

            vis.yScale.domain([0, d3.max(vis.bins, d => d.length)]);

            vis.yAxisG                
                .call(vis.yAxis);

            vis.rectangles = vis.chart
                .selectAll('.rect')
                    .data(vis.bins)
                .join('rect')
                    .attr('class', 'rect')
                    .attr('fill', 'gray')
                    .attr("x", (d) => vis.xScale(d.x0) + 1)
                    .attr("width", (d) => vis.xScale(d.x1) - vis.xScale(d.x0))
                    .attr("y", (d) => vis.yScale(d.length))
                    .attr("height", (d) => vis.yScale(0) - vis.yScale(d.length));

            vis.svg.select(".text1")
                .text(yAxisLabel);

            vis.brushG
                .call(vis.brush);

        }

        brushed(selection) {
            let vis = this;

            if (!selection) {
                brushedSelection = [];
                // vis.data.objects.counties.geometries.forEach(d => {
                //     let dataX = (d.properties.y);
                //     brushedSelection.push(d.properties.cnty_fips);
                //     });
            } else {
                const [leftX, rightX] = selection;
                let dataLeft = vis.xScale.invert(leftX - vis.config.margin.left);
                let dataRight = vis.xScale.invert(rightX - vis.config.margin.left);

                brushedSelection = [];
                vis.data.objects.counties.geometries.forEach(d => {
                let dataX = (d.properties.y);
                    if (dataX >= dataLeft && dataX <= dataRight) {
                        brushedSelection.push(d.properties.cnty_fips);
                    }
                });
            }

            filterData();
        }

        
}


