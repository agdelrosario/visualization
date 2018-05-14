var Types = require('app/components/visualization/Types.js');
var AxisType = Types.AxisType;
var ChartType = Types.ChartType;
var FitType = Types.FitType;
var ShapeType = Types.ShapeType;
var ShadeType = Types.ShadeType;

var Chart = require('app/components/visualization/Chart.js').Chart;
var Legend = require('app/components/visualization/Legend.js').Legend;
var Shape = require('app/components/visualization/Shape.js').Shape;
var Shader = require('app/components/visualization/Shader.js').Shader;
var d3 = require('app/components/d3js.js');

exports.Graph = function (container, id, name, width, height, margin, bgColor="none", className="main-graph") {
  this.container = container
  this.name = name
  // this.type = type
  this.id = id
  this.className = className

  this.margin = margin
  this.bgColor = bgColor

  this.width = width
  this.height = height
  this.bodyWidth = width - margin.left - margin.right
  this.bodyHeight = 0
  this.nameOffset = null

  this.errorOffset = null
  this.errorText = null

  this.legend = new Legend(this.bodyWidth, 0, 0, id)
  this.showLegends = true
  this.showChartLegends = false
  this.showLine = false

  this.hoverAxis = null
  this.interpolateType = "linear"

  this.charts = []

  this.chartsWithGradientEnabled = []
  this.chartShapeValues = {};

  this.addChart = function (width, height, id, type, name=null) {
    var newChart = new Chart((width == null) ? this.width : width,
                               (height == null) ? this.height : height,
                               this.charts.length, type, name, this.id)
    this.charts.push(newChart)
    this.chartShapeValues[newChart.id] = []
    return this.charts[this.charts.length - 1]
  }

  this.setNameOffset = function (offset) {
    this.nameOffset = offset
    return this
  }

  this.setErrorOffset = function (offset) {
    this.errorOffset = offset
    return this
  }

  this.setShowLegends = function (show) {
    this.showLegends = show
    this.showChartLegends = !show
    return this
  }

  this.setShowLine = function (show) {
    this.showLine = show
    return this
  }

  this.setShowChartLegends = function (show) {
    this.showLegends = !show
    this.showChartLegends = show
    return this
  }

  this.setHoverAxis = function(hoverAxis) {
    this.hoverAxis = hoverAxis
    return this
  }

  this.setCss = function () {
    this.renderDefaultStyling()
    this.renderCustomStyling()
    return this
  }

  this.setCustomCss = function (css) {
    this.styling = css
    return this
  }

  this.renderCustomStyling = function () {
    if (this.styling) {
      this.styling.forEach(function (item) {
        var selected = $(item.selector)

        item.style.forEach(function(style) {
          selected.css(style.attribute, style.value)
        })
      })
    }
  }

  this.renderDefaultStyling = function () {
    $("body").css("margin", "0 0 0 0")

    $(".axis path, .axis line")
      .css("fill", "none")
      .css("stroke", "ddd")
      .css("stroke-width", 1)
      .css("shape-rendering", "crispEdges")

    $(".axis .tick text")
      .css("font-size", "12px")

    $(".axis text.axisText")
      .css("font-size", "14px")

    $(".legendText, .levelText")
      .css("font-size", "11px")

    $(".barText")
      .css("font-size", "10px")

    $(".legends")
      .css("fill", "#ffffff")
      .css("stroke", "#aaa")
      .css("stroke-width", 1)
      .css("shape-rendering", "crispEdges")

    return this
  }

  this.renderSVG = function () {
    this.svg = d3.select(this.container).append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("class", this.className)
      .attr("id", this.id)
      .style("font-family", "sans-serif")
      .style("background-color", "#ffffff")

    this.svg = this.svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

    return this
  }

  this.getSVG = function () {
    return this.svg
  }

  this.generate = function (dataset, overlayCurveSource) {
    d3.json(dataset, function (error, data) {
      if (error) throw error;
      this.generateWithData(data, overlayCurveSource)
    }.bind(this));
    return this
  }

  this.getSVG = function () {
    return this.svg
  }

  this.generateWithData = function (data, overlayCurveSource, color, lineSize) {
    this.renderSVG()
    this.plotData(data, overlayCurveSource, color, lineSize)
    this.renderGraphName()

    if (this.showError === true) {
      this.renderErrorText()
    }

    var redChartType = this.charts.reduce(function (initial, chart) {
      if (chart.type === ChartType.BoreOutputCurve || chart.type === ChartType.TP || chart.type === "PTSPlot" ||
      chart.type === ChartType.SteamForecasting) {
        initial.push(chart.type)
      }
      return initial
    }, [])
    if (redChartType.length > 0) {
      $("#visLoadingIndicator").hide()
      if (redChartType.indexOf(ChartType.SteamForecasting) > -1) {
        $('#btn_checkbox').trigger('click');
        $('#ForecastDetailsGraphArea').show();
        $('#ForecastDetailsGraphSFC').show();
        $('#ForecastDetailsGraphMFC').show();
        $('#ForecastDetailsGraphWFC').show();
        $('#ForecastDetailsGraphHC').show();
        $('#ForecastDetailsGraphWHPC').show();
      }
    }
    return this
  }

  this.defineStartMarker = function () {
    return this.svg.append("defs").append("marker")
        .attr("id", "startArrowHead")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 3)
        .attr("refY", 5)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 4)
        .attr("markerHeight", 3)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M 0 5 L 10 0 L 10 10")
  }

  this.defineEndMarker = function () {
    return this.svg.append("defs").append("marker")
        .attr("id", "endArrowHead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 4)
        .attr("markerHeight", 3)
        .attr("fill", "#ff0aba")
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M 0 -5 L 10 0 L 0 5")
  }

  this.flattenArray = function (data) {
    var tempData = []

    if (data != null) {
      if (data.constructor.name === "Array") {
        data.forEach(function (featureCollection) {
          featureCollection.features.forEach(function (feature) {
            tempData.push(feature)
          })
        })
      } else {
        tempData = data.features
      }
    }

    return tempData
  }

  this.plotData = function (data, overlayCurveSource, color, lineSize) {
    var tp_afac_graph = this.svg.append("g")
      .attr("id", "tp_afac_graph")
 
    tp_afac_graph.append("g")
      .attr("id", "tp_afac_label")
 
    tp_afac_graph.append("g")
      .attr("id", "tp_afac")

    var flattenedData = this.flattenArray(data)
    var isSinglePoint = false

    this.drawAxes(flattenedData)
    var chartTypeHolTp = this.charts.reduce(function (initial, chart) {
      if (chart.type === ChartType.HolisticView || chart.type === ChartType.TP) {
        initial.push(chart.type)
      }
      if(chart.fit && chart.fit === FitType.SinglePoint){
        isSinglePoint = true
      }
      return initial
    }, [])

    if (chartTypeHolTp.length > 0) {
      var startMarker = this.defineStartMarker()
      var endMarker = this.defineEndMarker()
    }
    if(!isSinglePoint){
      this.drawShapes(flattenedData)
    }
    var chartTypeBorInjTP = this.charts.reduce(function (initial, chart) {
      if (chart.type === ChartType.BoreOutputCurve || chart.type === ChartType.Injectivity || chart.type === ChartType.TP) {
        initial.push(chart.type)
      }
      return initial
    }, [])

    if (chartTypeBorInjTP.indexOf(ChartType.BoreOutputCurve) > -1 || chartTypeBorInjTP.indexOf(ChartType.Injectivity) > -1) {
      this.plotCurves(data, overlayCurveSource, color, lineSize)
    } else if (chartTypeBorInjTP.indexOf(ChartType.TP) > -1) {
      this.addPlotHover()
      this.plotCurves(null, overlayCurveSource, color, lineSize)
    }

    if (this.showLine) {
      this.charts.forEach(function (chart) {
        if (chart.type == chartType.HolisticView) {
          chart.setShowLine(this.showLine)
        }
      }.bind(this))
    }

    if (this.showLegends) {
      var chartsHeightDifference = 0
      var maximumWidth = 0
      var isOffsetWell = false

      this.charts.forEach(function (chart) {
        chart.setShowLegends(false);
        if (chart.heightDifference != null) {
          chartsHeightDifference += chart.heightDifference
          maximumWidth = Math.max(maximumWidth, chart.axes[AxisType.x].width)
        }

        if (chart.type === ChartType.OffsetWells) {
          isOffsetWell = true 
        }
      })

      if (this.legend.y < this.charts[0].height && chartsHeightDifference != null) {
        this.legend.y += chartsHeightDifference
      } else if (isOffsetWell === true) {
        this.legend.y += 40
      }

      var chartTypes = this.charts.reduce(function (initialValue, chart) {
        initialValue.push({"type": chart.type, "id": chart.id})
        return initialValue
      }, [])

      var offsetWellsId = chartTypes.reduce(function (initial, chart) {
        if (chart.type == ChartType.OffsetWells) {
          initial.push(chart.id)
        }
        return initial
      }, [])


      if (flattenedData && offsetWellsId.length > 0 && offsetWellsId != null){
        unique_shapes = [];
        temp_shapes = [];
        flattenedData.forEach(function (shape, index) {
          var chart = this.getChartWithSameAxes(shape.properties.axis)
          if (offsetWellsId.indexOf(chart.id) != -1) {
            if (unique_shapes.indexOf(shape.properties.name) == -1) {
              unique_shapes.push(shape.properties.name);
              temp_shapes.push(shape)
            }
          }
        }.bind(this))
        flattenedData = temp_shapes;
      }
      
      this.drawLegend(flattenedData, chartsHeightDifference, chartTypes)
    }
    else if(this.showChartLegends){
      var graph = this;
      this.charts.forEach(function (chart) {
        var shapes = graph.getDataWithSameAxes(chart.getAxis(AxisType.x).id, chart.getAxis(AxisType.y).id, flattenedData);
        chart.legend.y = chart.height + 100;
        chart.drawLegend(graph.id, shapes);
      })
    }

    this.charts.forEach(function (chart) {
      if ((chart.type != ChartType.TP || (chart.type === ChartType.TP && chart.showBPD)) && chart.type != ChartType.HolisticView && chart.type != ChartType.SteamForecasting) {
        chart.renderMouse(chart.type, this.hoverAxis, this.id)
      }
    }.bind(this))

    this.setCss()

    return this
  }



  this.getSVG = function () {
    return this.svg
  }

  this.renderGraphName = function () {
    this.svg.append("text")
      .attr("transform", "translate(" + ((this.nameOffset) ? this.nameOffset[AxisType.x] : this.bodyWidth/2) + ", " +
                                        ((this.nameOffset) ? this.nameOffset[AxisType.y] : -this.margin.top/2) + ")")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "16px")
      .attr("id", "graphName")
      .text(this.name)
    return this
  }

  this.renderErrorText = function () {
    this.svg.append("text")
      .attr("transform", "translate(" + ((this.nameOffset) ? this.nameOffset[AxisType.x] : this.bodyWidth/2) + ", " +
                                        ((this.nameOffset) ? this.nameOffset[AxisType.y] : -5) + ")")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#FF0000")
      .attr("id", "errorText")
      .text(this.errorText)
    return this
  }

  this.drawAxes = function (data) {
    this.charts.forEach(function (chart) {
      chart.setBounds(this.getDataWithSameAxes(chart.axes[AxisType.x].id, chart.axes[AxisType.y].id, data))
        .draw(this.svg, this.bgColor, this.id, this.height, [this.legend.x, this.legend.y], chart.type)
        .displayName()

      this.bodyHeight += chart.height + chart.padding.bottom
    }.bind(this))

    if (this.legend.x === 0 && this.legend.y === 0) {
      this.legend.setOffset(0, this.bodyHeight)
    }

    return this
  }

  this.drawLegend = function (data, chartsHeightDifference, chartTypes) {
    //this.legend.setWidth(maximumWidth)
    this.legend.drawBox(this.svg, data, chartTypes, this.showChartLegends)
    this.legend.displayKeys(this.legend.getBox(), this.id, this.height + chartsHeightDifference, chartsHeightDifference, chartTypes, this.id)
    return this
  }

  this.setLegendWidth = function (width) {
    this.legend.setWidth(width)
    return this
  }

  this.setLegendHeight = function (height) {
    this.legend.setHeight(height)
    return this
  }

  this.getChartWithSameAxes = function (shapeAxes) {
    return this.charts.find(function (chart) {
      return (shapeAxes[0] == ((chart.axes[AxisType.x] != null) ? chart.axes[AxisType.x].id : null)) &&
             (shapeAxes[1] == ((chart.axes[AxisType.y] != null) ? chart.axes[AxisType.y].id : null))
    })
  }

  this.getDataWithSameAxes = function (xAxisName, yAxisName, data) {
    return data.reduce(function (a, b) {
      if (b.properties.axis[AxisType.x] === xAxisName && b.properties.axis[AxisType.y] === yAxisName) {
        a = a.concat(b)
      }

      return a
    }, [])
  }

  this.extractData = function (data) {
    var points = []
    if (data && data.constructor.name === "Array") {
      data.forEach(function (featureCollection, featureCollectionIndex) {
        featureCollection.features.forEach(function (feature) {
          var chart = this.getChartWithSameAxes(feature.properties.axis)
  
            if (chart != null && (chart.type === ChartType.BoreOutputCurve || chart.type === ChartType.Injectivity)) {
              if (!points[chart.id]) {
                points[chart.id] = []
              }
              if (!points[chart.id][featureCollectionIndex]) {
                points[chart.id][featureCollectionIndex] = []
              }
              
              if (feature.geometry.coordinates && feature.properties.selected) {
                points[chart.id][featureCollectionIndex].push(feature.geometry.coordinates)
              } else if (feature.geometry.value != null) {
                points[chart.id][featureCollectionIndex].push(feature.geometry.value)
              }
            }

        }.bind(this))
      }.bind(this))
    } else {
      data.features.forEach(function (feature, index) {
        var chart = this.getChartWithSameAxes(feature.properties.axis)

          if (chart != null && (chart.type === ChartType.BoreOutputCurve || chart.type === ChartType.Injectivity)) {
            if (!points[chart.id]) {
              points[chart.id] = []
              points[chart.id][0] = []
            }
            if (feature.geometry.coordinates && feature.properties.selected) {
              points[chart.id][0].push(feature.geometry.coordinates)
            } else if (feature.geometry.value != null) {
              points[chart.id][0].push(feature.geometry.value)
            }
          }
      }.bind(this))
    }

    return points
  }

  this.setInterpolateType = function(type) {
    this.interpolateType = type
    return this
  }

  this.setShowError = function(showError, errorText){
    this.showError = showError
    this.errorText = errorText
  }

  this.bboxIntersects = function(valueText1, valueText2) {
    //no need to recompute top/bottom values, since text anchor does not affect y-axis
    var bbox1Bottom = valueText1.getY(),
        bbox1Top = valueText1.getY() - valueText1.getBBox().height;
        
    var bbox2Bottom = valueText2.getY(),
        bbox2Top = valueText2.getY() - (valueText2.getBBox().height * 0.75);

    return (bbox2Top < bbox1Bottom ||
           bbox2Bottom < bbox1Top);
  }

  this.rearrangeOverlappingValues = function(){
    var keys = Object.keys(this.chartShapeValues);
    var bboxIntersects = this.bboxIntersects;

    for(var i=0 ; i<keys.length ; i++){
      var valueTexts = this.chartShapeValues[keys[i]]

      valueTexts.sort(function(a, b){
        var aContainer = d3.selectAll(jQuery(a.getContainer().tagName+"#"+a.getContainer().id))
        var bContainer = d3.selectAll(jQuery(b.getContainer().tagName+"#"+b.getContainer().id))
        var aContainerY = d3.transform(aContainer.attr("transform")).translate[1]
        var bContainerY = d3.transform(bContainer.attr("transform")).translate[1]
        if(parseFloat(a.getElement().textContent) < parseFloat(b.getElement().textContent) || 
          (parseFloat(a.getElement().textContent) == parseFloat(b.getElement().textContent) &&
          parseFloat(aContainerY) < parseFloat(bContainerY)))
            return -1;
        if(parseFloat(a.getElement().textContent) > parseFloat(b.getElement().textContent) || 
          (parseFloat(a.getElement().textContent) == parseFloat(b.getElement().textContent) &&
          parseFloat(aContainerY) > parseFloat(bContainerY)))
          return 1;
        return 0;
      })

      var j = 2;
      while(j < valueTexts.length) {
        prevValText = valueTexts[j-1];
        currentValText = valueTexts[j];
        var prevContainer = prevValText.getContainer()
        var prevG = d3.selectAll(jQuery(prevContainer.tagName+"#"+prevContainer.id))
        var prevContainerX = d3.transform(prevG.attr("transform")).translate[0]
        var prevContainerBottom = d3.transform(prevG.attr("transform")).translate[1] + prevValText.getContainer().getBBox().height
        var prevContainerTop = d3.transform(prevG.attr("transform")).translate[1]
        var prevY = prevContainerBottom - prevValText.getBBox().height/2
        var prevTextTop = prevValText.getY() - prevValText.getBBox().height/2
        var prevTextBottom = prevValText.getY() + prevValText.getBBox().height/2

        var currContainer = currentValText.getContainer()
        var currG = d3.selectAll(jQuery(currContainer.tagName+"#"+currContainer.id))
        var currContainerX = d3.transform(currG.attr("transform")).translate[0]
        var currContainerBottom = d3.transform(currG.attr("transform")).translate[1] + currentValText.getContainer().getBBox().height
        var currContainerTop = d3.transform(currG.attr("transform")).translate[1]
        var currY = currContainerTop + currentValText.getBBox().height/2
        var currTextTop = currentValText.getY() - currentValText.getBBox().height/2
        var currTextBottom = currentValText.getY() + currentValText.getBBox().height/2

        //check if current element and prev element values are the same
        if(parseFloat(prevValText.getElement().textContent) == parseFloat(currentValText.getElement().textContent)) {
          //check if the prevValText and currentValText is already outside of the box
          //if true place prevValText on the left side of the box
          if(prevContainerBottom <= prevTextTop && currContainerTop > currTextTop) {
            //hide current element since prev element already displays the same value
            d3.selectAll(jQuery(currentValText.getElement().tagName+"#"+currentValText.getElement().id)).remove()
            if(prevValText.getTextAnchor() == "start"){
              prevValText.setXY(prevContainerX - prevValText.getBBox().width - 2,prevContainerBottom)
            } else if(prevValText.getTextAnchor() == "middle"){
              prevValText.setXY(prevContainerX - prevValText.getBBox().width/2 - 2,prevContainerBottom)
            } else if(prevValText.getTextAnchor() == "end"){
              prevValText.setXY(prevContainerX - 2,prevContainerBottom)
            }
          } else if(prevContainerBottom <= prevTextTop && currContainerTop < currTextTop) {
            //prev value is already outside, but current is still inside
            //hide prev element since current element already displays the same value
            d3.selectAll(jQuery(prevValText.getElement().tagName+"#"+prevValText.getElement().id)).remove()
          } else {
            //if prev is inside and (current is still inside or current is already outside)
            //hide current element since prev element already displays the same value
            d3.selectAll(jQuery(currentValText.getElement().tagName+"#"+currentValText.getElement().id)).remove()
          }
        } else if(bboxIntersects(valueTexts[j-1], valueTexts[j])) {
          //previous
          //check if bottom value text is still inside the previous container or it's already outside

          if(prevContainerBottom < prevTextBottom) {
            //check top of text label will go above the top of the container
            if(prevContainerTop > prevContainerBottom - prevValText.getBBox().height) {
              prevY = prevContainerTop + prevContainer.getBBox().height/2
            }
            if(prevValText.getTextAnchor() == "start"){
              prevValText.setXY(prevContainerX + prevValText.getContainer().getBBox().width + 2,prevY)
            } else if(prevValText.getTextAnchor() == "middle"){
              prevValText.setXY(prevContainerX + prevValText.getContainer().getBBox().width + prevValText.getBBox().width/2 + 2,prevY)
            } else if(prevValText.getTextAnchor() == "end"){
              prevValText.setXY(prevContainerX + prevValText.getContainer().getBBox().width + prevValText.getBBox().width + 2,prevY)
            }
          }


          //current
          //check if top value text is still inside the current container or it's already outside
          //if it's already outside place it on the left side of the box

          if(currContainerTop > currTextTop) {
            //check bottom of text label will go below the bottom of the container
            if(currContainerBottom < currContainerTop + currentValText.getBBox().height) {
              currY = currContainerTop + currContainer.getBBox().height/2
            }

            if(currentValText.getTextAnchor() == "start"){
              currentValText.setXY(currContainerX - currentValText.getBBox().width - 2,currY)
            } else if(currentValText.getTextAnchor() == "middle"){
              currentValText.setXY(currContainerX - currentValText.getBBox().width/2 - 2,currY)
            } else if(currentValText.getTextAnchor() == "end"){
              currentValText.setXY(currContainerX - 2,currY)
            }
          }
        }
        
        //check next bar
        j += 2
      }
    }
  }

  this.drawShapes = function (data) {
    var vectorCount = 0
    var prevX = 0
    var prevY = 0

    if (data != null && data.length > 0) {
      data.forEach(function (geometricalShape, index, array) {
        var chart = this.getChartWithSameAxes(geometricalShape.properties.axis)
        
        if (chart) {
          var shape = new Shape(geometricalShape, index, chart.graphId + chart.id, chart.type, chart.gradientEnabled)

          shape.setInterpolateType(this.interpolateType)
          if ((chart.type === ChartType.SteamForecasting && geometricalShape.properties.nodeHighlight) || chart.type === ChartType.TP) {
            shape.enableNodeHighlightingOnLines();
          }

          if (shape.type === ShapeType.TopLevel || shape.type == ShapeType.BottomLevel) {
            var mrsl_yScale = this.charts[0].axes[AxisType.y].scale.scale
            var mmd_yScale = chart.axes[AxisType.y].scale.scale

            var line = d3.svg.line()
              .x(function (d) { return d[0]; })
              .y(function (d) { return mrsl_yScale(d[1]); })

            var endpoints = []

            if (shape.fullLength == true) {
              var mmd_y = mmd_yScale(shape.coordinates[AxisType.y])
              var mrsl_y = mrsl_yScale.invert(mmd_y)
              endpoints = [[0, mrsl_y], [this.charts[0].width, mrsl_y]]
            }

            var path = this.charts[0].svg.append("path")
              .attr("d", line(endpoints))
              .attr("class", "level")
              .attr("id", this.id)
              .attr("fill", "none")
              .style("stroke", "#" + shape.color)
              .style("stroke-width", "1")
              .style("stroke-dasharray", "5, 5")
              .style("stroke-linecap", "round")
          } else if (shape.type === ShapeType.Vector || shape.type === ShapeType.ProdLine || shape.type === ShapeType.Blockage || shape.type === ShapeType.PvACasing) {
            shape.setWidth(chart.width)
          }

          if (chart.type === ChartType.HolisticView && shape.type === ShapeType.Bar) {
            shape.enableOrdinateNotation()
            shape.setHeight(chart.height)
          }

          shape.plot(chart.svg,
            chart.type,
            chart.axes[AxisType.x].scale.scale, 
            chart.axes[AxisType.y].scale.scale,
            chart.axes[AxisType.x].range, 
            chart.axes[AxisType.y].range)

          this.chartShapeValues[chart.id].push.apply(this.chartShapeValues[chart.id], shape.valueTexts);

          if (chart.type === ChartType.HolisticView && index === array.length - 1) {
            this.rearrangeOverlappingValues();
          }

          if (geometricalShape.geometry.type === ShapeType.Vector) {
            vectorCount++
          }
        }
      }.bind(this)) 
    }
  }

  this.setLegendOffset = function (x, y) {
    this.legend.setOffset(x, y)
    return this
  }

  this.addPlotHover = function (){
    this.charts.forEach(function (chart) {
      if (chart.axes[0] && (chart.axes[0].id == "temperature" || chart.axes[0].id == "pressure")) {
        var text = chart.svg.append("text")
            .attr("id", "hover" + chart.id)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .style("font-size", "10px")

        d3.selectAll("circle").on({
          "mouseover": function (d, i) {
            var coords = d3.mouse(this)
            d3.select("text#hover" + chart.id).style("display", null)
            text.attr("transform", "translate(" + (coords[0] + 7) + "," + (coords[1] - 3) + ")");
            text.text("[" + d[0] + "," + d[1] + "]");
          },
          "mouseout": function (d, i) {
            d3.select("text#hover" + chart.id).style("display", "none")
          }
        })
      }
    })
  }

  this.prepareCurves = function (data, lineColor, lineSize) {
    var points = this.extractData(data)

    points.forEach(function (chart, chartIndex) {
      var currentNumberOfCurves = this.charts[chartIndex].curves.length

      chart.forEach(function (curve, curveIndex) {
        standardFormCurve = [];
        pointsCurve = [];
        curve.forEach(function (value, i) {
          if (value instanceof Array) {
            pointsCurve.push(value)
          } else {
            standardFormCurve.push(value)
          }
        }.bind(this))

        if (this.charts[chartIndex].fit != null && this.charts[chartIndex].fit != NaN) {
          this.charts[chartIndex].addCurve(curveIndex, pointsCurve, (standardFormCurve != null) ? standardFormCurve : null, this.charts[chartIndex].type, false, lineColor, lineSize)
          this.charts[chartIndex].drawCurve(currentNumberOfCurves + curveIndex, this.charts[chartIndex].fit)
        }
      }.bind(this))

    }.bind(this))
  }

  this.plotCurves = function (data, source, lineColor, lineSize) {
    if (data != null) {
      this.prepareCurves(data, lineColor, lineSize)
      this.plotSinglePoint(lineColor, lineSize)
    }

    if (source) {
      this.overlayCurvesWithData(source)
    }
  }

  this.plotSinglePoint = function (color, lineSize=0.5) {
    this.charts.forEach(function (chart, index) {
      if (chart.fit === FitType.SinglePoint && chart.type === ChartType.BoreOutputCurve) {
        var coordinate = [chart.axes[AxisType.x].scale.scale(chart.singlePoint[AxisType.x]),
                          chart.axes[AxisType.y].scale.scale(chart.singlePoint[AxisType.y])]

        chart.svg.append("circle")
          .attr("cx", coordinate[AxisType.x])
          .attr("cy", coordinate[AxisType.y])
          .attr("r", 3)
          .attr("id", "singlePoint" + chart.id )
          .attr("fill", "#000")
          .attr("clip-path", "url(#newSVG" + chart.graphId + chart.id + ")")
          
        var ln = []

        var middle = { "x": chart.width/2, "y": chart.height/2}
        var pt = chart.curves[0].points.find(function (point) {
            return (parseInt(chart.axes[AxisType.x].scale.scale(point[0])) === middle.x)
          })

        var adjustmentY = middle.y - chart.axes[AxisType.y].scale.scale(pt[1]),
          offsetX = coordinate[AxisType.x] - middle.x,
          offsetY = coordinate[AxisType.y] - middle.y

        var line = d3.svg.line()
          .x(function (d) { return chart.axes[AxisType.x].scale.scale(d[0]) + offsetX; })
          .y(function (d) { return chart.axes[AxisType.y].scale.scale(d[1]) + offsetY + adjustmentY; })
          .interpolate("basis");
        var displayLine = !(chart.type == ChartType.BoreOutputCurve && jQuery("#parametric").is(":checked") && index == 1);

        if (displayLine){
          var path = chart.svg.append("path")
            .attr("d", line(chart.curves[0].points))
            .attr("class", "line")
            .attr("fill", "none")
            .style("stroke", "#" + color)
            .style("stroke-width", lineSize)
            .style("stroke-linecap", "round")
            .attr("clip-path", "url(#newSVG" + chart.graphId + chart.id + ")")
        }
        
      }
    }.bind(this))
  }

  this.overlayCurvesWithData = function (source, color, lineSize) {
    var chartTypeList = this.charts.reduce(function (initial, chart) {
      if (chart.type === ChartType.BoreOutputCurve || chart.type === ChartType.Injectivity || chart.type === ChartType.TP) {
        initial.push(chart.type)
      }
      return initial
    }, [])

    if (source != null) {
      if (chartTypeList.indexOf(ChartType.BoreOutputCurve) > -1 || chartTypeList.indexOf(ChartType.Injectivity) > -1) {
          this.prepareCurves(source, color, lineSize)
      } else if (chartTypeList.indexOf(ChartType.TP) > -1) {
        this.shadeGraph(source)
      }
    }
  }

  this.getCurveIntersection = function (a, b) {
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

  this.shadeGraph = function (data) {
    this.charts.forEach(function (chart) {
      if (chart.showAFAC || chart.showBPD) {
        var xScale = chart.axes[AxisType.x].scale.scale
        var yScale = chart.axes[AxisType.y].scale.scale

        var line = d3.svg.line()
          .x(function (d) { return (xScale != null) ? xScale(d[0]) : d[0] })
          .y(function (d) { return (yScale != null) ? yScale(d[1]) : d[1] })

        var path = chart.svg.append("path")
          .attr("d", line(data.features[0].geometry.coordinates))
          .attr("class", "line")
          .attr("id", "shader_AFAC")
          .attr("fill", "none")
          .style("stroke", "#660000")
          .style("stroke-linecap", "round")
          .style("stroke-width", "2")
            .attr("clip-path", "url(#newSVG" + chart.graphId + chart.id + ")")

        if (chart.showAFAC) {
          var extractedPointsFromPath = chart.extractPointsFromPath(chart, path, data.features[0].geometry.coordinates, xScale, yScale, ShadeType.None)
          chart.setAfacPoints(extractedPointsFromPath)

          if (data.features[0].geometry.coordinates[0][AxisType.x] < 100) {
            var shader = new Shader (100, AxisType.x, extractedPointsFromPath, "#7f0000", 2, chart.graphId + chart.id, 
                {
                  "x": { "minimum": chart.axes[AxisType.x].bounds.minimum, "maximum": chart.axes[AxisType.x].bounds.maximum },
                  "y": { "minimum": chart.axes[AxisType.y].bounds.minimum, "maximum": chart.axes[AxisType.y].bounds.maximum },
                })
            shader.shade(chart.svg, xScale, yScale)
            chart.setAfacArea(shader.area)
          }
        }
      }
    })
  }
}