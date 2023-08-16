/*
    Author: Erik Anderson
    Description: Toggles the http log levels on the ServiceNow instance. 
    This allows you to view things like response bodies in the outbound http request table.
*/
var overrideStatus = gs.getProperty('glide.outbound_http_log.override') === 'true'

gs.info("Current override status is: " + overrideStatus + '. Changing to ' + !overrideStatus);

gs.setProperty('glide.outbound_http_log.override', !overrideStatus);

if(!overrideStatus){
    gs.setProperty('glide.outbound_http_log.override.level', 'ALL');
}else{
    gs.setProperty('glide.outbound_http_log.override.level', '');
}
