var Margin = require('app/components/visualization/Margin.js').Margin;
var Curve = require('app/components/visualization/Curve.js').Curve;
var Axis = require('app/components/visualization/Axis.js').Axis;
var Legend = require('app/components/visualization/Legend.js').Legend;
var Types = require('app/components/visualization/Types.js');
var AxisType = Types.AxisType;
var FitType = Types.FitType;
var ChartType = Types.ChartType;
var ShapeType = Types.ShapeType;
var ShadeType = Types.ShadeType;
var ContentType = Types.ContentType;

var Shader = require('app/components/visualization/Shader.js').Shader;

var d3 = require('app/components/d3js.js');

var Chart = function (width, height, id, type, name, graphId) {
  this.width = width
  this.height = height
  this.type = type
  this.padding = new Margin (30, 30, 30, 30)
  this.insidePadding = new Margin (0, 0, 0, 0)
  this.name = name
  this.graphId = graphId
  this.x = 0
  this.y = 0
  this.id = id
  this.fit = FitType.Regular
  this.mouseRendered = false
  this.axes = []
  this.curves = []
  this.curveType = []
  this.singlePoint = [0, 0]
  this.showAFAC = false
  this.showBPD = false
  this.bpdUrl = ""
  this.afacPoints = []
  this.afacArea = 0
  this.bpdArea = 0
  this.gradientEnabled = false
  this.gradientColors = ["#fff", "#000"]
  this.nameOffset = null
  this.errorOffset = []
  this.errorText = null
  this.imageUrl = null
  this.imageLimits = null
  this.imageOnLoad = null
  this.showLegends = false
  this.showLine = false

  this.legend = new Legend(this.width, 0, 0, this.id)

  this.setName = function (name) {
    this.name = name
    return this
  }

  this.setShowLegends = function (show) {
    this.showLegends = show
    return this
  }

  this.setShowLine = function (show) {
    this.showLine = show
    return this
  }

  this.drawLegend = function (graphId, data) {
    if(this.showLegends){
      var chartType = [{"type": this.type, "id": this.id}]
      this.legend.drawBox(this.svg, data, chartType, this.showLegends)
      this.legend.displayKeys(this.legend.getBox(), this.id, this.height, 0, chartType, graphId)
    }
    return this
  }

  this.setBpdUrl = function (bpdUrl) {
    this.bpdUrl = bpdUrl
    return this
  }

  this.setAfacPoints = function (afacPoints) {
    this.afacPoints = afacPoints
    return this
  }

  this.setAfacArea = function (afacArea) {
    this.afacArea = afacArea
    return this
  }

  this.setBpdArea = function (bpdArea) {
    this.bpdArea = bpdArea
    return this
  }

  this.getAfacPoints = function () {
    return this.afacPoints
  }

  this.setSinglePoint = function (coordinates) {
    this.singlePoint = coordinates
    return this
  }

  this.setNameOffset = function (offset) {
    this.nameOffset = offset
    return this
  }

  this.setErrorOffset = function (offset) {
    this.errorOffset = offset
    return this
  }

  this.setImageUrl = function (url) {
    this.imageUrl = url
    return this
  }

  this.setImageLimits = function (limits) {
    this.imageLimits = limits
    return this
  }

  this.setImageOnLoad = function (func) {
    this.imageOnLoad = func
    return this
  }

  this.addCurve = function (index, points, standardForm, chartType, selected, color, lineSize) {
    this.curves.push(new Curve(this.fit, this.curveType[index], points, standardForm, chartType, selected, color, lineSize, this.singlePoint))
    return this.curves
  }

  this.setCurveType = function (type) {
    this.curveType = type
    return this
  }

  this.drawCurve = function (index, newFit) {
    this.curves[index].draw(this.svg,
      { x: this.axes[AxisType.x].scale.scale, y: this.axes[AxisType.y].scale.scale },
      this.axes[AxisType.x].bounds, this.graphId + this.id, index, newFit)
  }

  this.drawCurves = function () {
    this.curves.forEach(function (curve, index) {
      curve.draw(this.svg,
      { x: this.axes[AxisType.x].scale.scale, y: this.axes[AxisType.y].scale.scale },
      this.axes[AxisType.x].bounds, this.graphId + this.id, index)
    }.bind(this))
  }

  this.extractPointsFromPath = function (chart, path, coordinates, xScale, yScale, shadeType) {
    var pathEl = path.node()
    var distance = 0
    var isReversedY = chart.axes[AxisType.y].reverseDataRange

    var element = { "first": coordinates[0], "last": coordinates[coordinates.length - 1] }
    var last = { "x": xScale(element.first[AxisType.x]), "y": yScale(element.first[AxisType.y]) }
    var farthest = { "x": xScale.invert(chart.width),
                     "y": (isReversedY) ?
                            Math.max(element.last[AxisType.y], yScale.invert(chart.height)) :
                            Math.min(element.last[AxisType.y], yScale.invert(chart.height)) }

    var extractedPointsFromPath = []
    while ((shadeType != ShadeType.AFAC || (shadeType === ShadeType.AFAC && last.x < 100)) &&
            last.x < farthest.x && ((isReversedY) ? last.y > farthest.y : last.y < farthest.y)) {
      var extractedPoint = pathEl.getPointAtLength(distance++)

      var newX = xScale.invert(extractedPoint.x)
      var newY = yScale.invert(extractedPoint.y)

      if (last.x === newX && last.y === newY) {
        break
      }

      last.x = newX
      last.y = newY
      extractedPointsFromPath.push([last.x, last.y])
    }

    return extractedPointsFromPath
  }

  this.renderChartName = function () {
    this.svg.append("text")
      .attr("transform", "translate(" + ((this.nameOffset[AxisType.x]) ? this.nameOffset[AxisType.x] : 0) + ", " +
                                        ((this.nameOffset[AxisType.y]) ? this.nameOffset[AxisType.y] : 0) + ")")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "16px")
      .attr("id", "chartName")
      .text(this.name)
    return this
  }

  this.renderErrorText = function () {
    this.svg.append("text")
      .attr("transform", "translate(" + ((this.errorOffset[AxisType.x]) ? this.errorOffset[AxisType.x] : this.width/2) + ", " +
                                        ((this.errorOffset[AxisType.y]) ? this.errorOffset[AxisType.y] : -5) + ")")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#FF0000")
      .attr("id", "errorText")
      .text(this.errorText)
    return this
  }

  this.renderImage = function () {
    function base64Encode(str) {
      var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var out = "", i = 0, len = str.length, c1, c2, c3;
      while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt((c1 & 0x3) << 4);
          out += "==";
          break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
          out += CHARS.charAt((c2 & 0xF) << 2);
          out += "=";
          break;
        }
        c3 = str.charCodeAt(i++);
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += CHARS.charAt(c3 & 0x3F);
      }
      return out;
    }

    var chart = this
    $.ajax({
      context: this,
      url: this.imageUrl,
      type: 'GET',
      mimeType: "text/plain; charset=x-user-defined"
    }).done(function(data){
      var url = 'data:image/jpeg;base64,' + base64Encode(data);
      this.bgImage = this.svg.append("svg:image")
        .attr('x', 0)
        .attr('y', 0)
        .attr('id', 'planViewImage')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('href', url)
        .attr('onload', function () {
          d3.select($("#planViewImage")[0]).moveToBack();
          if (chart.imageOnLoad) {
            chart.imageOnLoad()
          }
        })
    }.bind(this)).fail(function(data){
      if (data.status == 404){
        this.bgImage = this.svg.append("svg:image")
          .attr('x', 0)
          .attr('y', 0)
          .attr('id', 'planViewImage')
          .attr('width', this.width)
          .attr('height', this.height)
          .attr('onload', function () {
            d3.select($("#planViewImage")[0]).moveToBack();
            if (chart.imageOnLoad) {
              chart.imageOnLoad()
            }
          })
        }
    })
  }

  this.renderMouse = function (chartType, hoverAxis, graphId) {
    if (hoverAxis != null){
      var axisScale = hoverAxis.scale.scale
    } else {
      var xScale = this.axes[AxisType.x].scale.scale
      var yScale = this.axes[AxisType.y].scale.scale
    }

    if (!this.mouseRendered && hoverAxis == null && !(typeof xScale.rangePoints === "function" || typeof yScale.rangePoints === "function")) {
      var id = this.id
      var rect = this.svg.append("rect")
        .attr("id", graphId + "rect" + id)
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("transform", "translate(0, 0)")
        .style("opacity", "0")

      if (chartType === ChartType.TP) {
        var chart = this

        rect.on({
          "click": function() {
            var mouseCoordinates = d3.mouse(this)

            $.ajax({
              'url': chart.bpdUrl + Number(Math.round(yScale.invert(mouseCoordinates[1])+'e0')+'e-0'),
              'type': 'GET',
              'data': {}
            }).done(function (data) {
              if (d3.selectAll("#shader_BPD").size() > 0) {
                d3.selectAll("#shader_BPD").remove()
                d3.selectAll("#shade_BPD").remove()
              }
              
              var yAdjustment = mouseCoordinates[1] - yScale(data[0][1])
              var xAdjustment = xScale(data[0][0])

              var line = d3.svg.line()
                .x(function (d) { return (xScale != null) ? xScale(d[0]) - xAdjustment : d[0] })
                .y(function (d) { return (yScale != null) ? yScale(d[1]) + yAdjustment : d[1] })

              var path = chart.svg.append("path")
                .attr("d", line(data))
                .attr("class", "line")
                .attr("id", "shader_BPD")
                .attr("fill", "none")
                .style("stroke", "#bf4b4b")
                .style("stroke-linecap", "round")
                .style("stroke-width", "2")
                .attr("clip-path", "url(#newSVG" + chart.graphId + chart.id + ")")

              var pathExtractedPoints = chart.extractPointsFromPath(chart, path, data, xScale, yScale, ShadeType.BPD)

              var shader = new Shader (
                chart.afacPoints,
                AxisType.x,
                pathExtractedPoints,
                "#bf4b4b",
                2,
                chart.id,
                {
                  "x": { "minimum": chart.axes[AxisType.x].bounds.minimum, "maximum": chart.axes[AxisType.x].bounds.maximum },
                  "y": { "minimum": chart.axes[AxisType.y].bounds.minimum, "maximum": chart.axes[AxisType.y].bounds.maximum },
                }
              )
              shader.shade(chart.svg, xScale, yScale)

              if (shader.area && chart.afacArea) {
                var af_over_ac = (shader.area/chart.afacArea).toFixed(2)
                var charge = "Discharging"

                if (af_over_ac < 0.7) {
                  charge = "Not discharging"
                } else if (af_over_ac >= 0.7 && af_over_ac < 0.85) {
                  charge = "Discharge uncertain"
                }

                $("#tp_afac_label").text("")
                $("#tp_afac").text("")
                d3.select("#tp_afac_label").append("text")
                  .text("AF/AC:")
                  .attr("transform", "translate(-60, 0)")

                d3.select("#tp_afac").append("text")
                  .text(af_over_ac + "  " + charge)
              }
            })
          }
        })
      } else if (chartType === ChartType.Injectivity) {
        var text = this.svg.append("text")
          .attr("id", graphId + "hover" + id)
          .attr("dy", ".71em")
          .style("text-anchor", "start")
          .style("font-size", "10px")

        var cursor = this.svg.append("circle")
          .attr("id", graphId + "hover" + id)
          .attr("r", 4)
          .attr("fill", "none")
          .attr("stroke", "#666")
          .style("display", "none")

        rect.on({
          "mouseover": function () {
            d3.select("text#" + graphId + "hover" + id).style("display", null)
            d3.select("circle#" + graphId + "hover" + id).style("display", null)
          },
          "mouseout": function () {
            d3.select("text#" + graphId + "hover" + id).style("display", "none")
            d3.select("circle#" + graphId + "hover" + id).style("display", "none")
          },
          "mousemove": function() {
            var coords = d3.mouse(this)
            text.attr("transform", "translate(" + (coords[0] + 7) + "," + (coords[1] - 3) + ")");
            text.text("(" + (yScale.invert(coords[1])).toFixed(2) + ")");
            cursor.attr("transform", "translate(" + (coords[0]) + "," + coords[1] + ")");
          }
        })
      } else {
        var text = this.svg.append("text")
          .attr("id", graphId + "hover" + id)
          .attr("dy", ".71em")
          .style("text-anchor", "start")
          .style("font-size", "10px")

        var cursor = this.svg.append("circle")
          .attr("id", graphId + "hover" + id)
          .attr("r", 4)
          .attr("fill", "none")
          .attr("stroke", "#666")
          .style("display", "none")

        rect.on({
          "mouseover": function () {
            d3.select("text#" + graphId + "hover" + id).style("display", null)
            d3.select("circle#" + graphId + "hover" + id).style("display", null)
          },
          "mouseout": function () {
            d3.select("text#" + graphId + "hover" + id).style("display", "none")
            d3.select("circle#" + graphId + "hover" + id).style("display", "none")
          },
          "mousemove": function() {
            var coords = d3.mouse(this)
            text.attr("transform", "translate(" + (coords[0] + 7) + "," + (coords[1] - 3) + ")");
            text.text("(" + (xScale.invert(coords[0])).toFixed(2) + "," + (yScale.invert(coords[1])).toFixed(2) + ")");
            cursor.attr("transform", "translate(" + (coords[0]) + "," + coords[1] + ")");
          }
        })
      }

      this.mouseRendered = true
    } else if(this.mouseRendered != true && hoverAxis != null && typeof axisScale.rangePoints != "function"){
      var id = this.id
      var rect = this.svg.append("rect")
        .attr("id", "rect" + id)
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("transform", "translate(0, 0)")
        .style("opacity", "0")

      var text = this.svg.append("text")
        .attr("id", "hover" + id)
        .attr("dy", ".71em")
        .style("text-anchor", "start")
        .style("font-size", "10px")

      var cursor = this.svg.append("circle")
        .attr("id", "hover" + id)
        .attr("r", 4)
        .attr("fill", "none")
        .attr("stroke", "#666")
        .style("display", "none")

      rect.on({
        "mouseover": function () {
          d3.select("#" + graphId + " text#hover" + id).style("display", null)
          d3.select("#" + graphId + " circle#hover" + id).style("display", null)
        },
        "mouseout": function () {
          d3.select("#" + graphId + " text#hover" + id).style("display", "none")
          d3.select("#" + graphId + " circle#hover" + id).style("display", "none")
        },
        "mousemove": function() {
          var coords = d3.mouse(this)
          text.attr("transform", "translate(" + (coords[0] + 7) + "," + (coords[1] - 3) + ")");
          text.text("(" + (axisScale.invert(coords[1])).toFixed(2) +  ")");
          cursor.attr("transform", "translate(" + (coords[0]) + "," + coords[1] + ")");
        }
      })
    }
  }

  this.setDataOffset = function (offset) {
    this.insidePadding = offset
    return this
  }

  this.setFit = function (fit) {
    this.fit = fit
    return this
  }

  this.setOffset = function (x, y) {
    this.x = x
    this.y = y
    return this
  }

  this.addAxis = function (type, name, id) {
    if (!(type in this.axes)) {
      this.axes[type] = new Axis(this.width, this.height, name, id, type, this.type)

      if (type === AxisType.x) {
        this.padding.bottom += 30
      }
    }
    return this
  }

  this.addAxisScale = function (type) {
    this.axes[type].scale()
    return this
  }

  this.getAxis = function (type) {
    return this.axes[type]
  }

  this.setAxis = function (type, axis) {
    this.axis[type] = axis
    return this
  }

  this.setAxisOffset = function (type, x, y) {
    this.axes[type].setOffset(x, y)
    return this
  }

  this.setAxisOrientation = function (type, orientation) {
    this.axes[type].setOrientation(orientation)
    return this
  }

  this.setAxisRotation = function (type, rotation) {
    this.axes[type].setRotation(rotation)
    return this
  }

  this.setAxisLabelOffset = function (type, x, y) {
    this.axes[type].setLabelOffset(x, y)
    return this
  }

  this.setAxisTickPadding = function (type, tickPadding) {
    this.axes[type].setTickPadding(tickPadding)
    return this
  }

  this.setAxisTickFormat = function (type, format) {
    this.axes[type].setTickFormat(format)
    return this
  }

  this.setAxisTickTextAnchor = function (type, textAnchor) {
    this.axes[type].setTickTextAnchor(textAnchor)
    return this
  }

  this.setAxisNumberOfTicks = function (type, ticks) {
    this.axes[type].setNumberOfTicks(ticks)
    return this
  }

  this.setAxisHeight = function (type, height) {
    this.axes[type].setHeight(height)
    return this
  }

  this.setAxisWidth = function (type, width) {
    this.axes[type].setWidth(width)
    return this
  }

  this.setAxisDataBounds = function (type, minimum, maximum) {
    this.axes[type].setDataBounds(minimum, maximum, this.insidePadding)
    return this
  }

  this.setAxisMinimumDataBounds = function(type, minimum){
    this.axes[type].setMinimumDataBounds(minimum)
    return this
  }

  this.setAxisMaximumDataBounds = function(type, maximum){
    this.axes[type].setMaximumDataBounds(maximum)
    return this
  }

  this.setAxisSide = function (type, side) {
    this.axes[type].setSide(side)
    return this
  }

  this.reverseAxisRange = function (type) {
    this.axes[type].reverseRange()
    return this
  }

  this.setShowAxisText = function (type, show) {
    this.padding.bottom = (show && this.axes[type].showText == false) ? this.padding.bottom + 30 : this.padding.bottom - 30
    this.axes[type].showText = show
    return this
  }

  this.setShowError = function(showError, errorText){
    this.showError = showError
    this.errorText = errorText
  }

  this.setBounds = function (data) {
    this.axes.forEach(function (axis) {
      axis.setBounds(data, this.insidePadding)
    }.bind(this))
    return this
  }

  this.setInsidePadding = function (padding) {
    this.insidePadding = padding
    return this
  }

  this.displayName = function () {
    this.axes.forEach(function (axis) {
      axis.displayName()
    })
    return this
  }

  this.setAxisTickValues = function (type, tickValues) {
    this.axes[type].setTickValues(tickValues)
    return this
  }

  this.setAxisTickOffset = function (type, x, y) {
    this.axes[type].setTickOffset(x, y)
    return this
  }

  this.setAxisTextAnchor = function (type, anchor) {
    this.axes[type].setTextAnchor(anchor)
    return this
  }

  this.setAxisTickRotation = function(type, angle){
    this.axes[type].setTickRotation(angle)
    return this
  }

  this.setAxisDateTimeFormat = function(type, format){
      this.axes[type].setDateTimeFormat(format)
      return this
  }

  this.setLabelVisibility = function (type, visibility) {
    this.axes[type].setLabelVisibility(visibility)
    return this
  }

  this.setLabelOffset = function (type, offset) {
    this.axes[type].setLabelOffset(offset)
    return this
  }

  this.setLabelRotation = function (type, rotation) {
    this.axes[type].setLabelRotation(rotation)
    return this
  }

  this.setTickVisibility = function (type, visibility) {
    this.axes[type].setTickVisibility(visibility)
  }

  this.setShowAFAC = function (show) {
    this.showAFAC = show
    return this
  }

  this.setShowBPD = function (show) {
    this.showBPD = show
    return this
  }

  this.setAxisTickInterval = function (type, interval) {
    this.axes[type].setInterval(interval)
    return this
  }

  this.showAxisOrigin = function (type, show) {
    this.axes[type].setShowOrigin(show)
    return this
  }

  this.defineLinearGradient = function () {
    return this.svg.append("defs").append("linearGradient")
      .attr("id", "linear-gradient");
  }

  this.setGradientColors = function (color1, color2) {
    this.gradientColors = [color1, color2]
    return this
  }

  this.enableGradient = function () {
    this.gradientEnabled = true
    return this
  }

  this.draw = function (graph, bgColor, graphId, graphHeight, legendOffset, chartType) {
    this.svg = graph.append("g")
      .attr("class", "chart")
      .attr("id", "chart" + this.id)
      .attr("transform", "translate(" + this.x + "," + this.y + ")")

    var bg_rect = this.svg.append("rect")
      .attr("id", "backgroundColor")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("fill", bgColor)

    this.axes.forEach(function (axis) {
      if (axis.type === AxisType.y) {
        axis.draw(this.svg,
          this.axes[AxisType.x].axisDefinition,
          this.axes[AxisType.x].scale.scale,
          this.axes[AxisType.x].contentType,
          this.axes[AxisType.x].currentTicks,
          this.axes[AxisType.x].width
        )
      } else {
        axis.draw(this.svg, null, null, null, null, null)
      }

      if (axis.tickOffset.x != 0 || axis.tickOffset.y != 0) {
        $("#chart" + this.id + " .axis#axis" + axis.type + " .tick text")
          .attr("transform", "translate(" + axis.tickOffset.x + "," + axis.tickOffset.y + ")")
      }
    }.bind(this))

    // Weight adjustment
    if (this.axes[AxisType.y].reachedMaximumHeight) {
      this.axes[AxisType.x].adjustWidthForSquareGridsAccordingToMaximumHeight(this.axes[AxisType.x].maximumHeight * (this.axes[AxisType.x].width / this.axes[AxisType.y].proposedHeight))
    }

    // Height adjustment
    if (this.axes[AxisType.y].height != this.height) {
      this.heightDifference = this.axes[AxisType.y].height - this.height

      this.height = this.axes[AxisType.y].height
      bg_rect.attr("height", this.height)

      this.axes[AxisType.x].setSide(this.height * -1)
      this.axes[AxisType.x].y = this.height
      this.axes[AxisType.x].axis.attr("transform", "translate(" + this.axes[AxisType.x].x + "," + 0 + ")")
      this.axes[AxisType.x].axisDefinition.tickSize(this.height)
      this.axes[AxisType.x].axis = this.axes[AxisType.x].axis.call(this.axes[AxisType.x].axisDefinition)
      this.axes[AxisType.x].labelOffset[1] = this.height + this.axes[AxisType.x].labelOffset[1]

      this.axes[AxisType.x].axis.selectAll("text")
        .style("text-anchor", "start")
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform", "translate(0," + (this.height + 5) + ")rotate(60)")

      d3.select("#" + graphId).attr("height", graphHeight + this.heightDifference)
    }

    var xAxis = this.axes[AxisType.x]
    var yAxis = this.axes[AxisType.y]

    if (this.type != ChartType.HolisticView && this.type != ChartType.OffsetWells && xAxis.contentType === ContentType.Integer && yAxis.contentType === ContentType.Integer) {
      if (xAxis.bounds.minimum != null && xAxis.bounds.maximum != null && !isNaN(xAxis.bounds.minimum) && !isNaN(xAxis.bounds.maximum)) {
        this.width = xAxis.scale.scale((xAxis.reverseDataRange) ? xAxis.bounds.minimum : xAxis.bounds.maximum)
        this.axes[AxisType.x].width = this.width
        this.axes[AxisType.x].labelOffset[AxisType.x] = this.width/2
      }

      if (yAxis.bounds.minimum != null && yAxis.bounds.maximum != null && !isNaN(yAxis.bounds.minimum) && !isNaN(yAxis.bounds.maximum)) {
        this.height = yAxis.scale.scale((yAxis.reverseDataRange) ? yAxis.bounds.maximum : yAxis.bounds.minimum)
        this.axes[AxisType.y].height = this.height
        this.axes[AxisType.y].labelOffset[AxisType.y] = this.height/2
      }
    }

    if (this.type == ChartType.HolisticView && this.showLine) {
      this.svg.append("line")
        .attr('class', "line")
        .attr("id", "chartLine" + this.id)
        .attr('x1', 0)
        .attr('y1', "-40")
        .attr('x2', 0)
        .attr('y2', this.height)
        .attr('stroke', "#ff0000")
        .attr('stroke-width', "3px")
    }

    d3.selection.prototype.moveToBack = function() {  
      return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        
        if (firstChild) { 
          this.parentNode.insertBefore(this, firstChild); 
        } 
      });
    };

    if (this.imageUrl) {
      this.renderImage()
    }
    
    this.svg.append("defs").append("clipPath")
        .attr("id", "newSVG" + this.graphId + this.id)
      .append("rect")
        .attr("id", "newSVG" + this.graphId +  this.id)
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("transform", "translate(0, 0)")
        .style("fill", "none")

    if (this.gradientEnabled === true) {
      var linearGradient = this.defineLinearGradient()

      linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")

      linearGradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", this.gradientColors[0]);

      linearGradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", this.gradientColors[1]);
    }

    if (this.name) {
      this.renderChartName()
    }

    if (this.showError === true) {
      this.renderErrorText()
    }

    return this
  }

  this.getIntersectionOfTwoCurves = function (a, b) {
    var ai = 0;
    var bi = 0;
    var result = [];

    while (ai < a.length && bi < b.length) {
      if (a[ai][AxisType.x] === b[bi][AxisType.x] && a[ai][AxisType.y] === b[bi][AxisType.y]) {
        result.push(ai);
      }

      if (a[ai][AxisType.x] <= b[bi][AxisType.x] && a[ai][AxisType.y] <= b[bi][AxisType.y]) {
        ai++;
      }
      
      if (a[ai][AxisType.x] >= b[bi][AxisType.x] && a[ai][AxisType.y] >= b[bi][AxisType.y]) {
        bi++;
      }
    }

    return result;
  }
}

exports.Chart = Chart