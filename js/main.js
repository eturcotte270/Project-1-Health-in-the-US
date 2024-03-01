// Global variables
let xAxisLabel, yAxisLabel, updatedData;
let geoData, healthData, dataJSON;
// for the selected urban rural status d.properties.status
let selectedStatus = [];
// for the brushed data d.properties.cnty_fips
let brushedSelection = [];
// initalize all charts
let choroplethX, choroplethY, scatterplot, histogramX, histogramY;

// Load data from the CSV file and json file
Promise.all([
    d3.json('data/counties.json'),
    d3.json('data/counties.json'),
    d3.csv('data/national_health_data.csv')
]).then(data => {
    geoData = data[0];
    updatedData = data[1];
    healthData = data[2];

    // combine the data sets - format variable names
    geoData.objects.counties.geometries.forEach(d => {
        for (let i = 0; i < healthData.length; i++) {
            if (d.id == healthData[i].cnty_fips) {
                /* add in all variables to the geoData under the properties */
                d.properties.cnty_fips = healthData[i].cnty_fips;
                d.properties.display_name = healthData[i].display_name.slice(1, -1);
                d.properties.percent_elderly = + healthData[i].elderly_percentage;
                d.properties.percent_smoking = + healthData[i].percent_smoking;
                d.properties.percent_poverty = + healthData[i].poverty_perc;
                d.properties.status = healthData[i].urban_rural_status;
                d.properties.median_income = + healthData[i].median_household_income;
                d.properties.percent_education_less_than_hs = + healthData[i].education_less_than_high_school_percent;
                d.properties.air_quality = + healthData[i].air_quality;
                d.properties.park_access = + healthData[i].park_access;
                d.properties.percent_inactive = + healthData[i].percent_inactive;
                d.properties.number_of_hospitals = + healthData[i].number_of_hospitals;
                d.properties.number_of_primary_care_physicians = + healthData[i].number_of_primary_care_physicians;
                d.properties.percent_without_health_insurance = + healthData[i].percent_no_health_insurance;
                d.properties.percent_high_blood_pressure = + healthData[i].percent_high_blood_pressure;
                d.properties.percent_coronary_heart_disease = + healthData[i].percent_coronary_heart_disease;
                d.properties.percent_stroke = + healthData[i].percent_stroke;
                d.properties.percent_high_cholesterol = + healthData[i].percent_high_cholesterol;
    
                /*Initial Values for the two variables*/
                d.properties.x =+ d.properties.median_income;
                d.properties.y =+ d.properties.percent_smoking;
            }
        }
    });

    // declare initial x and y
    xAxisLabel = "median_income";
    yAxisLabel = "percent_smoking";

    // all options to be selected
    const allVars = ["percent_elderly", "percent_smoking", "percent_poverty", "median_income", "percent_education_less_than_hs",
    "air_quality", "park_access", "percent_inactive", "number_of_hospitals", "number_of_primary_care_physicians",
    "percent_without_health_insurance", "percent_high_blood_pressure", "percent_coronary_heart_disease", 
    "percent_stroke", "percent_high_cholesterol"];

    // selection 1 - x variable (right side choropleth and histogram)
    // add the button and values
    d3.select("#selectButton1")
        .selectAll('options')
            .data(allVars)
        .enter()
            .append('option')
        .text(d => d) // shows current selection
        .attr("variable1", d => d);

    // selection 2 - y variable (left side choropleth and histogram)
    // add the button and the values
    d3.select("#selectButton2")
        .selectAll('options')
            .data(allVars)
        .enter()
            .append('option')
        .text(d => d) // shows current selection
        .attr("variable2", d => d);

    // create variable x choropleth map
    choroplethX = new ChoroplethX({parentElement: '#mapX'}, geoData);
    choroplethY = new ChoroplethY({parentElement: '#mapY'}, geoData);
    scatterplot = new Scatterplot({parentElement: '#scatterplot'}, geoData);
    histogramX = new HistogramX({parentElement: '#histogramX'}, geoData);
    histogramY = new HistogramY({parentElement: '#histogramY'}, geoData);      
})
.catch(error => console.log(error));


function updateXCharts() {
    histogramX.data = updatedData;
    choroplethX.data = updatedData;
    scatterplot.data = updatedData;
    histogramX.updateVis();
    choroplethX.updateVis();
    scatterplot.updateVis();
}

function updateYCharts() {
    histogramY.data = updatedData;
    choroplethY.data = updatedData;
    scatterplot.data = updatedData;

    histogramY.updateVis();
    choroplethY.updateVis();
    scatterplot.updateVis();
}

function updateX(selectedX) {
    // Update d.properties.x
    geoData.objects.counties.geometries.forEach(d => {
        d.properties.x =+ d.properties[selectedX];
    });
    // Update titles/label x name
    xAxisLabel = selectedX;
    brushedSelection = [];
    filterData();
    //updateXCharts();
}

function updateY(selectedY) {
    // Update d.properties.y
    geoData.objects.counties.geometries.forEach(d => {
        d.properties.y =+ d.properties[selectedY];
    });

    // Update titles/labels y name
    yAxisLabel = selectedY;
    brushedSelection = [];
    filterData();
    //updateYCharts();
}

function filterData() {
    if (brushedSelection.length == 0 && selectedStatus.length == 0) {
        updatedData.objects.counties.geometries = geoData.objects.counties.geometries;
    } else if (brushedSelection.length == 0) {
        updatedData.objects.counties.geometries = geoData.objects.counties.geometries.filter(d => selectedStatus.includes(d.properties.status));
    } else if (selectedStatus.length == 0) {
        updatedData.objects.counties.geometries = geoData.objects.counties.geometries.filter(d => brushedSelection.includes(d.properties.cnty_fips));
    } else {
        updatedData.objects.counties.geometries = geoData.objects.counties.geometries.filter(d => selectedStatus.includes(d.properties.status) && brushedSelection.includes(d.properties.cnty_fips));
    }
    updateXCharts();
    updateYCharts();
}

/* EVENT LISTENERS */

// #selectbutton1 - handle the updating of the x button
d3.select("#selectButton1").on("change", function(d) {
    console.log(d);
    var selectedVar1 = d.target.value;
    // run the updateX function with this selected option
    updateX(selectedVar1);
});

// #selectbutton2 - handle the updating of the y button
d3.select("#selectButton2").on("change", function(d) { 
    var selectedVar2 = d.target.value;
    // run the updateY function with this selected option
    updateY(selectedVar2);
});

// all the legend buttons for urban rural status d.properties.status, 
// filters the data based on the buttons active
d3.selectAll('.legend-btn').on('click', function() {
    // clear the selected status array
    selectedStatus = [];

    // toggle 'inactive' class
    d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));

    // check which categories are active and add them to selectedStatus
    d3.selectAll('.legend-btn:not(.inactive)').each(function() {
        selectedStatus.push(d3.select(this).attr('status'));
    });

    // call filter data to update the data
    filterData();
});






