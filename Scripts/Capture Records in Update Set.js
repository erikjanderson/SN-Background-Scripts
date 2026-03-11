var updateSetName = "Generic Record Capture";
var mainUpdateSetId = "";
var applicationId = gs.getCurrentApplicationId();
//Cascade Capture will automatically step into any reference records and capture those as well and and then again and again.. So use with caution or you could end up capturing the whole instance;..
var cascadeCapture = false;
//If you are using cascade capture, you can set the maximum level of recursion. If left at -1 there will be no limit
var maxLevelOfRecursion = -1

//List of tables you absolutely do not want to capture for any reason. Think of capturing a script include. you do not necessarily want to capture the sys_scope record or plugin record that it references.
var ignoreTables = [
    "sys_user",
    "sys_scope",
    "sys_store_app",
    "sys_app",
    "sys_plugins",
    "sys_package"
]


var updateSetMap = {};
var deltaDate = new GlideDate("2025-08-05")

var failedRecords = [];
var currentScope = ""
var tableCaptures = [
    {
        "table_name": "cmdb_ci_hardware",
        "encoded_query": ""
    }
]


//Create main update set: 
if(!mainUpdateSetId){
    mainUpdateSetId = setUpdateSet(applicationId);
    if (!mainUpdateSetId) {
        throw "main update set could not be created";
    }
}

tableCaptures.forEach(capture => {
    gs.info("Data Capture: Now capturing " + capture.table_name + " records.");
    var recordGr = new GlideRecord(capture.table_name);
    if (capture.encoded_query) {
        recordGr.addEncodedQuery(capture.encoded_query);
    }

    recordGr.query();
    while (recordGr.next()) {
        captureGr(recordGr);
    }
})

gs.info("Failed Records: " + JSON.stringify(failedRecords));

function captureGr(recordGr, recursionLevel) {
    var scope = recordGr.getValue("sys_scope");
    if (!scope) {
        scope = "global";
    }
    if(!recursionLevel){
        recursionLevel = 0;
    }

    var recordClassName = recordGr.getRecordClassName();
    var recordUpdatedOn = new GlideDate(recordGr.getValue("sys_updated_on"))
    if (ignoreTables.indexOf(recordClassName) == -1 && recordUpdatedOn >= deltaDate) {
        setUpdateSet(scope);
        var um = new GlideUpdateManager2();
        try {
            um.saveRecord(recordGr);
        } catch (e) {
            failedRecords.push({
                "table_name": recordClassName,
                "sys_id": recordGr.getUniqueValue()
            });
        }
    }

    if (cascadeCapture && (recursionLevel <= maxLevelOfRecursion || maxLevelOfRecursion == -1)) {
        for (var field in recordGr) {
            var element = recordGr.getElement(field.toString())
            if (!element) {
                continue
            }
            var ed = element.getED();
            if (recordGr.getValue(field) && ed.getInternalType() == "reference") {
                var referenceRecordGr = recordGr[field].getRefRecord();
                if (ignoreTables.indexOf(referenceRecordGr.getRecordClassName()) > -1) {
                    continue;
                }
                var referenceRecordScope = referenceRecordGr.getValue("sys_scope");
                if (!referenceRecordScope) {
                    referenceRecordScope = "global";
                }
                //lookup if the reference has already  been captured and skip. this helps prevent infinite recursion
                var customerUpdateCapture = lookupReferenceCapture(referenceRecordGr.getTableName(), recordGr.getValue(field), referenceRecordScope);
                if (!customerUpdateCapture) {
                    captureGr(referenceRecordGr)
                }
            }
        }
    }
}

function setUpdateSet(scope) {
    if (!updateSetMap[scope]) {
        var updateSetGr = new GlideRecord("sys_update_set");
        if (!mainUpdateSetId) {
            updateSetGr.addQuery("parent", mainUpdateSetId);
        }
        updateSetGr.addQuery("application", scope);
        updateSetGr.query();
        if (!updateSetGr.next()) {
            var scopeGr = getRecord("sys_scope", scope);
            updateSetGr.initialize();
            updateSetGr.name = "(" + scopeGr.getValue("name") + ") PSA Migration Data Capture";
            updateSetGr.parent = mainUpdateSetId;
            updateSetGr.application = scope;
            updateSetGr.insert();
        }
        updateSetMap[scope] = updateSetGr.getUniqueValue();
    }
    if (currentScope != scope) {
        var gus = new GlideUpdateSet();
        gus.set(updateSetMap[scope]);
        currentScope = scope;
    }
    return updateSetMap[scope];
}

function getRecord(table, sysId) {
    var recordGr = new GlideRecord(table);
    if (recordGr.get(sysId)) {
        return recordGr;
    }
}

function lookupReferenceCapture(tableName, sysId, scope) {
    if (!updateSetMap[scope]) {
        return;
    }
    var customerUpdateGr = new GlideRecord("sys_update_xml");
    customerUpdateGr.addQuery("name", tableName + "_" + sysId)
    customerUpdateGr.addQuery("update_set", updateSetMap[scope]);
    customerUpdateGr.setLimit(1);
    customerUpdateGr.query();
    if (customerUpdateGr.next()) {
        return customerUpdateGr;
    }
}