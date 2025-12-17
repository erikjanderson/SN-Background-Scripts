/**
 * @file Validate Robust Transform CMDB Mappings.js
 * @description Validates RTE (Robust Transform Engine) mappings for ServiceNow CMDB Integrations.
 *              Reviews transform definitions, checks table and field mappings,
 *              validates Configuration Item (CI) population correctness,
 *              and relationship populations as well.
 *              Used for automated QA of connectors to ensure proper data mapping.
 * 
 *              Copy logged out strings and copy them into a csv editor to review and report on the results.
 * @author Erik Anderson
 * @version 1.0
 * @date 2025-12-17
 */
//Gets application Id from the current users session scope
var applicationId = gs.getCurrentApplicationId();

//List of fields to not report on.
var ignoreFields = [
    "source_native_key"
];

//Begin Execution
if (gs.nil(applicationId)) {
    throw "This script cannot run without an application ID being specified.";
}
if (gs.getCurrentScopeName() != "rhino.global"){
    throw "This script needs to run in the Global scope. Make sure to select the Global scope in the background script runner.";
}

var transformDefGr = getTransformDefinitions(applicationId);
var transformDefs = {
    discovery_source: "",
    transforms: [],
};

while (transformDefGr.next()) {
    if (gs.nil(transformDefs.discovery_source) && transformDefGr.getValue("cmdb_inst_application")) {
        transformDefs.discovery_source = transformDefGr.cmdb_inst_application.discovery_source + "";
    }
    var transform = {
        name: transformDefGr.getValue("name"),
        tables: {},
        relationships: {}
    };

    getTargetTables(transformDefGr.getUniqueValue(), transform.tables);
    getTargetRelationships(transformDefGr.getUniqueValue(), transform.relationships);
    transformDefs.transforms.push(transform);
}
getTransformCompleteness(transformDefs)
//gs.info(JSON.stringify(transformDefs));


//Output report as string
var tableResultsStr = reportTransformTableResults(transformDefs);
gs.info("Table Mapping Results")
gs.info(tableResultsStr);
var relationshipResultsStr = reportTransformRelationshipResults(transformDefs);
gs.info("Relationship Mapping Results")
gs.info(relationshipResultsStr);


/**
 * Calculates the completeness of transforms by populating counts for tables, fields, and relationships.
 * @param {Object} transformDefs - The transform definitions object containing discovery source and transforms array.
 */
function getTransformCompleteness(transformDefs) {
    for (var i = 0; i < transformDefs.transforms.length; i++) {
        var transform = transformDefs.transforms[i];
        for (var tableName in transform.tables) {
            var tableMappingObj = transform.tables[tableName];
            var tableCount = getTablePopulation(transformDefs.discovery_source, transform.name, tableName);
            tableMappingObj.table_count = tableCount;
            for (var fieldName in tableMappingObj.fields) {
                var fieldMappingObj = tableMappingObj.fields[fieldName]
                var fieldCount = getTablePopulation(transformDefs.discovery_source, transform.name, tableName, fieldName);
                fieldMappingObj.count = fieldCount;
                fieldMappingObj.ratio = (fieldCount / tableCount)
            }
        }
        for (var relationshipDisplay in transform.relationships) {
            var relationship = transform.relationships[relationshipDisplay];
            var relationshipCount = getRelationshipPopulation(transformDefs.discovery_source, transform.name, relationship.parent, relationship.child, relationship.relationship_type)
            relationship.rel_count = relationshipCount;
        }
    }
}

//RTE Lookup Functions

/**
 * Retrieves the transform definitions for a given application scope.
 * @param {string} applicationScopeId - The sys_id of the application scope.
 * @returns {GlideRecord} The GlideRecord of transform definitions.
 */
function getTransformDefinitions(applicationScopeId) {
    var transformDefGr = new GlideRecord("cmdb_inst_application_feed");
    transformDefGr.addQuery("sys_scope", applicationScopeId);
    transformDefGr.addActiveQuery();
    transformDefGr.query();
    return transformDefGr;
}

/**
 * Populates the tables object with target tables from the entity mappings.
 * @param {string} transformDefSysId - The sys_id of the transform definition.
 * @param {Object} tablesObj - The object to populate with table mappings.
 */
function getTargetTables(transformDefSysId, tablesObj) {
    var entityMappingGr = new GlideRecord('sys_rte_eb_entity_mapping');
    entityMappingGr.addEncodedQuery("target_sys_rte_eb_entity.tableISNOTEMPTY^target_sys_rte_eb_entity.pathISNOTEMPTY");
    entityMappingGr.addQuery("sys_rte_eb_definition", transformDefSysId);
    entityMappingGr.addQuery("ignore", "false");
    entityMappingGr.addQuery("target_sys_rte_eb_entity.table", "!=", "cmdb_rel_ci");
    entityMappingGr.orderBy('order');
    entityMappingGr.query();
    while (entityMappingGr.next()) {
        var targetEntityGr = entityMappingGr.target_sys_rte_eb_entity.getRefRecord();
        var table = targetEntityGr.getValue("table");
        if (gs.nil(tablesObj[table])) {
            tablesObj[table] = {
                table_count: 0,
                identifier: "",
                related_for_table: "",
                lookup_for_table: "",
                fields: {},
            };
            var identifierGr = findIdentifierGr(table);
            if (identifierGr && identifierGr.getValue("applies_to")) {
                tablesObj[table].identifier = identifierGr.getValue("applies_to");
            }
        }
        if (!gs.nil(targetEntityGr.getValue("related_for_entity")) && !gs.nil(targetEntityGr.related_for_entity.table + "")) {
            tablesObj[table].related_for_table = targetEntityGr.related_for_entity.table + "";
            var relatedTableIdentifierGr = findIdentifierGr(tablesObj[table].related_for_table);
            var referenceField = getRelatedTableReference(table, relatedTableIdentifierGr.getValue("applies_to"));
            if (gs.nil(tablesObj[table].fields[referenceField])) {
                tablesObj[table].fields[referenceField] = { count: 0, ratio: 0 };
            }
            //lookup related entry for this table to find the reference field?
        }
        if (!gs.nil(targetEntityGr.getValue("lookup_for_entity")) && !gs.nil(targetEntityGr.lookup_for_entity.table + "")) {
            tablesObj[table].lookup_for_table = targetEntityGr.lookup_for_entity.table + "";
            var lookupReferenceFields = getLookupReferenceColumns(table, tablesObj[table].lookup_for_table)
            if (Array.isArray(lookupReferenceFields)) {
                for (var i = 0; i < lookupReferenceFields.length; i++) {
                    if (gs.nil(tablesObj[table].fields[lookupReferenceFields[i]])) {
                        tablesObj[table].fields[lookupReferenceFields[i]] = { count: 0 };
                    }
                }
            }
        }
        getTargetFields(entityMappingGr.getUniqueValue(), tablesObj[table].fields);
    }
}

/**
 * Populates the field list object with target fields from the field mappings.
 * @param {string} entityMappingSysId - The sys_id of the entity mapping.
 * @param {Object} fieldListObj - The object to populate with field mappings.
 */
function getTargetFields(entityMappingSysId, fieldListObj) {
    var entityFieldMapGr = new GlideRecord('sys_rte_eb_field_mapping');
    entityFieldMapGr.addQuery("sys_rte_eb_entity_mapping", entityMappingSysId);
    entityFieldMapGr.query();
    while (entityFieldMapGr.next()) {
        var targetField = entityFieldMapGr.target_sys_rte_eb_field.field;
        if(ignoreFields.indexOf(targetField.toString()) > -1){
            continue;
        }
        fieldListObj[targetField] = {
            count: 0
        };
    }
}

/**
 * Populates the relationships object with target relationships from the entity mappings.
 * @param {string} transformDefSysId - The sys_id of the transform definition.
 * @param {Object} relObj - The object to populate with relationship mappings.
 */
function getTargetRelationships(transformDefSysId, relObj) {
    var entityMappingGr = new GlideRecord('sys_rte_eb_entity_mapping');
    entityMappingGr.addQuery("sys_rte_eb_definition", transformDefSysId);
    entityMappingGr.addQuery("ignore", "false");
    entityMappingGr.addQuery("target_sys_rte_eb_entity.table", "cmdb_rel_ci");
    entityMappingGr.orderBy('order');
    entityMappingGr.query();
    while (entityMappingGr.next()) {
        if (entityMappingGr.getValue("target_sys_rte_eb_entity") && entityMappingGr.target_sys_rte_eb_entity.relationship_type + "" && entityMappingGr.target_sys_rte_eb_entity.relationship_type.name + "") {
            var relationshipType = entityMappingGr.target_sys_rte_eb_entity.relationship_type.name + "";
            var relationshipMappings = getRelationshipMappings(entityMappingGr.getUniqueValue());
            if (!gs.nil(relationshipMappings.parent) && !gs.nil(relationshipMappings.child)) {
                var relName = relationshipMappings.parent + "<<" + relationshipType + ">>" + relationshipMappings.child;
                if (!relObj[relName]) {
                    relObj[relName] = {
                        rel_count: 0,
                        parent: relationshipMappings.parent,
                        relationship_type: relationshipType,
                        child: relationshipMappings.child
                    };
                }
            }
        }
    }
}

/**
 * Retrieves the parent and child mappings for a relationship.
 * @param {string} entityMappingSysId - The sys_id of the entity mapping.
 * @returns {Object} An object with parent and child table names.
 */
function getRelationshipMappings(entityMappingSysId) {
    var relationshipMappings = {
        parent: "",
        child: ""
    };
    var entityFieldMapGr = new GlideRecord('sys_rte_eb_field_mapping');
    entityFieldMapGr.addQuery("sys_rte_eb_entity_mapping", entityMappingSysId);
    entityFieldMapGr.orderBy('order');
    entityFieldMapGr.query();
    while (entityFieldMapGr.next()) {
        if (entityFieldMapGr.getValue("target_sys_rte_eb_field") && entityFieldMapGr.target_sys_rte_eb_field.field + "") {
            var field = entityFieldMapGr.target_sys_rte_eb_field.field + "";
            if (entityFieldMapGr.getValue("referenced_sys_rte_eb_entity") && entityFieldMapGr.referenced_sys_rte_eb_entity.table + "") {
                relationshipMappings[field] = entityFieldMapGr.referenced_sys_rte_eb_entity.table + "";
            }
        }
    }
    return relationshipMappings;
}

//IRE Component Lookups

/**
 * Finds the reference field for a related table entry.
 * @param {string} relatedTable - The name of the related table.
 * @param {string} hostTable - The name of the host table.
 * @returns {string} The referenced field name.
 */
function getRelatedTableReference(relatedTable, hostTable) {
    var relatedEntryGr = new GlideRecord("cmdb_related_entry");
    relatedEntryGr.addQuery("table", relatedTable);
    relatedEntryGr.addQuery("identifier.applies_to", hostTable);
    relatedEntryGr.query();
    if (relatedEntryGr.next()) {
        return relatedEntryGr.getValue("referenced_field");
    }
}


/**
 * Finds the identifier GlideRecord for a given table.
 * @param {string} tableName - The name of the table.
 * @returns {GlideRecord} The identifier GlideRecord.
 */
function findIdentifierGr(tableName) {
    var tables = j2js(new TableUtils(tableName).getTables());
    var identifier = "";
    for (var i = 0; i < tables.length; i++) {
        var identifierGr = lookupCIIdentifier(tables[i]);
        if (identifierGr) {
            identifier = identifierGr;
            break;
        }
    }
    return identifier;
}

/**
 * Looks up the CI identifier for a given table.
 * @param {string} tableName - The name of the table.
 * @returns {GlideRecord} The identifier GlideRecord if found.
 */
function lookupCIIdentifier(tableName) {
    var identifierGr = new GlideRecord("cmdb_identifier");
    if (identifierGr.get("applies_to", tableName)) {
        return identifierGr;
    }
}

/**
 * Gets the lookup reference columns for a lookup table and host table.
 * @param {string} lookupTable - The name of the lookup table.
 * @param {string} hostTable - The name of the host table.
 * @returns {Array} An array of reference field names.
 */
function getLookupReferenceColumns(lookupTable, hostTable) {
    var elements = [];
    var tables = j2js(new TableUtils(hostTable).getTables());
    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        var dictionaryGr = new GlideRecord("sys_dictionary");
        dictionaryGr.addQuery("reference", table);
        dictionaryGr.addQuery("name", lookupTable);
        dictionaryGr.addQuery('element', '!=', 'duplicate_of');
        dictionaryGr.query();
        while (dictionaryGr.next()) {
            elements.push(dictionaryGr.getValue("element"));
        }
    }
    return elements;
}

//Metric Functions

/**
 * Gets the population count for a table or column from the discovery source.
 * @param {string} source - The discovery source name.
 * @param {string} feed - The source feed name.
 * @param {string} table - The table name.
 * @param {string} column - The column name (optional).
 * @returns {number} The count of populated records.
 */
function getTablePopulation(source, feed, table, column) {
    var tableGa = new GlideAggregate(table);
    tableGa.addEncodedQuery("JOIN" + table + ".sys_id=sys_object_source.target_sys_id!name=" + source);
	tableGa.addEncodedQuery("JOIN" + table + ".sys_id=sys_object_source.target_sys_id!source_feed=" + feed);
    if (!gs.nil(column)) {
        tableGa.addNotNullQuery(column);
    }
    tableGa.addAggregate("COUNT");
    tableGa.query();
    if (tableGa.next()) {
        var count = tableGa.getAggregate("COUNT");
        return parseInt(count);
    }
}

/**
 * Gets the population count for relationships from the discovery source.
 * @param {string} source - The discovery source name.
 * @param {string} feed - The source feed name.
 * @param {string} parentTable - The parent table name.
 * @param {string} childTable - The child table name.
 * @param {string} relType - The relationship type name.
 * @returns {number} The count of relationship records.
 */
function getRelationshipPopulation(source, feed, parentTable, childTable, relType) {
    var parentHierarchy = j2js(new TableUtils(parentTable).getTableExtensions());
    parentHierarchy.push(parentTable);
    var childHierarchy = j2js(new TableUtils(childTable).getTableExtensions());
    childHierarchy.push(childTable);
    var tableGa = new GlideAggregate("cmdb_rel_ci");
    tableGa.addQuery("type.name", relType);
    tableGa.addQuery("parent.sys_class_name", "IN", parentHierarchy);
    tableGa.addQuery("child.sys_class_name", "IN", childHierarchy);
    tableGa.addEncodedQuery("JOINcmdb_rel_ci.parent=sys_object_source.target_sys_id!name=" + source);
	tableGa.addEncodedQuery("JOINcmdb_rel_ci.parent=sys_object_source.target_sys_id!source_feed=" + feed);
    tableGa.addEncodedQuery("JOINcmdb_rel_ci.child=sys_object_source.target_sys_id!name=" + source);
	tableGa.addEncodedQuery("JOINcmdb_rel_ci.child=sys_object_source.target_sys_id!source_feed=" + feed);
    tableGa.addAggregate("COUNT");
    tableGa.query();
    if (tableGa.next()) {
        var count = tableGa.getAggregate("COUNT");
        return parseInt(count);
    }
}
//Report Functions

/**
 * Generates a report string for transform table results.
 * @param {Object} transformDefs - The transform definitions object.
 * @returns {string} The report string.
 */
function reportTransformTableResults(transformDefs) {
    var reportStr = "Transform\tTable\tTable Count\tColumn\tColumn Population Count\tCompleteness";
    for (var i = 0; i < transformDefs.transforms.length; i++) {
        var transform = transformDefs.transforms[i];
        for (var tableName in transform.tables) {
            var tableMappingObj = transform.tables[tableName];
            for (var fieldName in tableMappingObj.fields) {
                var field = tableMappingObj.fields[fieldName];
                reportStr += "\n" + transform.name + "\t" + tableName + "\t" + tableMappingObj.table_count + "\t" + fieldName + "\t" + field.count + "\t" + field.ratio;
            }
        }
    }
    return reportStr;
}

/**
 * Generates a report string for transform relationship results.
 * @param {Object} transformDefs - The transform definitions object.
 * @returns {string} The report string.
 */
function reportTransformRelationshipResults(transformDefs){
    var reportStr = "Transform\tRelationship Type\tParent\tParent Count\tChild\tChild Count\tRelationship Count";
    for (var i = 0; i < transformDefs.transforms.length; i++) {
        var transform = transformDefs.transforms[i];
        for (var relationshipDisplay in transform.relationships) {
            var relationship = transform.relationships[relationshipDisplay];
            var parentTableCount = 0;
            if(!gs.nil(transform.tables) && !gs.nil(transform.tables[relationship.parent]) && !gs.nil(transform.tables[relationship.parent].table_count)){
                parentTableCount = transform.tables[relationship.parent].table_count;
            }
            var childTableCount = 0;
            if(!gs.nil(transform.tables) && !gs.nil(transform.tables[relationship.child]) && !gs.nil(transform.tables[relationship.child].table_count)){
                childTableCount = transform.tables[relationship.child].table_count;
            }
            reportStr += "\n" + transform.name + "\t" + relationship.relationship_type + "\t" + relationship.parent + "\t" + parentTableCount + "\t" + relationship.child + "\t" + childTableCount + "\t" + relationship.rel_count;
        }
    }
    return reportStr;
}