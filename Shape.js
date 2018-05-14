var Types = require('app/components/visualization/Types.js');
var AxisType = Types.AxisType;
var ShapeType = Types.ShapeType;
var ChartType = Types.ChartType;

var d3 = require('app/components/d3js.js');
var math = require('vendor/mathjs/dist/math.min.js');

var ValueText = function (x, y, bbox, element, textAnchor, container) {
  this.x = x
  this.y = y
  this.bbox = bbox
  this.element = element
  this.textAnchor = textAnchor
  this.container = container

  this.setX = function(newX) {
    this.setXY(newX,this.y) 
  }

  this.setY = function(newY) {
    this.setXY(this.x,newY)
  }

  this.setXY = function(newX,newY) {
    this.x = newX
    this.y = newY
    d3.selectAll(jQuery(element.tagName+"#"+element.id)).attr("transform", "translate("+this.x+","+this.y+")")
  }

  this.getX = function() {
    return this.x
  }

  this.getY = function() {
    return this.y
  }

  this.getBBox = function(){
    return this.bbox
  }

  this.getElement = function(){
    return this.element
  }

  this.getTextAnchor = function(){
    return this.textAnchor
  }

  this.getContainer = function(){
    return this.container
  }
}

var Shape = function (shape, id, chartId=null, chartType=null, gradientEnabled=false) {
  this.generateRandomColor = function () {
    return "000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
  }

  this.generateRandom = function (n) {
    return Math.floor(Math.random() * n)
  }

  if (!shape.properties.hasOwnProperty("color") || shape.properties.color === "") {
    shape.properties.color = this.generateRandomColor()
  }

  if (!shape.properties.hasOwnProperty("weight") || shape.properties.weight === "") {
    shape.properties.weight = this.generateRandom(3) + 3
  }

  if (!shape.properties.hasOwnProperty("name") || shape.properties.name === "") {
    shape.properties.name = ""
  }

  this.id = id
  this.color =  shape.properties.color
  this.type = shape.geometry.type
  this.chartType = chartType
  this.coordinates = shape.geometry.coordinates
  this.weight = shape.properties.weight
  this.name = shape.properties.name
  this.acronym = (shape.properties.acronym) ? shape.properties.acronym : ""
  this.nodeHighlight = (shape.properties.nodeHighlight) ? shape.properties.nodeHighlight : false
  this.ordinateNotation = false
  this.marker = shape.properties.marker
  this.chartId = chartId
  this.text = shape.properties.text
  this.interpolateType = (shape.properties.interpolateType) ? shape.properties.interpolateType : "linear"
  this.gradientEnabled = gradientEnabled
  this.showLabel = (shape.properties.showLabel) ? shape.properties.showLabel : false 
  this.labelFontSize = (shape.properties.labelFontSize) ? shape.properties.labelFontSize : "10px" 
  this.labelWrapWidth = (shape.properties.labelWrapWidth) ? shape.properties.labelWrapWidth : null
  this.lineHeight = (shape.properties.lineHeight) ? shape.properties.lineHeight : null
  this.makeAcronym = shape.properties.makeAcronym
  
  this.object = null;
  this.objectX = 0;
  this.objectY = 0;
  this.valueTexts = [];
  this.fullLength = shape.properties.full_length

  this.setWidth = function (width) {
    this.width = width
  }

  this.setHeight = function (height) {
    this.height = height
  }

  this.enableNodeHighlightingOnLines = function () {
    this.nodeHighlight = true
  }

  this.disableNodeHighlightingOnLines = function () {
    this.nodeHighlight = false
  }

  this.plot = function (graph, chartType, xScale, yScale, xRange, yRange, prevX, prevY) {
    switch (this.type) {
      case ShapeType.Point:
        this.drawCircle(graph, xScale(this.coordinates[0]), yScale(this.coordinates[1]))
        break
      case ShapeType.MultiPoint:
        this.coordinates.forEach(function (coordinate) {
            this.drawCircle(graph, xScale(coordinate[0]), yScale(coordinate[1]), this.weight/2, this.name, this.color)
        }.bind(this))
        break
      case ShapeType.Vector:
        this.drawVector(graph, xScale, yScale)
        break
      case ShapeType.VectorLabel:
        this.drawVectorLabel(graph, xScale, yScale)
        break
      case ShapeType.Line:
        this.drawLine(graph, xScale, yScale)
        break
      case ShapeType.Bar:
        this.drawRectangle(graph, xScale, yScale, xRange, yRange)
        break
      case ShapeType.Blockage:
        this.drawBlockage(graph, xScale, yScale, xRange, yRange)
        break
      case ShapeType.Casing:
        this.drawRectangle(graph, xScale, yScale, xRange, yRange)
        break
      case ShapeType.Histogram:
        this.drawHistogram(graph, xScale, yScale, xRange, yRange)
        break
      case ShapeType.TopLevel:
        this.drawLevel(graph, chartType, xScale, yScale, "top")
        break
      case ShapeType.BottomLevel:
        this.drawLevel(graph, chartType, xScale, yScale, "bottom")
        break
      case ShapeType.Liner:
        this.drawLiner(graph, xScale, yScale)
        break
      case ShapeType.ProdLine:
        this.drawProdLine(graph, xScale, yScale)
        break
      case ShapeType.Drill:
        this.drawDrill(graph, xScale, yScale)
        break
      case ShapeType.CrossHair:
        this.drawCrossHair(graph, xScale, yScale)
        break
      case ShapeType.Area:
        this.drawArea(graph, xScale, yScale, xRange, yRange)
        break
      case ShapeType.Bore:
        this.drawBore(graph, xScale, yScale, xRange, yRange)
      case ShapeType.PvACasing:
        this.drawPvACasing(graph, xScale, yScale, xRange, yRange)
        break
      case ShapeType.PvALiner:
        this.drawPvALiner(graph, xScale, yScale)
        break
    }
  }

  this.enableOrdinateNotation = function (graph) {
    this.ordinateNotation = true
  }

  this.wrap = function (tx, width, height=1) {
    var totalLineNumbers = 0

    tx.each(function() {
      var text = d3.select(this);
      var words = text.text().split(/\s+/).reverse();
      var line = [];
      var lineNumber = 0;
      var lineHeight = height;
      var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", 0).attr("dy", "0.0em");

      if (words.length > 1) {
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
              .attr("dy", (++lineNumber * lineHeight) + "em")
              .text(word);
          }
        }
      } else {
        line.push(words[0]);
        tspan.text(line.join(" "));
      }

      totalLineNumbers += lineNumber
    });

    return totalLineNumbers
  }

  this.dashText = function(tx, width){
    tx.each(function() {
      var text = d3.select(this),
          letters = text.text().split("").reverse(),
          letter,
          words = [],
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", 0).attr("dy", "0.25em"),
          lineNumber = 0,
          lineHeight = 1.1

      while(letter = letters.pop()){
        words.push(letter)
        tspan.text(words.join(""));

        if (tspan.node().getComputedTextLength() > (width * .80)) {
          words.pop()
          tspan.text(words.join(" "));
          words = [letter];

          tspan = text.append("tspan")
            //.attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", ++lineNumber * lineHeight + "em")
            .text(letter);

          words = []
        }
      }
    })
  }

  this.drawBore = function (graph, xScale, yScale, xRange, yRange) {
    graph.append("line")
      .attr("x1", xScale(Date.parse(this.coordinates[0])))
      .attr("y1", yRange[0])
      .attr("x2", xScale(Date.parse(this.coordinates[0])))
      .attr("y2", yRange[1])
      .attr("class", "boreText")
      .attr("fill", "#" + this.color)
      .attr("stroke", "#" + this.color)
      .attr("stroke-width", 1)

    graph.append("text")
      .attr("transform", "translate(" + (xScale(Date.parse(this.coordinates[0])) + 10) + "," + (yRange[1] + 10) + ")")
      .attr("class", "boreText")
      .attr("id", this.id)
      .text(this.text)
      .attr("font-size", "10px")
      .style("font-weight", "normal")
      .attr("stroke", "#" + this.color)
      .style("text-anchor", "start")
      .attr("dominant-baseline", "central")
  }

  this.drawArea = function (graph, xScale, yScale, xRange, yRange) {
    var area = d3.svg.area()
      .x(function (d) {
          return (xScale != null) ? xScale(d[0]) : d[0]
      })
      .y0(yRange[0])
      .y1(function (d) {
          return (yScale != null) ? yScale(d[1]) : d[1]
      })

    graph.append("path")
      .attr("class", "area")
      .attr("fill", "#" + this.color)
      .style("opacity", "0.6")
      .attr("d", area(this.coordinates));

    this.drawLine(graph, xScale, yScale)
  }

  this.drawCrossHair = function (graph, xScale, yScale) {
    graph.append("line")
      .attr("class", "line")
      .attr("x1", xScale(this.coordinates[0][AxisType.x]) - 15)
      .attr("y1", yScale(this.coordinates[0][AxisType.y]))
      .attr("x2", xScale(this.coordinates[1][AxisType.x])+ 15)
      .attr("y2", yScale(this.coordinates[1][AxisType.y]))
      .attr("fill", "none")
      .attr("stroke", "#222")
      .attr("stroke-width", 1)

    graph.append("line")
      .attr("class", "line")
      .attr("x1", xScale(this.coordinates[2][AxisType.x]))
      .attr("y1", yScale(this.coordinates[2][AxisType.y]) - 15)
      .attr("x2", xScale(this.coordinates[3][AxisType.x]))
      .attr("y2", yScale(this.coordinates[3][AxisType.y]) + 15)
      .attr("fill", "none")
      .attr("stroke", "#222")
      .attr("stroke-width", 1)

    this.coordinates.forEach(function (coordinate) {
      graph.append("text")
        .attr("transform", "translate(" + xScale(coordinate[AxisType.x]) + "," + yScale(coordinate[AxisType.y]) + ")")
        .attr("class", "crosshairText")
        .attr("id", this.id)
        .text(math.abs((coordinate[AxisType.x] != 0) ? coordinate[AxisType.x] : coordinate[AxisType.y]))
        .style("text-anchor", "middle")
        .attr("dominant-baseline", "central")
    })
  }

  this.drawVectorLabel = function (graph, xScale, yScale) {
    var t = graph.append("text")
      .attr("transform", "translate(" + xScale(this.coordinates[0][AxisType.x] + 10) + "," + yScale((this.coordinates[1][AxisType.y] - this.coordinates[0][AxisType.y])/2 + this.coordinates[0][AxisType.y]) + ")")
      .attr("class", "legendText")
      .attr("id", this.id)
      .text(this.name)
      .style("text-anchor", "start")

    this.wrap(t, 100)
  }

  this.drawVector = function (graph, xScale, yScale) {
    graph.append("line")
      .attr("class", "line")
      .attr("x1", xScale(this.coordinates[0][AxisType.x]) - 10)
      .attr("y1", yScale(this.coordinates[0][AxisType.y]))
      .attr("x2", xScale(this.coordinates[0][AxisType.x]) + 10)
      .attr("y2", yScale(this.coordinates[0][AxisType.y]))
      .attr("fill", "none")
      .attr("stroke", "#" + this.color)
      .attr("stroke-width", 1)

    graph.append("line")
      .attr("class", "line")
      .attr("x1", xScale(this.coordinates[1][AxisType.x]) - 10)
      .attr("y1", yScale(this.coordinates[1][AxisType.y]))
      .attr("x2", xScale(this.coordinates[1][AxisType.x]) + 10)
      .attr("y2", yScale(this.coordinates[1][AxisType.y]))
      .attr("fill", "none")
      .attr("stroke", "#" + this.color)
      .attr("stroke-width", 1)

    graph.append("path")
      .attr("class", "path")
      .attr("d", "M" + xScale(this.coordinates[0][AxisType.x]) + "," + (yScale(this.coordinates[0][AxisType.y]) + 2) +
                 "L" + xScale(this.coordinates[1][AxisType.x]) + "," + (yScale(this.coordinates[1][AxisType.y]) - 4))
      .attr("fill", "none")
      .attr("stroke", "#" + this.color)
      .attr("stroke-width", 3)
      .attr("marker-start", "url(#startArrowHead)")
      .attr("marker-end", "url(#endArrowHead)");

    var g = graph.append("g")
    var t = g.append("text")
      .attr("transform", "translate(" + xScale(this.coordinates[1][AxisType.x] + 20) + "," + yScale(this.coordinates[1][AxisType.y]) + ")")
      .attr("class", "legendText")
      .attr("id", this.id)
      .text(this.name + " @ " + this.coordinates[1][AxisType.y] + "mMD")
      .style("text-anchor", "start")

    this.wrap(t, this.width - xScale(this.coordinates[1][AxisType.x]))
    g.attr("dominant-baseline", "middle")

    $("marker path").css("fill", "#" + this.color)
  }

  this.drawLevel = function (graph, chartType, xScale, yScale, type) {
    var rangePoint = ((typeof xScale.rangePoints === "function" || typeof yScale.rangePoints === "function") ? (xScale.rangeBand()/2) : 0)
    var x = xScale(this.coordinates[AxisType.x]) - this.weight/2 + rangePoint
    var y = yScale(this.coordinates[AxisType.y])

    var path, line, g;
    if (type === "top") {
      path = graph.append("path")
        .attr("d", "M" + (x + 3) + "," + (y - 10) +
                   "L" + (x + 3 + 10) + "," + (y - 10) +
                   "L" + (x + 3 + 5) + "," + y)
        .attr("stroke-width", 0)
        //.attr("clip-path", "url(#newSVG" + this.chartId + ")")
        .attr("fill", "#" + this.color);
    } else if (type === "bottom") {
      path = graph.append("path")
        .attr("d", "M" + (x + 3) + "," + (y + 10) +
                   "L" + (x + 3 + 10) + "," + (y + 10) +
                   "L" + (x + 3 + 5) + "," + y)
        .attr("stroke-width", 0)
        //.attr("clip-path", "url(#newSVG" + this.chartId + ")")
        .attr("fill", "#" + this.color);
    }

    if (this.fullLength == false || this.fullLength == null) {
      line = graph.append("line")
        .attr("class", "level")
        .attr("x1", x)
        .attr("y1", y)
        .attr("x2", x + this.weight)
        .attr("y2", y)
        .attr("id", this.id)
        .attr("fill", "none")
        .style("stroke", "#" + this.color)
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5")
        .style("stroke-linecap", "round")
        //.attr("clip-path", "url(#newSVG" + this.chartId + ")")
    }
    
    if (type === "top") {
      var currentX = x + 20
      var currentY = y - 5

      g = graph.append("g")
  
      var t = g.append("text")
        .attr("transform", "translate(" + currentX + "," + (currentY) + ")")
        .attr("class", "topLevelText")
        .attr("id", this.id)
        .text(this.name)
        .style("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .style("fill", "#" + this.color)
        .style("font-size", "10px")
        //.attr("clip-path", "url(#newSVG" + this.chartId + ")")

      if (this.name != "") {
        var height = this.wrap(t, this.weight + 15)

        var rect = g.insert("rect",":first-child")
          .attr("fill", 'white')
          .attr("fill-opacity", '0.7')
          .attr("width", this.weight + 15)
          .attr("height", (height + 1) * 11)
          .attr("x", currentX)
          .attr("y", currentY - 6)
      }
    }

    if (chartType != ChartType.HolisticView){
        if(g != null){
          g.attr("clip-path", "url(#newSVG" + this.chartId + ")")
        }
        if(path != null){
          path.attr("clip-path", "url(#newSVG" + this.chartId + ")")
        }
        if(line != null){
          line.attr("clip-path", "url(#newSVG" + this.chartId + ")")
        }
      }  
  }

  this.appendText = function (svg, x, y, className, idName, text, textAnchor, textColor = "000000",fontSize="10px") {
    return svg.append("text")
      .attr("transform", "translate(" + x + "," + y + ")")
      .attr("class", className)
      .attr("id", idName)
      .text(text)
      .style("text-anchor", textAnchor)
      .style("fill", "#" + textColor)
      .style("font-size", fontSize)
      .attr("dominant-baseline", "central")
      .attr("alignment-baseline", "central")
  }

  this.drawBlockage = function (graph, xScale, yScale, xRange, yRange) {
    var chartWidth = this.width;
    color = (this != null) ? this.color : color
    var height = 6
    var width = this.coordinates[AxisType.x][0] * 2
    var g = graph.append("g")
      .attr("clip-path", "url(#newSVG" + this.chartId + ")")

    this.coordinates.forEach(function(entry){
      var rect = g.append("rect")
        .attr("id", "container"+this.id)
        .attr("width", width)
        .attr("height", (height === 0) ? 2 : height)
        .attr("transform", "translate(" + xScale((entry[AxisType.x] > 0) ? 0:entry[AxisType.x]) + "," + yScale(entry[AxisType.y]) + ")")
      rect.style("fill", (this.gradientEnabled === true) ? "url(#linear-gradient)" : "#" + color)
    })  
  }

  // Only rectangle supports gradients for the time being
  this.drawRectangle = function (graph, xScale, yScale, xRange, yRange) {
    color = (this != null) ? this.color : color
    var height = 5
    var x = this.coordinates[AxisType.x]
    var y = this.coordinates[AxisType.y]

    if (xScale && yScale) {
      if (this.coordinates && this.coordinates[0] && this.coordinates[0].constructor.name === "Array") {
        x = this.coordinates[0][AxisType.x]
        y = (yRange[0] < yRange[1]) ?
              Math.min(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y]) :
              Math.max(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y])

        if ((yRange[0] > yRange[1]) && (this.coordinates[0][AxisType.y] < this.coordinates[1][AxisType.y])) {
          y = Math.min(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y])
          height = 2
        } else {
          height = Math.abs(yScale(this.coordinates[0][AxisType.y]) - yScale(this.coordinates[1][AxisType.y]))
        }
      } else {
        height = 10
        this.weight = 40
      }

      if (shape.properties.orientation == "right"){
        x = xScale(x) - 20
      }
      else {
        x = xScale(x) - this.weight/2 + ((typeof xScale.rangePoints === "function" || typeof yScale.rangePoints === "function") ?
                  (xScale.rangeBand()/2) : 0)
      }
      y = yScale(y)
    }

    var g = graph.append("g")
      .attr("clip-path", "url(#newSVG" + this.chartId + ")")

    var rect = g.append("rect")
      .attr("id", "container"+this.id)
      .attr("width", this.weight)
      .attr("height", (height === 0) ? 2 : height)
      .attr("transform", "translate(" + x + "," + y + ")")

    this.object = rect;
    this.objectX = x;
    this.objectY = y;

    rect.style("fill", (this.gradientEnabled === true) ? "url(#linear-gradient)" : "#" + color)

    var barLabel = null
    if (xScale && yScale) {
      if (this.coordinates && this.coordinates[0] && this.coordinates[0].constructor.name === "Array" && (this.name || this.name != "")) {
        if (this.chartType == ChartType.OffsetWells) {
          var href = $('#offset_wells_graphs_tabs > div > ul > .active > a').attr('href');
          if (href == "#smectiteZonesTabMount" || href == "#intrusivesTabMount" || href == "#estmdTempTabMount") {
            barLabel = this.appendText(g, (x + this.weight/2), (y + height/2), "legendText", this.id, this.name, "middle", "000")
            var lineNumbers = this.wrap(barLabel, height);

            if(href == "#estmdTempTabMount"){
              barLabel.attr("transform", "translate(" + (x + this.weight/2) + "," + (y + (height/(lineNumbers + 2))) + ") rotate(-90)");
            }
            else{
              barLabel.attr("transform", "translate(" + (x + this.weight/2) + "," + (y + (height/(lineNumbers + 2))) + ")");
            }
          }
        // } else if (height > 10 && this.name != null && this.name != "") {
        } else if (this.name != null && this.name != "") {
          var rgb = parseInt(this.color, 16);   // convert rrggbb to decimal
          var red = (rgb >> 16) & 0xff;  // extract red
          var green = (rgb >>  8) & 0xff;  // extract green
          var blue = (rgb >>  0) & 0xff;  // extract blue

          var oldColor = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue); // per ITU-R BT.709
          var textColor = (oldColor > 200) ? "000000" : "ffffff"

          barLabel = this.appendText(graph, (x + this.weight/2), (y + (height/2)), "barText", "label"+this.id, this.name, "middle", textColor)
          
          var rectbbox = jQuery(rect)[0][0].getBBox()
          var labelbbox = jQuery(barLabel)[0][0].getBBox()
          
          if (this.type == 'Casing' && this.name == "PCS" && shape.properties.depth[1] != null && shape.properties.depth[1][AxisType.y] != null) {
            this.appendText(g, (x + this.weight/2), (y + (height) - 10), "barText", "label"+this.id, shape.properties.depth[1][AxisType.y], "middle", textColor)
          }

          if (this.type == 'Casing' && (labelbbox.height >= rectbbox.height)) {
            barLabel.attr('transform', "translate(" + (x - labelbbox.width - 5) + "," + (y + (rectbbox.height/2)) + ")")
              .style("text-anchor", "start")
              .style("fill", "#000000")
          }

          //check if the label is too big, turn the text into an acronym
          if(this.type != 'Casing' && this.makeAcronym && (labelbbox.width >= rectbbox.height)) {
            //convert name to acronym
            if(this.acronym && this.acronym != "") {
              this.name = this.acronym
            } else {
              this.name = this.name.replace(/[\-\.\,\_]/g," ").split(" ").map(function(elem) {
                return elem[0]
              }).join("");
            }
            barLabel.text(this.name)
          }

          var lineNumbers;
          if (this.type != 'Casing') {
            lineNumbers = this.wrap(barLabel, height);
            barLabel.attr("transform", "translate(" + (x + this.weight/(lineNumbers + 2)) + "," + (y + height/2) + ") rotate(-90)");
          }

          rectbbox = jQuery(rect)[0][0].getBBox()
          labelbbox = jQuery(barLabel)[0][0].getBBox()

          //check again if the label is too big, rotate the text to 0 degree
          if ((this.type != 'Casing') && (labelbbox.width >= rectbbox.height)) {
            barLabel.text(this.name)
            lineNumbers = this.wrap(barLabel, height);
            labelbbox = jQuery(barLabel)[0][0].getBBox()
            var horizontal_y = (y + (rectbbox.height/2) - ((lineNumbers > 1) ? ((lineNumbers - 1) * 5) + 10 : 2))
            barLabel.attr("transform", "translate(" + (x + this.weight/2) + "," + horizontal_y + ")");
          }

          /*if (labelbbox.height > rectbbox.height || labelbbox.width > rectbbox.width) {
            //barLabel.attr("fill", "#000")
            //jQuery(barLabel[0][0]).hide();
          }*/
        }
      }

      if (this.ordinateNotation) {
        var y1 = yScale(this.coordinates[0][AxisType.y])
        var y2 = yScale(this.coordinates[1][AxisType.y]) + ((height === 0) ? 2 : 0)
        var textAnchor = "end"

        if (this.chartType != ChartType.HolisticView && Math.abs(this.coordinates[0][AxisType.y] - this.coordinates[1][AxisType.y]) > 20) {
          x -= 5
        } else {
          x += this.weight/2
          if (y1 + 6 < y2 - 6) {
            y1 += 6
            y2 -= 6
          } else {
            y1 += height/2
            y2 = y1
          }
          textAnchor = "middle"
        }
        var objectElement = jQuery(this.object)[0][0]
        var textValue = (shape.properties.depth) ? shape.properties.depth:this.coordinates
        var lowerValueText = this.appendText(graph, x, y1, "barText", this.id+"lower", textValue[0][AxisType.y], textAnchor)
        var lowerValueElem = jQuery(lowerValueText)[0][0]
        lowerText = new ValueText(x,y1,lowerValueElem.getBBox(), lowerValueElem, textAnchor, objectElement)
        var upperValueText = this.appendText(graph, x, y2, "barText", this.id+"upper", textValue[1][AxisType.y], textAnchor)
        var upperValueElem = jQuery(upperValueText)[0][0]
        upperText = new ValueText(x, y2, upperValueElem.getBBox(), upperValueElem, textAnchor,objectElement)
        //up-down outside box formation whenever text overlaps with upper and bottom values or
        //upper and bottom values overlap with no text
        if (barLabel) {
          var element = barLabel[0][0]
          var g = d3.selectAll(jQuery(element.tagName + "#" + element.id))
          var rotate = d3.transform(g.attr("transform")).rotate

          if (this.bboxIntersectsLabel(lowerText,upperText,element)) {
            //text overlaps with lower and upper values
            var newY1 = this.objectY - lowerText.getBBox().height/2
            var newY2 = this.objectY + jQuery(this.object)[0][0].getBBox().height + upperText.getBBox().height/2+0.1
            lowerText.setY(newY1)
            if (newY1 < 0) {
              lowerText.getElement().remove()
            }
            upperText.setY(newY2)  
            if (newY2 > this.height) {
              upperText.getElement().remove()
            }
          }

        } else if(this.bboxIntersects(lowerText,upperText)) {
          //no text but the lower and upper values overlaps with each other
          lowerText.setY(this.objectY - lowerText.getBBox().height/2)
          upperText.setY(this.objectY + jQuery(this.object)[0][0].getBBox().height + upperText.getBBox().height/2+0.1)
        }

        this.valueTexts.push(lowerText)
        this.valueTexts.push(upperText)
      }
    }
  }

  this.bboxIntersectsLabel = function(valueText1, valueText2, label) {
    //no need to recompute top/bottom values, since text anchor does not affect y-axis
    var bbox1Bottom = valueText1.getY(),
        bbox1Top = valueText1.getY() - valueText1.getBBox().height;
        
    var bbox2Bottom = valueText2.getY(),
        bbox2Top = valueText2.getY() - (valueText2.getBBox().height * 0.75);

    var labelBottom = bbox2Top,
        labelTop = bbox1Bottom;

    var g = d3.selectAll(jQuery(label.tagName+"#"+label.id))
    var labelRect = d3.transform(g.attr("transform"))
    var rotate = labelRect.rotate
    var currentX = labelRect.translate[0]
    var currentY = labelRect.translate[1]

    if(rotate == 0) {
      //text is horizontal
      labelBottom = currentY
      labelTop = currentY - label.getBBox().height;
    } else if(rotate == 90 || rotate == -90) {
      //text is vertical
      labelBottom = currentY + label.getBBox().width/2
      labelTop = currentY - label.getBBox().width/2
    }

    return (labelTop < bbox1Bottom ||
           bbox2Top < labelBottom);

  }

  this.bboxIntersects = function(valueText1, valueText2) {

    //no need to recompute top/bottom values, since text anchor does not affect y-axis
    var bbox1Bottom = valueText1.getY(),
        bbox1Top = valueText1.getY() - valueText1.getBBox().height;
        
    var bbox2Bottom = valueText2.getY(),
        bbox2Top = valueText2.getY() - (valueText2.getBBox().height * 0.75);

    
    // if(valueText1.getTextAnchor() == "start"){
    //   bbox1Left = valueText1.getX();
    //   bbox1Right = valueText1.getX() + valueText1.getBBox().width;
    // } else if(valueText1.getTextAnchor() == "middle"){
    //   bbox1Left = valueText1.getX() - valueText1.getBBox().width/2;
    //   bbox1Right = valueText1.getX() + valueText1.getBBox().width/2;
    // } else if(valueText1.getTextAnchor() == "end"){
    //   bbox1Left = valueText1.getX() - valueText1.getBBox().width;
    //   bbox1Right = valueText1.getX();
    // }

    // if(valueText2.getTextAnchor() == "start"){
    //   bbox2Left = valueText2.getX();
    //   bbox2Right = valueText2.getX() + valueText2.getBBox().width;
    // } else if(valueText2.getTextAnchor() == "middle"){
    //   bbox2Left = valueText2.getX() - valueText2.getBBox().width/2;
    //   bbox2Right = valueText2.getX() + valueText2.getBBox().width/2;
    // } else if(valueText2.getTextAnchor() == "end"){
    //   bbox2Left = valueText2.getX() - valueText2.getBBox().width;
    //   bbox2Right = valueText2.getX();
    // }

    return (bbox2Top < bbox1Bottom ||
           bbox2Bottom < bbox1Top);
  }

  this.drawPvACasing = function (graph, xScale, yScale, xRange, yRange) {
    color = (this != null) ? this.color : color
    var height = 5
    var x = this.coordinates[AxisType.x]
    var y = this.coordinates[AxisType.y]

    if (xScale && yScale) {
      if (this.coordinates && this.coordinates[0] && this.coordinates[0].constructor.name === "Array") {
        x = this.coordinates[0][AxisType.x]
        if ((yRange[0] > yRange[1]) && (this.coordinates[0][AxisType.y] < this.coordinates[1][AxisType.y])) {
          y = Math.min(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y])
          height = 2
        } else {
          y = (yRange[0] < yRange[1]) ?
              Math.min(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y]) :
              Math.max(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y])
          height = Math.abs(yScale(this.coordinates[0][AxisType.y]) - yScale(this.coordinates[1][AxisType.y]))
        }
      } else {
        height = 10
        this.weight = 40
      }
      
      if (shape.properties.orientation == "right"){
        x = xScale(x) - 20
      }
      else {
        x = xScale(x) - this.weight/2 + 25 + ((typeof xScale.rangePoints === "function" || typeof yScale.rangePoints === "function") ?
                (xScale.rangeBand()/2) : 0)
      }
      y = yScale(y)
    }

    var g = graph.append("g")
      .attr("clip-path", "url(#newSVG" + this.chartId + ")")
    
    var rect = g.append("rect")
      .attr("id", "container"+this.id)
      .attr("width", this.weight/2)
      .attr("height", (height === 0) ? 2 : height)
      .attr("transform", "translate(" + x + "," + y + ")")

    this.object = rect;
    this.objectX = x;
    this.objectY = y;

    rect.style("fill", "#" + color)

    var barLabel = null
    if (xScale && yScale) {
      if (this.coordinates && this.coordinates[0] && this.coordinates[0].constructor.name === "Array" && (this.name || this.name != "")) {
        if (this.name != null && this.name != "") {
          var rgb = parseInt(this.color, 16);   // convert rrggbb to decimal
          var red = (rgb >> 16) & 0xff;  // extract red
          var green = (rgb >>  8) & 0xff;  // extract green
          var blue = (rgb >>  0) & 0xff;  // extract blue

          var oldColor = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue); // per ITU-R BT.709
          var textColor = (oldColor > 200) ? "000000" : "ffffff"
          var newX =  (shape.properties.orientation == "left") ? (x - this.weight/2) + 10: (x + this.weight/2) + 5
          barLabel = this.appendText(graph, newX, (y + height), "barText", "label"+this.id, this.name, (shape.properties.orientation == "left") ? "end" : "start", "000000")
          
          this.wrap(barLabel, 40)
        }
      }

      if (this.ordinateNotation) {
        var y1 = yScale(this.coordinates[0][AxisType.y])
        var y2 = yScale(this.coordinates[1][AxisType.y]) + ((height === 0) ? 2 : 0)
        var textAnchor = "middle"

        x += this.weight/2
        if (y1 + 6 < y2 - 6) {
          y1 += 6
          y2 -= 6
        } else {
          y1 += height/2
          y2 = y1
        }

        var objectElement = jQuery(this.object)[0][0]
        var textValue = (shape.properties.depth) ? shape.properties.depth:this.coordinates
        var lowerValueText = this.appendText(graph, x, y1, "barText", this.id+"lower", textValue[0][AxisType.y], textAnchor)
        var lowerValueElem = jQuery(lowerValueText)[0][0]
        lowerText = new ValueText(x,y1,lowerValueElem.getBBox(), lowerValueElem, textAnchor, objectElement)
        var upperValueText = this.appendText(graph, x, y2, "barText", this.id+"upper", textValue[1][AxisType.y], textAnchor)
        var upperValueElem = jQuery(upperValueText)[0][0]
        upperText = new ValueText(x, y2, upperValueElem.getBBox(), upperValueElem, textAnchor,objectElement)
        //up-down outside box formation whenever text overlaps with upper and bottom values or
        //upper and bottom values overlap with no text
        if (barLabel) {
          var element = barLabel[0][0]
          var g = d3.selectAll(jQuery(element.tagName + "#" + element.id))
          var rotate = d3.transform(g.attr("transform")).rotate

          if (this.bboxIntersectsLabel(lowerText,upperText,element)) {
            //text overlaps with lower and upper values
            var newY1 = this.objectY - lowerText.getBBox().height/2
            var newY2 = this.objectY + jQuery(this.object)[0][0].getBBox().height + upperText.getBBox().height/2+0.1
            lowerText.setY(newY1)
            if (newY1 < 0) {
              lowerText.getElement().remove()
            }
            upperText.setY(newY2)  
            if (newY2 > this.height) {
              upperText.getElement().remove()
            }
          }

        } else if(this.bboxIntersects(lowerText,upperText)) {
          //no text but the lower and upper values overlaps with each other
          lowerText.setY(this.objectY - lowerText.getBBox().height/2)
          upperText.setY(this.objectY + jQuery(this.object)[0][0].getBBox().height + upperText.getBBox().height/2+0.1)
        }

        this.valueTexts.push(lowerText)
        this.valueTexts.push(upperText)
      }
    }
  }
  
  this.drawHistogram = function (graph, xScale, yScale, xRange, yRange) {
    color = (this != null) ? this.color : color
    var height = 5
    var x = this.coordinates[AxisType.x]
    var y = this.coordinates[AxisType.y]

    if (xScale && yScale) {
      if (this.coordinates && this.coordinates[0] && this.coordinates[0].constructor.name === "Array") {
        x = this.coordinates[0][AxisType.x]
        y = (yRange[0] < yRange[1]) ?
              Math.min(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y]) :
              Math.max(this.coordinates[0][AxisType.y], this.coordinates[1][AxisType.y])
        height = Math.abs(yScale(this.coordinates[0][AxisType.y]) - yScale(this.coordinates[1][AxisType.y]))
      } else {
        height = 10
        this.weight = 40
      }

      x = xScale(x)  + ((typeof xScale.rangePoints === "function" || typeof yScale.rangePoints === "function") ?
                (xScale.rangeBand()/2) : 0)
      y = yScale(y)
    }

    var rect = graph.append("rect")
      .attr("id", this.id)
      .attr("width", xRange[1] / 5)
      .attr("height", (height === 0) ? 2 : height)
      .attr("transform", "translate(" + x + "," + y + ")")

    if (this.gradientEnabled === true) {
      rect.style("fill", "url(#linear-gradient)")
    } else {
      rect.attr("fill", "#" + color)
    }
    
  }

  this.drawCircle = function (graph, cx, cy, weight, id, color) {
    var radius = (this != null) ? this.weight/2 : weight

    graph.append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", radius)
      .attr("id", (this != null) ? this.id : id )
      .attr("fill", "#" + ((this != null) ? this.color : color))
      .attr("name", (this.name != null) ? this.name: '')
      .attr("clip-path", "url(#newSVG" + this.chartId + ")")

    if (this.showLabel === true){
      var t = this.appendText(graph, (cx + radius + 10), cy, "pointText", this.id, this.name, "left","000000",fontSize=this.labelFontSize)
      wrapWidth = (this.labelWrapWidth ? this.labelWrapWidth : 80)
      height = (this.lineHeight ? this.lineHeight : 1.5)
      this.wrap(t, wrapWidth, height=height)
    }
  }

  this.drawLiner = function (graph, xScale, yScale) {
    if (this.coordinates && this.coordinates[0] && this.coordinates[1]) {
      graph.append("line")
        .attr("class", "line")
        .attr("x1", xScale(this.coordinates[0][AxisType.x]) - this.weight)
        .attr("y1", yScale(this.coordinates[0][AxisType.y]))
        .attr("x2", xScale(this.coordinates[1][AxisType.x]) - this.weight)
        .attr("y2", yScale(this.coordinates[1][AxisType.y]))
        .attr("fill", "none")
        .attr("stroke", "#" + this.color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")

      graph.append("line")
        .attr("class", "line")
        .attr("x1", xScale(this.coordinates[0][AxisType.x]) + this.weight)
        .attr("y1", yScale(this.coordinates[0][AxisType.y]))
        .attr("x2", xScale(this.coordinates[1][AxisType.x]) + this.weight)
        .attr("y2", yScale(this.coordinates[1][AxisType.y]))
        .attr("fill", "none")
        .attr("stroke", "#" + this.color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")

      var t = graph.append("text")
        .attr("transform", "translate("+ (xScale(this.coordinates[1][AxisType.x]) + this.weight + 5) +"," + yScale(this.coordinates[1][AxisType.y] - 30) + ")")
        .attr("class", "barText")
        .attr("id", this.id)
        .text(this.name)
        .attr("font-size", "10px")
        .style("text-anchor", "start")
        .attr("dominant-baseline", "central")

      this.wrap(t, 40)
    }
  }

  this.drawPvALiner = function (graph, xScale, yScale) {
    if (this.coordinates && this.coordinates[0] && this.coordinates[1]) {
      var xAxisOffset = (shape.properties.orientation == "left") ? 20 - this.weight : this.weight - 20
      
      graph.append("line")
        .attr("class", "line")
        .attr("x1", xScale(this.coordinates[0][AxisType.x]) + xAxisOffset)
        .attr("y1", yScale(this.coordinates[0][AxisType.y]))
        .attr("x2", xScale(this.coordinates[1][AxisType.x]) + xAxisOffset)
        .attr("y2", yScale(this.coordinates[1][AxisType.y]))
        .attr("fill", "none")
        .attr("stroke", "#" + this.color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")

      var xText = (shape.properties.orientation == "left") ? xScale(this.coordinates[0][AxisType.x]) - this.weight + 15 : xScale(this.coordinates[0][AxisType.x]) + this.weight - 15
      var t = graph.append("text")
        .attr("transform", "translate("+ xText +"," + yScale(this.coordinates[1][AxisType.y] - 30) + ")")
        .attr("class", "barText")
        .attr("id", this.id)
        .text(this.name)
        .attr("font-size", "10px")
        .style("text-anchor", (shape.properties.orientation == "left") ? "end" : "start")
        .attr("dominant-baseline", "central")

      this.wrap(t, 40)
    }
  }

  this.drawProdLine = function (graph, xScale, yScale) {
    var chartWidth = this.width
    if (this.coordinates && this.coordinates[0] && this.coordinates[1]) {
      this.coordinates.forEach(function(entry){
        var g = graph.append('g')
          .attr("clip-path", "url(#newSVG" + this.chartId + ")")

        g.append("line")
          .attr("class", "line")
          .attr("x1", xScale(entry[AxisType.x][0]))
          .attr("y1", yScale(entry[AxisType.x][1]))
          .attr("x2", xScale(entry[AxisType.y][0]))
          .attr("y2", yScale(entry[AxisType.y][1]))
          .attr("fill", "none")
          .attr("stroke", "#" + this.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")

        var line = d3.svg.line()
          .x(function (d) { return d[0] })
          .y(function (d) { return d[1] })
          .interpolate("basis");

        g.append("text")
          .attr("transform", "translate("+ ((entry[AxisType.x][0] > 0) ? 5 : 145) +"," + yScale(entry[AxisType.x][1]) + ")")
          .attr("class", "barText")
          .attr("id", this.id)
          .text("TOL")
          .style("text-anchor", (entry[AxisType.x][0] > 0) ? "start": "end")
          .attr("dominant-baseline", "central")

        g.append("text")
          .attr("transform", "translate("+ ((entry[AxisType.x][0] > 0) ? 5 : 145) + "," + yScale(entry[AxisType.y][1]) + ")")
          .attr("class", "barText")
          .attr("id", this.id)
          .text("BOL")
          .style("text-anchor", (entry[AxisType.x][0] > 0) ? "start": "end")
          .attr("dominant-baseline", "central")

        if (shape.properties.lastLiner){
          var path = g.append("path")
            .attr("d", line([
                [xScale(0), yScale(entry[AxisType.y][1] + 15)],
                [xScale(entry[AxisType.y][0]), yScale(entry[AxisType.y][1])]
              ])
            )
            .attr("class", "line")
            .attr("id", this.id)
            .attr("fill", "none")
            .style("stroke", "#" + this.color)
            .style("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("clip-path", "url(#newSVG" + this.chartId + ")")
        }
      }.bind(this))
    }
  }

  this.drawDrill = function (graph, xScale, yScale) {
    this.weight = 3
    this.coordinates.forEach(function(entry){
      graph.append("line")
        .attr("class", "line")
        .attr("x1", xScale(entry[AxisType.x]))
        .attr("y1", yScale(0) - this.weight/2)
        .attr("x2", xScale(entry[AxisType.x]))
        .attr("y2", yScale(entry[AxisType.y]) + this.weight/2)
        .attr("fill", "none")
        .attr("stroke", "#" + this.color)
        .attr("stroke-width", this.weight)

      graph.append("line")
        .attr("class", "line")
        .attr("x1", xScale((entry[AxisType.x] > 0) ? 40:-40))
        .attr("y1", yScale(0))
        .attr("x2", xScale(entry[AxisType.x]))
        .attr("y2", yScale(0))
        .attr("fill", "none")
        .attr("stroke", "#" + this.color)
        .attr("stroke-width", this.weight)

      graph.append("line")
        .attr("class", "line")
        .attr("x1", xScale(entry[AxisType.x]))
        .attr("y1", yScale(entry[AxisType.y]))
        .attr("x2", xScale(entry[AxisType.x] + ((entry[AxisType.x] > 0) ? 5:-5)))
        .attr("y2", yScale(entry[AxisType.y]))
        .attr("fill", "none")
        .attr("stroke", "#" + this.color)
        .attr("stroke-width", this.weight)

      graph.append("line")
      .attr("class", "line")
      .attr("x1", xScale(entry[AxisType.x]))
      .attr("y1", yScale(entry[AxisType.y]) - 10)
      .attr("x2", xScale(entry[AxisType.x] + ((entry[AxisType.x] > 0) ? 5:-5)))
      .attr("y2", yScale(entry[AxisType.y]))
      .attr("fill", "none")
      .attr("stroke", "#" + this.color)
      .attr("stroke-width", this.weight)

      graph.append("text")
      .attr("transform", "translate(" + (xScale(entry[AxisType.x] + ((entry[AxisType.x] > 0) ? 1.5:-1.5))) + "," + (yScale(entry[AxisType.y]) + 10) + ")")
      .attr("class", "barText")
      .attr("id", this.id)
      .text(this.name)
      .style("text-anchor", (entry[AxisType.x] > 0) ? "start":"end")
      .attr("dominant-baseline", "central")

    }.bind(this))
  }

  this.setInterpolateType = function(type) {
    this.interpolateType = type
    return this
  }

  this.drawLine = function (graph, xScale, yScale) {
    var line = d3.svg.line()
      .interpolate(this.interpolateType)
      .x(function (d) { return (xScale != null) ? xScale(d[0]) : d[0] })
      .y(function (d) { return (yScale != null) ? yScale(d[1]) : d[1] })

    var isCasingOrLiner = function() {
      return (this.name.indexOf("Casing") != -1 || this.name.indexOf("Liner") != -1)
    }.bind(this)



    var path = graph.append("path")
      .attr("d", line(this.coordinates))
      .attr("class", "line")
      .attr("id", (isCasingOrLiner() && this.chartId != null) ? this.id + "_casing" : "hoverShape"+this.id)
      .attr("fill", "none")
      .style("stroke", "#" + this.color)
      .style("stroke-width", this.weight)
      .style("stroke-linecap", "round")

    if (this.chartId != null) {
      path.attr("clip-path", "url(#newSVG" + this.chartId + ")")
    }

    var g = graph.append("g")
      .attr("clip-path", "url(#newSVG" + this.chartId + ")")

    if (this.nodeHighlight) {
      if (xScale && yScale) {
         var text = graph.append("text")
            .attr("id", "hover" + this.id)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .style("font-size", "10px")

        g.selectAll("path")
            .data(this.coordinates)
            .attr("clip-path", "url('#newSVG" + this.chartId + "')")
          .enter().append("path")
            .attr("id", (isCasingOrLiner() && this.chartId != null) ? this.id + "_casing" : this.id)
            .attr("d", d3.svg.symbol()
              .type(this.marker)
              .size(35))
            .attr("transform", function (d) { return "translate(" + xScale(d[0]) +  "," + yScale(d[1]) + ")" })
            .style("fill", "#" + this.color)
            .on({
              "mouseover": function (d, i) {
                var coords = d3.mouse(document.getElementById("chart2"))
                d3.select("text#hover" + this.id).style("display", null)
                document.getElementById("hover" + this.id).style.visibility = "visible"; 
                text.attr("transform", "translate(" + (coords[0] + 7) + "," + (coords[1] - 3) + ")");
              
                var value = (d[0] % 1 != 0 ? d[0].toFixed(2) : d[0]);
                
                text.text("[" + value + "," + d[1].toFixed(2) + "]");
              },
              "mouseout": function (d, i) {
                d3.select("text#hover" + this.id).style("display", "none")
                document.getElementById("hover" + this.id).style.visibility = "hidden"; 
              }
            })

      } else {
        g.selectAll("path")
            .data(this.coordinates)
          .enter().append("path")
            .attr("id", (isCasingOrLiner() && this.chartId != null) ? this.id + "_casing" : this.id)
            .attr("d", d3.svg.symbol()
              .type(this.marker)
              .size(35))
            .attr("transform", function (d) { return "translate(" + d[0] +  "," + d[1] + ")" })
            .style("fill", "#" + this.color)
      }
    }
  }
}

exports.Shape = Shape