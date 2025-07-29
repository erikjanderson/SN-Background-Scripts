var appId = gs.getCurrentApplicationId(); //Gets the current application your user session is in (regardless of what app scope this script runs in)
//var appId = 'custom_app_id';
var versionOverride = '';

var appGr = new GlideRecord('sys_app');
if (appGr.get(appId)) {
    var changedFiles = getChangedRecords(appGr, versionOverride);
    result = reportChangedFiles(changedFiles);
    //result = generateCSVReport(changedFiles, appGr, versionOverride);
    gs.info(result);
}

function reportChangedFiles(changedFiles) {
    var reportString = "Updated On\tDisplay\tTable\tState\tRecord\tPrevious Version\tCompare";
    for (var i = 0; i < changedFiles.length; i++) {
        var file = changedFiles[i];
        var compareLink = '';
        if (file.versionSysId) {
            compareLink = generateLink('/merge_form_current_version.do?sysparm_version_id=' + file.versionSysId);
        }
        reportString += "\n" + file.updated + "\t" + file.display + "\t" + file.table + "\t" + file.state + "\t" + generateLink(file.link) + "\t" + generateLink(file.previousVersion) + "\t" + compareLink;
    }
    return reportString;
}

function generateCSVReport(changedFiles, appGr, versionOverride) {
    var csv = new DevOperationCSV();
    csv.addHeader('Updated On', 'Display', 'Table', 'State', 'Record', 'Previous Version', 'Compare');
    for (var i = 0; i < changedFiles.length; i++) {
        var file = changedFiles[i];
        var row = csv.addRow();
        row['Updated On'] = file.updated + '';
        row['Display'] = file.display;
        row['Table'] = file.table;
        row['State'] = file.state;
        row['Record'] = generateLink(file.link);
        row['Previous Version'] = generateLink(file.previousVersion);
        var compareLink = '';
		//=IF(H2<>"",(HYPERLINK(H2,"Record")), "")
        if (file.versionSysId) {
            compareLink = generateLink('/merge_form_current_version.do?sysparm_version_id=' + file.versionSysId);
        }
        row['Compare'] = compareLink;
    }

    csv.build();
    var version = appGr.getValue('version');
    if (versionOverride) {
        version = versionOverride;
    }
    var fileName = appGr.getValue('name') + ' Changes Since ' + version;
    return csv.createAttachment(fileName);

}

function generateLink(url) {
    if (url) {
        return gs.getProperty('glide.servlet.uri') + 'nav_to.do?uri=/' + url;
    } else {
        return '';
    }

}

function getChangedAppFiles(versionCreateGdt, appGr) {
    var serializer = new GlideRecordXMLSerializer();
    var changedFiles = [];
    if (!versionCreateGdt || !appGr) {
        gs.info('No versionCreateGdt or appGr was specified');
        return false;
    }
    var metadataGr = new GlideRecord('sys_metadata');
    metadataGr.addQuery('sys_scope', appGr.getUniqueValue());
    metadataGr.addQuery('sys_updated_on', '>=', versionCreateGdt);
    metadataGr.orderByDesc('sys_updated_on');
    metadataGr.query();
	gs.info("Potentially Changed Files: " + metadataGr.getRowCount());
    while (metadataGr.next()) {
        var tableName = metadataGr.getValue('sys_class_name');
        var recordGr = new GlideRecord(tableName);
        if (recordGr.get(metadataGr.getUniqueValue())) {
            var current = {};
            var currentPayload = serializer.serialize(recordGr) + '';
            var isDeleted = false;
            if (tableName === 'sys_metadata_delete') {
				tableName = recordGr.getValue('sys_db_object');
                if (recordGr.sys_audit_delete) {
                    currentPayload = recordGr.sys_audit_delete.payload + '';
                } else if (recordGr.sys_update_version) {
                    currentPayload = recordGr.sys_update_version.payload + '';
                }
                isDeleted = true;
            }
            currentPayload = currentPayload.replace(/&#13;/g, '\r');
            currentPayload = gs.xmlToJSON(currentPayload);
            currentPayload = getPrimaryObject(currentPayload, tableName);
            if (isDeleted && new GlideDateTime(currentPayload.sys_created_on) > versionCreateGdt) {
                continue;
            }
            current.display = currentPayload.sys_name;
            current.table = currentPayload.sys_class_name;

            current.link = recordGr.getLink();
            var updatedOnGdt = new GlideDateTime(recordGr.getValue('sys_updated_on'));
            current.updated = updatedOnGdt.getDisplayValue();
            var createdOnGdt = new GlideDateTime(currentPayload.sys_created_on);
            if (createdOnGdt > versionCreateGdt && isDeleted) {
                continue;
            } else if (createdOnGdt > versionCreateGdt) {
                current.state = 'NEW';
            } else if (isDeleted) {
                current.state = 'DELETE';
            } else {
                current.state = 'UPDATE';
                var versionGr = getPreviousVersion(tableName, recordGr.getUniqueValue(), versionCreateGdt);
                if (versionGr) {
                    current.versionSysId = versionGr.getUniqueValue();
                    current.previousVersion = versionGr.getLink();
                    var prevPayload = versionGr.getValue('payload');
                    prevPayload = prevPayload.replace(/&#13;/g, '\r');
                    prevPayload = gs.xmlToJSON(prevPayload);
                    prevPayload = getPrimaryObject(prevPayload, tableName);
                    var changedFields = findChangedFields(currentPayload, prevPayload);
                    if (changedFields.length > 0) {
                        current.state = 'UPDATE';
                    } else {
                        current.state = 'UPDATE_NO_CHANGE';
                    }
                    current.changedFields = changedFields;
                }
            }
            changedFiles.push(current);
        }
    }
    return changedFiles;
}

function findChangedFields(currentPayload, prevPayload) {
    var changedFields = [];
    if (!currentPayload || !prevPayload) {
        return changedFields;
    }
    for (var key in currentPayload) {
        if (key.startsWith('sys_')) {
            continue;
        }

        var prevValue = prevPayload[key];
        var currentValue = currentPayload[key];
        if (typeof currentValue === 'object' && currentValue.content) {
            currentValue = currentValue.content;
            prevValue = prevValue.content;
        }

        if (currentValue != prevValue) {
            changedFields.push({
                "field": key,
                "prevValue": prevValue,
                "currentValue": currentValue
            });
        }
    }
    return changedFields;
}

function getChangedRecords(appGr, versionOverride) {
    var updatedOn = getLastAppVersion(appGr, versionOverride);
    var version = appGr.getValue('version');
    gs.info('Version: ' + version);
    gs.info('Version Create Time: ' + updatedOn);
    return getChangedAppFiles(updatedOn, appGr);
}


function getPreviousVersion(table, sysId, versionCreateGdt) {
    var versionGr = new GlideRecord('sys_update_version');
    versionGr.addQuery('name', table + '_' + sysId);
    versionGr.addQuery('sys_created_on', '<=', versionCreateGdt);
    versionGr.orderByDesc('sys_created_on');
    versionGr.query();
    if (versionGr.next()) {
        return versionGr;
    }
}

function getLastAppVersion(appGr, versionOverride) {
    var currentVersion = appGr.getValue('version');
    if (versionOverride) {
        currentVersion = versionOverride;
    }
    var versionGr = getVersions('sys_app', appGr.getUniqueValue());
    var lastSysUpdatedOn;
    var trace = false;
	var versionList = [];
    while (versionGr.next()) {
        var xml = versionGr.getValue('payload');
        var versionObj = getObj(xml);
        if (versionObj) {
            var oldVersion = versionObj.version;
			if(versionList.indexOf(oldVersion) == -1){
				versionList.push(oldVersion);
			}
            if (oldVersion == currentVersion) {
                trace = true;
            }
            if (currentVersion != oldVersion && trace === true) {
                trace = false;
            } else if(trace === true){
                lastSysUpdatedOn = versionObj.sys_updated_on;
            }
        }
    }
	gs.info("Version List: " + JSON.stringify(versionList))
    return lastSysUpdatedOn;
}

function getVersions(table, sysId) {
    var versionGr = new GlideRecord('sys_update_version');
    versionGr.addQuery('name', table + '_' + sysId);
    versionGr.orderByDesc('sys_recorded_at');
    versionGr.query();
    return versionGr;
}

function getObj(xml) {
    var helper = new XMLHelper(xml);
    var obj = helper.toObject();
    var table = obj['@table'];
    if (table) {
        return obj[table];
    }
}

function getPrimaryObject(currentPayload, tableName) {
    var keys = Object.keys(currentPayload);
    currentPayload = currentPayload[keys[0]];
    if (keys[0] === 'record_update') {
		return getSubObject(currentPayload, tableName);
    } else {
        return currentPayload;
    }
}

function getSubObject(currentPayload, tableName){
	if (currentPayload[tableName]) {
		currentPayload = currentPayload[tableName];
		
		if(Array.isArray(currentPayload)){
			return currentPayload[currentPayload.length - 1];
		}
		
		if(!currentPayload.sys_created_on){
			return getSubObject(currentPayload, tableName);
		}else{
			return currentPayload;
		}
	} else {try{
		keys = Object.keys(currentPayload);
		return getSubObject(currentPayload[keys[0]], tableName);
	}catch(e){
		gs.info('ERROR: ' + tableName + currentPayload);
	}
		
	}
}


