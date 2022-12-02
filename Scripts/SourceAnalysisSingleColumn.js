/* 
    Title: Source Analysis Builder For Entities
    Author: Erik Anderson
    Description: Scans the transform definition based on a list of entites specified in the entity list array. 
                 Logs out a tab delimited string that can be pasted into an excel sheet.
*/

/////////////////////////////////////
////Script Configuration Settings////
/////////////////////////////////////

//Definition of the parent RTE transform which references all contained entities
var transformDefinitionId = '';

//The max number of rows to search for sample data before giving up
var searchLimit = 100;

//////////////////////////////////////
//////////Processing Logic////////////
//////////////////////////////////////



var reportString = '\nNative File/Table' + '\t' +	'Native Column Header' + '\t' +	'Sample Data' + '\t' +	'NOW Table	NOW Attribute' + '\t' +	'Reference' + '\t' +	'Referenced	Invalid Value Check' + '\t' +	'Transform' + '\t' +	'Comments';
var importEntityId = '';
var importEntityTableName = ''
var importEntityGr = searchForImportEntity();
if(importEntityGr){
    importEntityId = importEntityGr.getUniqueValue();
    importEntityTableName = importEntityGr.getValue('table');
}


var entityList = getTargetEntities();
//gs.info(JSON.stringify(entityList))
for(var i = 0; i <entityList.length; i++){
    var currentEntity = entityList[i];
        var entityGr = getEntity(currentEntity.id)
        var entity = getEntitySourceInfo(entityGr)
        //gs.info(JSON.stringify(entity))
        reportString = reportString + excelReportEntity(entity)
}
gs.info(reportString);


function getTargetEntities(){
    var entityList = [];
    var entityGr = new GlideRecord('cmdb_inst_entity');
    entityGr.addQuery('sys_rte_eb_definition', transformDefinitionId)
    entityGr.addEncodedQuery('table!=NULL^relationship_type=NULL^path!=NULL');
    entityGr.query();
    while (entityGr.next()) {
       entityList.push({
           name: entityGr.getValue('name'),
           id: entityGr.getUniqueValue(),
           table: entityGr.getValue('table'),
       });
    }
    return entityList
}



function getEntitySourceInfo(entityGr) {
    if (entityGr) {
        var entity = {};
        entity.name = entityGr.getValue('name');
        entity.id = entityGr.getUniqueValue();
        entity.table = entityGr.getValue('table');

        entity.fields = getEntityFields(entityGr.getUniqueValue());
        entity.relationships = getEntityRelationships(entityGr.getUniqueValue());
    

        // gs.info(JSON.stringify(entity))
        return entity;
    } else {
        gs.info('No entity Glide Record provided.');
    }
}




function excelReportRelationships(relationships) {
    var relationshipString = '\nRelationships';
    for (var i = 0; i < relationships.length; i++) {
        var relationship = relationships[i];
        var relFields = excelReportFields(relationship.inverseEntityFields);
        relationshipString += relFields;
    }
    return relationshipString;
}


function getEntity(entityId) {
    var entityGr = new GlideRecord('cmdb_inst_entity');
    if (entityGr.get(entityId)) {
        return entityGr;
    }
}

function searchForImportEntity(){
    var entityGr = new GlideRecord('cmdb_inst_entity');
    entityGr.addQuery('sys_rte_eb_definition', transformDefinitionId);
    entityGr.addQuery('name', 'Import');
    entityGr.query();
    if(entityGr.next()){
        return entityGr;
    }
}


function getEntityRelationships(entityId) {
    var returnFields = [];
    if (entityId) {
        var fieldMapsGr = getReferenceFieldMapping(entityId);
        if (fieldMapsGr && fieldMapsGr.hasNext()) {
            while (fieldMapsGr.next()) {
                var entityMap = fieldMapsGr.getValue('sys_rte_eb_entity_mapping');

                var inverseEntity = getInverseFieldMap(entityMap, fieldMapsGr.getUniqueValue());
                if (inverseEntity) {
                    var relationshipType = fieldMapsGr.target_sys_rte_eb_field.sys_rte_eb_entity.relationship_type.getDisplayValue();
                    var field = fieldMapsGr.target_sys_rte_eb_field.field + '';
                    var inverseEntityFields = getEntityFields(inverseEntity, 'source_native_key');
                    var relEntityObj = {
                        relationshipType: relationshipType,
                        field: field,
                        inverseEntityFields: inverseEntityFields
                    }
                    returnFields.push(relEntityObj);

                } else {
                    gs.info('Couldn\'t find an inverse field map for under map id: ' + entityMap);
                }
            }
        } else {
            gs.info('No reference entity maps found.');
        }
    } else {
        gs.info('No entityId provided to the getEntityRelationships function');
    }
    return returnFields;
}

function getInverseFieldMap(entityMapId, notFieldMapId) {
    var entityFieldMapGr = new GlideRecord('sys_rte_eb_field_mapping');
    entityFieldMapGr.addEncodedQuery('sys_rte_eb_entity_mapping.sys_id=' + entityMapId + '^sys_id!=' + notFieldMapId);
    entityFieldMapGr.addQuery('sys_rte_eb_entity_mapping', entityMapId);
    entityFieldMapGr.addQuery('sys_id', '!=', notFieldMapId);
    entityFieldMapGr.query();
    if (entityFieldMapGr.next()) {
        return entityFieldMapGr.getValue('referenced_sys_rte_eb_entity');
    }
}



function getReferenceFieldMapping(entityId) {
    var entityFieldMapGr = new GlideRecord('sys_rte_eb_field_mapping');
    entityFieldMapGr.addQuery('referenced_sys_rte_eb_entity', entityId);
    entityFieldMapGr.query();
    return entityFieldMapGr;
}


function getEntityFields(entityId, fieldName, passThroughOps) {
    var ignoreOps;
    if(Array.isArray(passThroughOps)){
        ignoreOps = true;
    }
    var returnArray = [];
    var fieldGr = new GlideRecord('sys_rte_eb_field');
    fieldGr.addQuery('sys_rte_eb_entity', entityId);
    if(fieldName){
        fieldGr.addQuery('name', fieldName);
    }
    fieldGr.query();
    while (fieldGr.next()) {
        var operations;
        if(!Array.isArray(passThroughOps)){
            operations = [];
        }else{
            operations = passThroughOps
        }
        
        var targetField = {};
        targetField.sourceEntity = fieldGr.sys_rte_eb_entity.getDisplayValue();
        targetField.name = fieldGr.getValue('name');
        targetField.id = fieldGr.getUniqueValue();
        targetField.table = fieldGr.sys_rte_eb_entity.table + '';
        targetField.sourceFields = findSourceEntityFields([targetField.id], operations);
        if(!ignoreOps){
            targetField.operations = operations;
        }
        returnArray.push(targetField);
    }
    return returnArray;
}

function findSourceEntityFields(fieldIds, operations) {
    var sourceFields = [];
    if (fieldIds && fieldIds.length) {
        for (var i = 0; i < fieldIds.length; i++) {  
            var field = getEntityField(fieldIds[i]);
            if (field) {
                if (field.entityId === importEntityId) {
                    field.sampleValue = findExampleValue(field.name);
                    sourceFields.push(field);
                } else {
                    var foundFields = findSourceEntityField(field, operations);
                    if (foundFields) {
                        sourceFields = sourceFields.concat(foundFields);
                    }
                }
            }
        }
    } else {
        gs.info('No field IDs provided')
    }
    return sourceFields;
}




function findSourceEntityField(field, operations) {
    if (field) {
        var operationSourceFields = findSourceOperationField(field, operations);
        if (operationSourceFields && operationSourceFields.length) {
            return findSourceEntityFields(operationSourceFields, operations);
        }
        var entityFieldMapSource = findEntityFieldMapSource(field, operations);
        //gs.info(JSON.stringify(entityFieldMapSource))
        if (entityFieldMapSource) {
            if (Array.isArray(entityFieldMapSource)) {
                return entityFieldMapSource;
            } else {
                return findSourceEntityFields([entityFieldMapSource], operations)
            }

        }
    } else {
        gs.info('No field provided');
    }
}

function findEntityFieldMapSource(field, operations) {
    var fieldMapGr = new GlideRecord('sys_rte_eb_field_mapping');
    fieldMapGr.addQuery('target_sys_rte_eb_field', field.id);
    fieldMapGr.query();
    //target_sys_rte_eb_field.sys_id=1a589059db9720508d736a5f0596199e
    if (fieldMapGr.next()) {
        var sourceId = fieldMapGr.getValue('source_sys_rte_eb_field');
        if (sourceId) {
            return sourceId;
        }
        var referenceEntity = fieldMapGr.getValue('referenced_sys_rte_eb_entity');
        if (referenceEntity) {
            return getEntityFields(referenceEntity, 'source_native_key', operations);
        }
    }

}

function findSourceOperationField(field, operations) {
    var entityOperation = new GlideRecord('sys_rte_eb_operation');
    entityOperation.addQuery('sys_rte_eb_definition', transformDefinitionId);
    entityOperation.addQuery('sys_rte_eb_entity', field.entityId);
    entityOperation.addEncodedQuery('target_sys_rte_eb_field=' + field.id + '^ORtarget_sys_rte_eb_fieldsLIKE' + field.id);
    entityOperation.query();
    if (entityOperation.next()) {
        var operation = {
            name: entityOperation.getValue('name'),
            type: entityOperation.type.getDisplayValue()
        }
        operations.unshift(operation);
        var sourceField = entityOperation.getValue('source_sys_rte_eb_field');
        if (sourceField) {
            return [sourceField];
        }
        var sourceFields = entityOperation.getValue('source_sys_rte_eb_fields');
        if (sourceFields) {
            return sourceFields.split(',');
        }
    }
}

function getEntityField(fieldId) {
    var fieldGr = new GlideRecord('sys_rte_eb_field');
    if (fieldGr.get(fieldId)) {
        var returnObj = {};
        returnObj.name = fieldGr.getValue('name');
        returnObj.id = fieldGr.getUniqueValue();
        returnObj.entityId = fieldGr.getValue('sys_rte_eb_entity');
        return returnObj;
    } else {
        gs.info('Couldnt find an entity field with id: ' + fieldId);
    }
}

function findDictionaryLabel(columnName, tableName) {
    var dictionaryGr = new GlideRecord('sys_dictionary');
    dictionaryGr.addQuery('name', tableName);
    dictionaryGr.addQuery('element', columnName);
    dictionaryGr.query();
    if (dictionaryGr.next()) {
        return dictionaryGr.getValue('column_label');
    } else {
        gs.info('Could not find dictionary record named ' + columnName + ' in table ' + tableName);
    }
}


function flattenObjectClean(object, returnObj, stack) {
    if (!returnObj) {
        returnObj = {};
    }
    var originalStack = stack;
    for (var key in object) {
        if (!originalStack) {
            stack = key.toLowerCase();
        } else {
            stack = originalStack + '_' + key.toLowerCase();
        }
        var element = object[key];
        var type = typeof element;
        if (type === 'object') {
            if (Array.isArray(element)) {
                returnObj[stack + '_json'] = JSON.stringify(element);
            } else {
                returnObj = this.flattenObjectClean(element, returnObj, stack);
            }
        } else {
            returnObj[stack] = element;
        }
    }

    return returnObj;
}



//Excel Report Functions
function excelReportEntity(entity) {
    var reportString = ''
    reportString += '\n' + entity.name;
    var fieldsString = excelReportFields(entity.fields);
    reportString += fieldsString;
    var relationshipString = excelReportRelationships(entity.relationships);
    reportString += relationshipString;
    return reportString;
}

function excelReportFields(entityFields) {
    var reportString = '';
    for (var i = 0; i < entityFields.length; i++) {
        var field = entityFields[i];
        var fieldName = field.name;
        var table = field.table;
       
        var sourceObj = getSourceFieldInfo(field.sourceFields);
        var operations = getOperationInfo(field.operations);

        sourceObj.fields = cleanseFieldsString(sourceObj.fields);
        //build report string line
        reportString += '\n\t' + sourceObj.fields + '\t' + sourceObj.sampleValues + '\t' + table + '\t' + fieldName + '\t' + sourceObj.referenceField + '\t' + sourceObj.referenceTable + '\t\t' + operations;
    }
    return reportString;
}

function getOperationInfo(operations){
    var operationString = '';
    for(var i = 0; i < operations.length; i++){
        if(i === 0){
            operationString = operations[i].type;
        }else{
            operationString += ' & ' + operations[i].type;
        }
    }
    return operationString;
}

function getSourceFieldInfo(sourceFields) {
    var returnObj = {
        fields: '',
        referenceTable: '',
        referenceField: ''
    };
    for (var i = 0; i < sourceFields.length; i++) {
        var sourceField = sourceFields[i];
        if (sourceField.sourceFields) {
            returnObj.referenceTable = sourceField.table;
            returnObj.referenceField = sourceField.name;
            var sourceObj = getSourceFieldInfo(sourceField.sourceFields);
            returnObj.fields = sourceObj.fields;
            returnObj.sampleValues = sourceObj.sampleValues;
        } else {
            if (i === 0) {
                returnObj.sampleValues = sourceField.sampleValue;
                returnObj.fields = sourceField.name;
            } else {
                returnObj.sampleValues += ' & ' + sourceField.sampleValue;
                returnObj.fields += ' & ' + sourceField.name
            }
        }
    }
    return returnObj;
}

function cleanseFieldsString(fields){
    if(fields){
        fields = 'object➛' + fields
        fields = fields.replace(/\&/g, '& object➛');
        fields = fields.replace(/\./g, '➛');
        fields = fields.replace(/\[\*\]/g, '');
    } 
    
    return fields;
}
// End Excel Report Functions

//Start Example Value Search

function findExampleValue(fieldName){
    if(importEntityTableName && fieldName){
        var stagingGr = new GlideRecord(importEntityTableName);
        stagingGr.orderByDesc('sys_created_on');
        stagingGr.query();
        var intCount = 0;
        while(stagingGr.next()){
            if(intCount > searchLimit){
                return;
            }
            intCount++;
            var data = stagingGr.getValue('u_data');
            if(data){
                data = JSON.parse(data);
                var stack = fieldName.split('.');
                var val = findValueInObj(0, stack, data);
                if(!gs.nil(val)){
                    return val;
                }
            }
        }
        //ip_addresses[*].addresses_value
    }
}

function findValueInObj(index, stack, obj){
    var key = stack[index];
    if(key.indexOf('[*]') > -1){
        key = key.replace('[*]', '');
        if(Array.isArray(obj[key])){
            return findValueInArray(index+1, stack, obj[key]);
        }
    }else{
        if(obj[key]){
            if(typeof obj[key] === 'object' && stack[index + 1]){
                findValueInObj(index + 1, stack, obj[key]);
            }else{
                return obj[key];
            }
        }
    }
}

function findValueInArray(index, stack, array){
    if(Array.isArray(array)){
        for(var i = 0; i < array.length; i++){
            var obj = array[i];
            var val = findValueInObj(index, stack, obj);
            if(!gs.nil(val)){
                return val;
            }
        }
    }
}