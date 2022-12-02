/* 
    Title: Source Analysis Relationship Builder
    Author: Erik Anderson
    Description: Specify a transform definition and the script will go through all realationship entities and report a list of all relationships from different entities.
                 This is helpful for the summary page of the Source Analysis.
*/

var transformDefinitionId = ""
var relationships = getRelationshipInfo(transformDefinitionId);
//gs.info(JSON.stringify(relationships))

excelReport(relationships)


function getRelationshipInfo(definitionId){
    var returnArray = [];
    var grCIE = new GlideRecord('cmdb_inst_entity');
    grCIE.addEncodedQuery("relationship_type!=NULL");
    grCIE.addQuery("sys_rte_eb_definition", definitionId)
    grCIE.query();
    while (grCIE.next()) {
        var relationshipType = grCIE.relationship_type.getDisplayValue();
        var sys_id = grCIE.getUniqueValue();

        var fields = getEntityFields(sys_id);
        if(fields){
            fields.relationship_type = relationshipType;
        }
        returnArray.push(fields);
    }
    return returnArray;
}


function getEntityFields(entityId){

    var returnItem = {};
    var grSREF = new GlideRecord('sys_rte_eb_field');
    grSREF.addQuery("sys_rte_eb_entity", entityId)
    grSREF.query();
    while (grSREF.next()) {
        var field = grSREF.getValue("field");
        var entityFieldMappingGr =  getFieldMapping(grSREF.getUniqueValue());
        if(entityFieldMappingGr){

            var entityName = entityFieldMappingGr.referenced_sys_rte_eb_entity.getDisplayValue();
            entityName += " [" + entityFieldMappingGr.referenced_sys_rte_eb_entity.table + "]"
            returnItem[field] = entityName
        }
    }
    return returnItem;
}


function getFieldMapping(entityFieldId){
    var grSREFM  = new GlideRecord("sys_rte_eb_field_mapping");
    if(grSREFM.get("target_sys_rte_eb_field", entityFieldId)){
        return grSREFM;
    }
}


function getTableLabel(tableName){
    var tableGr = new GlideRecord('sys_db_object');
    tableGr.addQuery('name', tableName);
    tableGr.query();
    if(tableGr.next()){
        var displayName = tableGr.getValue('label');
        return displayName;
    }
}

function excelReport(relArray){
    var str = ""
    for(var i =  0; i < relArray.length; i++){
        var relationship = relArray[i];
        str += "\n" + relationship.parent + "\t" + relationship.child + "\t" + relationship.relationship_type;
    }
    gs.info(str)
}



