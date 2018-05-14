var Types = require('app/components/visualization/Types.js');
var AxisType = Types.AxisType;
var ContentType = Types.ContentType;
var DateTimeFormat = Types.DateTimeFormat;
var ChartType = Types.ChartType;

var Scale = require('app/components/visualization/Scale.js').Scale;
var Bounds = require('app/components/visualization/Bounds.js').Bounds;

var d3 = require('app/components/d3js.js');
var math = require('vendor/mathjs/dist/math.min.js');

var Axis = function (width, height, name, id, type, chartType) {
  this.width = width
  this.height = height
  this.name = name
  this.id = id
  this.type = type
  this.chartType = chartType

  this.contentType = ContentType.Integer
  this.dateTimeFormat = DateTimeFormat.MY
  this.labelOffset = [0, 0]
  this.orientation = "bottom"
  this.reverseDataRange = false
  this.rotation = 0
  this.showText = true
  this.side = ((this.type == AxisType.x) ? this.height : this.width) * -1
  this.tickInterval = 0
  this.tickOffset = { x: 0, y: 0}
  this.tickPadding = 10
  this.tickRotation = 0
  this.ticks = 5
  this.currentTicks = []
  this.reachedMaximumHeight = false
  this.maximumHeight = 650
  this.textAnchor = "middle"
  this.tickTextAnchor = "middle"
  this.showOrigin = false

  this.minBound = null;
  this.maxBound = null;

  this.x = 0
  this.y = 0

  this.setChartType = function(chartType){
    this.chartType = chartType
    return this
  }

  this.setShowOrigin = function (show) {
    this.showOrigin = show
    return
  }

  this.setInterval = function (interval) {
    this.tickInterval = interval
    return this
  }

  this.setSide = function (side) {
    this.side = side
    return this
  }

  this.setTickOffset = function (x, y) {
    this.tickOffset.x = x
    this.tickOffset.y = y
    return this
  }

  this.setShowText = function (show) {
    this.showText = show
    return this
  }

  this.setOffset = function (x, y) {
    this.x = x
    this.y = y
    return this
  }

  this.wrap = function (tx, width) {
    tx.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          sth = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1,
          y = 0,
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", 0).attr("dy", "0.25em")

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));

        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];

          tspan = text.append("tspan")
            .attr("alignment-baseline", "central")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", ++lineNumber * lineHeight + "em")
            .text(word);
        }
      }
    });
  }

  this.extractUnique = function (array) {
    return array.filter(function(item, pos) {
      return array.indexOf(item) == pos;
    })
  }

  this.setDomain = function (domain, data) {
    this.domain = (domain === null) ?
      ((this.contentType === ContentType.String && !(data[0].geometry.type === "Coefficient" || data[0].geometry.type === "Constant")) ?
        this.extractUnique(data.map(function (shape) {
          if (shape.properties.axis[this.type] == this.id) {
            if (shape.geometry.coordinates[0].constructor.name === "Array") {
              var values = []
              shape.geometry.coordinates.forEach(function (coordinate) {
                if (values.indexOf(coordinate[this.type]) == -1) {
                  values.push(coordinate[this.type])
                }
              }.bind(this))

              return (values.length > 1) ? null : values[0]
            } else {
              return shape.geometry.coordinates[this.type]
            }
          }
        }.bind(this))) :
        [this.bounds.minimum, this.bounds.maximum]) :
      domain

    return this
  }

  this.setHeight = function (height) {
    this.height = height
    return this
  }

  this.setWidth = function (width) {
    this.width = width
    return this
  }

  this.setRange = function (range) {
    this.range = (range == null) ?
      ((this.type == AxisType.x) ? [0, this.width] : [this.height, 0]) :
      range
    return this
  }

  this.setTickFormat = function (format) {
    this.tickFormat = format
    return this
  }

  this.setTickPadding = function (tickPadding) {
    this.tickPadding = tickPadding
    return this
  }

  this.setNumberOfTicks = function (n) {
    this.ticks = n
    return this
  }

  this.setTickTextAnchor = function (textAnchor) {
    this.tickTextAnchor = textAnchor
    return this
  }

  this.setTickRotation = function(angle){
    this.tickRotation = angle
    return this
  }

  this.addScale = function (type) {
    this.scale = new Scale(this.domain, this.range, type)
    return this
  }

  this.setOrientation = function (orientation) {
    this.orientation = orientation
    return this
  }

  this.setRotation = function (rotation) {
    this.rotation = rotation
    return this
  }

  this.setTickValues = function (tickValues) {
    this.tickValues = tickValues
    return this
  }

  this.setDateTimeFormat = function(dateTimeFormat){
    this.dateTimeFormat = dateTimeFormat
    return this
  }

  this.setLabelVisibility = function (visibility) {
    this.showLabel = visibility
    return this
  }

  this.setLabelRotation = function (rotation) {
    this.rotation = rotation
    return this
  }

  this.computeIntervalTicks = function (newTicks) {
    if (this.reverseDataRange) {
      if (this.showOrigin === true && 0 <= this.bounds.maximum && 0 >= this.bounds.minimum) {
        var newTicks = []
        newTicks.push(0)

        while (newTicks[newTicks.length - 1] - this.tickInterval >= this.bounds.minimum) {
          newTicks.push(newTicks[newTicks.length - 1] - this.tickInterval)
        }

        newTicks = newTicks.reverse()

        while ((newTicks[newTicks.length - 1] + this.tickInterval) <= this.bounds.maximum) {
          newTicks.push(newTicks[newTicks.length - 1] + this.tickInterval)
        }
      } else {
        if (newTicks[0] + this.tickInterval <= this.bounds.maximum) {
          newTicks.splice(0, 0, newTicks[0] + this.tickInterval)
        }

        do {
          newTicks.push(newTicks[newTicks.length - 1] - this.tickInterval)
        } while ((newTicks[newTicks.length - 1] - this.tickInterval) >= this.bounds.minimum)

        while ((newTicks[0] + this.tickInterval) <= this.bounds.maximum) {
          newTicks.unshift(newTicks[0] + this.tickInterval)
        } 
      }
    } else {
      if (this.showOrigin === true && 0 <= this.bounds.maximum && 0 >= this.bounds.minimum) {
        var newTicks = []
        newTicks.push(0)

        while (newTicks[newTicks.length - 1] - this.tickInterval >= this.bounds.minimum) {
          newTicks.push(newTicks[newTicks.length - 1] - this.tickInterval)
        }

        newTicks = newTicks.reverse()

        while (newTicks[newTicks.length - 1] + this.tickInterval <= this.bounds.maximum) {
          newTicks.push(newTicks[newTicks.length - 1] + this.tickInterval)
        }
      } else {
        if (newTicks[0] - this.tickInterval >= this.bounds.minimum) {
          newTicks.splice(0, 0, newTicks[0] - this.tickInterval)
        }

        do {
          newTicks.push(newTicks[newTicks.length - 1] + this.tickInterval)
        } while ((newTicks[newTicks.length - 1] + this.tickInterval) <= this.bounds.maximum)

        while ((newTicks[0] - this.tickInterval) >= this.bounds.minimum) {
          newTicks.unshift(newTicks[0] - this.tickInterval)
        }
      }

    }

    return newTicks
  }

  this.adjustWidthForSquareGridsAccordingToMaximumHeight = function (newWidth) {
    this.width = newWidth

    if (this.type == AxisType.x) {
      this.range = [0, this.width]
      this.scale.scale.range(this.range)
      this.axisDefinition.scale(this.scale.scale)
    }

    this.axis.call(this.axisDefinition)
  }

  this.adjustHeightForSquareGrids = function (newTicks, xAxisDefinition, xAxisScale, xAxisCurrentTicks, xAxisWidth) {
    var xAxisTicks = xAxisDefinition.scale().ticks(xAxisDefinition.ticks()[0])
    if (xAxisCurrentTicks != null && xAxisCurrentTicks.length > 0) {
      xAxisTicks = xAxisCurrentTicks
    }

    var yAxisDistance = math.abs(this.scale.scale(newTicks[0]) - this.scale.scale(newTicks[1]))
    var xAxisDistance = math.abs(xAxisScale(xAxisTicks[0]) - xAxisScale(xAxisTicks[1]))
    var difference = xAxisDistance - yAxisDistance

    if (difference && difference != 0) {
      length = newTicks.length

      var topSquare = 0
      var bottomSquare = 0

      if (this.scale.scale(newTicks[0]) != this.height) {
        var bottomSquareHeight = math.abs(this.height - this.scale.scale(newTicks[0]))
        bottomSquare = (bottomSquareHeight/yAxisDistance) * difference
      }

      if (this.scale.scale(newTicks[newTicks.length - 1]) != 0) {
        var topSquareHeight = math.abs(0 - this.scale.scale(newTicks[newTicks.length - 1]))
        topSquare = (topSquareHeight/yAxisDistance) * difference
      }

      this.proposedHeight = this.height + ((length - 1) * difference) + (topSquare + bottomSquare)

      if (this.scale.scale(newTicks[newTicks.length - 1]) == 0) {
        length -= 1
      }
      
      this.labelOffset[1] = this.labelOffset[1] + ((length * difference)/2)

      if (this.chartType != ChartType.PlanView && (this.proposedHeight > this.maximumHeight))  {
        this.height = this.maximumHeight
        this.reachedMaximumHeight = true
      } else {
        this.height = this.proposedHeight
      }

      if (this.chartType != ChartType.PlanView){
        this.width = this.maximumHeight * (xAxisWidth / this.proposedHeight)
      }

      if (this.reverseDataRange != null && this.reverseDataRange === true) {
        this.range = [0, this.height]
      } else {
        this.range = [this.height, 0]
      }
    } else if (!difference) {
      var firstHalf = xAxisScale(newTicks[0]) - xAxisScale(this.bounds.minimum)
      var secondHalf = xAxisScale(this.bounds.maximum) - xAxisScale(newTicks[0])
      this.height = firstHalf + secondHalf

      if (this.reverseDataRange != null && this.reverseDataRange === true) {
        this.range = [0, this.height]
      } else {
        this.range = [this.height, 0]
      }
    }

  }

  this.createAxisTicks = function (graph, xAxisDefinition, xAxisScale, xAxisContentType, xAxisCurrentTicks, xAxisWidth) {
    this.axisDefinition = d3.svg.axis()
      .scale(this.scale.scale)
      .orient(this.orientation)
      .tickPadding(this.tickPadding)

    if (this.side != 0) {
      this.axisDefinition.tickSize(this.side)
    }

    if (this.ticks > 0) {
      this.axisDefinition.ticks(this.ticks)
    }

    if (this.tickValues != null) {
      this.axisDefinition.tickValues(this.tickValues)
    } else if (this.type === AxisType.x && this.contentType === ContentType.Integer && this.tickInterval > 0) {
      var ticks = this.axisDefinition.scale().ticks(this.ticks)
      if (this.reverseDataRange) {
        ticks = ticks.reverse()
      }

      var newTicks = this.computeIntervalTicks([ticks[0]])

      this.axisDefinition.tickValues(newTicks)
      this.currentTicks = newTicks
    } else if (this.type === AxisType.y && xAxisContentType === ContentType.Integer && this.tickInterval > 0) {
      var ticks = this.axisDefinition.scale().ticks(this.ticks)

      if (this.reverseDataRange) {
        ticks = ticks.reverse()
      }

      var newTicks = this.computeIntervalTicks([ticks[0]])

      this.adjustHeightForSquareGrids(newTicks, xAxisDefinition, xAxisScale, xAxisCurrentTicks, xAxisWidth)
      this.scale.scale.range(this.range)
      this.axisDefinition.scale(this.scale.scale)
      this.axisDefinition.tickValues(newTicks)

      if (this.reachedMaximumHeight === true) {
        this.side = this.width * -1
        this.axisDefinition.tickSize(this.side)
      }

      this.currentTicks = newTicks
    }

    if (this.contentType === ContentType.Date) {
      this.axisDefinition.tickFormat((this.tickFormat != null) ? this.tickFormat : d3.time.format(this.dateTimeFormat))
    } else if (this.tickFormat != null) {
      this.axisDefinition.tickFormat(this.tickFormat)
    }
  }

  this.draw = function (graph, xAxisDefinition, xAxisScale, xAxisContentType, xAxisCurrentTicks, xAxisWidth) {
    this.createAxisTicks(graph, xAxisDefinition, xAxisScale, xAxisContentType, xAxisCurrentTicks, xAxisWidth)

    if (this.tickRotation && this.tickRotation != 0) {
      this.axis = graph.append("g")
          .attr("id", "axis" + this.type)
          .attr("class", "axis")
          .attr("transform", "translate(" + this.x + "," + this.y + ")")
          .call(this.axisDefinition)
        .selectAll(".tick text")
          .style("text-anchor", "start")
          .attr("transform", function(d) {
            return "translate(10,5)rotate(" + this.tickRotation + ")" 
          }.bind(this));
    } else {
      this.axis = graph.append("g")
          .attr("id", "axis" + this.type)
          .attr("class", "axis")
          .attr("transform", "translate(" + this.x + "," + this.y + ")")
          .call(this.axisDefinition)
    }

    return this
  }

  this.getAxisMainValues = function () {
    return this.axisDefinition
  }

  this.get = function () {
    return this.axis
  }

  this.setLabelOffset = function (x, y) {
    this.labelOffset = [x, y]
    return this
  }

  this.setTextAnchor = function (anchor) {
    this.textAnchor = anchor
    return this
  }

  this.displayName = function () {
    if (this.showText) {
      this.axisText = this.axis.append("text")
        .attr("transform", "translate(" + this.labelOffset[0] + "," + this.labelOffset[1] + ")rotate(" + this.rotation + ")")
        .attr("dy", ".5em")
        .attr("class", "axisText")
        .style("text-anchor", this.textAnchor)
        .text(this.name)

      if (this.type === AxisType.x) {
        this.wrap(this.axisText, this.width);
      }
    }
    return this
  }

  this.setContentType = function (contentType) {
    this.contentType = contentType
    return this
  }

  this.getContentType = function (data) {
    if (data && data[0] && data[0].geometry && !(data[0].geometry.type === "Coefficient" || data[0].geometry.type === "Constant")) {
      data.forEach(function (shape, index) {
        if (index == 0) {
          if (shape.geometry.coordinates && shape.geometry.coordinates[0] && shape.geometry.coordinates[0].constructor.name === "Array") {
            coordinate = shape.geometry.coordinates[0]

            if (coordinate != null && coordinate[this.type] != null) {
              if (shape.properties.contentType) {
                if (shape.properties.contentType[this.type] != null) {
                  this.contentType = shape.properties.contentType[this.type]
                }
              } else {
                if (isDate(coordinate[this.type], Date.parse(coordinate[this.type]))) {
                  this.contentType = ContentType.Date
                } else if (isString(coordinate[this.type])) {
                  this.contentType = ContentType.String
                }
              }
            }
          } else if (shape.geometry.coordinates != null && shape.geometry.coordinates[this.type] != null) {
            if (isDate(shape.geometry.coordinates[this.type], Date.parse(shape.geometry.coordinates[this.type]))) {
              this.contentType = ContentType.Date
            } else if (isString(shape.geometry.coordinates[this.type])) {
              this.contentType = ContentType.String
            }
          }
        }
      }.bind(this))
    }

    function isString (variable) {
      return variable.constructor.name === "String" && isNaN(Date.parse(variable))
    }

    function isDate (variable, parsedDate) {
      return (variable.constructor.name === "String" || variable.constructor.name === "Date") && !isNaN(parsedDate)
    }
  }


  this.validateData = function (data) {
    if (data && data[0] && data[0].geometry && !(data[0].geometry.type === "Coefficient" || data[0].geometry.type === "Constant")) {
      data.forEach(function (shape, index) {
        if (this.contentType === ContentType.Date) {
          if (shape.geometry.coordinates && shape.geometry.coordinates[0] && shape.geometry.coordinates[0].constructor.name === "Array") {
            var indicesToRemove = []
            shape.geometry.coordinates.forEach (function (coordinate) {
              if (coordinate && coordinate[this.type]) {
                coordinate[this.type] = new Date(coordinate[this.type])
              } else {
                indicesToRemove.push(index)
              }
            }.bind(this))

            indicesToRemove.forEach(function (index) {
              shape.geometry.coordinates.splice(index, 1)
            })
          } else {
            shape.geometry.coordinates[this.type] = new Date(shape.geometry.coordinates[this.type])
          }
        }
      }.bind(this))
    }
  }

  this.setBounds = function (data, insidePadding) {
    this.getContentType(data)
    this.validateData(data)

    if (this.bounds == null) {
      this.bounds = new Bounds(data, this.type, this.id, this.contentType, insidePadding)

      if (this.minBound != null) {
        this.bounds.setMinimum(this.minBound,this.reverseDataRange)
      }

      if (this.maxBound != null) {
        this.bounds.setMaximum(this.maxBound,this.reverseDataRange)
      }
    }

    this.setDomain(null, data)
    this.setRange()

    if (this.reverseDataRange != null && this.reverseDataRange == true) {
      var temp = this.range[0]
      this.range[0] = this.range[1]
      this.range[1] = temp
    }

    this.addScale(this.contentType)

    return this
  }

  this.reverseRange = function () {
    this.reverseDataRange = true
    return this
  }

  this.setDataBounds = function (minimum, maximum, insidePadding) {
    this.bounds = new Bounds(null, this.type, this.id, this.contentType, insidePadding)
    if (minimum != null) {
      this.bounds.setMinimum(minimum, this.reverseDataRange)
    }

    if (maximum != null) {
      this.bounds.setMaximum(maximum, this.reverseDataRange)
    }
  }

  this.setMinimumDataBounds = function (minimum) {
    if (minimum != null) {
      this.minBound = minimum
    }
  }

  this.setMaximumDataBounds = function (maximum) {
    if (maximum != null) {
      this.maxBound = maximum
    }
  }
}

exports.Axis = Axis