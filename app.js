
var pmx = require('pmx');
var stats = {};
stats.connections = {};
stats.network = {};
stats.opcounters = {};

/* TODO: Web */
pmx.initModule({


  widget : {

    // Logo displayed
    logo : 'https://app.keymetrics.io/img/logo/keymetrics-300.png',

    // Module colors
    // 0 = main element
    // 1 = secondary
    // 2 = main border
    // 3 = secondary border
    theme            : ['#141A1F', '#222222', '#3ff', '#3ff'],

    // Section to show / hide
    el : {
      probes  : true,
      actions : true
    },

    // Main block to show / hide
    block : {
      actions : false,
      issues  : true,
      meta    : true,

      // Custom metrics to put in BIG
      main_probes : ['version']
    }

  }

}, function(err, conf) {

  /**
   * Module specifics like connecting to a database and
   * displaying some metrics
   */

  /**
   *                      Custom Metrics
   *
   * Let's expose some metrics that will be displayed into Keymetrics
   *   For more documentation about metrics: http://bit.ly/1PZrMFB
   */
  var Probe = pmx.probe();
  var cache = {};
  var value_to_inspect = 0;


   Probe.metric({
    name : 'MongoDB',
    value : function() {
      return "v."+stats.version;
    }
  });

  Probe.metric({
    name : 'Uptime',
    value : function() {
      return formatSeconds(stats.uptime);
    }
  });
  Probe.metric({
    name : 'Connections',
    value : function() {

      return stats.connections.current+"/"+stats.connections.available+" [Total: "+stats.connections.totalCreated+"] ["+stats.connections.avg+"/sec]";
    },
    alert : {
      mode  : 'threshold',
      value : 1000,
      msg   : '> 1000 connections', // optional
      action: function() { //optional
        console.error('MongoDB 1000+ connections');
      },
      cmp   : function(value, threshold) { //optional
        return (parseFloat(stats.connections.current) > threshold); // default check
      }
    }
  });




  Probe.metric({
    name : 'Network',
    value : function() {
      return "⬇ "+bytesToSize(stats.netIn)+" ⬆ "+bytesToSize(stats.netOut);
    }
  });

  Probe.metric({
    name : 'Insert',
    value : function() {
      return stats.insert+"/sec";
    }
  });

  Probe.metric({
    name : 'Update',
    value : function() {
      return stats.update+"/sec";
    }
  });

  Probe.metric({
    name : 'Query',
    value : function() {
      return stats.query+"/sec";
    }
  });

  Probe.metric({
    name : 'Delete',
    value : function() {
      return stats.deleted+"/sec";
    }
  });




var refresh_rate = 1000;

setInterval(function() {
    getStats(function(data){
      if (typeof stats.lastInsert != 'undefined') {
          stats.insert = (Math.round((data.opcounters.insert - stats.lastInsert) * 1000 / refresh_rate));
          stats.query = (Math.round((data.opcounters.query - stats.lastQuery) * 1000 / refresh_rate));
          stats.update = (Math.round((data.opcounters.update - stats.lastUpdate) * 1000 / refresh_rate));
          stats.deleted = (Math.round((data.opcounters.delete - stats.lastDelete) * 1000 / refresh_rate));
          stats.command = (Math.round((data.opcounters.command - stats.lastCommand) * 1000 / refresh_rate));
          stats.netIn = (Math.round((data.network.bytesIn - stats.lastBytesIn) * 1000 / refresh_rate));
          stats.netOut = (Math.round((data.network.bytesOut - stats.lastBytesOut) * 1000 / refresh_rate));
          stats.connections.avg = (Math.round((data.connections.totalCreated - stats.connections.totalCreated) * 1000 / refresh_rate));
        }
        stats.lastInsert = data.opcounters.insert;
        stats.lastQuery = data.opcounters.query;
        stats.lastUpdate = data.opcounters.update;
        stats.lastDelete = data.opcounters.delete;
        stats.lastCommand = data.opcounters.command;
        stats.lastBytesIn = data.network.bytesIn;
        stats.lastBytesOut = data.network.bytesOut;
        stats.version = data.version;
        stats.uptime = data.uptime;
        stats.connections.current = data.connections.current;
        stats.connections.totalCreated = data.connections.totalCreated;
        stats.connections.available = data.connections.available;
        //console.log(stats);
    });
  }, refresh_rate);


  /**
   *                Simple Actions
   *
   *   Now let's expose some triggerable functions
   *  Once created you can trigger this from Keymetrics
   *
   */
  pmx.action('env', function(reply) {
    return reply({
      env: process.env
    });
  });

  /**
   *                 Scoped Actions
   *
   *     This are for long running remote function
   * This allow also to res.emit logs to see the progress
   *
   **/
  var spawn = require('child_process').spawn;

  pmx.scopedAction('lsof cmd', function(options, res) {
    var child = spawn('lsof', []);

    child.stdout.on('data', function(chunk) {
      chunk.toString().split('\n').forEach(function(line) {
        /**
         * Here we send logs attached to this command
         */
        res.send(line);
      });
    });

    child.stdout.on('end', function(chunk) {
      /**
       * Then we emit end to finalize the function
       */
      res.end('end');
    });

  });


});


var getStats = function(callback){
  var MongoClient = require('mongodb').MongoClient
  var url = 'mongodb://localhost:27017/test'
  var conn = MongoClient.connect(url, function(err, db) {
      var adminDb = db.admin();
      adminDb.serverStatus(function(err, info) {
          //stats = info;
          db.close();
          if(callback)
            callback(info);
      })
  })
}

function formatSeconds(sec) {
     return [(sec / 3600), ((sec % 3600) / 60), ((sec % 3600) % 60)]
            .map(v => v < 10 ? "0" + parseInt(v) : parseInt(v))
            .filter((i, j) => i !== "00" || j > 0)
            .join(":");
}
function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};
//getStats();
