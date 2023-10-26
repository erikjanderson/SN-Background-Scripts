//Rest SG Connector

var applicationId = gs.getCurrentApplicationId(); //Gets the current application your user session is in (regardless of what app scope this script runs in)
var defaultBatchSize = 100;

//System Properties
//gs.setProperty("property_name", "");


//Reset Connection
var grSC = new GlideRecord('sys_connection');
grSC.addEncodedQuery("connection_alias.sys_scope=" + applicationId);
grSC.orderByDesc('order');
grSC.query();
while (grSC.next()) {
    if(grSC.hasNext()){
        grSC.active = false;
    }else{
        grSC.active = true;
        grSC.host = "{Your Host Name}";
    }
    var credentialGr = grSC.credential.getRefRecord();
    credentialGr.user_name = "";
    credentialGr.api_key = "";
    credentialGr.update();

    grSC.update();
    

}

//Reset Guided Setup Progress
var rec = new GlideRecord('gsw_status_of_content');
	rec.addEncodedQuery('status!=0^sys_scope=' + applicationId);
	rec.query();
while (rec.next()) { 
	rec.setValue('status', 0);
	rec.setValue('progress', 0);
	rec.setValue('previous_status', 0);
	rec.setValue('related_log_entry', '');
	rec.update();
}


//Reset Scheduled Jobs
var grSysauto = new GlideRecord('sysauto');
grSysauto.addEncodedQuery("sys_scope=" + applicationId);
grSysauto.query();
while (grSysauto.next()) {
    if(grSysauto.getValue("run_type") === "parent"){
        grSysauto.active = true;
    }else{
        grSysauto.active = false;
    }
    grSysauto.run_as = "";
    grSysauto.update();
}


//Reset Transformer
var grSRIST = new GlideRecord('sys_robust_import_set_transformer');
grSRIST.addEncodedQuery("sys_scope=" + applicationId);
grSRIST.query();
while (grSRIST.next()) {
    grSRIST.batch_size = defaultBatchSize;
    grSRIST.verbose = false;
    grSRIST.active = true;
    grSRIST.update();
}
