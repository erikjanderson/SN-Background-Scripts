/* 
    Title: Report Merged CIs
    Author: Erik Anderson
    Description: Queries the Source [sys_object_source] table to determine if a multiple source devices have merged into a single ServiceNow CI.
    This can cause issues later on where a device may be changing "identify" where all of its attributes will randomly flip back and forth after a source imports.
*/


var discoverySource = "SG-Example";
var array = [];
new global.GlideQuery("sys_object_source")
    //.where("name", discoverySource)
    .aggregate("COUNT", "sys_id")
    .groupBy("target_sys_id")
    .having("COUNT", "sys_id", ">", 1)
    .select()
    .forEach(function (source) {
        var obj = {
            target_sys_id: source.group.target_sys_id,
            sources: {}
        }
        new global.GlideQuery("sys_object_source")
            .where("target_sys_id", source.group.target_sys_id)
            .select("name", "id", "last_scan", "source_feed", "target_sys_id$DISPLAY", "target_table")
            .forEach(function(sourceDetail){
                obj.target_table = sourceDetail.target_table;
                obj.target_display = sourceDetail.target_sys_id$DISPLAY
                if(!obj.sources[sourceDetail.name]){
                    obj.sources[sourceDetail.name] = {}
                }
                if(!obj.sources[sourceDetail.name][sourceDetail.id]){
                    obj.sources[sourceDetail.name][sourceDetail.id] = []
                }
                obj.sources[sourceDetail.name][sourceDetail.id].push({
                    id: sourceDetail.id,
                    last_scan: sourceDetail.last_scan,
                    source_feed: sourceDetail.source_feed
                })
            })
        
        for(discoverySource in obj.sources){
            if(Object.keys(obj.sources[discoverySource]).length > 1){
                array.push(obj)
                break;
            }
        }
    })

gs.info(JSON.stringify(array))

