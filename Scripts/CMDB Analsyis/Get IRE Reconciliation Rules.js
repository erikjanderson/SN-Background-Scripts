/* 
    Title: Get IRE Reconciliation Rules
    Author: Erik Anderson
    Description: Generates a CSV file listing the reconciliation rules for all CMDB sources.
*/

//Reconciliation Definitions

var rules = {};

var reconciliationDefinitionGr = new GlideRecord('cmdb_reconciliation_definition');
reconciliationDefinitionGr.orderBy('priority');
reconciliationDefinitionGr.query();
while (reconciliationDefinitionGr.next()) {
    var table = reconciliationDefinitionGr.getValue("applies_to");
    var attributes = reconciliationDefinitionGr.getValue("attributes");
    if (attributes) {
        attributes = attributes.split(',');
    } else {
        attributes = "All";
    }
    if (!rules[table]) {
        rules[table] = {}
    }
    if(Array.isArray(attributes)){
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            if(!rules[table][attribute]){
                rules[table][attribute] = [];
            }
            var updateWithNull = reconciliationDefinitionGr.getValue("null_update");
            if(!gs.nil(updateWithNull)){
                updateWithNull.split(",");
            }else{
                updateWithNull = [];
            }
            rules[table][attributes].push({
                "Priority": parseInt(reconciliationDefinitionGr.getValue("priority")),
                "Data source": reconciliationDefinitionGr.getValue("discovery_source"),
                "Applies to": table,
                "Attribute": attribute,
                "Update with null": updateWithNull.indexOf(attribute) > -1,
                "Filter condition": reconciliationDefinitionGr.getValue("condition") || "",
                "Active": reconciliationDefinitionGr.getValue("active") == "1"
            });
        }
    }else{
        if(!rules[table][attributes]){
            rules[table][attributes] = [];
        }

        rules[table][attributes].push({
            "Priority": parseInt(reconciliationDefinitionGr.getValue("priority")),
            "Data source": reconciliationDefinitionGr.getValue("discovery_source"),
            "Applies to": table,
            "Attribute": attributes,
            "Update with null": false,
            "Filter condition": reconciliationDefinitionGr.getValue("condition") || "",
            "Active": reconciliationDefinitionGr.getValue("active") == "1"
        });
        
    }
}

gs.info(JSON.stringify(rules))


