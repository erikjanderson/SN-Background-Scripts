
function runInBackground(script, applicationScopeId){
    var sysTriggerGr = new GlideRecord("sys_trigger");
    sysTriggerGr.initialize()
    sysTriggerGr.job_context = 
    "fcCannotCancel=false" +
    "\nfcElevatedRoles=" +
    "\nfcGlideSessionApplicationId=" + (applicationScopeId || 'global') +
    "\nfcUserName=" + gs.getUserName() +
    "\nfcGlideSessionUser=" + gs.getUserID() ;
    sysTriggerGr.script = script;
   // sysTriggerGr.trigger_type = 0;
    sysTriggerGr.job_id = "fa3846f00b522200d109061437673ad4"

    gs.info("Job Context: " + sysTriggerGr.job_context)
    sysTriggerGr.insert();
}

runInBackground(
`
gs.info(gs.getUserID());
gs.info(gs.getUserName())
gs.info(gs.getCurrentApplicationId());
gs.info(gs.getCurrentApplicationScope())
`
)