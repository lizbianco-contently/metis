queue()
    .defer(d3.json, "/senate114/projects")
    .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {
	
	//Clean projectsJson data
	var senate114Projects = projectsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");
	senate114Projects.forEach(function(d) {
		d["date"] = dateFormat.parse(d["date"]);
		 
	
		d["dummycount"] = +d["dummycount"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(senate114Projects);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["date"]; });
	var topicDim = ndx.dimension(function(d) { return d["topic"]; });
	var partyDim = ndx.dimension(function(d) { return d["party"]; });
	var stateDim = ndx.dimension(function(d) { return d["state"]; });
	var dummycountDim  = ndx.dimension(function(d) { return d["dummycount"]; });


	//Calculate metrics
	var numProjectsByDate = dateDim.group(); 
	var numProjectsByTopic = topicDim.group();
	var numProjectsByParty = partyDim.group();
	var totalCountByState = stateDim.group().reduceSum(function(d) {
		return d["dummycount"];
	});

	var all = ndx.groupAll();
	var totalCount = ndx.groupAll().reduceSum(function(d) {return d["dummycount"];});

	var max_state = totalCountByState.top(1)[0].value;

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["date"];
	var maxDate = dateDim.top(1)[0]["date"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
	var topicChart = dc.rowChart("#topic-row-chart");
	var partyChart = dc.rowChart("#party-row-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");
	var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	var countND = dc.numberDisplay("#count-nd");

	numberProjectsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	countND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(countND)
		.formatNumber(d3.format(".3s"));

	timeChart
		.width(600)
		.height(200)
		.margins({top: 10, right: 0, bottom: 30, left: 35})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.colors(["#2f2f2f"])
		.elasticY(true)
		.xAxisLabel("114th Senate")
		.yAxis().ticks(4);

	topicChart
        .width(600)
        .height(350)
        .margins({top: 10, right: 0, bottom: 30, left: 150})
        .dimension(topicDim)
        .group(numProjectsByTopic)
        .elasticX(true)
        .colors(['#3b3b3b', '#535353','#3b3b3b', '#535353','#3b3b3b', '#535353','#3b3b3b', '#535353','#3b3b3b', '#535353','#3b3b3b', '#535353', ])
        .xAxis().ticks(4);

	partyChart
		.width(300)
		.height(225)
        .dimension(partyDim)
        .group(numProjectsByParty)
        .elasticX(true)
        .colors(["#0a044f",  "#D4AC0D","#630505"])
        .xAxis().ticks(4);


	usChart.width(1000)
		.height(330)
		.dimension(stateDim)
		.group(totalCountByState)
		.colors(['#5f5f5f', '#4744747', '#2f2f2f' ])
		.colorDomain([0, max_state])
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		
		})
		.projection(d3.geo.albersUsa()
    				.scale(600)
    				.translate([340, 150]))
		.title(function (p) {
			return "State: " + p["key"]
					+ "\n"
					+ "Value: " + Math.round(p["dummycount"]) ;
		})

    dc.renderAll();

};