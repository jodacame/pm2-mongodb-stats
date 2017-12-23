
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
      histogramConex.update(stats.connections.current);
      return stats.connections.current+"/"+stats.connections.available+" [Total: "+stats.connections.totalCreated+"]";
    },
    alert : {
      mode  : 'threshold',
      value : 10,
      msg   : '> 100 connections', // optional
      action: function() { //optional
        console.error('MongoDB 100+ connections');
      },
      cmp   : function(value, threshold) { //optional
        return (parseFloat(value) > threshold); // default check
      }
    }
  });

  var histogramConex = Probe.histogram({
    name        : 'Connections [AVG]',
    measurement : 'mean'
  });


  Probe.metric({
    name : 'Network',
    value : function() {
      return "⬇ "+bytesToSize(stats.network.bytesIn)+" ⬆ "+bytesToSize(stats.network.bytesOut);
    }
  });

  Probe.metric({
    name : 'Insert [TOTAL]',
    value : function() {
      return stats.opcounters.insert;
    }
  });
  Probe.metric({
    name : 'Query [TOTAL]',
    value : function() {
      return stats.opcounters.query;
    }
  });
  Probe.metric({
    name : 'Update [TOTAL]',
    value : function() {
      return stats.opcounters.update;
    }
  });
  Probe.metric({
    name : 'Delete [TOTAL]',
    value : function() {
      return stats.opcounters.delete;
    }
  });


  Probe.metric({
    name : 'MEMORY',
    value : function() {
      return  (stats.mem.bits)+"-bit";
    }
  });

  Probe.metric({
    name : 'Virtual',
    value : function() {
      return  (stats.mem.virtual)+" MB";
    }
  });
  Probe.metric({
    name : 'Resident',
    value : function() {
      return  (stats.mem.virtual)+" MB";
    }
  });
  Probe.metric({
    name : 'Mapped',
    value : function() {
      return  (stats.mem.mapped)+" MB";
    }
  });



  setInterval(function() {
    // Then we can see that this value increase over the time in Keymetrics
    value_to_inspect++;
    getStats();
  }, 1000);


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


var getStats = function(){
  var MongoClient = require('mongodb').MongoClient
  var url = 'mongodb://localhost:27017/test'
  var conn = MongoClient.connect(url, function(err, db) {
      var adminDb = db.admin();
      adminDb.serverStatus(function(err, info) {
          stats = info;
          db.close();
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
getStats();
