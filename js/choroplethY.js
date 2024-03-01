class ChoroplethY {
    /** Class Constructor */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement, 
            containerWidth: _config.containerWidth || 400, 
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            tooltipPadding: 10,
            legendBottom: 20,
            legendLeft: 200,
            legendRectHeight: 12, 
            legendRectWidth: 150
        }
        this.data = _data;
        this.initVis();
    }

    /** Initalize scales and append static elements */
    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart 
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform',`translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        // Initialize projection and path generator
        vis.projection = d3
            .geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.width);

        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.colorScale = d3.scaleLinear()
            .range(['#dadaeb', '#3f007d'])
            .interpolate(d3.interpolateHcl);

        // Initialize gradient that we will later use for the legend
        vis.linearGradient = vis.svg.append('defs').append('linearGradient')
            .attr("id", "legend-gradient");

        // Append legend
        vis.legend = vis.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.legendLeft},${vis.config.legendBottom})`);

        vis.legendRect = vis.legend.append('rect')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight);

        vis.legendTitle = vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('dy', '.35em')
            .attr('y', -10)
            .text(yAxisLabel)

        vis.legendLabel = vis.legend.append('text')

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.data.objects.counties.geometries = vis.data.objects.counties.geometries.filter((d) => d.properties.y != -1);

        const yVariable = d3.extent(vis.data.objects.counties.geometries, d => d.properties.y);
        vis.colorScale.domain(yVariable);

        vis.legend.select(".legend-title")
            .text(yAxisLabel);

        // Update color scale
        vis.colorScale.domain(yVariable);

        // Define begin and end of the color gradient (legend)
        vis.legendStopsY = [
            { color: '#dadaeb', value: yVariable[0], offset: 0},
            { color: '#3f007d', value: yVariable[1], offset: 100},
        ];

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // Convert compressed TopoJSON to GeoJSON format
        const countiesData = topojson.feature(vis.data, vis.data.objects.counties);

        // Defines the scale of the projection so that the geometry fits within the SVG area
        vis.projection.fitSize([vis.width, vis.height], countiesData);

        // Append map
        const countryPathY = vis.chart.selectAll('.country')
                .data(countiesData.features)
            .join('path')
                .attr('class', 'country')
                .attr('d', vis.geoPath)
                .attr('fill', d => {
                    if (d.properties.y) {
                        return vis.colorScale(d.properties.y);
                    } else {
                        return '#D3D3D3';
                    }
                });

        // format tooltip output
        countryPathY
            .on('mousemove', (event, d) => {
                const yVal = d.properties.y ? `<strong>${d.properties.y}</strong>` : 'No data available';
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                        <div class = "tooltip-title">${d.properties.display_name}</div>
                        <div>${yAxisLabel}: ${yVal}</div>
                    `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltop').style('display', 'none');
            });

        // Add legend labels
        vis.legend.selectAll('.legend-label')
                .data(vis.legendStopsY)
            .join('text')
                .attr('class', 'legend-label')
                .attr('text-anchor', 'middle')
                .attr('dy', '.35em')
                .attr('y', 20)
                .attr('x', (d, index) => {
                    return index == 0 ? 0 : vis.config.legendRectWidth;
                })
                .text(d => Math.round(d.value * 10) / 10);

        // Update gradient for legend
        vis.linearGradient.selectAll('stop')
                .data(vis.legendStopsY)
            .join('stop')
                .attr('offset', d => d.offset)
                .attr('stop-color', d => d.color);
        
        vis.legendRect.attr('fill', 'url(#legend-gradient)');
    }
}