var Icon = require('app/components/visualization/Icon.js').Icon;
var Label = require('app/components/visualization/Label.js').Label;
var d3 = require('app/components/d3js.js');

var Key = function (index, shape, x, y, isChartLegendEnabled = false, width = 0) {
  this.id = shape.geometry.type + index
  this.height = 15
  this.width = width
  this.x = x
  this.y = y
  this.spacing = 10
  this.icon = new Icon(this.id, shape, this.height, this.x, this.y)
  this.label = new Label(this.id, shape.properties.name, this.height, this.x, this.y, width)
  this.legendSpacing = 0
  this.isChartLegendEnabled = isChartLegendEnabled

  this.display = function (graph, legend_spacing = this.spacing) {
    if(shape.properties.name){
      this.legendSpacing = legend_spacing
      this.icon.draw(graph)
      this.label.addOffset(this.icon.width + this.spacing, 0)
      this.label.draw(graph)
      this.width = this.icon.width + this.spacing + this.label.width + this.legendSpacing
    }
  }


  this.addOffset = function (x, y) {
    this.x += x
    this.y += y
    this.icon.addOffset(x, y)
    this.label.addOffset(x, y)
  }

  this.setX = function (x) {
    this.x = x
    this.icon.setX(x)
    this.label.setX(x)
  }

  this.setY = function (y) {
    this.offset = y
    this.icon.setY(y)
    this.label.setY(y)
  }

  this.remove = function (graphId) {
    if (this.isChartLegendEnabled) {
      d3.selectAll("#chart" + graphId + " #" + this.id).remove()
    } else {
      d3.selectAll("#" + graphId + " #" + this.id).remove()  
    }
  }
}

exports.Key = Key