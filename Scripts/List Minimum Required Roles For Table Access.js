
var tables = ['http_connection',"cmdb_ci_computer", "cmdb_ci_disk", "cmdb_ci_ip_address", "cmdb_ci_network_adapter", "sys_alias", "syslog_app_scope", "sys_data_source", "sysauto", "sys_script_include", "sys_db_object", "sys_hub_action", "sys_user_role", "sys_user_group", "cmdb_ire_data_source_rule"];
var ops = ['read', 'write', 'create'];
var output = {};
for (var i = 0; i < tables.length; i++) {
	var table = tables[i];
	var aclData = getRequiredTablePermissions(table);

	output[table] = aclData;

}

gs.info(JSON.stringify(output))


function getRequiredTablePermissions(tableName) {
	var aclData = {};
	for (var i = 0; i < ops.length; i++) {
		var operation = ops[i];
		aclData[operation] = getRequiredRoleForTableOperation(tableName, operation);
	}
	return aclData;
}

function getRequiredRoleForTableOperation(tableName, operation) {
	var requiredRolesObj  = {
		acl_table: tableName,
		roles: []
	};
	// Query the ACL table for the specified table and operation
	var aclGR = new GlideRecord('sys_security_acl');
	aclGR.addQuery("name", tableName);
	aclGR.addQuery("operation.name", operation);
	aclGR.addQuery("active", true);
	aclGR.query();
	var rowCount = aclGR.getRowCount();
	if (rowCount === 0) {
		//TODO: get parent table and search that one instead.. and then return
		var parentTable = getParentTable(tableName);
		if(parentTable){
			return getRequiredRoleForTableOperation(parentTable, operation);
		}
		return requiredRolesObj
	}
	while (aclGR.next()) {
		var aclRoleGR = new GlideRecord('sys_security_acl_role');
		aclRoleGR.addQuery('sys_security_acl', aclGR.getUniqueValue());
		aclRoleGR.query();
		while (aclRoleGR.next()) {
			var roleName = aclRoleGR.sys_user_role.name + "";
			if (roleName && requiredRolesObj.roles.indexOf(roleName) === -1) {
				requiredRolesObj.roles.push(roleName);
			}
		}
	}
	return requiredRolesObj;
}

function getParentTable(tableName){
	var tableGr = new GlideRecord("sys_db_object");
	if(tableGr.get("name", tableName)){
		var parent = tableGr.getValue("super_class");
		if(parent){
			return tableGr.super_class.name + "";
		}
	}
}