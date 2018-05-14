var Types = require('app/components/visualization/Types.js');
var AxisType = Types.AxisType;
var ContentType = Types.ContentType;
var d3 = require('app/components/d3js.js');

var Bounds = function (data, axisType, id, contentType, insidePadding) {
  this.index = (axisType === AxisType.y) ? 1 : 0
  this.type = axisType
  this.contentType = contentType
  this.insidePadding = insidePadding
  var dataMin = null
  var dataMax = null

  this.setMinimum = function (minimum, reverseDataRange) {
    if (this.contentType !== ContentType.Date && !reverseDataRange &&
      ((dataMax && minimum > dataMax) || (this.maximum && minimum > this.maximum))) {
      
      this.maximum = minimum + ((this.type === AxisType.x) ? this.insidePadding.right : this.insidePadding.top)
    }

    this.minimum = minimum
  }

  this.setMaximum = function (maximum,reverseDataRange) {
    if (this.contentType !== ContentType.Date && !reverseDataRange &&
      ((dataMin && maximum < dataMin) || (this.minimum && maximum < this.minimum))) {

      this.minimum = maximum - ((this.type === AxisType.x) ? this.insidePadding.left : this.insidePadding.bottom)
    }

    this.maximum = maximum
  }

  this.computeMinimum = function (data, id) {
    var d3Minimum = d3.min(data, function (shape) {
      if (shape.properties.axis[this.index] === id) {
        return (shape.geometry.coordinates) ?
          ((shape.geometry.coordinates[0] && shape.geometry.coordinates[0].constructor.name === "Array") ?
            d3.min(shape.geometry.coordinates, function(point) { return point[this.index] }.bind(this)) :
            shape.geometry.coordinates[this.index]) : 0
      }
    }.bind(this))

    dataMin = d3Minimum - (this.contentType === ContentType.Date) ? 0 :
      ((this.type === AxisType.x) ? this.insidePadding.left : this.insidePadding.bottom)

    return dataMin
  }

  this.computeMaximum = function (data, id) {
    var d3Maximum = d3.max(data, function(shape) {
      if (shape.properties.axis[this.index] === id) {
        return (shape.geometry.coordinates) ?
          ((shape.geometry.coordinates[0] && shape.geometry.coordinates[0].constructor.name === "Array") ?
            d3.max(shape.geometry.coordinates, function(point) { return point[this.index]; }.bind(this)) :
            shape.geometry.coordinates[this.index]) : 0
      }
    }.bind(this))

    dataMax = d3Maximum + (this.contentType === ContentType.Date) ? 0 :
      ((this.type === AxisType.x) ? this.insidePadding.right : this.insidePadding.top)

    return dataMax
  }

  this.minimum = 0
  this.maximum = 0

  if (data != null) {
    this.minimum = (this.contentType != ContentType.String) ? this.computeMinimum(data, id) : null
    this.maximum = (this.contentType != ContentType.String) ? this.computeMaximum(data, id) : null
  }
}

exports.Bounds = Bounds