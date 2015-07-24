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

  function RemoteMACAddressModel() {
    // private
    var PAGESIZE = 20;
    var data = {
      length:0
    };
    var sortcol = 'address';
    var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request

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

      var prefix = "";
      var macPool = "";
      var imagename = "";
      var username = "";
      
      var searchVal = jQuery('#macSearch').attr('value');
      if (searchVal) {
        clearTimeout(VB.monitoring.timeoutHandle);
        prefix = "&prefix="+searchVal;
      }
      var poolVal = jQuery('#macAddressPool').attr('value');
      if (poolVal != 'all') {
        macPool = "&poolname="+poolVal;
      }
      var imageVal = jQuery('#imageSearch').attr('value');
      if (imageVal) {
        imagename = "&imagename="+imageVal;
      }
      var usernameVal = jQuery('#usernameSearch').attr('value');
      if (usernameVal) {
        username = "&username="+usernameVal;
      }      
      
      if (sortcol == "formattedMACAddress") {
        sortcol = "address"
      }
      var parms = "offset=" + (fromPage * PAGESIZE) +
      "&max=" + (((toPage - fromPage) * PAGESIZE) + PAGESIZE) +
      "&order=" + ((sortdir>0)?"asc":"desc") +
      "&sort=" + sortcol +
      prefix+macPool+imagename+username;
    
      if (VB.monitoring.macAddressesTotal) {
        parms += "&total="+VB.monitoring.macAddressesTotal;
      }

      var url = VB.appCtx+'monitoring/listMACAddresses';

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

      if (!resp.macAddrs) {
        jQuery.jGrowl(VB.i18n.server_error, {theme: 'error'});
        return;
      }

      var from = resp.offset, to = resp.offset + resp.count;
      data.length = parseInt(resp.total);
      VB.monitoring.macAddressesTotal = resp.total;

      jQuery.each(resp.macAddrs, function(idx) {
        var addrVals = resp.macAddrs[idx];
        addrVals['num'] = resp.offset + idx;
        addrVals['goldUsername'] = resp.goldUsername;
        data[from+idx] = addrVals;
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

  // RemoteMACAddressModel
  $.extend(true, window, {
    VB: {
      monitoring: {
        RemoteMACAddressModel: RemoteMACAddressModel
      }
    }
  });
})(jQuery);
