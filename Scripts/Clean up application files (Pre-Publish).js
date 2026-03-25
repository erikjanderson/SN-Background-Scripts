/* 
    Title: Clean up application files (Pre-Publish)
    Author: Erik Anderson
    Description: Cleans up various application file records that should not be included in a scoped application for publishing purposes
*/

if (gs.nil(applicationId)) {
	throw "This script cannot run without an application ID being specified.";
}
if (gs.getCurrentScopeName() != "rhino.global") {
	throw "This script needs to run in the Global scope. Make sure to select the Global scope in the background script runner.";
}

var applicationId = gs.getCurrentApplicationId();
var deleteMetadataDelete = false;

//Remove User UI Lists
var grSysUiList = new GlideRecord("sys_ui_list");
grSysUiList.addEncodedQuery("sys_user!=NULL^sys_scope=" + applicationId);
grSysUiList.deleteMultiple();

//Remove User UI Views
var grSysUiView = new GlideRecord("sys_ui_view");
grSysUiView.addEncodedQuery("user!=NULL^sys_scope=" + applicationId);
grSysUiView.deleteMultiple();

//Remove User Service Portals
var grSPP = new GlideRecord("sys_portal_page");
grSPP.addEncodedQuery("user!=NULL^sys_scope=" + applicationId);
grSPP.deleteMultiple();

//Clear Users From Reports
var grSysReport = new GlideRecord("sys_report");
grSysReport.addEncodedQuery("sys_scope=" + applicationId);
while (grSysReport.next()) {
	grSysReport.user = "";
	grSysReport.update();
}

//Remove user report groups
var grSRUG = new GlideRecord("sys_report_users_groups");
grSRUG.addEncodedQuery("user_id!=NULL^sys_scope=" + applicationId);
grSRUG.deleteMultiple();

//Remove AutoGen Module Access Policies
var grSKCCP = new GlideRecord("sys_kmf_crypto_caller_policy");
grSKCCP.addEncodedQuery("sys_scope=" + applicationId + "^policy_nameSTARTSWITHAutoGen");
grSKCCP.deleteMultiple();

//Update all dependency versions to the currently installed version.
var grSPDM2 = new GlideRecord("sys_package_dependency_m2m");
grSPDM2.addEncodedQuery("sys_package=" + applicationId);
grSPDM2.query();
while (grSPDM2.next()) {
	var version = grSPDM2.dependency.version + "";
	grSPDM2.min_version = version;
	grSPDM2.update();
}

//Set all metadata files to updated and created by admin
var grMetadata = new GlideRecord("sys_metadata");
grMetadata.addEncodedQuery("sys_scope=" + applicationId);
grMetadata.autoSysFields(false);
grMetadata.setWorkflow(false);
grMetadata.sys_created_by = "admin";
grMetadata.sys_updated_by = "admin";
grMetadata.updateMultiple();

//Delete deleted application files
if (deleteMetadataDelete) {
	var grSMD = new GlideRecord("sys_metadata_delete");
	grSMD.addEncodedQuery("sys_scope=" + applicationId);
	grSMD.deleteMultiple();
}
