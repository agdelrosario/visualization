var Types = require('app/components/visualization/Types.js');
var AxisType = Types.AxisType;
var ShadeType = Types.ShadeType;

var Shape = require('app/components/visualization/Shape.js').Shape;

exports.Shader = function (limit, axis, basis, color = "#000000", lineSize=2, chartId, chartBounds) {
  this.limit = limit // 100 if AFAC or well track if BPD
  this.axis = axis
  this.basis = basis // The well track if AFAC or BPD curve if BPD
  this.coordinates = []
  this.color = color
  this.weight = 2
  this.type = ShadeType.None
  this.lineSize = lineSize
  this.area = 0
  this.areaBasisPoints = []
  this.areaLimitPoints = []
  this.chartId = chartId
  this.chartBounds = chartBounds

  this.calculateCoordinates = function (yScale) {
    var topmost_y = 0
    var leftmost_x = 0

    if (this.limit && this.limit.constructor.name === "Array") {
      this.type = ShadeType.BPD
    } else if (this.basis != null && this.basis.length > 0 && (this.basis[0][AxisType.x] < 100)) {
      this.type = ShadeType.AFAC
      topmost_y = this.chartBounds.y.minimum - 300 //Math.min(this.basis[0][AxisType.y], (this.chartBounds.y.minimum - 300))
      leftmost_x = Math.max(this.basis[0][AxisType.x], this.chartBounds.x.minimum)

      for (var y = this.basis[0][AxisType.y]; y < topmost_y; y += 3) {
        this.coordinates.unshift([[leftmost_x, y], [100, y]])
      }
    }

    this.basis.forEach(function (basisCoordinate) {
      if (this.type === ShadeType.BPD) {
        var limitX = this.limit.find(function (limitCoordinate) {
          return (Math.floor(yScale(basisCoordinate[AxisType.y])) === Math.floor(yScale(limitCoordinate[AxisType.y]))) &&
            basisCoordinate[AxisType.x] <= limitCoordinate[AxisType.x]
        })

        if (limitX != null) {
          this.coordinates.push([[basisCoordinate[0], Math.floor(basisCoordinate[1])], [limitX[AxisType.x] - 1, Math.floor(basisCoordinate[AxisType.y])]])
        }
      } else if (this.type === ShadeType.AFAC && basisCoordinate[AxisType.x] < 100 && leftmost_x < 100 && basisCoordinate[AxisType.y] < this.chartBounds.y.minimum) {
        this.coordinates.push([[basisCoordinate[0], Math.floor(basisCoordinate[1])], [100, Math.floor(basisCoordinate[AxisType.y])]])
      }
    }.bind(this))
  }

  this.shade = function (graph, xScale, yScale) {
    this.calculateCoordinates(yScale)

    var line = d3.svg.line()
      .x(function (d) { return (xScale != null) ? xScale(d[0]) : d[0] })
      .y(function (d) { return (yScale != null) ? yScale(d[1]) : d[1] })

    this.coordinates.forEach(function (coordinate) {
      this.path = graph.append("path")
        .attr("d", line(coordinate))
        .attr("fill", "none")
        .attr("stroke", this.color)
        .attr("stroke-width", this.lineSize)
        .attr("id", "shade_" + this.type)
        .attr("clip-path", "url(#newSVG" + this.chartId + ")")  
    }.bind(this))

    this.calculateArea()
  }

  this.calculateArea = function () {
    var previous_y = 0
    var sum = 0

    this.coordinates.forEach(function (coordinate) {
      if (previous_y != coordinate[0][1] && (Math.abs(previous_y - coordinate[0][1]) >= 5)) {
        sum += coordinate[1][0] - coordinate[0][0]
        previous_y = coordinate[0][1]
      }
    }.bind(this))

    this.area = sum
  }
}