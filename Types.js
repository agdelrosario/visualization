var AxisType = {
  "x": 0,
  "y": 1
}

exports.AxisType = AxisType

var ChartType = {
  "SectionView": 0,
  "BoreOutputCurve": 1,
  "SteamForecasting": 2,
  "OffsetWells": 3,
  "HolisticView": 4,
  "TP": 5,
  "Injectivity": 6,
  "PTSPlot": 7,
  "PlanView" : 8
}

exports.ChartType = ChartType

var ContentType = {
  "Integer": 0,
  "String": 1,
  "Date": 2,
  "Object": 3,
  "Log10": 4
}

exports.ContentType = ContentType

var CurveType = {
  "None": 0,
  "Linear": 1,
  "Quadratic": 2,
  "Cubic": 3,
  "Quartic": 4,
  "Quintic": 5,
  "Sextic": 6,
  "Septic": 7,
  "Octic": 8,
  "Nonic": 9,
  "Decic": 10
}

exports.CurveType = CurveType

var FitType = {
  "Regular": 0,
  "SinglePoint": 1,
  "UserGenerated": 2
}

exports.FitType = FitType

var ShapeType = {
  "Point": "Point",
  "MultiPoint": "MultiPoint",
  "Line": "LineString",
  "Bar": "Bar",
  "Casing": "Casing",
  "Histogram": "Histogram",
  "Vector": "Vector",
  "VectorLabel": "VectorLabel",
  "TopLevel": "TopLevel",
  "BottomLevel": "BottomLevel",
  "ProdLine": "ProdLine",
  "Liner": "Liner",
  "Drill": "Drill",
  "CrossHair": "CrossHair",
  "Area": "Area",
  "Bore": "Bore",
  "Blockage": "Blockage",
  "PvACasing": "PvACasing",
  "PvALiner": "PvALiner"
}

exports.ShapeType = ShapeType

var DateTimeFormat = {
    "M": "%B",
    "D": "%d",
    "Y": "%Y",
    "MY": "%B %Y",
    "MDY": "%B %d %Y",
    "Date": "%x",
    "Time": "%X",
    "DateTime": "%m/%e/%Y %H:%M:%S"
}

exports.DateTimeFormat = DateTimeFormat

var DownloadExtensions = {
  "png": "png",
  "pdf": "pdf",
  "jpg": "jpg"
}

exports.DownloadExtensions = DownloadExtensions

var ShadeType = {
  "None": "None",
  "AFAC": "AFAC",
  "BPD": "BPD"
}

exports.ShadeType = ShadeType