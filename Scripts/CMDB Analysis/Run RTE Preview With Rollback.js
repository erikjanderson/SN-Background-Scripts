/**
 * Run RTE Preview With Rollback
 *
 * Executes a preview of a Robust Transform Engine (RTE) transformation for an import set,
 * capturing rollback context and import run details. Allows for testing transformations
 * before committing them to the target table.
 *
 * Requires the IntegrationHub ETL plugin to be installed
 */

var importSetSysId = "c2e6cbb1c3ab7a50fac7fb377d013188";
var encodedQuery = "";
var maxRows = -1;

var importSetGr = getImportSetGr(importSetSysId);
if (!importSetGr) {
	throw "Could not find import set with sys_id " + importSetSysId;
}
var tableName = importSetGr.getValue("table_name");
var rteDefinitionSysId = getRTEDefinitionSysId(tableName);
if (!rteDefinitionSysId) {
	throw "Missing No RTE Definition Associated to this Import Set";
}

var previewResult = sn_integration_studio.IntegrationStudioScriptableApi.preview(
	importSetGr.getUniqueValue(),
	rteDefinitionSysId,
	encodedQuery,
	maxRows
);
if (previewResult) {
	previewResult = JSON.parse(previewResult);
	if (previewResult && previewResult.rollbackContextId && previewResult.importSetRunId) {
		gs.info(
			"Import Completed\nImport Set Run: " +
				previewResult.importSetRunId +
				"\nRollback Context ID: " +
				previewResult.rollbackContextId
		);
	}
}

function getImportSetGr(importSetSysId) {
	var importSetGr = new GlideRecord("sys_import_set");
	if (importSetGr.get(importSetSysId)) {
		return importSetGr;
	}
}

function getRTEDefinitionSysId(stagingTable) {
	var robustImportSetTransformGr = new GlideRecord("sys_robust_import_set_transformer");
	robustImportSetTransformGr.addQuery("source_table", stagingTable);
	robustImportSetTransformGr.addActiveQuery();
	robustImportSetTransformGr.setLimit(1);
	robustImportSetTransformGr.query();
	if (robustImportSetTransformGr.next()) {
		var rteDefinitionSysId = robustImportSetTransformGr.getValue("robust_transform_engine");
		return rteDefinitionSysId;
	}
}
