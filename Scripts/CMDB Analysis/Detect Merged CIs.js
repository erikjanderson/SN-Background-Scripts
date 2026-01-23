/* 
    Title: Report Merged CIs
    Author: Erik Anderson
    Description: Queries the Source [sys_object_source] table to determine if a multiple source devices have merged into a single ServiceNow CI.
    This can cause issues later on where a device may be changing "identify" where all of its attributes will randomly flip back and forth after a source imports.
*/


var discoverySource = "SG-Example";
var classHierarchy = "cmdb_ci_hardware";
var reportAsCSV = true;

var outputArray = [];

//Get target table hierarchy
var tu = new TableUtils(classHierarchy);
var tableHierarchy = tu.getTableExtensions();
gs.include("j2js");
var tableArray = j2js(tableHierarchy);
tableArray.unshift(classHierarchy);

//Begin merged device detection
new global.GlideQuery("sys_object_source")
    .where("name", discoverySource)
    .where("target_table", "IN", tableArray)
    .aggregate("COUNT", "sys_id")
    .groupBy("target_sys_id")
    .having("COUNT", "sys_id", ">", 1)
    .select()
    .forEach(function (source) {
        var obj = {
            target_sys_id: source.group.target_sys_id,
            sources: {}
        };
        new global.GlideQuery("sys_object_source")
            .where("target_sys_id", source.group.target_sys_id)
            .where("name", discoverySource)
            .select("name", "id", "last_scan", "source_feed", "target_sys_id$DISPLAY", "target_table")
            .forEach(function (sourceDetail) {
                obj.target_table = sourceDetail.target_table;
                obj.target_display = sourceDetail.target_sys_id$DISPLAY;
                if (!gs.nil(obj.target_display)) {
                    var displaySplit = obj.target_display.split(":");
                    if (!gs.nil(displaySplit[1])) {
                        obj.target_display = displaySplit[1].trim();
                    }
                }
                if (!obj.sources[sourceDetail.name]) {
                    obj.sources[sourceDetail.name] = {};
                }
                if (!obj.sources[sourceDetail.name][sourceDetail.id]) {
                    obj.sources[sourceDetail.name][sourceDetail.id] = [];
                }
                obj.sources[sourceDetail.name][sourceDetail.id].push({
                    id: sourceDetail.id,
                    last_scan: sourceDetail.last_scan,
                    source_feed: sourceDetail.source_feed
                });
            });

        for (discoverySource in obj.sources) {
            if (Object.keys(obj.sources[discoverySource]).length > 1) {
                outputArray.push(obj);
                //gs.info("MERGED RECORD: " + JSON.stringify(obj.sources[discoverySource]));
                break;
            }
        }
    });

/*
Example Output
{
    "target_sys_id": "{GUID}",
    "sources": {
        "SG-example": {
            "example|||123456": [
                {
                    "id": "example|||123456",
                    "last_scan": "2026-01-21 21:54:38",
                    "source_feed": "SG-example Host"
                }
            ],
            "example|||543211": [
                {
                    "id": "example|||543211",
                    "last_scan": "2025-10-03 06:01:52",
                    "source_feed": null
                }
            ],
            "example|||567890": [
                {
                    "id": "example|||567890",
                    "last_scan": "2026-01-23 07:18:40",
                    "source_feed": null
                }
            ]
        }
    },
    "target_table": "cmdb_ci_computer",
    "target_display": "Computer: Record Name.."
}
*/

if (reportAsCSV === true) {
    //Report in CSV String Format
    var reportStr = "Target Display\tTargetTable\tTarget SysId\tDiscovery Source\tSource Id\tLast Scan";
    for (var i = 0; i < outputArray.length; i++) {
        var ciObj = outputArray[i];
        for (var sourceName in ciObj.sources) {
            for (var id in ciObj.sources[sourceName]) {
                var mostRecentLastScan = getMostRecentScan(ciObj.sources[sourceName][id]);
                reportStr += "\n" + ciObj.target_display + "\t" + ciObj.target_table + "\t" + ciObj.target_sys_id + "\t" + sourceName + "\t" + id + "\t" + mostRecentLastScan;
            }
        }
    }
    gs.info(reportStr);
} else {
    gs.info(JSON.stringify(outputArray));
}


function getMostRecentScan(sourceFeedArray) {
    var currentGdt;
    for (var i = 0; i < sourceFeedArray.length; i++) {
        var lastScan = sourceFeedArray[i].last_scan;
        if (!gs.nil(lastScan)) {
            var lastScanGDT = new GlideDateTime(lastScan);
            if (gs.nil(currentGdt) || lastScanGDT.getNumericValue() > currentGdt.getNumericValue()) {
                currentGdt = lastScanGDT;
            }
        }
    }
    return currentGdt;
}