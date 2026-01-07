/* 
    Title: Refresh Application Cache
    Author: Erik Anderson
    Description: Sometimes when you uninstall an application from a ServiceNow Instance it will show up as installed still in the application manager and you wont be able to re-install it.
    Run this script to force the application cache to fully refresh and the issue should go away after a min or two (I think)
*/

gs.eventQueue("sn_appclient.check.for.update");
new global.UpdateChecker().deleteAppManagerCache();
new global.UpdateChecker().checkAvailableUpdates();