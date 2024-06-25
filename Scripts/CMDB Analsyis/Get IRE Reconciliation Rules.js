/* 
    Title: Get IRE Reconciliation Rules
    Author: Erik Anderson
    Description: Generates a CSV file listing the reconciliation rules for all CMDB sources.
*/

//Reconciliation Definitions



var reconciliationRules= getReconciliationDefinitions();

gs.info(JSON.stringify(reconciliationRules));

// var dynamicRules = getDynamicReconciliationDefinitions()

// gs.info(JSON.stringify(dynamicRules));


function getReconciliationDefinitions() {
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
            attributes = "ALL";
        }
        if (!rules[table]) {
            rules[table] = {}
        }
        if (Array.isArray(attributes)) {
            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                if (!rules[table][attribute]) {
                    rules[table][attribute] = [];
                }
                var updateWithNull = reconciliationDefinitionGr.getValue("null_update");
                if (!gs.nil(updateWithNull)) {
                    updateWithNull.split(",");
                } else {
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
        } else {
            if (!rules[table][attributes]) {
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

    
    _cascadeTableWideRules(rules);
    return rules;
}


function getDynamicReconciliationDefinitions() {
    var dynamicRules = {}
    var dynamicReconciliationDefinitionGr = new GlideRecord("cmdb_dynamic_reconciliation_definition");
    dynamicReconciliationDefinitionGr.query();
    while (dynamicReconciliationDefinitionGr.next()) {
        var table = dynamicReconciliationDefinitionGr.getValue("applies_to");
        if (!dynamicRules[table]) {
            dynamicRules[table] = [];
        }

        var attributes = dynamicReconciliationDefinitionGr.getValue("attributes");
        if (attributes) {
            attributes = attributes.split(',');
        } else {
            attributes = "Invalid";
        }

        if (Array.isArray(attributes)) {
            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                dynamicRules[table].push({
                    "Name": dynamicReconciliationDefinitionGr.getValue("name"),
                    "Applies to": dynamicReconciliationDefinitionGr.getValue("applies_to"),
                    "Rule type": dynamicReconciliationDefinitionGr.getValue("rule_type"),
                    "Attribute": attribute,
                    "Filter condition": dynamicReconciliationDefinitionGr.getValue("condition"),
                    "Active": dynamicReconciliationDefinitionGr.getValue("active") == "1"
                });
            }
        } else {
            dynamicRules[table].push({
                "Name": dynamicReconciliationDefinitionGr.getValue("name"),
                "Applies to": dynamicReconciliationDefinitionGr.getValue("applies_to"),
                "Rule type": dynamicReconciliationDefinitionGr.getValue("rule_type"),
                "Attribute": attributes,
                "Filter condition": dynamicReconciliationDefinitionGr.getValue("condition"),
                "Active": dynamicReconciliationDefinitionGr.getValue("active") == "1"
            });
        }
    }
    return dynamicRules;
}


function _cascadeTableWideRules(reconciliationRules){
    for(var table in reconciliationRules){
        if(reconciliationRules[table]["ALL"] && Object.keys(reconciliationRules[table]).length > 1){
            for (var i = 0; i < reconciliationRules[table]["ALL"].length; i++){
                var allAttributeRule = reconciliationRules[table]["ALL"][i];

                for(var attribute in reconciliationRules[table]){
                    if(attribute === "ALL"){
                        continue;
                    }
                    reconciliationRules[table][attribute].push(allAttributeRule);

                    reconciliationRules[table][attribute].sort((a, b) => a.Priority - b.Priority);
                }
            }
        }
    }
}