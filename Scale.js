var ContentType = require('app/components/visualization/Types.js').ContentType;
var d3 = require('app/components/d3js.js');

var Scale = function (domain, range, type) {
  if (type === ContentType.Date) {
    this.scale = d3.time.scale().domain(domain).range(range)
  } else if (type === ContentType.String) {
    this.scale = d3.scale.ordinal().domain(domain).rangeRoundBands(range, .1)
  } else if(type === ContentType.Log10){
    this.scale = d3.scale.log().domain(domain).range(range)
  } else {
    this.scale = d3.scale.linear().domain(domain).range(range)
  } 

  this.get = function () {
    return this.scale
  }
}

exports.Scale = Scale