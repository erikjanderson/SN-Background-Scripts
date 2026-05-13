/**
 * Retrieves all variables from a task record and outputs them as JSON
 * Handles both single-value variables and multi-row variable sets
 */
var taskSysId = "";

var taskGr = new GlideRecord("task");
if (taskGr.get(taskSysId)) {
	var obj = {};
	var variables = taskGr.variables.getElements(true);
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];
		if (variable.isMultiRow()) {
			var variableSet = variable.getED().getName();
			obj[variableSet] = [];
			var rows = variable.getRows();
			for (var j = 0; j < variable.getRowCount(); j++) {
				var rowObj = {};
				var row = rows[j];
				var cells = row.getCells();
				for (var k = 0; k < cells.length; k++) {
					var cell = cells[k];
					rowObj[cell.getED().getName()] = cell.getCellDisplayValue();
				}
				obj[variableSet].push(rowObj);
			}
		} else {
			var question = variable.getQuestion();
			obj[variable.getED().getName()] = question.getValue();
		}
	}
	gs.info(JSON.stringify(obj));
}
