var ShapeType = require('app/components/visualization/Types.js').ShapeType;
var Shape = require('app/components/visualization/Shape.js').Shape;

var Icon = function (id, shape, height, x, y) {
  this.shape = new Shape(shape, id)
  this.height = height
  this.x = x
  this.y = y
  this.width = 10
  this.id = id

  this.draw = function (graph) {
    switch (this.shape.type) {
      case ShapeType.Point:
        this.shape.drawCircle(graph, this.x + this.shape.weight/2, this.y + this.height/2, this.shape.weight, this.id, this.shape.color)
        this.width = this.shape.weight
        break
      case ShapeType.MultiPoint:
        this.shape.drawCircle(graph, this.x + this.shape.weight/2, this.y + this.height/2, this.shape.weight, this.id, this.shape.color)
        this.width = this.shape.weight
        break
      case ShapeType.Line:
        this.shape.coordinates = [[this.x, this.y + this.height/2], [this.x + this.width, this.y + this.height/2]]
        this.shape.drawLine(graph)
        break
      case ShapeType.Bar:
        this.shape.coordinates = [this.x, this.y + this.height/2 - 2]
        this.shape.drawRectangle(graph)
    }
  }

  this.addOffset = function (x, y) {
    this.x += x
    this.y += y
  }

  this.setHeight = function (height) {
    this.height = height
  }

  this.setX = function (x) {
    this.x = x
  }

  this.setY = function (y) {
    this.y = y
  }
}

exports.Icon = Icon