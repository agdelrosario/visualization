var d3 = require('app/components/d3js.js');
var saveAs = require('vendor/file-saver/FileSaver.min.js').saveAs;

var DownloadGraph = function(graphs) {
  this.graph = graphs
  
  this.download = function() {
    this.graph.forEach (function (graph) {
      var doctype = '<?xml version="1.0" standalone="no"?>'
          + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
      
      var graph_id = (graph.g_id) ? graph.g_id + ' svg#' + graph.id : 'svg#' + graph.id
      var source = (new XMLSerializer()).serializeToString(d3.select(graph_id).node());
      var blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' });
      var url = window.URL.createObjectURL(blob);

      var img = d3.select('body').append('img')
          .attr('width', graph.width)
          .attr('height', graph.height)
          .attr('id', 'img_' + graph.id)
          .node();

      img.onload = function () {
        var canvas = d3.select('body').append('canvas')
            .attr('id', 'canvas_' + graph.id)
            .node();
            
        canvas.width = graph.width;
        canvas.height = graph.height;
        
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        
        var canvasdata = canvas.toDataURL("image/png");

        var pngimg = '<img src="'+canvasdata+'">'; 
        d3.select("#pngdataurl").html(pngimg);

        var a = document.createElement("a");
        a.download = graph.name + ".png";
        a.href = canvasdata;
        a.click();
      }
    
      img.src = url;
      d3.select("#img_" + graph.id).remove()
    })
  }
};

var dl_graph = new DownloadGraph();

exports.DownloadGraph = DownloadGraph;

var download = function (id, width, height, name, mode = "png") {
  var save = function (canvas) {
    switch (mode) {
      case "pdf":
        canvas.toBlob(function (blob) {
          //var file = new File(blob, "name.pdf")
          blob.lastModifiedDate = new Date();
          blob.name = "name.pdf";
          //saveAs(blob, ((name == null) ? "file" : name) + "." + mode)
        }, "application/" + mode + ";base64")
        break
      default:
        canvas.toBlob(function (blob) {
          saveAs(blob, ((name == null) ? "img" : name) + "." + mode)
        }, "image/" + mode)
    }
  }

  var doctype = '<?xml version="1.0" standalone="no"?>'
      + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
  var source = (new XMLSerializer()).serializeToString(d3.select('svg#' + id).node())
  var image = new Image();

  image.src = window.URL.createObjectURL(new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' }));

  image.onload = function () {
    var canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    canvas.getContext('2d').drawImage(image, 0, 0);
    save(canvas)
  }
}

exports.download = download