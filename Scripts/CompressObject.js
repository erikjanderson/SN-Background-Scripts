  function compressObject(obj, stack, newObj) {
      if (!newObj) {
          newObj = {};
      }
      for (var property in obj) {
          var type = getType(obj[property]);
          if (type === "object") {

              if (!stack) {
                  compressObject(obj[property], property, newObj)
              } else {
                  compressObject(obj[property], stack + "_" + property, newObj)
              }

          } else if (type === "array") {
              newObj[property] = compressArray(obj[property]);
          } else {

              if (!stack) {
                  newObj[property] = obj[property];
              } else {
                  newObj[stack + "_" + property] = obj[property];
              }
              //gs.info(JSON.stringify(newObj))
          }
      }
      return newObj;
  }

  function compressArray(array) {
      if (array && array.length) {
          var arrayTypes = getType(array[0]);
          if (arrayTypes === "object" || arrayTypes === "array") {
              for (var i = 0; i < array.length; i++) {
                  if (arrayTypes === "object") {
                      array[i] = compressObject(array[i]);
                  } else if (arrayTypes === "array") {
                      array[i] === compressArray(array[i]);
                  }
              }
          }
      }
      return array;
  }

  function getType(property) {
      var type = typeof property;
      if (type === "object") {
          if (!property) {
              return "null"
          } else if (Array.isArray(property)) {
              return "array";
          } else {
              return "object"
          }
      } else {
          return type;
      }
  }

  var obj = {};
  var compressedObj = compressObject(obj);
  gs.info(JSON.stringify(compressedObj));