export const translationWithoutTransforms = [
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "user_id",
        "index": 0,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "user_id",
    "chosenType": "number",
    "transforms": [],
    "showColumnTransforms": true
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "first",
        "index": 1,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "first",
    "chosenType": "number",
    "transforms": []
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "second",
        "index": 2,
        "processed": 3,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 3,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        }
      }
    },
    "name": "second",
    "chosenType": "text",
    "transforms": []
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "third",
        "index": 3,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "third",
    "chosenType": "number",
    "transforms": []
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "fourth",
        "index": 4,
        "processed": 3,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 3,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        }
      }
    },
    "name": "fourth",
    "chosenType": "text",
    "transforms": []
  }
];


export const translationWithTransforms = [
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "user_id",
        "index": 0,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "user_id",
    "chosenType": "number",
    "transforms": [
      {
        "type": "title"
      },
      {
        "type": "upper"
      },
      {
        "type": "lower"
      },
      {
        "type": "toStateCode"
      },
      {
        "type": "findReplace",
        "regex": false,
        "findText": "abc",
        "replaceText": "def",
        "caseSensitive": true
      }
    ],
    "showColumnTransforms": true
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "first",
        "index": 1,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "first",
    "chosenType": "number",
    "transforms": []
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "second",
        "index": 2,
        "processed": 3,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 3,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        }
      }
    },
    "name": "second",
    "chosenType": "text",
    "transforms": []
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "third",
        "index": 3,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "third",
    "chosenType": "number",
    "transforms": []
  },
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "fourth",
        "index": 4,
        "processed": 3,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 3,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        }
      }
    },
    "name": "fourth",
    "chosenType": "text",
    "transforms": []
  }
];

export const translationWithCompositeCol = [
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "user_id",
        "index": 0,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "user_id",
    "chosenType": "number",
    "transforms": [],
    "showColumnTransforms": true
  },
  {
    "columnSource": {
      "type": "CompositeColumn",
      components: [
        {
          "name": "first",
          "index": 1,
          "processed": 3,
          "suggestion": "number",
          "types": {
            "number": 3,
            "text": 3,
            "calendar_date": 3,
            "money": 3,
            "percent": 3
          }
        },
        'some constant text',
        {
          "name": "third",
          "index": 3,
          "processed": 3,
          "suggestion": "number",
          "types": {
            "number": 3,
            "text": 3,
            "calendar_date": 3,
            "money": 3,
            "percent": 3
          }
        }
      ]
    },
    "name": "first",
    "chosenType": "number",
    "transforms": []
  }
];


export const translationWithCompositeColAndTransform = [
  {
    "columnSource": {
      "type": "SingleColumn",
      sourceColumn: {
        "name": "user_id",
        "index": 0,
        "processed": 3,
        "suggestion": "number",
        "types": {
          "number": 3,
          "text": 3,
          "calendar_date": 3,
          "money": 3,
          "percent": 3
        }
      }
    },
    "name": "user_id",
    "chosenType": "number",
    "transforms": [],
    "showColumnTransforms": true
  },
  {
    "columnSource": {
      "type": "CompositeColumn",
      components: [
        {
          "name": "first",
          "index": 1,
          "processed": 3,
          "suggestion": "number",
          "types": {
            "number": 3,
            "text": 3,
            "calendar_date": 3,
            "money": 3,
            "percent": 3
          }
        },
        'some constant text',
        {
          "name": "third",
          "index": 3,
          "processed": 3,
          "suggestion": "number",
          "types": {
            "number": 3,
            "text": 3,
            "calendar_date": 3,
            "money": 3,
            "percent": 3
          }
        }
      ]
    },
    "name": "first",
    "chosenType": "number",
    "transforms": [
      {
        "type": "upper"
      }
    ]
  }
];

export const imports2ScanResponse = {
  "fileId" : "1624a924-53cd-47e3-8c6f-7f9df484eba8",
  "summary" : {
    "headers" : 0,
    "columns" : [ {
      "name" : "ID",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Case Number",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Date",
      "processed" : 4999,
      "suggestion" : "calendar_date",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Block",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "IUCR",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 3333,
        "text" : 4999,
        "calendar_date" : 3333,
        "money" : 3333,
        "percent" : 3333
      }
    }, {
      "name" : "Primary Type",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Description",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Location Description",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Arrest",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Domestic",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Beat",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "District",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Ward",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Community Area",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "FBI Code",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 3888,
        "text" : 4999,
        "calendar_date" : 3888,
        "money" : 3888,
        "percent" : 3888
      }
    }, {
      "name" : "X Coordinate",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Y Coordinate",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Year",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Updated On",
      "processed" : 4999,
      "suggestion" : "calendar_date",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 4999,
        "money" : 0,
        "percent" : 0
      }
    }, {
      "name" : "Latitude",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Longitude",
      "processed" : 4999,
      "suggestion" : "number",
      "types" : {
        "number" : 4999,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 4999,
        "percent" : 4999
      }
    }, {
      "name" : "Location",
      "processed" : 4999,
      "suggestion" : "text",
      "types" : {
        "number" : 0,
        "text" : 4999,
        "calendar_date" : 0,
        "money" : 0,
        "percent" : 0
      }
    } ],
    "locations" : [ {
      "latitude" : 19,
      "longitude" : 20
    } ],
    "sample" : [ [ "ID", "Case Number", "Date", "Block", "IUCR", "Primary Type", "Description", "Location Description", "Arrest", "Domestic", "Beat", "District", "Ward", "Community Area", "FBI Code", "X Coordinate", "Y Coordinate", "Year", "Updated On", "Latitude", "Longitude", "Location" ], [ "10376594", "HZ112917", "01/11/2016 11:53:00 PM", "004XX S LARAMIE AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "SIDEWALK", "false", "false", "1522", "015", "29", "25", "03", "1141799", "1897396", "2016", "01/18/2016 03:54:10 PM", "41.874520022", "-87.754846231", "(41.874520022, -87.754846231)" ], [ "10376574", "HZ112920", "01/11/2016 11:45:00 PM", "003XX N CENTRAL AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "STREET", "false", "false", "1523", "015", "28", "25", "03", "1138978", "1901836", "2016", "01/18/2016 03:54:10 PM", "41.886755667", "-87.765095923", "(41.886755667, -87.765095923)" ], [ "10376371", "HZ112605", "01/11/2016 11:30:00 PM", "004XX E 48TH ST", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0223", "002", "3", "38", "07", "1180055", "1873293", "2016", "01/18/2016 03:54:10 PM", "41.807586328", "-87.615127788", "(41.807586328, -87.615127788)" ], [ "10380234", "HZ116304", "01/11/2016 11:30:00 PM", "055XX S CORNELL AVE", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0235", "002", "5", "41", "07", "1188201", "1868688", "2016", "01/18/2016 03:54:10 PM", "41.794759204", "-87.585397931", "(41.794759204, -87.585397931)" ], [ "10375856", "HZ112435", "01/11/2016 11:30:00 PM", "001XX S CENTRAL AVE", "0560", "ASSAULT", "SIMPLE", "RESIDENCE", "false", "false", "1522", "015", "29", "25", "08A", "1139082", "1898717", "2016", "01/18/2016 03:54:10 PM", "41.878194837", "-87.764789883", "(41.878194837, -87.764789883)" ], [ "10375836", "HZ112407", "01/11/2016 11:25:00 PM", "063XX S KEDZIE AVE", "1330", "CRIMINAL TRESPASS", "TO LAND", "DRUG STORE", "false", "false", "0823", "008", "15", "66", "26", "1156143", "1862448", "2016", "01/18/2016 03:54:10 PM", "41.778340981", "-87.703122242", "(41.778340981, -87.703122242)" ], [ "10376791", "HZ112953", "01/11/2016 11:20:00 PM", "004XX W 76TH ST", "031A", "ROBBERY", "ARMED: HANDGUN", "OTHER", "false", "false", "0621", "006", "17", "69", "03", "1174859", "1854542", "2016", "01/18/2016 03:54:10 PM", "41.756249125", "-87.634743877", "(41.756249125, -87.634743877)" ], [ "10375849", "HZ112411", "01/11/2016 11:15:00 PM", "024XX N NARRAGANSETT AVE", "0460", "BATTERY", "SIMPLE", "ATHLETIC CLUB", "false", "false", "2512", "025", "36", "19", "08B", "1133346", "1915440", "2016", "01/18/2016 03:54:10 PM", "41.924187262", "-87.785459395", "(41.924187262, -87.785459395)" ], [ "10376251", "HZ112670", "01/11/2016 11:15:00 PM", "037XX W FLOURNOY ST", "0820", "THEFT", "$500 AND UNDER", "STREET", "false", "false", "1133", "011", "24", "27", "06", "1151652", "1896775", "2016", "01/18/2016 03:54:10 PM", "41.872628006", "-87.718686345", "(41.872628006, -87.718686345)" ], [ "10376594", "HZ112917", "01/11/2016 11:53:00 PM", "004XX S LARAMIE AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "SIDEWALK", "false", "false", "1522", "015", "29", "25", "03", "1141799", "1897396", "2016", "01/18/2016 03:54:10 PM", "41.874520022", "-87.754846231", "(41.874520022, -87.754846231)" ], [ "10376574", "HZ112920", "01/11/2016 11:45:00 PM", "003XX N CENTRAL AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "STREET", "false", "false", "1523", "015", "28", "25", "03", "1138978", "1901836", "2016", "01/18/2016 03:54:10 PM", "41.886755667", "-87.765095923", "(41.886755667, -87.765095923)" ], [ "10376371", "HZ112605", "01/11/2016 11:30:00 PM", "004XX E 48TH ST", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0223", "002", "3", "38", "07", "1180055", "1873293", "2016", "01/18/2016 03:54:10 PM", "41.807586328", "-87.615127788", "(41.807586328, -87.615127788)" ], [ "10380234", "HZ116304", "01/11/2016 11:30:00 PM", "055XX S CORNELL AVE", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0235", "002", "5", "41", "07", "1188201", "1868688", "2016", "01/18/2016 03:54:10 PM", "41.794759204", "-87.585397931", "(41.794759204, -87.585397931)" ], [ "10375856", "HZ112435", "01/11/2016 11:30:00 PM", "001XX S CENTRAL AVE", "0560", "ASSAULT", "SIMPLE", "RESIDENCE", "false", "false", "1522", "015", "29", "25", "08A", "1139082", "1898717", "2016", "01/18/2016 03:54:10 PM", "41.878194837", "-87.764789883", "(41.878194837, -87.764789883)" ], [ "10375836", "HZ112407", "01/11/2016 11:25:00 PM", "063XX S KEDZIE AVE", "1330", "CRIMINAL TRESPASS", "TO LAND", "DRUG STORE", "false", "false", "0823", "008", "15", "66", "26", "1156143", "1862448", "2016", "01/18/2016 03:54:10 PM", "41.778340981", "-87.703122242", "(41.778340981, -87.703122242)" ], [ "10376791", "HZ112953", "01/11/2016 11:20:00 PM", "004XX W 76TH ST", "031A", "ROBBERY", "ARMED: HANDGUN", "OTHER", "false", "false", "0621", "006", "17", "69", "03", "1174859", "1854542", "2016", "01/18/2016 03:54:10 PM", "41.756249125", "-87.634743877", "(41.756249125, -87.634743877)" ], [ "10375849", "HZ112411", "01/11/2016 11:15:00 PM", "024XX N NARRAGANSETT AVE", "0460", "BATTERY", "SIMPLE", "ATHLETIC CLUB", "false", "false", "2512", "025", "36", "19", "08B", "1133346", "1915440", "2016", "01/18/2016 03:54:10 PM", "41.924187262", "-87.785459395", "(41.924187262, -87.785459395)" ], [ "10376251", "HZ112670", "01/11/2016 11:15:00 PM", "037XX W FLOURNOY ST", "0820", "THEFT", "$500 AND UNDER", "STREET", "false", "false", "1133", "011", "24", "27", "06", "1151652", "1896775", "2016", "01/18/2016 03:54:10 PM", "41.872628006", "-87.718686345", "(41.872628006, -87.718686345)" ], [ "10376594", "HZ112917", "01/11/2016 11:53:00 PM", "004XX S LARAMIE AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "SIDEWALK", "false", "false", "1522", "015", "29", "25", "03", "1141799", "1897396", "2016", "01/18/2016 03:54:10 PM", "41.874520022", "-87.754846231", "(41.874520022, -87.754846231)" ], [ "10376574", "HZ112920", "01/11/2016 11:45:00 PM", "003XX N CENTRAL AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "STREET", "false", "false", "1523", "015", "28", "25", "03", "1138978", "1901836", "2016", "01/18/2016 03:54:10 PM", "41.886755667", "-87.765095923", "(41.886755667, -87.765095923)" ], [ "10376371", "HZ112605", "01/11/2016 11:30:00 PM", "004XX E 48TH ST", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0223", "002", "3", "38", "07", "1180055", "1873293", "2016", "01/18/2016 03:54:10 PM", "41.807586328", "-87.615127788", "(41.807586328, -87.615127788)" ], [ "10380234", "HZ116304", "01/11/2016 11:30:00 PM", "055XX S CORNELL AVE", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0235", "002", "5", "41", "07", "1188201", "1868688", "2016", "01/18/2016 03:54:10 PM", "41.794759204", "-87.585397931", "(41.794759204, -87.585397931)" ], [ "10375856", "HZ112435", "01/11/2016 11:30:00 PM", "001XX S CENTRAL AVE", "0560", "ASSAULT", "SIMPLE", "RESIDENCE", "false", "false", "1522", "015", "29", "25", "08A", "1139082", "1898717", "2016", "01/18/2016 03:54:10 PM", "41.878194837", "-87.764789883", "(41.878194837, -87.764789883)" ], [ "10375836", "HZ112407", "01/11/2016 11:25:00 PM", "063XX S KEDZIE AVE", "1330", "CRIMINAL TRESPASS", "TO LAND", "DRUG STORE", "false", "false", "0823", "008", "15", "66", "26", "1156143", "1862448", "2016", "01/18/2016 03:54:10 PM", "41.778340981", "-87.703122242", "(41.778340981, -87.703122242)" ], [ "10376791", "HZ112953", "01/11/2016 11:20:00 PM", "004XX W 76TH ST", "031A", "ROBBERY", "ARMED: HANDGUN", "OTHER", "false", "false", "0621", "006", "17", "69", "03", "1174859", "1854542", "2016", "01/18/2016 03:54:10 PM", "41.756249125", "-87.634743877", "(41.756249125, -87.634743877)" ], [ "10375849", "HZ112411", "01/11/2016 11:15:00 PM", "024XX N NARRAGANSETT AVE", "0460", "BATTERY", "SIMPLE", "ATHLETIC CLUB", "false", "false", "2512", "025", "36", "19", "08B", "1133346", "1915440", "2016", "01/18/2016 03:54:10 PM", "41.924187262", "-87.785459395", "(41.924187262, -87.785459395)" ], [ "10376251", "HZ112670", "01/11/2016 11:15:00 PM", "037XX W FLOURNOY ST", "0820", "THEFT", "$500 AND UNDER", "STREET", "false", "false", "1133", "011", "24", "27", "06", "1151652", "1896775", "2016", "01/18/2016 03:54:10 PM", "41.872628006", "-87.718686345", "(41.872628006, -87.718686345)" ], [ "10376594", "HZ112917", "01/11/2016 11:53:00 PM", "004XX S LARAMIE AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "SIDEWALK", "false", "false", "1522", "015", "29", "25", "03", "1141799", "1897396", "2016", "01/18/2016 03:54:10 PM", "41.874520022", "-87.754846231", "(41.874520022, -87.754846231)" ], [ "10376574", "HZ112920", "01/11/2016 11:45:00 PM", "003XX N CENTRAL AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "STREET", "false", "false", "1523", "015", "28", "25", "03", "1138978", "1901836", "2016", "01/18/2016 03:54:10 PM", "41.886755667", "-87.765095923", "(41.886755667, -87.765095923)" ], [ "10376371", "HZ112605", "01/11/2016 11:30:00 PM", "004XX E 48TH ST", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0223", "002", "3", "38", "07", "1180055", "1873293", "2016", "01/18/2016 03:54:10 PM", "41.807586328", "-87.615127788", "(41.807586328, -87.615127788)" ], [ "10380234", "HZ116304", "01/11/2016 11:30:00 PM", "055XX S CORNELL AVE", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0235", "002", "5", "41", "07", "1188201", "1868688", "2016", "01/18/2016 03:54:10 PM", "41.794759204", "-87.585397931", "(41.794759204, -87.585397931)" ], [ "10375856", "HZ112435", "01/11/2016 11:30:00 PM", "001XX S CENTRAL AVE", "0560", "ASSAULT", "SIMPLE", "RESIDENCE", "false", "false", "1522", "015", "29", "25", "08A", "1139082", "1898717", "2016", "01/18/2016 03:54:10 PM", "41.878194837", "-87.764789883", "(41.878194837, -87.764789883)" ], [ "10375836", "HZ112407", "01/11/2016 11:25:00 PM", "063XX S KEDZIE AVE", "1330", "CRIMINAL TRESPASS", "TO LAND", "DRUG STORE", "false", "false", "0823", "008", "15", "66", "26", "1156143", "1862448", "2016", "01/18/2016 03:54:10 PM", "41.778340981", "-87.703122242", "(41.778340981, -87.703122242)" ], [ "10376791", "HZ112953", "01/11/2016 11:20:00 PM", "004XX W 76TH ST", "031A", "ROBBERY", "ARMED: HANDGUN", "OTHER", "false", "false", "0621", "006", "17", "69", "03", "1174859", "1854542", "2016", "01/18/2016 03:54:10 PM", "41.756249125", "-87.634743877", "(41.756249125, -87.634743877)" ], [ "10375849", "HZ112411", "01/11/2016 11:15:00 PM", "024XX N NARRAGANSETT AVE", "0460", "BATTERY", "SIMPLE", "ATHLETIC CLUB", "false", "false", "2512", "025", "36", "19", "08B", "1133346", "1915440", "2016", "01/18/2016 03:54:10 PM", "41.924187262", "-87.785459395", "(41.924187262, -87.785459395)" ], [ "10376251", "HZ112670", "01/11/2016 11:15:00 PM", "037XX W FLOURNOY ST", "0820", "THEFT", "$500 AND UNDER", "STREET", "false", "false", "1133", "011", "24", "27", "06", "1151652", "1896775", "2016", "01/18/2016 03:54:10 PM", "41.872628006", "-87.718686345", "(41.872628006, -87.718686345)" ], [ "10376594", "HZ112917", "01/11/2016 11:53:00 PM", "004XX S LARAMIE AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "SIDEWALK", "false", "false", "1522", "015", "29", "25", "03", "1141799", "1897396", "2016", "01/18/2016 03:54:10 PM", "41.874520022", "-87.754846231", "(41.874520022, -87.754846231)" ], [ "10376574", "HZ112920", "01/11/2016 11:45:00 PM", "003XX N CENTRAL AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "STREET", "false", "false", "1523", "015", "28", "25", "03", "1138978", "1901836", "2016", "01/18/2016 03:54:10 PM", "41.886755667", "-87.765095923", "(41.886755667, -87.765095923)" ], [ "10376371", "HZ112605", "01/11/2016 11:30:00 PM", "004XX E 48TH ST", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0223", "002", "3", "38", "07", "1180055", "1873293", "2016", "01/18/2016 03:54:10 PM", "41.807586328", "-87.615127788", "(41.807586328, -87.615127788)" ], [ "10380234", "HZ116304", "01/11/2016 11:30:00 PM", "055XX S CORNELL AVE", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0235", "002", "5", "41", "07", "1188201", "1868688", "2016", "01/18/2016 03:54:10 PM", "41.794759204", "-87.585397931", "(41.794759204, -87.585397931)" ], [ "10375856", "HZ112435", "01/11/2016 11:30:00 PM", "001XX S CENTRAL AVE", "0560", "ASSAULT", "SIMPLE", "RESIDENCE", "false", "false", "1522", "015", "29", "25", "08A", "1139082", "1898717", "2016", "01/18/2016 03:54:10 PM", "41.878194837", "-87.764789883", "(41.878194837, -87.764789883)" ], [ "10375836", "HZ112407", "01/11/2016 11:25:00 PM", "063XX S KEDZIE AVE", "1330", "CRIMINAL TRESPASS", "TO LAND", "DRUG STORE", "false", "false", "0823", "008", "15", "66", "26", "1156143", "1862448", "2016", "01/18/2016 03:54:10 PM", "41.778340981", "-87.703122242", "(41.778340981, -87.703122242)" ], [ "10376791", "HZ112953", "01/11/2016 11:20:00 PM", "004XX W 76TH ST", "031A", "ROBBERY", "ARMED: HANDGUN", "OTHER", "false", "false", "0621", "006", "17", "69", "03", "1174859", "1854542", "2016", "01/18/2016 03:54:10 PM", "41.756249125", "-87.634743877", "(41.756249125, -87.634743877)" ], [ "10375849", "HZ112411", "01/11/2016 11:15:00 PM", "024XX N NARRAGANSETT AVE", "0460", "BATTERY", "SIMPLE", "ATHLETIC CLUB", "false", "false", "2512", "025", "36", "19", "08B", "1133346", "1915440", "2016", "01/18/2016 03:54:10 PM", "41.924187262", "-87.785459395", "(41.924187262, -87.785459395)" ], [ "10376251", "HZ112670", "01/11/2016 11:15:00 PM", "037XX W FLOURNOY ST", "0820", "THEFT", "$500 AND UNDER", "STREET", "false", "false", "1133", "011", "24", "27", "06", "1151652", "1896775", "2016", "01/18/2016 03:54:10 PM", "41.872628006", "-87.718686345", "(41.872628006, -87.718686345)" ], [ "10376594", "HZ112917", "01/11/2016 11:53:00 PM", "004XX S LARAMIE AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "SIDEWALK", "false", "false", "1522", "015", "29", "25", "03", "1141799", "1897396", "2016", "01/18/2016 03:54:10 PM", "41.874520022", "-87.754846231", "(41.874520022, -87.754846231)" ], [ "10376574", "HZ112920", "01/11/2016 11:45:00 PM", "003XX N CENTRAL AVE", "031A", "ROBBERY", "ARMED: HANDGUN", "STREET", "false", "false", "1523", "015", "28", "25", "03", "1138978", "1901836", "2016", "01/18/2016 03:54:10 PM", "41.886755667", "-87.765095923", "(41.886755667, -87.765095923)" ], [ "10376371", "HZ112605", "01/11/2016 11:30:00 PM", "004XX E 48TH ST", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0223", "002", "3", "38", "07", "1180055", "1873293", "2016", "01/18/2016 03:54:10 PM", "41.807586328", "-87.615127788", "(41.807586328, -87.615127788)" ], [ "10380234", "HZ116304", "01/11/2016 11:30:00 PM", "055XX S CORNELL AVE", "0910", "MOTOR VEHICLE THEFT", "AUTOMOBILE", "STREET", "false", "false", "0235", "002", "5", "41", "07", "1188201", "1868688", "2016", "01/18/2016 03:54:10 PM", "41.794759204", "-87.585397931", "(41.794759204, -87.585397931)" ] ]
  }
};
