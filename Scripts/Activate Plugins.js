/* 
    Title: Activate Plugins Via Script
    Author: Erik Anderson
    Description: Activate 1 or more plugins using a background script.
    For bigger Plugins, you can monitor progress in the sys_execution_tracker table.
*/

//Activate plugins
var plugins = [];
//For each plugin, push the ID into the array
plugins.push('com.glide.now.platform.encryption');
var main = new GlideMultiPluginManagerWorker();
main.setPluginIds(plugins);
main.setProgressName("Plugin Installer");
main.setBackground(true);
main.start();



/*
    Some Useful Plugin IDs:
        IntegrationHub Enterprise - com.glide.hub.integrations.enterprise
        Software Asset Management - com.snc.software_asset_management
        Software Asset Management Foundation - com.snc.sams
        Column Level Encryption Enterprise - com.glide.now.platform.encryption
*/
