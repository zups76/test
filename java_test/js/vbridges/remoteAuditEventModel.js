/*
 * Copyright 2006-2013 Virtual Bridges, Inc.  All Rights Reserved.
 * 
 * NOTICE: ALL INFORMATION CONTAINED HEREIN IS, AND REMAINS THE PROPERTY OF
 * VIRTUAL BRIDGES, INC. AND ITS SUPPLIERS, IF ANY. THE INTELLECTUAL AND
 * TECHNICAL CONCEPTS CONTAINED HEREIN ARE PROPRIETARY TO VIRTUAL BRIDGES, INC.
 * AND ITS SUPPLIERS AND MAY BE COVERED BY U.S. AND FOREIGN PATENTS, PATENTS IN
 * PROCESS, AND ARE PROTECTED BY TRADE SECRET OR COPYRIGHT LAW. DISSEMINATION
 * OF THIS INFORMATION OR REPRODUCTION OF THIS MATERIAL IS STRICTLY FORBIDDEN
 * UNLESS PRIOR WRITTEN PERMISSION IS OBTAINED FROM VIRTUAL BRIDGES, INC.
 */
/***
 * A simple observer pattern implementation.
 */
function EventHelper() {
  this.handlers = [];

  this.subscribe = function(fn) {
    this.handlers.push(fn);
  };

  this.notify = function(args) {
    for (var i = 0; i < this.handlers.length; i++) {
      this.handlers[i].call(this, args);
    }
  };

  return this;
}


(function($) {

  function RemoteAuditEventModel() {
    // private
    var PAGESIZE = 20;
    var data = {
      length:0
    };
    var searchstr = "";
    //var sortcol = 'timestamp';
    //var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request
    var req_page;

    // events
    var onDataLoading = new EventHelper();
    var onDataLoaded = new EventHelper();


    function init() {
    }


    function isDataLoaded(from,to) {
      for (var i=from; i<=to; i++) {
        if (data[i] == undefined || data[i] == null)
          return false;
      }

      return true;
    }


    function clear() {
      for (var key in data) {
        delete data[key];
      }
      data.length = 0;
    }


    function ensureData(from,to) {
      if (req) {
        req.abort();
        for (var i=req.fromPage; i<=req.toPage; i++)
          data[i*PAGESIZE] = undefined;
      }

      if (from < 0)
        from = 0;

      var fromPage = Math.floor(from / PAGESIZE);
      var toPage = Math.floor(to / PAGESIZE);

      while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
        fromPage++;

      while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
        toPage--;

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage*PAGESIZE] !== undefined)) {
        // TODO:  lookeahead

        //if ()

        return;
      }

      var startDate = "";
      var endDate = "";
      var objType = "";
      var actor = "";
      var action = "";
      var timestamp = "";
      timestamp = jQuery('div.timestamp').attr('id');
      if (timestamp == undefined) {
        return;
      }
      var dr = jQuery('#dateRange').attr('value');
      if (dr) {
        clearTimeout(VB.monitoring.timeoutHandle);
        var dateArr = dr.split('-');
        var dObj;
        jQuery.each(dateArr, function(idx) {
          dObj = Math.round(new Date(this.toString()).getTime()/1000.0);
          var endOfDay = dObj + 86400;
          if (!isNaN(dObj)) {
            if (idx == 0) {
              startDate = '&startDate='+dObj;
              endDate   = '&endDate='+endOfDay;
            }
            if (idx == 1) {
              endDate = '&endDate='+endOfDay;
            }
          }
        });
      }
      var searchVal = jQuery('#actor').attr('value');
      if (searchVal) {
        clearTimeout(VB.monitoring.timeoutHandle);
        if (searchVal != 'ALL') {
          actor = '&actors='+searchVal;
        }
      }
      var on = jQuery('#objName').attr('value');
      if (on) {
        clearTimeout(VB.monitoring.timeoutHandle);
        if (on != "ALL") {
          objType = '&objectTypes='+on;
        }
      }
      var actionVal = jQuery('#action').attr('value');
      if (actionVal) {
        clearTimeout(VB.monitoring.timeoutHandle);
        if (actionVal != "ALL") {
          action = '&actions='+actionVal;
        }
      }
      var parms = 'timestamp='+timestamp+startDate+endDate+objType+actor+action +
      '&firstResult=' + (fromPage * PAGESIZE) +
      '&maxResults=' + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);
      if (VB.monitoring.auditEventsTotal) {
        parms += '&total='+VB.monitoring.auditEventsTotal;
      }

      var url = VB.appCtx+'monitoring/listAuditEvents';

      if (h_request != null)
        clearTimeout(h_request);

      h_request = setTimeout(function() {
        for (var i=fromPage; i<=toPage; i++)
          data[i*PAGESIZE] = null; // null indicates a 'requested but not available yet'

        onDataLoading.notify({
          from:from,
          to:to
        });

        req = jQuery.ajax({
          url: url,
          data: parms,
          type: "post",
          dataType: 'json',
          callbackParameter: "callback",
          success: onSuccess
        });

        req.fromPage = fromPage;
        req.toPage = toPage;
      }, 50);
    }

    function onError(fromPage,toPage) {
      alert("error loading pages " + fromPage + " to " + toPage);
    }

    function onSuccess(resp) {

      if (!resp.events) {
        jQuery.jGrowl(VB.i18n.server_error, {theme: 'error'});
        return;
      }

      var timestamp = resp.timestamp;

      // exit if we're no longer on the right page
      if (!jQuery('#'+timestamp)[0]) {
        return;
      }

      var from = resp.offset, to = resp.offset + resp.count;
      data.length = parseInt(resp.total);
      VB.monitoring.auditEventsTotal = resp.total;

      jQuery.each(resp.events, function(idx) {
        var eventVals = resp.events[idx];
        eventVals['action'] = eventVals['action'].name;
        eventVals['actor'] = eventVals['actor'].username;
        eventVals['objValue'] = VB.htmlEncode(eventVals['objValue']);
        eventVals['severity'] = eventVals.severity.name;
        data[from+idx] = eventVals;
        data[from+idx].index = from + idx;
      });

      req = null;

      onDataLoaded.notify({
        from:from,
        to:to
      });
    }


    function reloadData(from,to) {
      for (var i=from; i<=to; i++)
        delete data[i];

      ensureData(from,to);
    }


    function setSort(column,dir) {
      sortcol = column;
      sortdir = dir;
      clear();
    }

    function setSearch(str) {
      searchstr = str;
      clear();
    }


    init();

    return {
      // properties
      "data": data,

      // methods
      "clear": clear,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded
    };
  }

  // RemoteUserEventModel
  $.extend(true, window, {
    VB: {
      monitoring: {
        RemoteAuditEventModel: RemoteAuditEventModel
      }
    }
  });
})(jQuery);
