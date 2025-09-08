
/* 
    Title: Distribute Application Menu Module Orders
    Author: Erik Anderson
    Description: Simply evaluates the total number of modules for a specific application menu and re-rders the values evenly based on a specified range.
*/

var minOrder = 0;
var maxOrder = 1000;
var applicationMenuSysId = "";
var encodedQuery="";


if(gs.nil(applicationMenuSysId)){
	throw new Error("applicationMenuSysId is not defined");
}


var menuArray = [];
var appModuleGr = new GlideRecord('sys_app_module');
appModuleGr.addQuery("application", applicationMenuSysId);
if(encodedQuery){
	appModuleGr.addEncodedQuery(encodedQuery);
}
appModuleGr.orderBy('order');
appModuleGr.query();
var rowCount = appModuleGr.getRowCount();
var index = 0;
while (appModuleGr.next()) {
    var newOrderInt = getOrderValue(index, rowCount, minOrder, maxOrder);
	appModuleGr.setValue("order", newOrderInt);
	appModuleGr.update();
	index++;
}


/**
 * Get the evenly distributed order value for one item
 * @param {number} index - The item index (0-based)
 * @param {number} count - Total number of items
 * @param {number} min - The starting value of the range
 * @param {number} max - The ending value of the range
 * @returns {number} The order value (integer)
 */
function getOrderValue(index, count, min, max) {
  if (count <= 0) throw new Error("Count must be greater than 0");
  if (index < 0 || index >= count) throw new Error("Index out of range");

  if (count === 1) return min;

  var step = (max - min) / (count - 1);
  return Math.round(min + step * index);
}