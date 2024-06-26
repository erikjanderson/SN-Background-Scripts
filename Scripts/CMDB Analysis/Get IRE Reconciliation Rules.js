/* 
    Title: Get IRE Reconciliation Rules
    Author: Erik Anderson
    Description: Generates a CSV file listing the reconciliation rules for all CMDB sources.
*/

//Reconciliation Definitions

var CSV = Class.create();
CSV.prototype = {
	initialize: function () {
		this.headers = [];
		this.rows = [];
		this.data = '';
	},

	addHeader: function () {
		for(var i = 0; i < arguments.length; i++){
			var name = arguments[i];
			if (this.headers.indexOf(name) < 0) {
				this.headers.push(name);
			}
		}
	},

	addRow: function (obj) {
		var row = {};
		for (var i = 0; i < this.headers.length; i++) {
			var header = this.headers[i];
			if (obj && !gs.nil(obj[header])) {
				row[header] = obj[header];
			} else if(!gs.nil(arguments[i]) && typeof arguments[i] != 'object'){
				row[header] = arguments[i];
			} else {
				row[header] = '';
			}
		}
		this.rows.push(row);
		return this.rows[this.rows.length - 1];
	},

	build: function () {
		this.data = '';
		var headerAdded = false;
		//Add Headers
		if(this.headers.length > 0){
			this.data = this._buildHeaderString();
			headerAdded = true;
		}
		//Add Body
		this.data += this._buildBodyString(headerAdded);
		return this.data;
	},

	buildDisplay: function(){
		var headerAdded = false;
		this.data = '';
		//Add Headers
		for (var i = 0; i < this.headers.length; i++) {
			headerAdded = true;
			var header = this.headers[i];
			if(i > 0){
				this.data += '\t';
			}
			this.data += header;
		}

		for(var r = 0; r < this.rows.length; r++ ){
			var row = this.rows[r];
			var rowString = '';
			if(headerAdded || r > 0){
				rowString += '\n';
			}
			var first = true;
			for(var key in row){
				if(!first){
					rowString += '\t';
				}
				first =false;
				rowString += row[key] || ''
			}
			this.data += rowString;
		}
		return this.data;
	},

	createAttachment: function(name, gr){
		var attachment = new GlideSysAttachment();

		if(!gr){
			gr = this._createPollRecord();
		}

		var fileName = name;
		if(!fileName){
			fileName = gr.getDisplayValue();
		}
		if(!fileName){
			fileName = gr.getUniqueValue() + '-' + new GlideDateTime().getDisplayValue();
		}

		var sysId = attachment.write(gr, fileName + '.csv', 'text/csv', this.data);
		if(sysId){
			var attachmentGr = new GlideRecord('sys_attachment');
			if(attachmentGr.get(sysId)){
				return attachmentGr;
			}
		}
	},



	//Internal Functions

	_buildHeaderString: function () {
		var headerStr = '';
		for (var i = 0; i < this.headers.length; i++) {
			var header = this.headers[i];
			var cell = this._buildCell(header);
			if (!headerStr) {
				headerStr = cell;
			} else {
				headerStr += ',' + cell; 
			}
		}
		return headerStr;
	},

	_buildBodyString: function(headerAdded){
		var bodyStr = '';
		for(var i = 0; i < this.rows.length; i++){
			var row = this.rows[i];
			var rowString = '';
			if(headerAdded || i > 0){
				rowString += '\n';
			}
			if(headerAdded){
				rowString += this._buildRowString(row);
			}else{
				rowString += this._buildRowStringWithoutHeader(row);
			}
			bodyStr += rowString;
		}
		return bodyStr;
	},

	_buildRowString: function(row){
		var rowString = '';
		for (var i = 0; i < this.headers.length; i++) {
			var header = this.headers[i];
			var cell = this._buildCell((row[header]));
			if(i > 0){
				rowString += ',';
			}
			rowString += cell;
		}
		return rowString;
	},


	_buildRowStringWithoutHeader: function(row){
		var rowString = '';
		for(var key in row){
			var cell = this._buildCell((row[key]));
			if(rowString){
				rowString += ',';
			}
			rowString += cell;
		}
		return rowString;
	},

	_buildCell: function(val){
        if(gs.nil(val)){
            val = "";
        }
		if(typeof val === 'object'){
			val = JSON.stringify(val);
		}
		if(typeof val === 'string'){
			val = val.replace(/"/g, '""');
		}
		val = '"' + val + '"';
		return val;
	},

	_createPollRecord: function(){
		var pollGr = new GlideRecord('sys_poll');
		pollGr.initialize();
		pollGr.session_id = gs.getSessionID();
		pollGr.session_user = gs.getUserID();
		pollGr.state = 'complete';
		pollGr.max = '0';
		pollGr.current = '0';
		pollGr.message = 'Created by the Developer Operations CSV Script include.';
		pollGr.insert();
		return pollGr;
	},


	type: 'CSV'
};

var reconciliationRules= getReconciliationDefinitions();
var csv = new CSV();
csv.addHeader("Applies to", "Priority", "Attribute", "Data source", "Data source", "Update with null", "Filter condition", "Active");
for(var table in reconciliationRules){
    for(var attribute in reconciliationRules[table]){
        for(var i = 0;  i < reconciliationRules[table][attribute].length; i++){
            csv.addRow(reconciliationRules[table][attribute][i]);
        }
    }
}

csv.build();
var attachmentGr = csv.createAttachment("Reconciliation Rules");
gs.info(attachmentGr.getLink())
//gs.info(JSON.stringify(reconciliationRules));

// var dynamicRules = getDynamicReconciliationDefinitions()

// gs.info(JSON.stringify(dynamicRules));

function getReconciliationDefinitions() {
    var rules = {};
    var reconciliationDefinitionGr = new GlideRecord('cmdb_reconciliation_definition');
    reconciliationDefinitionGr.orderBy('priority');
    reconciliationDefinitionGr.query();
    while (reconciliationDefinitionGr.next()) {
        var table = reconciliationDefinitionGr.getValue("applies_to");
        var attributes = reconciliationDefinitionGr.getValue("attributes");
        if (attributes) {
            attributes = attributes.split(',');
        } else {
            attributes = "ALL";
        }
        if (!rules[table]) {
            rules[table] = {}
        }
        if (Array.isArray(attributes)) {
            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                if (!rules[table][attribute]) {
                    rules[table][attribute] = [];
                }
                var updateWithNull = reconciliationDefinitionGr.getValue("null_update");
                if (!gs.nil(updateWithNull)) {
                    updateWithNull.split(",");
                } else {
                    updateWithNull = [];
                }
                rules[table][attributes].push({
                    "Priority": parseInt(reconciliationDefinitionGr.getValue("priority")) || 0,
                    "Data source": reconciliationDefinitionGr.getValue("discovery_source"),
                    "Applies to": table,
                    "Attribute": attribute,
                    "Update with null": updateWithNull.indexOf(attribute) > -1,
                    "Filter condition": reconciliationDefinitionGr.getValue("condition") || "",
                    "Active": reconciliationDefinitionGr.getValue("active") == "1"
                });
            }
        } else {
            if (!rules[table][attributes]) {
                rules[table][attributes] = [];
            }

            rules[table][attributes].push({
                "Priority": parseInt(reconciliationDefinitionGr.getValue("priority")),
                "Data source": reconciliationDefinitionGr.getValue("discovery_source"),
                "Applies to": table,
                "Attribute": attributes,
                "Update with null": false,
                "Filter condition": reconciliationDefinitionGr.getValue("condition") || "",
                "Active": reconciliationDefinitionGr.getValue("active") == "1"
            });

        }
    }

    
    _cascadeTableWideRules(rules);
    return rules;
}


function getDynamicReconciliationDefinitions() {
    var dynamicRules = {}
    var dynamicReconciliationDefinitionGr = new GlideRecord("cmdb_dynamic_reconciliation_definition");
    dynamicReconciliationDefinitionGr.query();
    while (dynamicReconciliationDefinitionGr.next()) {
        var table = dynamicReconciliationDefinitionGr.getValue("applies_to");
        if (!dynamicRules[table]) {
            dynamicRules[table] = [];
        }

        var attributes = dynamicReconciliationDefinitionGr.getValue("attributes");
        if (attributes) {
            attributes = attributes.split(',');
        } else {
            attributes = "Invalid";
        }

        if (Array.isArray(attributes)) {
            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                dynamicRules[table].push({
                    "Name": dynamicReconciliationDefinitionGr.getValue("name"),
                    "Applies to": dynamicReconciliationDefinitionGr.getValue("applies_to"),
                    "Rule type": dynamicReconciliationDefinitionGr.getValue("rule_type"),
                    "Attribute": attribute,
                    "Filter condition": dynamicReconciliationDefinitionGr.getValue("condition"),
                    "Active": dynamicReconciliationDefinitionGr.getValue("active") == "1"
                });
            }
        } else {
            dynamicRules[table].push({
                "Name": dynamicReconciliationDefinitionGr.getValue("name"),
                "Applies to": dynamicReconciliationDefinitionGr.getValue("applies_to"),
                "Rule type": dynamicReconciliationDefinitionGr.getValue("rule_type"),
                "Attribute": attributes,
                "Filter condition": dynamicReconciliationDefinitionGr.getValue("condition"),
                "Active": dynamicReconciliationDefinitionGr.getValue("active") == "1"
            });
        }
    }
    return dynamicRules;
}


function _cascadeTableWideRules(reconciliationRules){
    for(var table in reconciliationRules){
        if(reconciliationRules[table]["ALL"] && Object.keys(reconciliationRules[table]).length > 1){
            for (var i = 0; i < reconciliationRules[table]["ALL"].length; i++){
                var allAttributeRule = reconciliationRules[table]["ALL"][i];

                for(var attribute in reconciliationRules[table]){
                    if(attribute === "ALL"){
                        continue;
                    }
                    reconciliationRules[table][attribute].push({
                        "Priority": allAttributeRule["Priority"],
                        "Data source": allAttributeRule["Data source"],
                        "Applies to": allAttributeRule["Applies to"],
                        "Attribute": attribute,
                        "Update with null":allAttributeRule["Update with null"],
                        "Filter condition": allAttributeRule["Filter condition"],
                        "Active": allAttributeRule["Active"]
                    });

                    reconciliationRules[table][attribute].sort((a, b) => a.Priority - b.Priority);
                }
            }
        }
    }
}

function getAllDiscoverySources(){
    var array = new global.GlideQuery("sys_choice")
        .where("name", "cmdb_ci")
        .where("element", "discovery_source")
        .orderBy("sequence")
        .select("value")
        .toArray(100);
    return array;
}