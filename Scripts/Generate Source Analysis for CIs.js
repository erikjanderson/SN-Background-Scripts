/*
    Title: Generate Source Analysis for CIs
    Author: Erik Anderson
    Description: Analyzes a CI to determine which source(s) contributed to its creation. 
    If verbose transformation is turned on, it will also be able to identify the staging rows that mapped to the CI.
*/

var reportString = "Configuration Item	Discovery Source	ID	Last Scan	Staging Table	Row ID";
var ciGr = new GlideRecord("cmdb_ci");
ciGr.addEncodedQuery("sys_id=123");


ciGr.query();
while(ciGr.next()){
    var ciSources = getSources(ciGr);
    for(var i = 0; i < ciSources.length; i++){
        var source = ciSources[i];
        var discoverySource = source.discovery_source;
        reportString += "\n=HYPERLINK(\""+ gs.getProperty('glide.servlet.uri') + ciGr.getLink() + "\", \"" + (ciGr.getDisplayValue() || ciGr.getUniqueValue()) + "\")" + "\t" + discoverySource;
        for(var o = 0; o < source.ids.length; o++){
            var idObj = source.ids[o];
            var id = idObj.id;
            var lastScan = idObj.last_scan;
            reportString += "\t" + id + "\t" + lastScan;
            for(var stagingTable in idObj.staging_rows){
                reportString += "\t" + stagingTable;
                for (var s = 0; s < idObj.staging_rows[stagingTable].length; s++){
                    var stagingRowId = idObj.staging_rows[stagingTable][s];

                    reportString += "\t=HYPERLINK(\"" + gs.getProperty('glide.servlet.uri') + stagingTable + ".do?sys_id=" +  stagingRowId + "\", \"" + "Hello" + "\")";
                }
            }
        }
    }
}

gs.info(reportString)


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
            gs.info(JSON.stringify(sourceFeedDetails))
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
    gs.debug((JSON.stringify(sources)));
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
        gs.info('hello?')
        if (stagingRows.length >= rowLimit) {
            break;
        }
    }
    gs.info(JSON.stringify(stagingRows))
    return stagingRows;
}

function _getImportSetRunTable(runId) {
    var importSetRunGr = new GlideRecord('sys_import_set_run');
    if (importSetRunGr.get(runId)) {
        return importSetRunGr.set.table_name + '';
    }
}
