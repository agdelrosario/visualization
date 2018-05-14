var d3 = require('app/components/d3js.js');
var regression = require('vendor/regression-js/build/regression.min.js');
var math = require('vendor/mathjs/dist/math.min.js');
var Types = require('app/components/visualization/Types.js');
var ChartType = Types.ChartType;
var FitType = Types.FitType;

exports.getStandardForm = function (basePoints, curveType) {
  standardForm = regression('polynomial', basePoints, curveType).equation
  return standardForm
}

exports.Curve = function (fit, curveType, points, standardForm, chartType, selected = false, color = "000", lineSize = 1, singlePoint = [0,0]) {
  this.basePoints = points
  this.curveType = (curveType) ? curveType : points.length - 1
  this.curveLimit = 0
  this.fit = fit
  this.isStandardFormGiven = (standardForm != null)
  this.points = []
  this.standardForm = (standardForm != null) ? standardForm : []
  this.selected = selected
  this.color = color
  this.lineSize = lineSize
  this.chartType = chartType
  this.isParametric = false
  this.singlePoint = singlePoint

  this.computeStandardForm = function () {
    if (this.fit == 0 || this.fit == 1) {
      if ($('#enth').val() != '' && this.chartType == ChartType.BoreOutputCurve && jQuery("#parametric").is(":checked")){
        equation = 'y^2 = ';
        this.standardForm = this.computeParabolic()
        this.isParametric = true
      }
      else {
        this.isParametric = false
        this.standardForm = regression('polynomial', this.basePoints, this.curveType).equation
        var equation = 'y = ';
      }
      if (typeof overlay_data !== 'undefined') {
        overlay_data.push(this.standardForm)
      }

      for (var i = this.standardForm.length - 1; i > -1; i--) {
        if(this.standardForm[i] == 0) {
          continue;
        } else if (i == this.standardForm.length - 1 && i == 1) {
          equation += this.standardForm[i] + 'x'
        } else if (i == this.standardForm.length - 1) {
          equation += this.standardForm[i] + ('x^' + i)
        } else if (i == 0) {
          equation += ((parseFloat(this.standardForm[i]) >= 0) ? ' + ' : ' ') + this.standardForm[i]
        } else if ( i == 1 ) {
          equation += ((parseFloat(this.standardForm[i]) >= 0) ? ' + ' : ' ') + this.standardForm[i] + 'x'
        }  else {
          equation += ((parseFloat(this.standardForm[i]) >= 0) ? ' + ' : ' ') + this.standardForm[i] + ('x^' + i)
        }
      }

      if (this.chartType == ChartType.BoreOutputCurve) {
        if ($('#enth').val() == '') {
          $('#enth').val((equation.toLowerCase().indexOf('nan') !== -1) ? 'Failed to generate equation.' : equation);
          document.getElementById("equation_h").innerHTML = equation;
        } else {
          $('#massflow').val((equation.toLowerCase().indexOf('n') !== -1) ? 'Failed to generate equation.' : equation);
          document.getElementById("equation_mf").innerHTML = equation;
        }
      }      
    }
  }

  this.computeParabolic = function() {
      var xList = []
      var mfList = []
      var whpConstant = ((this.basePoints.map(function(item){
        return parseFloat(item[0])
      }).reduce(function(pv, cv) {
        return pv + cv; 
      }, 0))/this.basePoints.length) - this.singlePoint[0]

      this.basePoints.forEach(function(item){
        xList.push(math.pow((parseFloat(item[0]) - ((this.fit == 1) ? parseFloat(whpConstant) : 0)), 2))
        mfList.push(math.pow(parseFloat(item[1]),2))
      }.bind(this))
      var averageY = (mfList.reduce(function(pv, cv) { return pv + cv; }, 0))/mfList.length;
      var averageX = (xList.reduce(function(pv, cv) { return pv + cv; }, 0))/xList.length;

      var slope =  (xList.map(function(x, i){
        return (x - averageX) * (mfList[i] - averageY)
      }).reduce(function(pv, cv) { return pv + cv; }, 0))/(xList.map(function(x){
        return math.pow((x - averageX), 2)
      }).reduce(function(pv, cv) { return pv + cv; }, 0))
      
      var intercept = averageY - (slope * averageX)
      return [intercept, 0, slope]
  }

  this.fillPoints = function (bounds) {
    for (var x = bounds.minimum; x <= bounds.maximum; x += 0.001) {
      var y = 0

      var len = this.standardForm.length
      this.standardForm.forEach(function (point, index) {
        y += point * math.pow(x, index)
        if (index === len - 1) {
          this.points.push([x, (this.isParametric && y > 0) ? math.sqrt(y) : y])
        }
      }.bind(this))
    }
  }

  this.draw = function (graph, scales, bounds, id, index, fittingInto) {
    if (this.standardForm.length === 0) {
      this.computeStandardForm()
    }

    var viewFlag = (this.chartType == ChartType.BoreOutputCurve && window.location.href.indexOf("details") > -1)

    this.fillPoints(bounds)

    if (fittingInto != FitType.SinglePoint || this.isParametric || viewFlag) {
      var line = d3.svg.line()
        .x(function (d) {return (scales.x != null) ? scales.x(d[0]) : d[0]})
        .y(function (d) { return (scales.y != null) ? scales.y(d[1]) : d[1]})
        .interpolate("basis");

      var cssID = (standardForm) ? "userGenFit" : "curvePath";

      var path = graph.append("path")
        .attr("d", line(this.points))
        .attr("class", "line")
        .attr("id", cssID + id + "_" + index)
        .attr("fill", "none")
        .style("stroke", "#" + this.color)
        .style("stroke-width", this.lineSize)
        .style("stroke-linecap", "round")
        .attr("clip-path", "url(#newSVG" + id + ")")
    }
  }
}