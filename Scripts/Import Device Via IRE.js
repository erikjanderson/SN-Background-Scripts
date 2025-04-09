/* 
    Title: Import Device via IRE
    Author: Erik Anderson
    Description: Small sample to import a device via the IRE. This is nice for debugging IRE and Reconciliation rules.
	Alternatively you can use the identification simulation UI but know that it wont actually commit anything to the CMDB which can be misleading.
*/

var discoverySource = "SG-Example";

var payload = {
	"items": [
		{
			"className": "cmdb_ci_computer",
			"values": {
				"name": "Computer ABC",
				"serial_number": "SNA"
			},
			"lookup": [],
			"sys_object_source_info": {
				"source_name": discoverySource,
				"source_native_key": "SNA"
			}
		}
	],
	"relations": []
};

//Defaults
var options = {
	"deduplicate_payloads": true,
	"generate_summary": false,
	"partial_commits": true,
	"partial_payloads": true,
	"skip_updating_last_scan_to_now": false,
	"skip_updating_source_last_discovered_to_now": false
};


var input = JSON.stringify(payload);
//Identify & Reconcile
var output = sn_cmdb.IdentificationEngine.createOrUpdateCIEnhanced(discoverySource, input, options);

//Identify Only (Simulation)
//var output = sn_cmdb.IdentificationEngine.identifyCIEnhanced(discoverySource, input, options);

gs.info(JSON.stringify(JSON.parse(output), null, 2));
