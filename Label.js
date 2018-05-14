var d3 = require('app/components/d3js.js');

var Label = function (id, name, height, x, y, boxWidth = 0) {
  this.name = name
  this.id = id
  this.x = x
  this.y = y
  this.width = 0
  this.height = height

  this.draw = function (graph) {
    this.text = graph.append("text")
      .attr("transform", "translate(" + this.x + "," + (this.y + this.height - 3) + ")")
      .attr("class", "legendText")
      .attr("id", this.id)
      .style("text-anchor", "start")
      .text(this.name)

    this.width = this.text.node().getComputedTextLength()

    // Set minimum width
    if (this.width == 0) {
      this.width = 150
    }
    
  }

  this.addOffset = function (x, y) {
    this.x += x
    this.y += y
  }

  this.setX = function (x) {
    this.x = x
  }

  this.setY = function (y) {
    this.y = y
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
}

exports.Label = Label