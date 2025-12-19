/* 
	Title: Correct RTE Element Scopes
	Author: Erik Anderson
	Description: Sometimes, the IH-ETL can create elements in incorrect scope. 
	This script will go through them all and convert it back to the intended app scope.
*/


var scope = gs.getCurrentApplicationId();

if (gs.nil(scope)) {
	throw "No Application ID Found";
}
var transformDefGr = new GlideRecord("cmdb_inst_application_feed");
transformDefGr.addQuery("sys_scope", scope);
transformDefGr.query();
while (transformDefGr.next()) {
	var grCIE = new GlideRecord('cmdb_inst_entity');
	grCIE.addQuery("sys_rte_eb_definition", transformDefGr.getUniqueValue());
	grCIE.addQuery("sys_scope", "!=", scope);
	grCIE.orderBy('sys_scope');
	grCIE.query();
	while (grCIE.next()) {
		grCIE.sys_scope = scope;
		grCIE.update();
	}



	var grSREF = new GlideRecord('sys_rte_eb_field');
	grSREF.addQuery("sys_rte_eb_definition", transformDefGr.getUniqueValue());
	grSREF.addQuery("sys_scope", "!=", scope);
	grSREF.orderBy('sys_scope');
	grSREF.query();
	while (grSREF.next()) {
		grSREF.sys_scope = scope;
		grSREF.update();
	}


	var grSREEM = new GlideRecord('sys_rte_eb_entity_mapping');
	grSREEM.addQuery("sys_rte_eb_definition", transformDefGr.getUniqueValue());
	grSREEM.addQuery("sys_scope", "!=", scope);
	grSREEM.orderByDesc('sys_scope');
	grSREEM.query();
	while (grSREEM.next()) {
		grSREEM.sys_scope = scope;
		grSREEM.update();
	}


	var grSREFM = new GlideRecord('sys_rte_eb_field_mapping');
	grSREFM.addQuery("sys_rte_eb_definition", transformDefGr.getUniqueValue());
	grSREFM.addQuery("sys_scope", "!=", scope);
	grSREFM.orderBy('sys_scope');
	grSREFM.query();
	while (grSREFM.next()) {
		grSREFM.sys_scope = scope;
		grSREFM.update();
	}


	var grSREO = new GlideRecord('sys_rte_eb_operation');
	grSREO.addQuery("sys_rte_eb_definition", transformDefGr.getUniqueValue());
	grSREO.addQuery("sys_scope", "!=", scope);
	grSREO.orderBy('order');
	grSREO.query();
	while (grSREO.next()) {
		grSREO.sys_scope = scope;
		grSREO.update();
	}

}
