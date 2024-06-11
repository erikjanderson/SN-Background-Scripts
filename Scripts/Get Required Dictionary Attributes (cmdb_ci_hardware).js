/* 
    Title: Get Required Dictionary Attributes (cmdb_ci_hardware)
    Author: Erik Anderson
    Description: lists out all required sys_dictionary attributes in the CMDB that are part of the hardware hierarchy
    CMDB integrations using the IRE will sometimes fail due to required attributes and this will help surface them more easily.
*/


var returnArray = [];
var dictionaryGr = new GlideRecord('sys_dictionary');
dictionaryGr.addEncodedQuery("nameSTARTSWITHcmdb_ci^mandatory=true");
dictionaryGr.query();
while (dictionaryGr.next()) {
    var td = GlideTableDescriptor.get(dictionaryGr.getValue("name"));
	var ed = td.getElementDescriptor(dictionaryGr.getValue("element"));
	if (ed == null || ed.isFirstTableName()) {
        var tableUtil = new TableUtils(dictionaryGr.getValue("name"));
        var tableArrayList = tableUtil.getTables();
        if(tableArrayList.indexOf("cmdb_ci_hardware") > -1){
            returnArray.push({
                "table_name": dictionaryGr.getValue("name"),
                "column": dictionaryGr.getValue("element")
            })
        }
        
	}
}

gs.info(JSON.stringify(returnArray))
