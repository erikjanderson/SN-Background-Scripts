
/* 
    Title: Get IRE Related Entries
    Author: Erik Anderson
    Description: Exports the Related Entries for a list of identifiers to a CSV Attachment.
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
            related_entries: []
        }

        var relatedEntryGr = new GlideRecord('cmdb_related_entry');
        relatedEntryGr.addQuery('identifier', identifierGr.getUniqueValue());
        relatedEntryGr.orderBy('order');
        relatedEntryGr.query();
        while(relatedEntryGr.next()){
            ireRule.related_entries.push({
                related_table: relatedEntryGr.getValue('table'),
                reference_field: relatedEntryGr.getValue('referenced_field'),
                criterion_attributes: relatedEntryGr.getValue('attributes'),
                allow_null_attribute: relatedEntryGr.getValue('allow_null_attribute') == '1'
            });
        }

        ireRules.push(ireRule)
    }
}


var csv = new CSV();
csv.addHeader("Table Name", "Related Table", "Reference Field", "Criterion Attributes", "Allow Null Attributes");

for(var i = 0; i < ireRules.length; i++){
    var identifier = ireRules[i];

    if(i > 0) {
        csv.addRow({})
    }

    csv.addRow({
        "Table Name": identifier.table_name
    });

    for(var r = 0; r < identifier.related_entries.length; r++){
        var relatedEntry = identifier.related_entries[r];
        csv.addRow({
            "Related Table": relatedEntry.related_table,
            "Reference Field": relatedEntry.reference_field,
            "Criterion Attributes": relatedEntry.criterion_attributes,
            "Allow Null Attributes": relatedEntry.allow_null_attribute
        })
    }

}


csv.build();
var attachmentGr = csv.createAttachment("IRE Related Entry Analysis");
gs.info(attachmentGr.getLink())
