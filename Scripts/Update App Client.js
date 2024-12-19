/* 
    Title: Update App Client
    Author: Erik Anderson
    Description: Triggers event to check for updates in the sn_appclient application
    This can be helpful when applications listed in the internal app repo or the store are not correct.
*/

gs.eventQueue("sn_appclient.check.for.update");
