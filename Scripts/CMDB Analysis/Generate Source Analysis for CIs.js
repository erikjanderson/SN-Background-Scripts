/*
    Title: Generate Source Analysis for CIs
    Author: Erik Anderson
    Description: Analyzes a CI to determine which source(s) contributed to its creation. 
    If verbose transformation is turned on, it will also be able to identify the staging rows that mapped to this CI.
*/

var CSV = Class.create();
CSV.prototype = {
	initialize: function () {
		this.headers = [];
		this.rows = [];
		this.data = '';
	},

	addHeader: function () {
		for(var i = 0; i < arguments.length; i++){
			var name = arguments[i];
			if (this.headers.indexOf(name) < 0) {
				this.headers.push(name);
			}
		}
	},

	addRow: function (obj) {
		var row = {};
		for (var i = 0; i < this.headers.length; i++) {
			var header = this.headers[i];
			if (obj && !gs.nil(obj[header])) {
				row[header] = obj[header];
			} else if(!gs.nil(arguments[i]) && typeof arguments[i] != 'object'){
				row[header] = arguments[i];
			} else {
				row[header] = '';
			}
		}
		this.rows.push(row);
		return this.rows[this.rows.length - 1];
	},

	build: function () {
		this.data = '';
		var headerAdded = false;
		//Add Headers
		if(this.headers.length > 0){
			this.data = this._buildHeaderString();
			headerAdded = true;
		}
		//Add Body
		this.data += this._buildBodyString(headerAdded);
		return this.data;
	},

	buildDisplay: function(){
		var headerAdded = false;
		this.data = '';
		//Add Headers
		for (var i = 0; i < this.headers.length; i++) {
			headerAdded = true;
			var header = this.headers[i];
			if(i > 0){
				this.data += '\t';
			}
			this.data += header;
		}

		for(var r = 0; r < this.rows.length; r++ ){
			var row = this.rows[r];
			var rowString = '';
			if(headerAdded || r > 0){
				rowString += '\n';
			}
			var first = true;
			for(var key in row){
				if(!first){
					rowString += '\t';
				}
				first =false;
				rowString += row[key] || ''
			}
			this.data += rowString;
		}
		return this.data;
	},

	createAttachment: function(name, gr){
		var attachment = new GlideSysAttachment();

		if(!gr){
			gr = this._createPollRecord();
		}

		var fileName = name;
		if(!fileName){
			fileName = gr.getDisplayValue();
		}
		if(!fileName){
			fileName = gr.getUniqueValue() + '-' + new GlideDateTime().getDisplayValue();
		}

		var sysId = attachment.write(gr, fileName + '.csv', 'text/csv', this.data);
		if(sysId){
			var attachmentGr = new GlideRecord('sys_attachment');
			if(attachmentGr.get(sysId)){
				return attachmentGr;
			}
		}
	},



	//Internal Functions

	_buildHeaderString: function () {
		var headerStr = '';
		for (var i = 0; i < this.headers.length; i++) {
			var header = this.headers[i];
			var cell = this._buildCell(header);
			if (!headerStr) {
				headerStr = cell;
			} else {
				headerStr += ',' + cell; 
			}
		}
		return headerStr;
	},

	_buildBodyString: function(headerAdded){
		var bodyStr = '';
		for(var i = 0; i < this.rows.length; i++){
			var row = this.rows[i];
			var rowString = '';
			if(headerAdded || i > 0){
				rowString += '\n';
			}
			if(headerAdded){
				rowString += this._buildRowString(row);
			}else{
				rowString += this._buildRowStringWithoutHeader(row);
			}
			bodyStr += rowString;
		}
		return bodyStr;
	},

	_buildRowString: function(row){
		var rowString = '';
		for (var i = 0; i < this.headers.length; i++) {
			var header = this.headers[i];
			var cell = this._buildCell((row[header]));
			if(i > 0){
				rowString += ',';
			}
			rowString += cell;
		}
		return rowString;
	},


	_buildRowStringWithoutHeader: function(row){
		var rowString = '';
		for(var key in row){
			var cell = this._buildCell((row[key]));
			if(rowString){
				rowString += ',';
			}
			rowString += cell;
		}
		return rowString;
	},

	_buildCell: function(val){
        if(gs.nil(val)){
            val = "";
        }
		if(typeof val === 'object'){
			val = JSON.stringify(val);
		}
		if(typeof val === 'string'){
			val = val.replace(/"/g, '""');
		}
		val = '"' + val + '"';
		return val;
	},

	_createPollRecord: function(){
		var pollGr = new GlideRecord('sys_poll');
		pollGr.initialize();
		pollGr.session_id = gs.getSessionID();
		pollGr.session_user = gs.getUserID();
		pollGr.state = 'complete';
		pollGr.max = '0';
		pollGr.current = '0';
		pollGr.message = 'Created by the Developer Operations CSV Script include.';
		pollGr.insert();
		return pollGr;
	},


	type: 'CSV'
};

var csv = new CSV();
csv.addHeader("Configuration item", "Class", "Discovery source", "ID", "Last scan", "Staging table", "Row Id")
var ciGr = new GlideRecord("cmdb_ci");
ciGr.addEncodedQuery("discovery_source=SG-Example");
ciGr.query();
while(ciGr.next()){
    var ciSources = getSources(ciGr);
    for(var i = 0; i < ciSources.length; i++){
        var rowObj = {"Configuration item": "","Discovery source": "","ID": "","Last scan": "","Staging table": "","Row Id": ""};
        var idReportLineAdded = false;
        var source = ciSources[i];
        var discoverySource = source.discovery_source;
        rowObj["Configuration item"] = "=HYPERLINK(\""+ gs.getProperty('glide.servlet.uri') + ciGr.getLink() + "\", \"" + (ciGr.getDisplayValue() || ciGr.getUniqueValue()) + "\")";
		rowObj["Class"] = ciGr.getValue("sys_class_name");
        rowObj["Discovery source"] = discoverySource
        for(var o = 0; o < source.ids.length; o++){
            var tableReportLineAdded = false;
            idReportLineAdded = true;
            var idObj = source.ids[o];
            var id = idObj.id;
            var lastScan = idObj.last_scan;
            rowObj["ID"] = id;
            rowObj["Last scan"] = lastScan;
            for(var stagingTable in idObj.staging_rows){
                var stagingRowLineAdded = false;
                tableReportLineAdded = true;
				rowObj["Staging table"] = stagingTable;
                for (var s = 0; s < idObj.staging_rows[stagingTable].length; s++){
                    var stagingRowId = idObj.staging_rows[stagingTable][s];
					rowObj["Row Id"] = "=HYPERLINK(\"" + gs.getProperty('glide.servlet.uri') + stagingTable + ".do?sys_id=" +  stagingRowId + "\", \"" + stagingRowId + "\")"
					csv.addRow(rowObj);
                    stagingRowLineAdded = true;
                }
                if(!stagingRowLineAdded){
					csv.addRow(rowObj);
                }
            }
            if(!tableReportLineAdded){
				csv.addRow(rowObj);
            }
        }
        if(!idReportLineAdded){
			csv.addRow(rowObj)
        }
    }
}

csv.build();
var attachmentGr = csv.createAttachment("CI Source Analysis");
gs.info(attachmentGr.getLink());


function getSources(ciGr) {
    var sources = [];
    var obj = {};
    var sourceGr = new GlideRecord('sys_object_source');
    sourceGr.addQuery('target_sys_id', ciGr.getUniqueValue());
    sourceGr.orderByDesc('last_scan');
    sourceGr.query();
    while (sourceGr.next()) {
        var sourceName = sourceGr.getValue('name');
        var sourceFeed = sourceGr.getValue('source_feed');
        var sourceId = sourceGr.getValue('id');
        if (!obj[sourceName]) {
            obj[sourceName] = {
                staging_rows: {}
            };
        }
        if (!obj[sourceName][sourceId]) {
            obj[sourceName][sourceId] = {
                id: sourceId,
                last_scan: sourceGr.last_scan.getDisplayValue(),
                staging_rows: {}
            };
        }

        if (sourceFeed) {
            var sourceFeedDetails = this._getSourceFeedDetails(sourceFeed);
            if ((sourceFeedDetails) && !obj[sourceName][sourceId].staging_rows[sourceFeedDetails.staging_table]) {
                obj[sourceName][sourceId].staging_rows[sourceFeedDetails.staging_table] = [];
                // Do a new index
                if (sourceFeedDetails && sourceFeedDetails.staging_table) {
                    obj[sourceName][sourceId].staging_rows[sourceFeedDetails.staging_table] = this._findStagingRows(sourceFeedDetails.staging_table, ciGr);
                }
            }
        }

    }
    for (var discovery_source in obj) {
        var sourceObj = {
            discovery_source: discovery_source,
            ids: []
        };
        for (var id in obj[discovery_source]) {
            if (id != 'staging_rows') {
                sourceObj.ids.push(obj[discovery_source][id]);
            }
        }
        sources.push(sourceObj);
    }
    return sources;
}



function _getSourceFeedDetails(sourceFeed) {
    var transformDefinitionGr = new GlideRecord('cmdb_inst_application_feed');
    if (transformDefinitionGr.get('name', sourceFeed)) {
        var feedObj = {};
        feedObj.name = transformDefinitionGr.getValue('name');
        feed_id = transformDefinitionGr.getUniqueValue();
        feedObj.staging_table = transformDefinitionGr.sys_data_source.import_set_table_name + '';
        feedObj.data_in_single_column = transformDefinitionGr.sys_data_source.data_in_single_column + '' === 'true';
        return feedObj;
    }
}


function _findStagingRows(sourceTableName, ciGr) {
    var firstRunContext = '';
    var tempRunContext = '';
    var runTableName = '';
    var stagingRows = [];
    var rowLimit = 50;
    var ireOutboundTargetsGr = new GlideRecord('cmdb_ire_output_target_item');
    ireOutboundTargetsGr.addQuery('target_record_id', ciGr.getUniqueValue());
    ireOutboundTargetsGr.orderByDesc('sys_created_on');
    ireOutboundTargetsGr.query();
    while (ireOutboundTargetsGr.next()) {
        
        var runId = ireOutboundTargetsGr.getValue('run_id');
        if (firstRunContext && runId != firstRunContext) {
            break;
        }
       
        if (tempRunContext != runId) {
            tempRunContext = runId;
            runTableName = this._getImportSetRunTable(runId);
        }
        if (runTableName === sourceTableName) {
            firstRunContext = runId;
            stagingRows.push(ireOutboundTargetsGr.getValue('source_record_id'));
        }
        if (stagingRows.length >= rowLimit) {
            break;
        }
    }
    return stagingRows;
}

function _getImportSetRunTable(runId) {
    var importSetRunGr = new GlideRecord('sys_import_set_run');
    if (importSetRunGr.get(runId)) {
        return importSetRunGr.set.table_name + '';
    }
}
