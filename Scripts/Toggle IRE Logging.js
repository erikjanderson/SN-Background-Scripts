/* 
    Title: Toggle IRE Logging
    Author: Erik Anderson
    Description: Toggles on or off the glide.cmdb.logger.source.identification_engine system property.
    This system property is in the platform by default so it sometimes needs to be created in the global scope first.

*/

var choices = 'info,warn,error,debug,debugVerbose';
var value = 'debugVerbose';


var sysPropertiesGr = new GlideRecord('sys_properties');
if(sysPropertiesGr.get('name', 'glide.cmdb.logger.source.identification_engine')){
    var existingValue = sysPropertiesGr.getValue('value');
    if(existingValue){
        sysPropertiesGr.value = '';
    }else{
        sysPropertiesGr.value = value;
    }
    sysPropertiesGr.update();
}else{
    sysPropertiesGr.initialize();
    sysPropertiesGr.sys_scope = 'global';
    sysPropertiesGr.name = 'glide.cmdb.logger.source.identification_engine';
    sysPropertiesGr.choices = choices;
    sysPropertiesGr.type = 'string';
    sysPropertiesGr.value = value;
    sysPropertiesGr.ignore_cache = false;
    sysPropertiesGr.insert();
}
