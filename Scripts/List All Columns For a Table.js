var targetTable = "";

var reportStr = "";
var reportColumns = ["column_label", "element", "internal_type", "reference"];
reportColumns.forEach((col, index) => {
	if (index > 0) {
		reportStr += "\t";
	}
	reportStr += col;
});
var tableAncestors = SNC.TableEditor.getTableAncestors("sam_vul_sw_m2m_disc_model");
var dictionaryGr = new GlideRecord("sys_dictionary");
var tableAncestors = ["sam_vul_sw_m2m_disc_model"];
dictionaryGr.addQuery("name", "ONE IN", tableAncestors);
dictionaryGr.addQuery("element", "!=", "NULL");
dictionaryGr.addEncodedQuery("elementNOT LIKEsys_");
dictionaryGr.query();
while (dictionaryGr.next()) {
	reportStr += "\n";
	reportColumns.forEach((col, index) => {
		if (index > 0) {
			reportStr += "\t";
		}
		reportStr += dictionaryGr[col].getDisplayValue();
	});
}
gs.info(reportStr);
