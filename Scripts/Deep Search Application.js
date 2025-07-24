/* 
	Title: Deep search application
	Author: Erik Anderson
	Description: Searches an applications metadata files and scans each column for a loose match on a search phrase.
*/
var applicationId = gs.getCurrentApplicationId(); //Gets the current application your user session is in (regardless of what app scope this script runs in)
//var applicationId = '';
var searchPhrase = "";

var outputString = "";
var resultCounts = 0;

gs.info("Searching Scope: " + applicationId + " for containments of " + searchPhrase);
run(applicationId, searchPhrase);
gs.info(outputString);
gs.info("Search Completed found " + resultCounts + " matching records.");


function run(scope, search) {
	search = search.toLowerCase();
	var gr = new GlideRecord('sys_metadata');
	gr.addQuery('sys_scope', scope);
	gr.query();
	while (gr.next()) {
		var foundInRecord = false;
		var table = gr.sys_class_name + '';
		var acutalRecord = getAcutalRecord(gr.getUniqueValue(), table);
		for (var key in acutalRecord) {
			if (acutalRecord.getValue(key) && acutalRecord.getValue(key).toLowerCase().indexOf(search) > -1) {
				if (!foundInRecord) {
					resultCounts++;
					outputString += "\n\n" + table + " :: " +gr.getDisplayValue() + '\r\t' + gr.getUniqueValue() + '\n\t' + acutalRecord.getLink();
					foundInRecord = true;
				}
				outputString += "\n\t" + key;
			}
		}
	}
}

//Gets the glide record for a specific table vs the sys_metadata table;
function getAcutalRecord(sysId, table) {
	var gr = new GlideRecord(table);
	if (gr.get(sysId)) {
		return gr;
	}
}
