/* 
    Title: Multi Thread GlideRecord Operations
    Author: Erik Anderson
    Description: Specify one or more GlideRecord operations in the operations array. 
                 The script will automaticly split the work across the number of threads specified and run them in the background
*/


// The number of threads you want have deployed.
var threads = 3;

//An array of script operations you want in each thread. the work will be divided automatically beased on the number of threads selected.
//The function should always be called "run" and "gr" for glide record should alwasy be the passed in variable.
var scriptOperations = [
    {
        table: "cmdb_ci_computer",
        query: "nameSTARTSWITHtest",
        code: (function run(gr) {
            gr.query();
            while (gr.next()) {
                gs.info("TEST: " + gr.getValue("name"));
            }
        })
    },
    {
        table: "sys_script_include",
        query: "sys_scope=a4c05057db14101095ea53184b961977",
        code: (function run(gr) {
            gr.query();
            while (gr.next()) {
                gs.info("Script include Test: " + gr.getValue("name"));
            }
        })
    },
]


function divideWork(workCount) {
    var setThreads = threads;
    var ranges = [];
    if (workCount < setThreads) {
        setThreads = workCount;
    }
    var div = Math.ceil(workCount / threads);
    var leaveOff = 1;
    for (var i = 0; i < threads; i++) {
        var range = {};
        range.start = leaveOff - 1;
        if (i + 1 === threads) {
            range.end = workCount;
        } else {
            range.end = div + leaveOff - 1;
        }
        leaveOff = range.end + 1;
        ranges.push(range);
    }
    return ranges;
}


function probeTable(table, query) {
    var gr = new GlideRecord(table);
    gr.addEncodedQuery(query);
    gr.query();
    return gr.getRowCount();
}

function buildCallCode(table, query) {
    var code = "";
    code += "var gr = new GlideRecord(\"" + table + "\");";
    code += "\ngr.addEncodedQuery(\"" + query + "\");";
    code += "\ngr.chooseWindow(\"{{start}}\" , \"{{end}}\");"
    code += "\nrun(gr);"
    return code;
}

var ScheduledItem = Class.create();
ScheduledItem.prototype = {
    initialize: function () {
    },

    startNewJob: function () {
        if (this.script) {
            this.name = this._generateJobName();
            this.triggerType = "0";
            this.state = "0";
            this._insert();
        } else {
            gs.info("Can't start a new job since no script has been specified. Use the set script function before trying to kick off a job.");
        }

    },

    setScript: function (script) {
        this.script = script;
    },

    appendScript: function(script){
        if(!this.script){
            this.script = "";
        }
        this.script += script;
    },

    //Internal Functions

    _insert: function () {
        var grSS = new GlideRecord("sys_trigger");
        grSS.initialize();
        grSS = this._assignGlideRecordValues(grSS);
        grSS.insert();
    },

    _assignGlideRecordValues: function (grSS) {
        grSS.name = this.name;
        grSS.state = this.state;
        grSS.script = this.script;
        grSS.trigger_type = this.triggerType;
        return grSS;
    },
    _generateJobName: function () {
        var name = "DB Operations Job (" + gs.getUserID() + ")";
        return name;
    },

    type: 'ScheduledItem'
};




var scheduledItems = [];

for(var t = 0; t < scriptOperations.length; t++){
    var operation = scriptOperations[t];
    var probeCount = probeTable(operation.table, operation.query);
    var dividedWork = divideWork(probeCount);
    //gs.info(JSON.stringify(dividedWork));
    var callCode = this.buildCallCode(operation.table, operation.query);
    for (var i = 0; i < dividedWork.length; i++) {
        var range = dividedWork[i];
        var threadCode = callCode;
        threadCode = threadCode.replace(/{{start}}/g, range.start);
        threadCode = threadCode.replace(/{{end}}/g, range.end)
        if(!scheduledItems[i]){
            scheduledItems.push(new ScheduledItem());
        }
        var operationCode = operation.code.toString() + threadCode;
        operationCode = operationCode.replace(/run\(/g, "run" + t + "(");
        operationCode = operationCode.replace(/gr/g, "gr" + t);
        scheduledItems[i].appendScript(operationCode);
        
    }
}

// run the scripts
for(var s = 0; s < scheduledItems.length; s++){
    var scheduledItem = scheduledItems[s];
    scheduledItem.startNewJob();
    //gs.info(scheduledItem.script)
}
    