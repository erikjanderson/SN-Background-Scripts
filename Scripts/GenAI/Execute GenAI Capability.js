/* 
    Title: Execute GenAI Capability
    Author: Erik Anderson
    Description: Helpful script if you want to generically execute a GenAI Capability (Sometimes called a skill)
    By default it targets the Generic Prompt capability which allows you to pass in any prompt as a string as an input.
*/

                    //Generic Prompt Capability
var capabilityId = '0c90ca79533121106b38ddeeff7b12d7';
var prompt = "What is 1 + 1 * 31";

var payload = {};
/*
    Glide Record Example
    payload["incident"] = {
        tableName: "incident",
        sysId: "sys_id",
        queryString: ""
    }
*/
payload["prompt"] = prompt;

var request = {
    "executionRequests": [
        {
            "payload": payload,
            "meta": {

            },
            "capabilityId": capabilityId
        }
    ],
    "mode": 'sync'
};


var output = sn_one_extend.OneExtendUtil.execute(request);
var capabilityResponse = output["capabilities"][capabilityId];
var provider = capabilityResponse["provider"];
var error = capabilityResponse["error"];
var response = capabilityResponse["response"];
var status = capabilityResponse["status"];
var message = capabilityResponse["error"];

gs.info(response)
