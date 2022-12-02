checkIfImportRunning: function (scheduledJobId, checkExecutionCreateTime) {
    this.importRunning = false;
    this.reason = '';
    this.inactiveThreshold = 30;
    var recentExecutionGr = this._getMostRecentExecution(scheduledJobId);
    if (!recentExecutionGr) {
        return;
    }
    var executionContextId = recentExecutionGr.getValue('execution_context');
    var executionGr = this._getExecutionsFromContext(executionContextId);
    while (executionGr.next()) {
        if (checkExecutionCreateTime) {
            //Check if execution is recent
            var executionGDT = new GlideDateTime(executionGr.getValue('sys_created_on'));
            if (this._isYoung(executionGDT)) {
                this.importRunning = true;
                this.reason = 'The most recent import had executed too recently.';
                break;
            }
        }
        this._checkImportSetProgress(executionGr.getValue('import_set'), executionGr.getValue('table'));
    }
    gs.debug(this.reason);
    return {
        'importRunning': this.importRunning,
        'reason': this.reason
    }
},


_checkImportSetProgress: function (importSetId, table) {
    var importSetGr = this._getImportSets(importSetId, table);
    gs.debug("Import sets to check: " + importSetGr.getRowCount());
    while (importSetGr.next()) {
        var state = importSetGr.getValue('state');
        gs.debug('Import Set' + importSetGr.getDisplayValue() + ' is ' + state);
        if (state === 'loading') {
            var importSetCreatedGDT = new GlideDateTime(importSetGr.getValue('sys_created_on'));
            if (this._isYoung(importSetCreatedGDT)) {
                this.importRunning = true;
                this.reason = 'An import set just started loading new rows.';
                return;
            }
            var importSetRowGr = this._getMostRecentImportSetRow(importSetGr.getUniqueValue());
            if (importSetRowGr) {
                var rowCreatedGDT = new GlideDateTime(importSetRowGr.getValue('sys_created_on'));
                if (this._isYoung(rowCreatedGDT)) {
                    this.importRunning = true;
                    this.reason = 'An import set is still currently loading new data.';
                    return;
                }
            }
        } else {
            var loadCompleteGDT = new GlideDateTime(importSetGr.getValue('load_completed'));
            if (this._isYoung(loadCompleteGDT)) {
                this.importRunning = true;
                this.reason = 'An import set has just completed loading and will begin transforming soon.';
                return;
            }
            var startCount = _getRowAggregateCount(importSetGr.getUniqueValue());
            gs.debug('Import Set Pending Rows startCount ' + startCount)
            this._wait(this.inactiveThreshold);
            var endCount = _getRowAggregateCount(importSetGr.getUniqueValue());
            gs.debug('Import Set Pending Rows endCount ' + endCount)
            if (startCount != endCount) {
                this.importRunning = true;
                reason = 'An import set is currently transforming rows.';
                return;
            }
        }
    }
},

_getImportSets: function (importSetId, table) {
    var importSetGr = new GlideRecord('sys_import_set')
    importSetGr.orderBy('sys_created_on');
    importSetGr.addEncodedQuery('state!=processed^state!=cancelled');
    if (table === 'sys_concurrent_import_set') {
        importSetGr.addQuery('concurrent_import_set', importSetId);
    } else {
        importSetGr.addQuery('sys_id', importSetId);
    }
    importSetGr.query();
    return importSetGr;
},

_getMostRecentImportSetRow: function(importSetId) {
    var importSetRowGr = new GlideRecord('sys_import_set_row');
    importSetRowGr.addQuery('sys_import_set', importSetId);
    importSetRowGr.orderByDesc('sys_created_on');
    importSetRowGr.setLimit(1);
    importSetRowGr.query();
    if (importSetRowGr.next()) {
        return importSetRowGr;
    }
},

_getRowAggregateCount: function(importSetId) {
    var importSetRowGa = new GlideAggregate('sys_import_set_row');
    importSetRowGa.addQuery('sys_import_set', importSetId);
    importSetRowGa.addQuery('sys_import_state', 'pending');
    importSetRowGa.addAggregate('COUNT');
    importSetRowGa.query();
    if (importSetRowGa.next()) {
        var count = importSetRowGa.getAggregate('COUNT');
        return count;
    } else {
        return 0;
    }
},

_getMostRecentExecution: function(scheduledJobId) {
    var executionGr = new GlideRecord('sys_import_set_execution');
    executionGr.addQuery('scheduled_import', scheduledJobId);
    executionGr.orderByDesc('sys_created_on');
    executionGr.setLimit(1);
    executionGr.query();
    if (executionGr.next()) {
        return executionGr;
    }
},

_getExecutionsFromContext: function(executionContextId) {
    var executionGr = new GlideRecord('sys_import_set_execution');
    executionGr.addQuery('execution_context', executionContextId);
    executionGr.orderByDesc('sys_created_on');
    executionGr.query();
    return executionGr
},


_isYoung: function(compareTimeGDT) {
    if (compareTimeGDT) {
        var currentGDT = new GlideDateTime();
        currentGDT.addSeconds(-this.inactiveThreshold);
        var currentTimeNumeric = currentGDT.getNumericValue();
        var compareTimeNumeric = compareTimeGDT.getNumericValue();
        if (currentTimeNumeric < compareTimeNumeric) {
            return true;
        }
    }
    return false;
},

_wait: function(seconds) {
    var ms = seconds * 1000;
    var unixtime_ms = new Date().getTime();
    while (new Date().getTime() < unixtime_ms + ms) { }
},