/* 
    Title: Increase Outbound HTTP Content Max Length
    Author: Erik Anderson
    Description: Increase (or decrease) the max length value of outbound http logs before the data is truncated
*/

var setToMaxLength = 500;

var maxLength = gs.getProperty("glide.outbound_http.content.max_limit");

gs.info(gs.getMessage("Setting Max Length From: {0} >> to >> {1}", [maxLength, setToMaxLength]));

gs.setProperty("glide.outbound_http.content.max_limit", setToMaxLength);