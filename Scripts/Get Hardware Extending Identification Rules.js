/* 
    Title: Get Hardware Extending Identification Rules.
    Author: Erik Anderson
    Description: Query the cmdb_identifier table to get a list of all tables under the hardware hierarch that have their own identifiers and therefore override the base hardware rules.
*/


var identifierTables = [];

var cmdbIdentifierGr = new GlideRecord('cmdb_identifier');
cmdbIdentifierGr.addEncodedQuery("active=true");
cmdbIdentifierGr.query();
while (cmdbIdentifierGr.next()) {
    var appliesTo = cmdbIdentifierGr.getValue('applies_to');
    var tableUtil = new TableUtils(appliesTo);
        var tableArrayList = tableUtil.getTables();
        if(tableArrayList.indexOf("cmdb_ci_hardware") > -1){
            identifierTables.push(appliesTo)
        }
}

gs.info(JSON.stringify(identifierTables))
