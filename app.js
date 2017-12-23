
var pmx = require('pmx');
var stats = {};
stats.connections = {};
stats.network = {};
stats.opcounters = {};

var config;






pmx.initModule({


  widget : {

    // Logo displayed
    logo : 'https://raw.githubusercontent.com/jodacame/pm2-mongodb-stats/master/logo.png',

    // Module colors
    // 0 = main element
    // 1 = secondary
    // 2 = main border
    // 3 = secondary border
    theme            : ['#141A1F', '#222222', '#000', '#000'],

    // Section to show / hide
    el : {
      probes  : true,
      actions : true
    },

    // Main block to show / hide
    block : {
      actions : true,
      issues  : true,
      meta    : false,

      // Custom metrics to put in BIG
      main_probes : ['MongoDB','Uptime','Connections','Connections AVG','Network']
    }

  }

}, function(err, conf) {

  config = conf;
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

      return stats.connections.current+" ("+((stats.connections.current*100)/stats.connections.available).toFixed(2)+"%) ["+stats.connections.avg+"/sec]";
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

  var histogramConnections = Probe.histogram({
    name        : 'Connections AVG',
    measurement : 'mean'
  });



  Probe.metric({
    name : 'Network',
    value : function() {
      return "⬇ "+bytesToSize(stats.networkIn)+"/sec ⬆ "+bytesToSize(stats.networkOut)+"/sec";
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
          stats.insert = Math.round(data.opcounters.insert - stats.lastInsert);
          stats.query = Math.round(data.opcounters.query - stats.lastQuery);
          stats.update = Math.round(data.opcounters.update - stats.lastUpdate);
          stats.deleted = Math.round(data.opcounters.delete - stats.lastDelete);
          stats.command = Math.round(data.opcounters.command - stats.lastCommand);
          stats.networkIn = Math.round(data.network.bytesIn - stats.lastBytesIn);
          stats.networkOut = Math.round(data.network.bytesOut - stats.lastBytesOut);
          stats.connections.avg = Math.round(data.connections.totalCreated - stats.connections.totalCreated);

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
        histogramConnections.update(stats.connections.current);
    });
  }, refresh_rate);




});




var getStats = function(callback){

  var url = process.env.MONGO || config.mongo;
  var MongoClient = require('mongodb').MongoClient;
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
