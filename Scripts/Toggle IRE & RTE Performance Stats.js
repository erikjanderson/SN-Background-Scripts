/* 
    Title: Toggle IRERTE Stats
    Author: Erik Anderson
    Description: If you face extremely slow run times for a robust transform, you can enable transaction stats for both the RTE and IRE.

    After enabling the below system properties, you can view the stats in the below tables:
    IRE Pattern [sys_ire_pattern]
    RTE Pattern [sys_rte_pattern]

*/

var ireStats = gs.getProperty('glide.identification_engine.ire_stats.enabled') == 'true';
var rteStats = gs.getProperty('glide.robust_transform_engine.rte_stats.enabled') == 'true';

if(ireStats === true){
    ireStats = false;
    rteStats = false;
}else{
    ireStats = true;
    rteStats = true;
}

setProperty('glide.identification_engine.ire_stats.enabled', ireStats);
setProperty('glide.robust_transform_engine.rte_stats.enabled', rteStats);


//Updates or inserts a system property
function setProperty(propertyName, value){
    var sysPropertiesGr = new GlideRecord('sys_properties');
    if(sysPropertiesGr.get('name', propertyName)){
        var existingValue = sysPropertiesGr.getValue('value');
        sysPropertiesGr.value = value;
        sysPropertiesGr.update();
    }else{
        sysPropertiesGr.initialize();
        sysPropertiesGr.sys_scope = 'global';
        sysPropertiesGr.name = propertyName;
        sysPropertiesGr.choices = choices;
        sysPropertiesGr.type = 'string';
        sysPropertiesGr.value = value;
        sysPropertiesGr.ignore_cache = false;
        sysPropertiesGr.insert();
    }
}
