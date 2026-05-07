/*
    Author: Erik Anderson
    Description: Toggles the http log levels on the ServiceNow instance. 
    This allows you to view things like response bodies in the outbound http request table.
*/

var overrideStatus = gs.getProperty("glide.outbound_http_log.override") === "true";

gs.info("Current override status is: " + overrideStatus + ". Changing to " + !overrideStatus);

gs.setProperty("glide.outbound_http_log.override", !overrideStatus);

if (!overrideStatus) {
	gs.setProperty("glide.rest.outbound.debug", "true");
	gs.setProperty("glide.outbound_http_log.override.level", "ALL");
	gs.setProperty("glide.outbound_http.content.max_limit", 1000);
} else {
	gs.setProperty("glide.rest.outbound.debug", "false");
	gs.setProperty("glide.outbound_http_log.override.level", "");
	gs.setProperty("glide.outbound_http.content.max_limit", 100);
}
