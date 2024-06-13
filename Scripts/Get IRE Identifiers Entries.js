
/* 
    Title: Get IRE Identifiers Entries
    Author: Erik Anderson
    Description: Exports the the identification rules for a set list of tables to a CSV Attachment.
    This helps with IRE analysis when getting understanding the impact of implementing new CMDB sources.
*/

var ireTables = ["cmdb_ci_hardware", "cmdb_ci_ot"]

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
			} else if(arguments[i] && typeof arguments[i] != 'object'){
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




var ireRules = [];

for(var i = 0; i < ireTables.length; i++){
    var tableName = ireTables[i];
    var identifierGr = new GlideRecord('cmdb_identifier');
    identifierGr.addQuery('applies_to', tableName);
    identifierGr.setLimit(1);
    identifierGr.query();
    while(identifierGr.next()){
        var ireRule = {
            table_name: tableName,
            name: identifierGr.getValue('name'),
            active: identifierGr.getValue('active') == "1",
            description: identifierGr.getValue('description'),
            independent: identifierGr.getValue('independent') == '1',
            entries: [],
            related_entries: []
        }


        var identifierEntryGr = new GlideRecord('cmdb_identifier_entry');
        identifierEntryGr.addQuery('identifier', identifierGr.getUniqueValue());
        identifierEntryGr.orderBy('order');
        identifierEntryGr.query();
        while (identifierEntryGr.next()) {
            var identifierEntry = {
                active: identifierEntryGr.getValue('active') == '1',
                search_on_table: identifierEntryGr.getValue('table'),
                attributes: identifierEntryGr.getValue('attributes'),
                hybrid_entry_ci_criterion_attributes: identifierEntryGr.getValue('hybrid_entry_ci_criterion_attributes'),
                priority: identifierEntryGr.getValue('order'),
                allow_null_attribute: identifierEntryGr.getValue('allow_null_attribute') == '1',
                optional_condition: identifierEntryGr.getValue('condition')
            }
            if(identifierEntry.search_on_table === tableName){
                identifierEntry.type = "Primary";
            }else if(identifierEntry.hybrid_entry_ci_criterion_attributes){
                identifierEntry.type = "Hybrid";
                identifierEntry.enforce_exact_count_match = identifierEntryGr.getValue('exact_count_match') == '1';
            }else{
                identifierEntry.type = "Lookup";
                identifierEntry.enforce_exact_count_match = identifierEntryGr.getValue('exact_count_match') == '1';
            }
            ireRule.entries.push(identifierEntry);
        }


        ireRules.push(ireRule)
    }
}


var csv = new CSV();
csv.addHeader("Table Name", "Priority", "Entity Type", "Search on Table", "Attributes", "Enforce Exact Count", "Optional Condition", "Hybrid CI Criterion Attributes");

for(var i = 0; i < ireRules.length; i++){
    var identifier = ireRules[i];

    csv.addRow({
        "Table Name": identifier.table_name
    });

    for(var e = 0; e < identifier.entries.length; e++){
        var entry = identifier.entries[e];

        csv.addRow({
            "Priority": entry.priority,
            "Entity Type": entry.type,
            "Search on Table": entry.search_on_table,
            "Attributes": entry.attributes,
            "Enforce Exact Count": entry.enforce_exact_count_match,
            "Optional Condition": entry.optional_condition,
            "Hybrid CI Criterion Attributes": entry.hybrid_entry_ci_criterion_attributes
        })
    }


}
csv.build();
var attachmentGr = csv.createAttachment("IRE Identification Rule Analysis");
gs.info(attachmentGr.getLink())
