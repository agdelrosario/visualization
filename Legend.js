var Types = require('app/components/visualization/Types.js');
var AxisType = Types.AxisType;
var ShapeType = Types.ShapeType;
var ChartType = Types.ChartType;

var Margin = require('app/components/visualization/Margin.js').Margin;
var Key = require('app/components/visualization/Key.js').Key;

var Legend = function (width, x, y, id) {
  this.width = width;
  this.height = 35;
  this.padding = new Margin(5, 5, 5, 5);
  this.x = x;
  this.y = y;
  this.enableLowerRightOffset = false;
  this.heightBasis = 0;
  this.id = id + "Legends";
  this.isChartLegendEnabled = false;

  this.getBox = function () {
    return this.box;
  }

  this.setWidth = function (width) {
    this.width = width;
    return this
  }

  this.setHeight = function (height) {
    this.height = height;
    return this
  }

  this.getKeys = function (shapes, chartTypes, isChartLegendEnabled) {
    var keys = []

    if (shapes) {
      var casingIndexes = [];
      shapes.forEach(function (shape, index) {
        if (('feature_type' in shape.properties) && (shape.properties.feature_type == 'casing')) {
          casingIndexes.push(index);
        }
      })

      if (casingIndexes.length > 1){
        var i = casingIndexes[0]
        var j = casingIndexes[casingIndexes.length-1]

        if (i > j){ 
          i, j = j, i
        }
        while (i < j){
          var temp = shapes[j];
          shapes[j] = shapes[i];
          shapes[i] = temp;
          i = i + 1;
          j = j - 1;
        }
      }

      shapes.forEach(function (shape, index) {
        var isTpChart = (chartTypes.findIndex(function(obj){
          return obj.type === ChartType.TP
        }) > -1);

        if ("enableLegend" in shape.properties) {
          if (shape.properties.enableLegend) {
            var boxWidth = (isTpChart) ? this.width: 0
            keys.push(new Key(index, shape, 0, 0, isChartLegendEnabled, boxWidth))
          }
        }
        else if (!isTpChart || (isTpChart && shape.geometry.type == ShapeType.Line)) {
          keys.push(new Key(index, shape, 0, 0, isChartLegendEnabled))
        }
      }.bind(this))
    }

    return keys
  }

  this.setOffset = function (x, y) {
    this.x = x
    this.y = y
    return this
  }

  this.offsetToLowerRight = function (heightBasis) {
    this.enableLowerRightOffset = true
    this.heightBasis = heightBasis
  }

  this.drawBox = function (graph, data, chartTypes, isChartLegendEnabled = false) {
    this.isChartLegendEnabled = isChartLegendEnabled
    this.keys = this.getKeys(data, chartTypes, isChartLegendEnabled)

    this.box = graph.append("g")
      .attr("id", "leg")
      .attr("transform", "translate(" + this.x + "," + this.y + ")")

    this.boxMain = this.box.append("rect")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("fill", "#ffffff")
      .attr("fill-opacity", "0.7")
      .attr("class", "legends")
      .attr("id", ((this.isChartLegendEnabled) ? "chart" : "") + this.id + "Box")
  }

  this.displayKeys = function (graph, graphId, graphHeight, heightAdjustment, chartTypes, mainGraphId) {
    var offsetX = this.padding.left
    var offsetY = this.padding.top
    var numberOfKeys = this.keys.length

    this.keys.forEach(function (key, index) {
      key.addOffset(offsetX, offsetY)

      if (chartTypes.indexOf(ChartType.TP) > -1) {
        key.display(graph, 10)
      }  else {
        key.display(graph)
      }

      if (offsetX + key.width > (this.width)) {
        offsetX = this.padding.left
        offsetY +=  this.padding.top + key.height
        key.remove(graphId)
        key.setX(offsetX)
        key.addOffset(0, this.padding.top + key.height)

        if (chartTypes.indexOf(ChartType.TP) > -1) {
          key.display(graph, 10)
        } else {
          key.display(graph)
        }

        this.height = offsetY + key.height + this.padding.bottom

        if (this.y + this.height > graphHeight) {
          if(this.isChartLegendEnabled){        
            var mainGraphHeight = parseFloat(d3.select("#" + mainGraphId).attr("height"))
            d3.select("#chart" + graphId).attr("height", graphHeight + this.height + (key.height * 2) + this.padding.bottom)
            d3.select("#" + mainGraphId).attr("height", mainGraphHeight + (key.height * 2) + this.padding.bottom)
          }
          else{
            d3.select("#" + graphId).attr("height", graphHeight + this.height + (key.height * 2) + this.padding.bottom)
          }
        }
      }

      if (this.enableLowerRightOffset) {
        $("g#leg").attr("transform", "translate(" + this.x + "," + (this.heightBasis - this.height) + ")")
      }

      offsetX += key.width
    }.bind(this))

    if (this.isChartLegendEnabled) {
      d3.select("#chart" + this.id + "Box").attr("height", this.height)
      d3.select("#chart" + this.id + "Box").attr("width", this.width)
    } else {
      d3.select("#" + this.id + "Box").attr("height", this.height)
    }
  }
}

exports.Legend = Legend