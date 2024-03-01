class Scatterplot {

    /**
     * Class constructor with basic chart configuration
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 400,
        containerHeight: _config.containerHeight || 250,
        margin: _config.margin || {top: 25, right: 25, bottom: 20, left: 55},
        tooltipPadding: _config.tooltipPadding || 15
      }
      this.data = _data;
      this.initVis();
    }
    
    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
      let vis = this;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Initialize scales
      vis.xScale = d3.scaleLinear()
          .range([0, vis.width]);
  
      vis.yScale = d3.scaleLinear()
          .range([vis.height, 0]);

      vis.colorScale = d3.scaleOrdinal()
          .range(['#d3eecd', '#7bc77e', '#2a8d46', '#174c26']) // light green to dark green
          .domain(['Rural','Suburban','Small City', 'Urban']);
  
      // Initialize axes
      vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSize(-vis.height - 10)
        .tickPadding(10)
        .tickFormat(d => d);
  
      vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSize(-vis.width - 10)
        .tickPadding(10)
        .tickFormat(d => d);

      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
  
      // Append group element that will contain our actual chart 
      // and position it according to the given margin config
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Append empty x-axis group and move it to the bottom of the chart
      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);

      // Append y-axis group
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');
  
      // Append both axis titles
      vis.chart.append('text')
          .attr('class', 'text1')
          .attr('y', vis.height - 25)
          .attr('x', vis.width + 10)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text(xAxisLabel);
  
      vis.svg.append('text')
          .attr('class', 'text2')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '.71em')
          .text(yAxisLabel);
  
      // Specificy accessor functions
      vis.xValue = d => d.properties.x;
      vis.yValue = d => d.properties.y;
      vis.colorValue = d => d.properties.status;

      vis.updateVis();
    }
  
    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
      let vis = this;

      vis.data.objects.counties.geometries = vis.data.objects.counties.geometries.filter((d) => ((vis.xValue(d) != -1) && vis.yValue(d) != -1));

      // Set the scale input domains
      vis.xScale.domain([d3.min(vis.data.objects.counties.geometries, vis.xValue), d3.max(vis.data.objects.counties.geometries, vis.xValue)]);
      vis.yScale.domain([d3.min(vis.data.objects.counties.geometries, vis.yValue), d3.max(vis.data.objects.counties.geometries, vis.yValue)]);
        
      // Add circles
      vis.circles = vis.chart.selectAll('.point')
          .data(vis.data.objects.counties.geometries, d => d.display_name)
        .join('circle')
          .attr('class', 'point')
          .attr('r', 4)
          .attr('cy', d => vis.yScale(vis.yValue(d)))
          .attr('cx', d => vis.xScale(vis.xValue(d)))
          .attr('opacity', 0.5)
          .attr('fill', d => vis.colorScale(vis.colorValue(d)));
  
      // Tooltip event listeners
      vis.circles
          .on('mouseover', (event, d) => {
            d3.select('#tooltip')
              .style('display', 'block')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              .html(`
                <div class="tooltip-title">${d.properties.display_name}</div>
                <i>${d.properties.status}</i>
                <ul>
                  <li>${xAxisLabel}: ${d.properties.x}</li>
                  <li>${yAxisLabel}: ${d.properties.y}</li>
                </ul>
              `);
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
          });

      vis.chart.select(".text1")
          .text(xAxisLabel);
    
      vis.svg.select(".text2")
          .text(yAxisLabel);
      
      // Update the axes/gridlines
      // We use the second .call() to remove the axis and just show gridlines
      vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());

      vis.yAxisG
        .call(vis.yAxis)
        .call(g => g.select('.domain').remove());
    }
  }