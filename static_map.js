
function whenDocumentLoaded(action) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", action);
  } else {
    action();
  }
}

var controller = new ScrollMagic.Controller({
  globalSceneOptions: {
    triggerHook: 'onLeave'
  }
});






function add_strories(map) {

  var story = document.getElementById("story1");
  new ScrollMagic.Scene({
      triggerElement: story
    })
    .addIndicators() // add indicators (requires plugin)
    .addTo(controller)
    .on("enter leave", function(e) {
      let map_div = document.getElementById("map");
      if (e.type == "enter") {
        map_div.style.top = "0px";
        map_div.style.position = "fixed";

      } else {
        map_div.style.position = "relative";
      }
    });

  story = document.getElementById("story2");
  new ScrollMagic.Scene({
      triggerElement: story
    })
    .addIndicators() // add indicators (requires plugin)
    .addTo(controller)
    .on("enter leave", function(e) {
      if (e.type == "enter") {
        continent = "Africa"
        updateData(map, "data/2050/" + map.climate_scenario + "/" + map.climate_scenario + "_" + continent +".csv", continent, 'Continent', map.climate_scenario)
      } else {
        updateData(map, "data/2050/" + map.climate_scenario + "/" + map.climate_scenario + "_" + "World" + ".csv", "World", "World", map.climate_scenario)
      }
    });

    story = document.getElementById("story3");
    new ScrollMagic.Scene({
        triggerElement: story
      })
      .addIndicators() // add indicators (requires plugin)
      .addTo(controller)
      .on("enter leave", function(e) {
        if (e.type == "enter") {
          updateData(map, "data/2050/" + map.climate_scenario + "/" + map.climate_scenario + "_" + "Nigeria" + ".csv", "Nigeria", "Country", map.climate_scenario)

        } else {
          updateData(map, "data/2050/" + map.climate_scenario + "/" + map.climate_scenario + "_" + continent +".csv", continent, 'Continent', map.climate_scenario)
        }
      });

    var slides = document.querySelectorAll(".spacer");
    // create scene for every slide
    for (var i = 0; i < slides.length; i++) {
      new ScrollMagic.Scene({
          triggerElement: slides[i]
        })
        .addIndicators() // add indicators (requires plugin)
        .addTo(controller);
    }
}


function updateData(map, path_to_data, region, region_type, climate_scenario) {
  let data = []
  d3.csv(path_to_data, function(csv) {

      let population = csv['Population 2050']
      let requirement = population * 365 * 2355000
      let calories = csv['Calories 2050']
      let sufficiency = 1
      if (requirement > 0) {
        sufficiency = calories / requirement
      }

      let change_in_prod = parseFloat(csv.percent_change_in_production)
      if (isNaN(change_in_prod)) {
        change_in_prod = Number.MAX_VALUE
      }
      data.push({
        "min_lon": (+csv.min_lon),
        "max_lon": (+csv.max_lon),
        "min_lat": -(+csv.min_lat),
        "max_lat": -(+csv.max_lat),
        "sufficiency": sufficiency,
        "percent_change_in_production": change_in_prod
      });
    })
    .then(() => {
      map.display_data(data, region, region_type, climate_scenario)
    });
}

class Map {
  constructor() {
    this.width = window.innerWidth * 0.66;
    this.height = window.innerHeight;
    this.projection = d3.geoWinkel3()
      .translate([4 * this.width / 9, this.height / 1.8])
      .scale((this.width) / 5);
    this.path = d3.geoPath()
      .projection(this.projection);
    this.svg = d3.select('#map').select('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.land = this.svg.select('#container').append('g');
    this.circles = this.svg.select('#container').append('g');
    this.boundaries = this.svg.select('#container').append('g');
    this.transform = d3.zoomIdentity
    this.climate_scenario = 'SSP1'
    this.region = 'World'
    this.region_type = 'Global'

    this.main_data = []

    this.predefined_zoom_levels = {
      'World': {
        'x': 0,
        'y': 0,
        'k': 1
      },
      'Europe': {
        'x': -4.009 * this.projection([15.36, 49.194])[0] + this.width / 2,
        'y': -4.009 * this.projection([15.36, 49.194])[1] + this.height / 2,
        'k': 4.009
      },
      'Africa': {
        'x': -1.496 * this.projection([19.25, 0.442])[0] + this.width / 2,
        'y': -1.496 * this.projection([19.25, 0.442])[1] + this.height / 2,
        'k': 1.496
      },
      'Asia': {
        'x': -1.604 * this.projection([78.76, 25.003])[0] + this.width / 2,
        'y': -1.604 * this.projection([78.76, 25.003])[1] + this.height / 2,
        'k': 1.604
      },
      'North America': {
        'x': -2.076 * this.projection([-78.23, 32.262])[0] + this.width / 2,
        'y': -2.076 * this.projection([-78.23, 32.262])[1] + this.height / 2,
        'k': 2.076
      },
      'South America': {
        'x': -1.782 * this.projection([-62.76, -20.891])[0] + this.width / 2,
        'y': -1.782 * this.projection([-62.76, -20.891])[1] + this.height / 2,
        'k': 1.782
      },
      'Oceania': {
        'x': -2.649 * this.projection([147.18, -25.378])[0] + this.width / 2,
        'y': -2.649 * this.projection([147.18, -25.378])[1] + this.height / 2,
        'k': 2.649
      }
    }
  }

  draw_legend(color_scale) {
    let xpos = window.innerWidth / 5;
    let ypos = window.innerHeight * 0.85;
    let svg = d3.select("svg");

    svg.selectAll(".legendLinear").remove()

    svg.append("g")
      .attr("class", "legendLinear")
      .attr("transform", "translate(" + xpos + "," + ypos + ")")

    let legendLinear = d3.legendColor()
      .shapeWidth(window.innerWidth / 37)
      .shapeHeight(window.innerWidth / 50)
      .title("Predicted percent change in calory production between 2000 and 2050 (%)")
      .orient('horizontal')
      .cells([-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
      .scale(color_scale);

    svg.select(".legendLinear")
      .call(legendLinear);
  }

  display_data(data, region, region_type, climate_scenario) {
    this.main_data = data

    const context = this;

    const colorScale = d3.scaleLinear()
      .domain([-100, 0, 100])
      .range(['red', 'yellow', 'green'])
    colorScale.clamp(true)

    this.draw_legend(colorScale)

    let dataPoints = this.circles.selectAll('polygon').data(data, d => d.min_lon.toString() + "," + d.min_lat.toString());

    if ((region_type == 'Continent' || region_type == 'Global') && (region_type != this.region_type || region != this.region)) {
      let zoom_level = this.predefined_zoom_levels[region]
      this.zoom_on_continent(zoom_level['x'], zoom_level['y'], zoom_level['k'])

      this.land
        .selectAll('path') // To prevent stroke width from scaling
        .transition()
        .duration(1000)
        .attr('transform', this.transform);

      this.boundaries
        .selectAll('path') // To prevent stroke width from scaling
        .transition()
        .duration(1000)
        .attr('transform', this.transform);
    }

    this.region = region
    this.region_type = region_type
    this.climate_scenario = climate_scenario

    dataPoints
      .enter().append('polygon')
      .attr('points', d => context.projection([d.min_lon, d.min_lat])[0] + ',' + context.projection([d.min_lon, d.min_lat])[1] + ' ' +
        context.projection([d.min_lon, d.max_lat])[0] + ',' + context.projection([d.min_lon, d.max_lat])[1] + ' ' +
        context.projection([d.max_lon, d.max_lat])[0] + ',' + context.projection([d.max_lon, d.max_lat])[1] + ' ' +
        context.projection([d.max_lon, d.min_lat])[0] + ',' + context.projection([d.max_lon, d.min_lat])[1])
      .style('fill', d => colorScale(d.percent_change_in_production))
      .attr('transform', context.transform)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1);

    dataPoints
      .transition()
      .duration(1000)
      .attr('points', d => context.projection([d.min_lon, d.min_lat])[0] + ',' + context.projection([d.min_lon, d.min_lat])[1] + ' ' +
        context.projection([d.min_lon, d.max_lat])[0] + ',' + context.projection([d.min_lon, d.max_lat])[1] + ' ' +
        context.projection([d.max_lon, d.max_lat])[0] + ',' + context.projection([d.max_lon, d.max_lat])[1] + ' ' +
        context.projection([d.max_lon, d.min_lat])[0] + ',' + context.projection([d.max_lon, d.min_lat])[1])
      .attr('transform', context.transform)
      .style('fill', d => colorScale(d.percent_change_in_production));

    dataPoints
      .exit()
      .transition()
      .duration(1000)
      .attr('opacity', 0)
      .remove();
  }

  zoom_on_continent(x, y, k) {
    this.transform.x = x
    this.transform.y = y
    this.transform.k = k
  }
}

function update_story(ssp_type) {
  d3.csv("../data/graph/graph_continent_data_" + ssp_type.toLowerCase() + ".csv").then(function(continents) {
    let max_gain = -10000000;
    let min_gain = 10000000;
    let max_sufficiency = -10000000;
    let min_sufficiency = 10000000;
    let suffient_continent = 'Europe';
    let continent_gains_most = 'Europe';
    let sufficient_continent = 'Europe';
    let least_sufficient_continent = 'Europe';
    for (let continent of continents) {
      let diffCalories = +continent.diffCalories;
      let sufficiency = +continent.Sufficiency2050;
      console.log(diffCalories, sufficiency, continent)
      if (diffCalories < min_gain) {
        continent_suffer_most = continent;
        min_gain = diffCalories;
      }
      else if (diffCalories > max_gain) {
        continent_gains_most = continent;
        max_gain = diffCalories;
      }
      if (sufficiency < min_sufficiency) {
        least_sufficient_continent = continent;
        min_sufficiency = sufficiency;
      }
      else if (sufficiency > max_sufficiency) {
        sufficient_continent = continent;
        max_sufficiency = sufficiency;
      }
    }
    console.log(continent_suffer_most, continent_gains_most, least_sufficient_continent, sufficient_continent)
    document.getElementById("continent_suffer_most").innerHTML = continent_suffer_most.continent;
    document.getElementById("continent_gains_most").innerHTML = continent_gains_most.continent;
    document.getElementById("least_sufficient_continent").innerHTML = least_sufficient_continent.continent;
    document.getElementById("sufficient_continent").innerHTML = sufficient_continent.continent;

    document.getElementById("continent_suffer_most_name").innerHTML = continent_suffer_most.continent;
    document.getElementById("continent_suffer_most_name_variation").innerHTML = continent_suffer_most.diffCalories;
    document.getElementById("continent_suffer_most_sufficiency").innerHTML = continent_suffer_most.Sufficiency2050;
    document.getElementById("continent_suffer_most_population").innerHTML = continent_suffer_most.Population2050;
  });

}


whenDocumentLoaded(() => {
  const map = new Map();

  add_strories(map);
  const background = d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json');

  let dropdown_scenario = document.getElementById("select_rcp");
  dropdown_scenario.onchange = function() {
    let ssp_nb = this.value;
    let ssp_type = 'SSP' + ssp_nb;
    if (!map.compare_mode) {
      updateData(map, 'data/2050/SSP' + ssp_nb + '/SSP' + ssp_nb + '_' + map.region + '.csv', map.region, map.region_type, ssp_type)
    }
    update_story(ssp_type)
  }

  let data = [];

  d3.csv("data/2050/SSP1/SSP1_World.csv", function(csv) {

      let population = csv['Population 2050']
      let requirement = population * 365 * 2355000
      let calories = csv['Calories 2050']
      let sufficiency = 1
      if (requirement > 0) {
        sufficiency = calories / requirement
      }

      let change_in_prod = parseFloat(csv.percent_change_in_production)
      if (isNaN(change_in_prod)) {
        change_in_prod = Number.MAX_VALUE
      }

      data.push({
        "min_lon": (+csv.min_lon),
        "max_lon": (+csv.max_lon),
        "min_lat": -(+csv.min_lat),
        "max_lat": -(+csv.max_lat),
        "sufficiency": sufficiency,
        "percent_change_in_production": change_in_prod
      });
    })
    .then(() => {
      background.then(world => {
        map.land.append('path')
          .datum(topojson.merge(world, world.objects.countries.geometries))
          .attr('class', 'land')
          .attr('d', map.path);

        map.boundaries.append('path')
          .datum(topojson.mesh(world, world.objects.countries))
          .attr('class', 'boundary')
          .attr('d', map.path);
      });

      map.display_data(data, 'World', 'Global', 'SSP1')
    });

});
