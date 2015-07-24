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
/* 
 * monitoring.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.monitoring == 'undefined') {
  VB.monitoring = {};
}

VB.monitorTable;
VB.monitoring.searchString = "";
VB.monitoring.serversColumnList = ['serverAddr', 'serverId', 'currentSessions', 'reservedSessions', 'cpuUtil', 'memUtil', 'memThreshold', 'status'];
VB.monitoring.branchServersColumnList = ['clusterName', 'serverAddr', 'serverId', 'currentSessions', 'reservedSessions', 'cpuUtil', 'memUtil', 'timestamp'];
VB.monitoring.serversSearchColumns = ['serverAddr', 'serverId', 'currentSessions', 'reservedSessions', 'cpuUtil', 'memUtil', 'memThreshold', 'status'];
VB.monitoring.serversEventColumns = ['severity', 'timestamp', 'type', 'server', 'mutableTags', 'info'];
VB.monitoring.sessionEventColumns = ['severity', 'timestamp', 'type', 'server', 'username', 'goldMaster', 'deploymentMode', 'organization', 'info'];
VB.monitoring.userEventColumns = ['severity', 'timestamp', 'type', 'username', 'leafServer', 'organization', 'info'];
VB.monitoring.auditEventColumns = ['severity', 'date', 'action', 'actor', 'objName', 'objValue'];
VB.monitoring.sessionsColumnList = ['sessionStartTime', 'serverAddr', 'title', 'organization', 'rui', 'spi', 'username', 'computerName', 'guestIP', 'macAddress', 'protocol', 'status'];
VB.monitoring.sessionsSearchColumns = ['username', 'title', 'sessionStartTime', 'rui', 'spi', 'computerName', 'guestIP', 'macAddress'];
VB.monitoring.ruiColumns = ['cpuUsage', 'cpuPerThread', 'ramSize', 'dispKbps', 'tapRKbps', 'tapXKbps'];
VB.monitoring.ruiColumnUnits = {'cpuUsage': '%', 'cpuPerThread': '%', 'ramSize': 'KB', 'dispKbps': 'Kbps', 'tapRKbps': 'Kbps', 'tapXKbps': 'Kbps'};
VB.monitoring.spiColumns = ['sessCPU', 'sessMem', 'sessSwappiness', 'sessSysDisk', 'sessUserDisk'];
VB.monitoring.macAddressesColumns = ['formattedMACAddress', 'imagename', 'username', 'organization', 'computerName', 'guestIP', 'serverAddr', 'sessionStartTime'];
VB.monitoring.gridDataView;
VB.monitoring.timoutHandle;
VB.monitoring.serverEventsColMap;
VB.monitoring.serverEventsTotal;
VB.monitoring.userEventsColMap;
VB.monitoring.auditEventsColMap;
VB.monitoring.auditEventsTotal;
VB.monitoring.userEventsTotal;
VB.monitoring.userEventsTotal;
VB.monitoring.userEventsColMap;
VB.monitoring.sessionEventsTotal;
VB.monitoring.sessionEventsTotal;
VB.monitoring.macAddressesTotal;
VB.monitoring.sessionEventsColMap;

VB.monitoring.toggleServer = function(event, serverId, status, ts) {

  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
  }

  var offlineServerIds = "";
  var onlineServerIds = "";
  var rowIds = [];
  if (serverId == undefined) {
    var rows = VB.monitorTable.getSelectedRows();
    jQuery.each(rows, function(idx) {
      rowIds.push(this);
      var item = VB.monitorTable.getDataItem(this); 
      status = item.status;
      if (status == "ONLINE") {
        offlineServerIds += '&serverId='+item.serverId;
      }
      else {
        onlineServerIds += '&serverId='+item.serverId;   
      }      
    });
  }

  var toggle = VB.i18n.toggle;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[toggle] = function() {
    if (offlineServerIds.length > 0) {
      var url = VB.appCtx+'monitoring/offlineServer';
      jQuery.ajax({
        url: url,
        data: offlineServerIds,
        type: 'post',
        async: false
      });        
    }  
    if (onlineServerIds.length > 0) {
      url = VB.appCtx+'monitoring/onlineServer';
      jQuery.ajax({
        url: url,
        data: onlineServerIds,
        type: 'post',
        async: false
      });        
    }          
    VB.monitorTable.setSelectedRows([]);
    setTimeout(function() {
    VB.monitoring.requestServerData();
    }, 500);
    jQuery(this).dialog('close');
    
    // block the checked row(s) and any that are already blocked 
    // due to a pending operation
    var previousData = VB.monitoring.gridDataView.getItems();
    var itemsWithOps = jQuery.grep(previousData, function(n, i) {
        return n.operation
    });  
    jQuery.each(itemsWithOps, function(idx) {
        rowIds.push(this.id);
    })
//    VB.monitoring.blockServer(rowIds);
    
  };
  buttonsObj[cancel] = function() {
    jQuery(this).dialog('close');
  };
  
  jQuery("#dialog-confirm").dialog({
    resizable: false,
    height:'auto',
    modal: true,
    buttons: buttonsObj
  });
}

VB.monitoring.blockServer = function(rows) {
  
    var changes = {}
  
    jQuery.each(rows, function(idx) {
        
        // set operation flag for this row
        var rowItem = VB.monitorTable.getDataItem(this);
        rowItem['operation'] = true;
        
        // block the row
        var row = jQuery('div[row="'+this+'"]');
        row.block({
            message: null,
            timeout: 0
        });
        
        // highlight the row columns
        changes[this] = {};
        changes[this]['_checkbox_selector'] = 'operation';
        for (var column in VB.monitoring.serversColumnList) {
            changes[this][VB.monitoring.serversColumnList[column]] = 'operation';
        }
        
    });  
    
    VB.monitorTable.setCellCssStyles('highlight', changes);
    VB.monitorTable.render();    
}

VB.monitoring.unblockServer = function(rows) {
  
    jQuery.each(rows, function(idx) {
        
        // remove highlight class and the row
        VB.monitorTable.removeCellCssStyles('highlight');
        VB.monitorTable.invalidateRows([this])
        VB.monitorTable.render();
        
    });  
}

VB.monitoring.blockSession = function(rows) {
  
    var changes = {}
  
    jQuery.each(rows, function(idx) {
        
        // set operation flag for this row
        var rowItem = VB.monitorTable.getDataItem(this);
        rowItem['operation'] = true;
        
        // block the row
        var row = jQuery('div[row="'+this+'"]');
        row.block({
            message: null,
            timeout: 0
        });
        
        // highlight the row columns
        changes[this] = {};
        changes[this]['_checkbox_selector'] = 'operation';
        for (var column in VB.monitoring.sessionsColumnList) {
            changes[this][VB.monitoring.sessionsColumnList[column]] = 'operation';
        }
        
    });  
    
    VB.monitorTable.setCellCssStyles('highlight', changes);
    VB.monitorTable.render();    
}

VB.monitoring.unblockSession = function(rows) {
  
    jQuery.each(rows, function(idx) {
        
        // remove highlight class and the row
        VB.monitorTable.removeCellCssStyles('highlight');
        VB.monitorTable.invalidateRows([this])
        VB.monitorTable.render();
        
    });  
}

VB.monitoring.shutdownSession = function(event) {

  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
  }

  var rows = VB.monitorTable.getSelectedRows();
  var sessionUID = '';
  var rowIds = [];
  
  jQuery.each(rows, function(idx) {
    rowIds.push(this);
    var item = VB.monitorTable.getDataItem(this);
    sessionUID = sessionUID + "&sessionUID=" + item.uid
  });

  var shutdown = VB.i18n.shutdown;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[shutdown] = function() {
        var url = VB.appCtx+'monitoring/shutdownSession';
        jQuery.ajax({
          url: url,
          data: sessionUID,
          type: 'post',
          async: false
        });
        VB.monitorTable.setSelectedRows([]);
        setTimeout(function() {
          VB.monitoring.requestSessionData();
        }, 500);
        jQuery(this).dialog('close');
        
        // block the checked row(s) and any that are already blocked 
        // due to a pending operation
        var previousData = VB.monitoring.gridDataView.getItems();
        var itemsWithOps = jQuery.grep(previousData, function(n, i) {
            return n.operation
        });  
        jQuery.each(itemsWithOps, function(idx) {
            rowIds.push(this.id);
        })
//        VB.monitoring.blockSession(rowIds);        
        
      };
  buttonsObj[cancel] = function() {
        jQuery(this).dialog('close');
      };
  jQuery("#dialog-confirm-shutdown").dialog({
    resizable: false,
    height:'auto',
    modal: true,
    buttons: buttonsObj
  });
}

VB.monitoring.abortSession = function(event) {

  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
  }

  var rows = VB.monitorTable.getSelectedRows();
  var sessionUID = '';
  var rowIds = [];
  
  jQuery.each(rows, function(idx) {
    rowIds.push(this);
    var item = VB.monitorTable.getDataItem(this);
    sessionUID = sessionUID + "&sessionUID=" + item.uid
  });

  var abort = VB.i18n.abort;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[abort] = function() {
        var url = VB.appCtx+'monitoring/abortSession';
        jQuery.ajax({
          url: url,
          data: sessionUID,
          type: 'post',
          async: false
        });
        VB.monitorTable.setSelectedRows([]);
        setTimeout(function() {
          VB.monitoring.requestSessionData();
        }, 500);
        jQuery(this).dialog('close');
        
        // block the checked row(s) and any that are already blocked 
        // due to a pending operation
        var previousData = VB.monitoring.gridDataView.getItems();
        var itemsWithOps = jQuery.grep(previousData, function(n, i) {
            return n.operation
        });  
        jQuery.each(itemsWithOps, function(idx) {
            rowIds.push(this.id);
        })
//        VB.monitoring.blockSession(rowIds);         
        
      };
  buttonsObj[cancel] = function() {
        jQuery(this).dialog('close');
      };
  jQuery("#dialog-confirm-abort").dialog({
    resizable: false,
    height:'auto',
    modal: true,
    buttons: buttonsObj
  });
}

VB.monitoring.revertSession = function(event) {

  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
  }

  var rows = VB.monitorTable.getSelectedRows();
  var sessionUID = '';
  var rowIds = [];
  
  jQuery.each(rows, function(idx) {
    rowIds.push(this);
    var item = VB.monitorTable.getDataItem(this);
    sessionUID = sessionUID + "&sessionUID=" + item.uid
  });

  var revert = VB.i18n.revert;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[revert] = function() {
        var url = VB.appCtx+'monitoring/revertSession';
        jQuery.ajax({
          url: url,
          data: sessionUID,
          type: 'post',
          async: false
        });
        VB.monitorTable.setSelectedRows([]);
        setTimeout(function() {
          VB.monitoring.requestSessionData();
        }, 500);
        jQuery(this).dialog('close');
        
        // block the checked row(s) and any that are already blocked 
        // due to a pending operation
        var previousData = VB.monitoring.gridDataView.getItems();
        var itemsWithOps = jQuery.grep(previousData, function(n, i) {
            return n.operation
        });  
        jQuery.each(itemsWithOps, function(idx) {
            rowIds.push(this.id);
        })
//        VB.monitoring.blockSession(rowIds);         
        
      };
  buttonsObj[cancel] = function() {
        jQuery(this).dialog('close');
      };
  jQuery("#dialog-confirm-revert").dialog({
    resizable: false,
    height:'auto',
    modal: true,
    buttons: buttonsObj
  });
}

VB.monitoring.removeBranchServer = function(event, uuid) {

  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
  }

  // TODO: Temporary solution until the
  // service methods can accept a list.
  if (uuid == undefined) {
    var rows = VB.monitorTable.getSelectedRows();
    var item = VB.monitorTable.getDataItem(rows[0]);
    if (item == undefined) {
      // This shouldn't occur.
      jQuery.jGrowl(VB.i18n.no_selection, {theme: 'warn'});
      return;
    }
    uuid = item.uuid;
  }

  var remove = VB.i18n.remove;
  var cancel = VB.i18n.cancel;

  var buttonsObj = new Object();
  buttonsObj[remove] = function() {
    var url = VB.appCtx+'monitoring/removeBranchServer';
    jQuery.ajax({
      url: url,
      data: 'uuid='+uuid,
      type: 'post',
      async: false
    });
    VB.monitorTable.setSelectedRows([]);
    jQuery(this).dialog('close');
    window.location.reload(true);
  };
  buttonsObj[cancel] = function() {
    jQuery(this).dialog('close');
  };

  jQuery("#dialog-confirm").dialog({
    resizable: false,
    height:'auto',
    modal: true,
    buttons: buttonsObj
  });

}

VB.monitoring.filterSessionGrid = function(item) {
  var found = false;
  if (VB.monitoring.searchString != "") {
    jQuery.each(VB.monitoring.sessionsSearchColumns, function(idx) {
      var col = VB.monitoring.sessionsSearchColumns[idx];
      var itemStr;
      if (col == 'sessionStartTime') {
        var dObj = new Date(item[col] * 1000);
        itemStr =  dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
          " " +
          dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");        
      }
      else {
        itemStr = item[col].toString();
      }
      if (itemStr.indexOf(VB.monitoring.searchString) >= 0) {
        found = true;
      }
    });
  }
  return found;
}

VB.monitoring.filterServerGrid = function(item) {
  var found = false;
  if (VB.monitoring.searchString != "") {
    jQuery.each(VB.monitoring.serversSearchColumns, function(idx) {
      var col = VB.monitoring.serversSearchColumns[idx];
      var itemStr = item[col].toString();
      if (itemStr.indexOf(VB.monitoring.searchString) >= 0) {
        found = true;
      }
    });
  }
  return found;
}

VB.monitoring.revokeMACAddress = function(event) {

  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
  }

  var items = [];
  var rows = VB.monitorTable.getSelectedRows();
  jQuery.each(rows, function(idx) {
    var item = VB.monitorTable.getDataItem(this);
    if (item) {
      items.push(item.id);  
    }
  });

  var revert = VB.i18n.revoke;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[revert] = function() {
      var url = VB.appCtx+'monitoring/revokeMACAddress';
      jQuery.ajax({
        url: url,
        data: 'id='+items,
        type: 'post'
      });
      VB.monitorTable.setSelectedRows([]);
      setTimeout(function() {
        VB.monitoring.initMACAddresses();
      }, 500);
      jQuery(this).dialog('close');
    };
  buttonsObj[cancel] = function() {
        jQuery(this).dialog('close');
      };
  jQuery("#dialog-confirm-revoke").dialog({
    resizable: false,
    height:'auto',
    modal: true,
    buttons: buttonsObj
  });
}

VB.monitoring.toggleFilterRow = function() {
    var grid = VB.monitorTable;
    if (jQuery(grid.getTopPanel()).is(":visible"))
        grid.hideTopPanel();
    else
        grid.showTopPanel();
}


VB.monitoring.initSessions = function(timestamp) {
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('[id^="action"]').button({disabled: true});
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.requestSessionData(timestamp);
}

VB.monitoring.requestSessionData = function(timestamp) {
  var url = VB.appCtx+'monitoring/listSessions';
  jQuery.ajax({
    url: url,
    data: 'timestamp='+timestamp,
    type: "post",
    dataType: 'json',
    complete: VB.monitoring.handleSessionResponse
  });
}

VB.monitoring.handleSessionResponse = function(xhr) {

  try {
    var json = jQuery.parseJSON(xhr.responseText);
  }
  catch (e) {
    return;
  }

  if (!json.sessions) {
    jQuery.jGrowl(VB.i18n.server_error, {theme: 'error'});
    return;
  }

  var timestamp = json.timestamp;

  // exit if we're no longer on the right page
  if (!jQuery('#'+timestamp)[0]) {
    return;
  }

  sessionStartTimeFormatter = function(row, cell, value, columnDef, dataContext) {
    var dObj = new Date(value * 1000);
    return dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
      " " +
      dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
  }
  sessionStatusFormatter = function(row, cell, value, columnDef, dataContext) {

    var statusStr = dataContext.status;
    var displayStr = VB.i18n['status_'+statusStr.toLowerCase()];
    return '<span class="sessionStatus">' + displayStr + '</span>';
  }
  usernameFormatter = function(row, cell, value, columnDef, dataContext) {
    if (dataContext.username == 'pool-mgr') {
      return ''
    }
    else if (value === null) {
      return dataContext.userId
    }
    else {
      return value;
    }
  }
  
  ruiFormatter = function(row, cell, value, columnDef, dataContext) {
    var anchorStr = '<a href=\"#\" class=\"ruiTip\" rel=\"modalDiv'+row+'\" title=\"'+VB.i18n.rui_title+'\">'+Math.round(value)+'</a>';
    return anchorStr;
  }
  
  spiFormatter = function(row, cell, value, columnDef, dataContext) {
    var anchorStr = '<a href=\"#\" class=\"spiTip\" rel=\"modalDiv'+row+'\" title=\"'+VB.i18n.spi_title+'\">'+value+'</a>';
    return anchorStr;
  }
  
  imageFormatter = function(row, cell, value, columnDef, dataContext) {
    var orgId = dataContext.orgImage;
    if (orgId == "0") {
        return value + " (global)";
    }
    else {
        return value;
    }
  }   
  
  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }
     
  var sortcol = "";
  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.monitoring.sessionsColumnList;

  var checkboxSelector = new Slick.CheckboxSelectColumn({
    cssClass: "slick-cell-checkboxsel"
  });
  var checkbox_column = checkboxSelector.getColumnDefinition();
  columns.push(checkbox_column);
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  userColumnList.push(checkbox_column);
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-sessions-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  // hide columns by default: macAddress, organization
  if (userColumns.length == 0) {
    var tmpColumns = VB.monitoring.sessionsColumnList;
    for (var k = 0; k < tmpColumns.length; k++) {
      if (tmpColumns[k] != 'macAddress' && tmpColumns[k] != 'organization') {
        userColumns.push(tmpColumns[k]);
      }
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = json.columnMap[key];
    if (key != 'class' && key != 'userId' && key.lastIndexOf('_tooltip') < 0) {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'sessionStartTime') {
        obj['formatter'] = sessionStartTimeFormatter;
        obj['width'] = 100;
      }
      if (key == 'serverAddr') {
        obj['width'] = 75;
      }    
      if (key == 'rui') {
        obj['formatter'] = ruiFormatter;
        obj['width'] = 45;
      }
      if (key == 'spi') {
        obj['formatter'] = spiFormatter;
        obj['width'] = 45;
      }      
      if (key == 'username') {
        obj['formatter'] = usernameFormatter;
      }
      if (key == 'computerName') {
        obj['width'] = 80;
      }
      if (key == 'guestIP') {
        obj['width'] = 75;
      }
      if (key == 'macAddress') {
        obj['width'] = 90;
      }
      if (key == 'protocol') {
        obj['width'] = 50;
      }
      if (key == 'status') {
        obj['formatter'] = sessionStatusFormatter;
        obj['width'] = 220;
      }
      if (key == 'title') {
        obj['formatter'] = imageFormatter;
      }
      obj['toolTip'] = json.columnMap[key+'_tooltip'];
      userColumnList.push(obj);
    }
  });   

  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = json.columnMap[key];
    if (key != 'class' && key != 'userId' && key.lastIndexOf('_tooltip') < 0) {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'sessionStartTime') {
        obj['formatter'] = sessionStartTimeFormatter;
        obj['width'] = 100;
      }
      if (key == 'serverAddr') {
        obj['width'] = 75;
      }     
      if (key == 'rui') {
        obj['formatter'] = ruiFormatter;
        obj['width'] = 45;
      }
      if (key == 'spi') {
        obj['formatter'] = spiFormatter;
        obj['width'] = 45;
      }
      if (key == 'username') {
        obj['formatter'] = usernameFormatter;
      }
      if (key == 'computerName') {
        obj['width'] = 80;
      }
      if (key == 'guestIP') {
        obj['width'] = 75;
      }
      if (key == 'macAddress') {
        obj['width'] = 90;
      }
      if (key == 'protocol') {
        obj['width'] = 50;
      }
      if (key == 'status') {
        obj['formatter'] = sessionStatusFormatter;
        obj['width'] = 220;
      }
      if (key == 'title') {
        obj['formatter'] = imageFormatter;
      }      
      obj['toolTip'] = json.columnMap[key+'_tooltip'];
      columns.push(obj);
    }
  });

  var data = [];
  jQuery.each(json.sessions, function(idx) {
    var sessionVals = json.sessions[idx].session;
    var statusStr = json.sessions[idx].displayStatus;
    sessionVals['organization'] = json.sessions[idx].session.organization.name;
    sessionVals['protocol'] = json.sessions[idx].session.protocol ? json.sessions[idx].session.protocol.name : ''
    sessionVals['status'] = statusStr;
    sessionVals['id'] = idx;
    sessionVals['num'] = idx;
    sessionVals['orgImage'] = json.sessions[idx].imageOrg;
    data.push(sessionVals);
  });

  var grid;
  var options = {
    editable: true,
    autoEdit: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    asyncEditorLoading: true,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 30,
    topPanelHeight: 30,
    rowHeight:25
  };
//  if (data.length < 20) {
//    jQuery('#grid').height(26*(data.length+1));
//  }
//  else {
    jQuery('#grid').height(526);
//  }
  if (VB.monitorTable) {
      
    var previousData = VB.monitoring.gridDataView.getItems();
    var itemsWithOps = jQuery.grep(previousData, function(n, i) {
        return n.operation
    });
    var blockSession = [];
    var unblockSession = [];
    jQuery.each(itemsWithOps, function(idx) {
      var opItem = this;
      blockSession = jQuery.grep(data, function(n, i) {
          return (n.sessionId == opItem.sessionId && n.status == opItem.status);
      });
      unblockSession = jQuery.grep(data, function(n, i) {
          return (n.sessionId == opItem.sessionId && n.status != opItem.status);
      });      
      if (blockSession.length > 0) {
          for (var i = 0; i < blockSession.length; i++) {
              data[blockSession[i].id]['operation'] = true
          }
      }     
    });      
      
    selectedRowIds = VB.monitorTable.getSelectedRows();
    var sortAsc = VB.monitorTable.sorted;
    VB.monitoring.gridDataView.setItems(data);
    VB.monitoring.gridDataView.setPagingOptions({pageSize:20});
    if (sortAsc != undefined) {
      VB.monitorTable.trigger(VB.monitorTable.onSort, {sortAsc:sortAsc});
    }
    
    if (blockSession.length > 0) {
        var ids = [];
        for (var i = 0; i < blockSession.length; i++) {
          ids.push(blockSession[i].id)  
        }
//        VB.monitoring.blockSession(ids);
    }
    if (unblockSession.length > 0) {
        var ids1 = [];
        for (var l = 0; l < unblockSession.length; l++) {
            ids1.push(unblockSession[l].id)
        }
//        VB.monitoring.unblockSession(ids1);
    }     
    
    VB.monitorTable.setSelectedRows(selectedRowIds);
    VB.styleSessionRUIUtil();
    VB.styleSessionSPIUtil();
  }
  else {

    var dataView = new Slick.Data.DataView();
    VB.monitoring.gridDataView = dataView;
    dataView.setItems(data);
    dataView.setPagingOptions({pageSize:20});
    grid = new Slick.Grid(jQuery("#grid"), dataView, columns, options);
    new Slick.Controls.VBColumnPicker(columns, grid, options);
    if (userColumnList.length > 1) {
      grid.setColumns(userColumnList);
    }      
    grid.autosizeColumns();
    var selectionModel = new Slick.RowSelectionModel({selectActiveRow:false});
    grid.setSelectionModel(selectionModel);
    grid.registerPlugin(checkboxSelector);
    var attPlugin = new Slick.AutoTooltips();
    grid.registerPlugin(attPlugin);
    grid['sorted'] = undefined;
    VB.monitorTable = grid;
    VB.styleSessionRUIUtil();
    VB.styleSessionSPIUtil();

    var pager = new Slick.Controls.Pager(dataView, grid, jQuery("#pager"));

    // Selecting a row in the grid enables the action buttons.
    // Disable action buttons if no rows are selected.
    selectionModel.onSelectedRangesChanged.subscribe(function(e, args) {
      var rows = selectionModel.getSelectedRows();
      var btn = jQuery('[id^="action"]');
      if (rows.length == 0) {
        btn.button({disabled: true});
      }
      else if (btn[0].title != VB.i18n.no_perm) {
        btn.button({disabled: false});
      }
      VB.styleSessionRUIUtil();
      VB.styleSessionSPIUtil();
    });

    grid.onSort.subscribe(function(e, args) {

      if (args.sortCol)
        sortcol = args.sortCol.field;

      // remember selected rows before sort
      var rows = VB.monitorTable.getSelectedRows();
      var items = [];
      jQuery.each(rows, function(idx) {
        items.push(VB.monitorTable.getDataItem(this))  
      });

      // using native sort with comparer
      // preferred method but can be very slow in IE with huge datasets
      dataView.sort(comparer, args.sortAsc);
      VB.monitorTable.sorted = args.sortAsc;
      grid.invalidateAllRows();
      grid.render();

      // If we had a row selection before the sort, restore it
      var restoreRows = [];
      jQuery.each(items, function(idx) {
        restoreRows.push(VB.monitoring.gridDataView.getRowById(this));   
      });
      VB.monitorTable.setSelectedRows(restoreRows);
      
      VB.styleSessionRUIUtil();
      VB.styleSessionSPIUtil();

    });

    dataView.onPagingInfoChanged.subscribe(function(pagingInfo) {
      VB.monitorTable.setSelectedRows([]);
      dataView.refresh();
      grid.invalidateAllRows();
      grid.render();
      VB.styleSessionRUIUtil();
      VB.styleSessionSPIUtil();
    });

    // wire up the search textbox to apply the filter to the model
    jQuery("#txtSearch,#txtSearch2").keyup(function(e) {
              Slick.GlobalEditorLock.cancelCurrentEdit();

      // clear on Esc
      if (e.which == 27)
        this.value = "";

      VB.monitoring.searchString = this.value;
      if (this.value != "") {
        dataView.setFilter(VB.monitoring.filterSessionGrid);
      }
      else {
        dataView.setFilter();
      }
      VB.styleSessionRUIUtil();
      VB.styleSessionSPIUtil();
    });

  }
  jQuery('.ruiTip').cluetip({
    width: 300,
    closePosition: 'bottom',
    closeText: VB.i18n.close,
    cluezIndex: 5000,
    local: true,
    cluetipClass: 'rounded',
    dropShadow: false,
    arrows: true,
    showTitle: false,
    sticky: false,
    mouseOutClose: true,
    cursor: 'pointer',
    fx:     {open: 'fadeIn', openSpeed: '600'},
//    hoverIntent: {
//      sensitivity: 3,
//      interval:    50,
//      timeout:     0
//    },    
    onActivate: function(event){
      var rowId = event.attr('rel').substring(8);
      VB.monitoring.loadRUI(rowId);
      return true;
    },
    onShow:function(ct, ci){
      var div = jQuery('#'+this.rel);
      div.css('display', 'block');
      ci.before(div);
      jQuery('table.ruiData td.ruiDataVal').heatcolor(
        function() {return jQuery("span.ruiDataVal", this).text();},
        {lightness: 0.3,
          colorStyle: 'greentored',
          maxval: 100,
          minval: 0,
          reverseOrder: true
        }
      );      
    },
    onHide:function(ct, ci){
      jQuery('[id^="modalDiv"]').remove();
    }
  });  

  jQuery('.spiTip').cluetip({
    width:300,
    closePosition: 'bottom',
    closeText: VB.i18n.close,
    cluezIndex: 5000,
    local: true,
    cluetipClass: 'rounded',
    dropShadow: false,
    arrows: true,
    showTitle: false,
    sticky: false,
    mouseOutClose: true,
    cursor: 'pointer',
    fx:     {open: 'fadeIn', openSpeed: '600'},
//    hoverIntent: {
//      sensitivity: 3,
//      interval:    50,
//      timeout:     0
//    },    
    onActivate: function(event){
      var rowId = event.attr('rel').substring(8);
      VB.monitoring.loadSPI(rowId);
      return true;
    },
    onShow:function(ct, ci){
      var div = jQuery('#'+this.rel);
      div.css('display', 'block');
      ci.before(div);
      jQuery('table.spiData td').heatcolor(
        function() {return jQuery("span.spiDataVal", this).text();},
        {lightness: 0.3,
          colorStyle: 'greentored',
          maxval: 100,
          minval: 0,
          reverseOrder: true
        }
      );     
    },
    onHide:function(ct, ci){
      jQuery('[id^="modalDiv"]').remove();
    }    
  });
  
  setTimeout(function() {
    VB.monitoring.requestSessionData(timestamp);
  }, 10000);
}

VB.monitoring.loadRUI = function(rowId) {
  jQuery('[id^="modalDiv"]').remove();
  var rowData = VB.monitorTable.getDataItem(rowId);
  var dataTbl = "<table class=\'ruiData\'>";
  for (var prop in rowData) {
    if (jQuery.inArray(prop, VB.monitoring.ruiColumns) > -1) {
      var className = "";
      if (VB.monitoring.ruiColumnUnits[prop] == '%') {
        className = "ruiDataVal";
      }
      dataTbl = dataTbl + "<tr><td class=\""+className+"\">"+VB.i18n[prop]+":&nbsp;<span class=\""+className+"\">"+rowData[prop]+"</span>&nbsp;"+VB.monitoring.ruiColumnUnits[prop]+"</td></tr>";  
    }
  }
  dataTbl = dataTbl + "</table>";
  var $dialog = jQuery('<div style="display:none;" id="modalDiv'+rowId+'"></div>').append(dataTbl);
  jQuery("body").append($dialog);  
}

VB.monitoring.loadSPI = function(rowId) {
  jQuery('[id^="modalDiv"]').remove();
  var rowData = VB.monitorTable.getDataItem(rowId);
  var dataTbl = "<table class=\'spiData\'>";
  for (var prop in rowData) {
    if (jQuery.inArray(prop, VB.monitoring.spiColumns) > -1) {  
      dataTbl = dataTbl + "<tr><td>"+VB.i18n[prop]+":&nbsp;<span class=\"spiDataVal\">"+rowData[prop]+"</span>%</td></tr>";
    }
  }
  dataTbl = dataTbl + "</table>";
  var $dialog = jQuery('<div style="display:none;" id="modalDiv'+rowId+'"></div>').append(dataTbl);
  jQuery("body").append($dialog);  
}

VB.monitoring.initMACAddresses = function() {
  jQuery('[id^="action"]').button({disabled: true});
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.getMACAddressesColMap();
  VB.monitoring.renderMACAddressesGrid();
}

VB.monitoring.getMACAddressesColMap = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'monitoring/getMACAddressesColMap',
    success: function(resp) {
      VB.monitoring.macAddressesColMap = resp.columnMap;
    },
    cache: false
  });
}

VB.monitoring.renderMACAddressesGrid = function() {

  timeFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value != '') {
      var dObj = new Date(value * 1000);
      return dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
        " " +
        dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
    }
  }
  
  imageFormatter = function(row, cell, value, columnDef, dataContext) {
    var orgId = dataContext.imageOrg.id;
    if (orgId == "0") {
        return value + " (global)";
    }
    else {
        return value;
    }
  }   

  organizationFormatter = function(row, cell, value, columnDef, dataContext) {
    return value.name;
  }
  
  usernameFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value == dataContext.goldUsername) {
        return ''
    }
    else if (value == 'pool-mgr') {
      return ''
    }
    else {
      return value.split("#")[0];
    }
  }  
  
  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }

  var grid;
  var loader = new VB.monitoring.RemoteMACAddressModel();
  var sortcol = "";
  var sortdir = 1;
  
  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.monitoring.macAddressesColumns;

  var checkboxSelector = new Slick.CheckboxSelectColumn({
    cssClass: "slick-cell-checkboxsel"
  });
  var checkbox_column = checkboxSelector.getColumnDefinition();
  columns.push(checkbox_column);
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  userColumnList.push(checkbox_column);
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-macAddresses-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = VB.monitoring.macAddressesColMap[key];
    if (key != 'class' && key != 'id') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      if (key != "formattedMACAddress" && key != "imagename" && key != "username") {
        obj['sortable'] = false;
      }
      else {
        obj['sortable'] = true;
      }
      if (key == "sessionStartTime") {
        obj['formatter'] = timeFormatter;
        obj['width'] = 110;
      } 
      if (key == 'imagename') {
        obj['formatter'] = imageFormatter;
      }
      if (key == 'username') {
        obj['formatter'] = usernameFormatter;
      }      
      if (key == 'organization') {
        obj['formatter'] = organizationFormatter;
      }      
      userColumnList.push(obj);
    }
  });  
  
  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = VB.monitoring.macAddressesColMap[key];
    if (key != 'class' && key != 'id') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      if (key != "formattedMACAddress" && key != "imagename" && key != "username") {
        obj['sortable'] = false;
      }
      else {
        obj['sortable'] = true;
      }
      if (key == "sessionStartTime") {
        obj['formatter'] = timeFormatter;
        obj['width'] = 110;
      }
      if (key == 'imagename') {
        obj['formatter'] = imageFormatter;
      }  
      if (key == 'username') {
        obj['formatter'] = usernameFormatter;
      }       
      if (key == 'organization') {
        obj['formatter'] = organizationFormatter;
      }        
      columns.push(obj);
    }
  });

  var options = {
    editable: true,
    autoEdit: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    asyncEditorLoading: true,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 25,
    rowHeight:25,
    topPanelHeight:30
  };
  
  jQuery('#grid').height(526);

  var loadingIndicator = null;
  grid = new Slick.Grid(jQuery("#grid"), loader.data, columns, options);
  new Slick.Controls.VBColumnPicker(columns, grid, options);
  if (userColumnList.length > 1) {
    grid.setColumns(userColumnList);
  }  
  grid.autosizeColumns();
  var selectionModel = new Slick.RowSelectionModel({selectActiveRow:false});
  grid.setSelectionModel(selectionModel);
  grid.registerPlugin(checkboxSelector);  
  var attPlugin = new Slick.AutoTooltips();
  grid.registerPlugin(attPlugin);
  grid['sorted'] = undefined;
  var skipRender = false;
  if (VB.monitorTable) {
    skipRender = true;
  }
  VB.monitorTable = grid;
  
  // Filtering controls for the grid

  var clrMacSearchBtn = jQuery('#searchControls button#clearMacSearch').button();
  clrMacSearchBtn.click(function(evt) {
    jQuery('#macSearch').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });  
  jQuery('#macSearch').keydown(function(evt) {
    if (evt.keyCode === jQuery.ui.keyCode.ENTER) {
      grid.invalidateAllRows();
      grid.updateRowCount();
      loader.clear();
      var vp = grid.getViewport();
      loader.reloadData(vp.top, vp.bottom);
      grid.resizeCanvas();
    }
  });
  jQuery('#macAddressPool').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  }); 
  var clrImageSearchBtn = jQuery('button#clearImageSearch').button();
  clrImageSearchBtn.click(function(evt) {
    jQuery('#imageSearch').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#imageSearch').keydown(function(evt) {
    if (evt.keyCode === jQuery.ui.keyCode.ENTER) {
      grid.invalidateAllRows();
      grid.updateRowCount();
      loader.clear();
      var vp = grid.getViewport();
      loader.reloadData(vp.top, vp.bottom);
      grid.resizeCanvas();
    }
  });  
  var clrUsernameSearchBtn = jQuery('button#clearUsernameSearch').button();
  clrUsernameSearchBtn.click(function(evt) {
    jQuery('#usernameSearch').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#usernameSearch').keydown(function(evt) {
    if (evt.keyCode === jQuery.ui.keyCode.ENTER) {
      grid.invalidateAllRows();
      grid.updateRowCount();
      loader.clear();
      var vp = grid.getViewport();
      loader.reloadData(vp.top, vp.bottom);
      grid.resizeCanvas();
    }
  });  
  
  if (!skipRender) {
    jQuery('#searchControls select').selectmenu({
        width:175,
        menuWidth:175,
        style:'dropdown'
    });      
  }   

  grid.onViewportChanged.subscribe(function() {
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

  grid.onSort.subscribe(function(e, args) {
    sortdir = args.sortAsc ? 1 : -1;
    sortcol = args.sortCol.field;
    loader.setSort(sortcol, sortdir);
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

  loader.onDataLoading.subscribe(function() {
    if (!loadingIndicator)
    {
      loadingIndicator = jQuery("<span class='loading-indicator'><label></label></span>").appendTo(document.body);
      var $g = jQuery("#grid");

      loadingIndicator
      .css("position", "absolute")
      .css("top", $g.position().top + $g.height()/2 - loadingIndicator.height()/2)
      .css("left", $g.position().left + $g.width()/2 - loadingIndicator.width()/2)
    }

    loadingIndicator.show();
  });

  loader.onDataLoaded.subscribe(function(args) {
    for (var i = args.from; i <= args.to; i++) {
      grid.invalidateRow(i);
    }

    grid.updateRowCount();
    grid.render();

    loadingIndicator.fadeOut();
  });
  
  // Selecting a row(s) in the grid enables the action button.
  // Disable action button if no rows are selected.
  selectionModel.onSelectedRangesChanged.subscribe(function(e, args) {
    var rows = selectionModel.getSelectedRows();
    var btn = jQuery('[id^="action"]');
    if (rows.length == 0) {
      btn.button({disabled: true});
    }
    else if (btn[0].title != VB.i18n.no_perm) {
      btn.button({disabled: false});
    }
  });  

  // load the first page
  grid.onViewportChanged.notify();
}

VB.monitoring.initServers = function(timestamp) {
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('[id^="action"]').button({disabled: true});
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.requestServerData(timestamp);
}

VB.monitoring.requestServerData = function(timestamp) {
  var url = VB.appCtx+'monitoring/listServers';
  jQuery.ajax({
    url: url,
    data: 'timestamp='+timestamp,
    type: "post",
    dataType: 'json',
    complete: VB.monitoring.handleServerResponse
  });
}

VB.monitoring.handleServerResponse = function(xhr) {

  try {
    var json = jQuery.parseJSON(xhr.responseText);
  }
  catch (e) {
    return;
  }

  if (!json.servers) {
    jQuery.jGrowl(VB.i18n.server_error, {theme: 'error'});
    return;
  }

  var timestamp = json.timestamp;

  // exit if we're no longer on the right page
  if (!jQuery('#'+timestamp)[0]) {
    return;
  }

  serverStatusFormatter = function(row, cell, value, columnDef, dataContext) {

    var statusStr = value;
    var displayStr = statusStr == 'OFFLINE' ? VB.i18n.status_offline : VB.i18n.status_online;
    var styleStr = statusStr == 'OFFLINE' ? 'serverStatusOff' : 'serverStatusOn';
    return '<span class="'+ styleStr +'">' + displayStr + '</span>';
  }
  
  cpuUtilFormatter = function(row, cell, value, columnDef, dataContext) {
    // round to 2 decimal places
    var fmt = Math.round(value * 100)/100;
    return fmt;
  }  

  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }
  
  var sortcol = "";
  var columns = [];
  var columnList = VB.monitoring.serversColumnList;
  var selectedRowIds = [];

  var checkboxSelector = new Slick.CheckboxSelectColumn({
    cssClass: "slick-cell-checkboxsel"
  });
  var checkbox_column = checkboxSelector.getColumnDefinition();
  columns.push(checkbox_column);
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  userColumnList.push(checkbox_column);
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-servers-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = json.columnMap[key];
    if (key != 'class' && key != 'serverId' && key.lastIndexOf('_tooltip') < 0) {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'status') {
        obj['formatter'] = serverStatusFormatter;
        obj['width'] = 60;
      }
      if (key == 'currentSessions' || key == 'reservedSessions') {
        obj['width'] = 50;
      }
      if (key == 'cpuUtil') {
        obj['width'] = 53;
        obj['formatter'] = cpuUtilFormatter;
      }
      if (key == 'memUtil' || key == 'ksmEfficiency') {
        obj['width'] = 53;
      }      
      if (key == 'memThreshold') {
        obj['width'] = 70;
      }
      obj['toolTip'] = json.columnMap[key+'_tooltip'];   
      userColumnList.push(obj);
    }
  });   

  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = json.columnMap[key];
    if (key != 'class' && key != 'serverId' && key.lastIndexOf('_tooltip') < 0) {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'status') {
        obj['formatter'] = serverStatusFormatter;
        obj['width'] = 60;
      }
      if (key == 'currentSessions' || key == 'reservedSessions') {
        obj['width'] = 50;
      }
      if (key == 'cpuUtil') {
        obj['width'] = 53;
        obj['formatter'] = cpuUtilFormatter;
      }
      if (key == 'memUtil' || key == 'ksmEfficiency') {
        obj['width'] = 53;
      }
      if (key == 'memThreshold') {
        obj['width'] = 70;
      }
      obj['toolTip'] = json.columnMap[key+'_tooltip'];
      columns.push(obj);
    }
  });

  var data = [];
  jQuery.each(json.servers, function(idx) {
    var serverVals = json.servers[idx];
    var statusStr = serverVals['status'].name;
    serverVals['status'] = statusStr;
    serverVals['id'] = idx;
    serverVals['num'] = idx;
    data.push(serverVals);
  });

  var grid;
  var options = {
    editable: true,
    autoEdit: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 30,
    topPanelHeight: 30,
    rowHeight:25
  };
  jQuery('#grid').height(526);
  if (VB.monitorTable) {
      
    var previousData = VB.monitoring.gridDataView.getItems();
    var itemsWithOps = jQuery.grep(previousData, function(n, i) {
        return n.operation
    });
    var blockServer = [];
    var unblockServer = [];
    jQuery.each(itemsWithOps, function(idx) {
      var opItem = this;
      blockServer = jQuery.grep(data, function(n, i) {
          return (n.serverId == opItem.serverId && n.status == opItem.status);
      });
      unblockServer = jQuery.grep(data, function(n, i) {
          return (n.serverId == opItem.serverId && n.status != opItem.status);
      });      
      if (blockServer.length > 0) {
          for (var i = 0; i < blockServer.length; i++) {
              data[blockServer[i].id]['operation'] = true
          }
      }     
    });
      
    selectedRowIds = VB.monitorTable.getSelectedRows();
    var sortAsc = VB.monitorTable.sorted;
    VB.monitoring.gridDataView.setItems(data);
    VB.monitoring.gridDataView.setPagingOptions({pageSize:20});
    if (sortAsc != undefined) {
      VB.monitorTable.trigger(VB.monitorTable.onSort, {sortAsc:sortAsc});
    }
    
    if (blockServer.length > 0) {
        var ids = [];
        for (var i = 0; i < blockServer.length; i++) {
          ids.push(blockServer[i].id)  
        }
//        VB.monitoring.blockServer(ids);
    }
    if (unblockServer.length > 0) {
        var ids1 = [];
        for (var k = 0; k < unblockServer.length; k++) {
            ids1.push(unblockServer[k].id)
        }
//        VB.monitoring.unblockServer(ids1);
    }    
       
    VB.monitorTable.setSelectedRows(selectedRowIds);
    VB.styleServerCpuUtil();
    VB.styleServerMemUtil();
  }
  else {

    var dataView = new Slick.Data.DataView();
    VB.monitoring.gridDataView = dataView;
    dataView.setItems(data);
    dataView.setPagingOptions({pageSize:20});
    grid = new Slick.Grid(jQuery("#grid"), dataView, columns, options);
    new Slick.Controls.VBColumnPicker(columns, grid, options);
    if (userColumnList.length > 1) {
      grid.setColumns(userColumnList);
    }    
    grid.autosizeColumns();
    var selectionModel = new Slick.RowSelectionModel({selectActiveRow:false});
    grid.setSelectionModel(selectionModel);
    grid.registerPlugin(checkboxSelector);
    var attPlugin = new Slick.AutoTooltips();
    grid.registerPlugin(attPlugin);
    grid['sorted'] = undefined;
    VB.monitorTable = grid;
    VB.styleServerCpuUtil();
    VB.styleServerMemUtil();

    var pager = new Slick.Controls.Pager(dataView, grid, jQuery("#pager"));
                
    // Selecting a row in the grid enables the action buttons.
    // Disable action buttons if no rows are selected.
    selectionModel.onSelectedRangesChanged.subscribe(function(e, args) {
      var rows = selectionModel.getSelectedRows();
      var btn = jQuery('[id^="action"]');
      if (rows.length == 0) {
        btn.button({disabled: true});
      }
      else if (btn[0].title != VB.i18n.no_perm) {
        btn.button({disabled: false});
      }
      VB.styleServerCpuUtil();
      VB.styleServerMemUtil();
    });            

    grid.onSort.subscribe(function(e, args) {

      if (args.sortCol)
        sortcol = args.sortCol.field;

      // remember selected rows before sort
      var rows = VB.monitorTable.getSelectedRows();
      var items = [];
      jQuery.each(rows, function(idx) {
        items.push(VB.monitorTable.getDataItem(this))  
      });

      // using native sort with comparer
      // preferred method but can be very slow in IE with huge datasets
      dataView.sort(comparer, args.sortAsc);
      VB.monitorTable.sorted = args.sortAsc;
      grid.invalidateAllRows();
      grid.render();

      // If we had a row selection before the sort, restore it
      var restoreRows = [];
      jQuery.each(items, function(idx) {
        restoreRows.push(VB.monitoring.gridDataView.getRowById(this));   
      });
      VB.monitorTable.setSelectedRows(restoreRows);

      VB.styleServerCpuUtil();
      VB.styleServerMemUtil();

    });

    dataView.onPagingInfoChanged.subscribe(function(pagingInfo) {
      VB.monitorTable.setSelectedRows([]);
      dataView.refresh();
      grid.invalidateAllRows();
      grid.render();
      VB.styleServerCpuUtil();
      VB.styleServerMemUtil();
    });

    // wire up the search textbox to apply the filter to the model
    jQuery("#txtSearch,#txtSearch2").keyup(function(e) {
              Slick.GlobalEditorLock.cancelCurrentEdit();

      // clear on Esc
      if (e.which == 27)
        this.value = "";

      VB.monitoring.searchString = this.value;
      if (this.value != "") {
        dataView.setFilter(VB.monitoring.filterServerGrid);
      }
      else {
        dataView.setFilter();
      }
      VB.styleServerCpuUtil();
      VB.styleServerMemUtil();
    });

  }
  setTimeout(function() {
    VB.monitoring.requestServerData(timestamp);
  }, 10000);
}

VB.monitoring.initBranchServers = function(timestamp) {
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('[id^="action"]').button({disabled: true});
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.requestBranchServerData(timestamp);
}

VB.monitoring.requestBranchServerData = function(timestamp) {
  var url = VB.appCtx+'monitoring/listBranchServers';
  jQuery.ajax({
    url: url,
    data: 'timestamp='+timestamp,
    type: "post",
    dataType: 'json',
    complete: VB.monitoring.handleBranchServerResponse
  });
}

VB.monitoring.handleBranchServerResponse = function(xhr) {

  try {
    var json = jQuery.parseJSON(xhr.responseText);
  }
  catch (e) {
    return;
  }

  if (!json.servers) {
    jQuery.jGrowl(VB.i18n.server_error, {theme: 'error'});
    return;
  }

  var timestamp = json.timestamp;

  // exit if we're no longer on the right page
  if (!jQuery('#'+timestamp)[0]) {
    return;
  }

  cmFQDNFormatter = function(row, cell, value, columnDef, dataContext) {
    return '<a href="'+dataContext.branchMCURL+'" target="_blank">'+value+'</a>';
  }

  cmFQDNActionHandler = function(args) {

    var $input;

    this.init = function() {
      var cellContents = args.column.formatter(0, 0, args.item.clusterName, args.column, args.item);
        $input = jQuery(cellContents)
          .appendTo(args.container)
          .bind("keydown.nav", function(e) {
            if (e.keyCode === jQuery.ui.keyCode.ENTER) {
              window.open(e.target.href);
            }
          });
        jQuery($input[0]).focus();
    };

    this.destroy = function() {};

    this.focus = function() {
        $input.focus();
    };

    this.getValue = function() {
        return $input.val();
    };

    this.setValue = function(val) {};

    this.loadValue = function(item) {};

    this.serializeValue = function() {
        return $input.val();
    };

    this.applyValue = function(item,state) {};

    this.isValueChanged = function() {
        return false;
    };

    this.validate = function() {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
  }

  timeFormatter = function(row, cell, value, columnDef, dataContext) {
    var dObj = new Date(Math.round(value / 1000));
    return dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
      " " +
      dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
  }

  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }
    
  var sortcol = "";
  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.monitoring.branchServersColumnList;

  var checkboxSelector = new Slick.CheckboxSelectColumn({
    cssClass: "slick-cell-checkboxsel"
  });
  var checkbox_column = checkboxSelector.getColumnDefinition();
  columns.push(checkbox_column);
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  userColumnList.push(checkbox_column);
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-branchServerEvents-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = json.columnMap[key];
    if (key != 'class' && key != 'serverId' && key.lastIndexOf('_tooltip') < 0) {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'uuid') {
        obj['formatter'] = serverRemoveFormatter;
        obj['sortable'] = false;
      }
      if (key == 'clusterName') {
        obj['formatter'] = cmFQDNFormatter;
        obj['sortable'] = false;
      }
      if (key == 'timestamp') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 100;
      }
      if (key == 'cpuUtil' ||
          key == 'memUtil' ||
          key == 'ksmEfficiency') {
        obj['width'] = 60;
      }
      if (key == 'currentSessions' ||
          key == 'reservedSessions') {
        obj['width'] = 50;
      }
      obj['toolTip'] = json.columnMap[key+'_tooltip'];      
      userColumnList.push(obj);
    }
  });   

  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = json.columnMap[key];
    if (key != 'class' && key != 'serverId' && key.lastIndexOf('_tooltip') < 0) {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'uuid') {
        obj['formatter'] = serverRemoveFormatter;
        obj['sortable'] = false;
      }
      if (key == 'clusterName') {
        obj['formatter'] = cmFQDNFormatter;
        obj['sortable'] = false;
      }
      if (key == 'timestamp') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 100;
      }
      if (key == 'cpuUtil' ||
          key == 'memUtil' ||
          key == 'ksmEfficiency') {
        obj['width'] = 60;
      }
      if (key == 'currentSessions' ||
          key == 'reservedSessions') {
        obj['width'] = 50;
      }
      obj['toolTip'] = json.columnMap[key+'_tooltip'];
      columns.push(obj);
    }
  });

  var data = [];
  jQuery.each(json.servers, function(idx) {
    var serverVals = json.servers[idx];
    serverVals['id'] = idx;
    serverVals['num'] = idx;
    serverVals['branchMCURL'] = json.branchMCURLToken.replace(/\@/, serverVals.clusterName);
    data.push(serverVals);
  });

  var grid;
  var options = {
    editable: true,
    autoEdit: false,
	enableCellNavigation: true,
	enableColumnReorder: false,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 30,
    topPanelHeight: 30,
    rowHeight:25
  };
//  if (data.length < 20) {
//    jQuery('#grid').height(26*(data.length+1));
//  }
//  else {
    jQuery('#grid').height(526);
//  }
  if (VB.monitorTable) {
    selectedRowIds = VB.monitorTable.getSelectedRows();
    var sortAsc = VB.monitorTable.sorted;
    VB.monitoring.gridDataView.setItems(data);
    VB.monitoring.gridDataView.setPagingOptions({pageSize:20});
    if (sortAsc != undefined) {
      VB.monitorTable.trigger(VB.monitorTable.onSort, {sortAsc:sortAsc});
    }
    VB.monitorTable.setSelectedRows(selectedRowIds);
    VB.styleBranchServerCpuUtil();
  }
  else {

    var dataView = new Slick.Data.DataView();
    VB.monitoring.gridDataView = dataView;
    dataView.setItems(data);
    dataView.setPagingOptions({pageSize:20});
    grid = new Slick.Grid(jQuery("#grid"), dataView, columns, options);
    new Slick.Controls.VBColumnPicker(columns, grid, options);
    if (userColumnList.length > 1) {
      grid.setColumns(userColumnList);
    }    
    grid.autosizeColumns();
    var selectionModel = new Slick.RowSelectionModel({selectActiveRow:false});
    grid.setSelectionModel(selectionModel);
    grid.registerPlugin(checkboxSelector);
    var attPlugin = new Slick.AutoTooltips();
    grid.registerPlugin(attPlugin);
    grid['sorted'] = undefined;
    VB.monitorTable = grid;
    VB.styleBranchServerCpuUtil();

    var pager = new Slick.Controls.Pager(dataView, grid, jQuery("#pager"));

    // Selecting a row in the grid enables the action buttons.
    // Disable action buttons if no rows are selected.
    selectionModel.onSelectedRangesChanged.subscribe(function(e, args) {
      var rows = selectionModel.getSelectedRows();
      var btn = jQuery('[id^="action"]');
      if (rows.length == 0) {
        btn.button({disabled: true});
      }
      else if (rows.length > 1) {
        // TODO: This is temporary.  Remove when the
        // service method can accept a list of multiple servers.
        jQuery.jGrowl(VB.i18n.single_selection, {theme: 'warn'});
        jQuery('[id^="action"]').button({disabled: true});
      }      
      else if (btn[0].title != VB.i18n.no_perm) {
        btn.button({disabled: false});
      }      
      VB.styleServerCpuUtil();
      VB.styleServerMemUtil();
    });

    grid.onKeyDown.subscribe(function(e) {
      if (e.which == 13) {
        var cell = VB.monitorTable.getCellFromEvent(e);
        jQuery('a', cell).click();
        return true;
      }
      return false;
    });

    grid.onSort.subscribe(function(e, args) {

      if (args.sortCol)
        sortcol = args.sortCol.field;

      // This only supports one row selection at a time.
      // Find the selected row, if any
      var rows = VB.monitorTable.getSelectedRows();
      if (rows)
        var item = VB.monitorTable.getDataItem(rows[0]);

      // using native sort with comparer
      // preferred method but can be very slow in IE with huge datasets
      dataView.sort(comparer, args.sortAsc);
      VB.monitorTable.sorted = args.sortAsc;
      grid.invalidateAllRows();
      grid.render();

      // If we had a row selection before the sort, restore it
      if (rows.length > 0) {
        var row = VB.monitoring.gridDataView.getRowById(item.id);
        VB.monitorTable.setSelectedRows([row]);
      }

      VB.styleBranchServerCpuUtil();

    });

    // wire up model events to drive the grid
    dataView.onRowCountChanged.subscribe(function(args) {
      grid.updateRowCount();
      grid.render();
    });

    dataView.onRowsChanged.subscribe(function(rows) {
      grid.invalidateRows(rows);
      grid.render();

      if (selectedRowIds.length > 0)
      {
        // since how the original data maps onto rows has changed,
        // the selected rows in the grid need to be updated
        var selRows = [];
        for (var i = 0; i < selectedRowIds.length; i++)
        {
          var idx = dataView.getRowById(selectedRowIds[i]);
          if (idx != undefined)
            selRows.push(idx);
        }

        grid.setSelectedRows(selRows);
      }
    });

    dataView.onPagingInfoChanged.subscribe(function(pagingInfo) {
      VB.monitorTable.setSelectedRows([]);
      dataView.refresh();
      grid.invalidateAllRows();
      grid.render();
      VB.styleBranchServerCpuUtil();
    });

    // wire up the search textbox to apply the filter to the model
    jQuery("#txtSearch,#txtSearch2").keyup(function(e) {
              Slick.GlobalEditorLock.cancelCurrentEdit();

      // clear on Esc
      if (e.which == 27)
        this.value = "";

      VB.monitoring.searchString = this.value;
      if (this.value != "") {
        dataView.setFilter(VB.monitoring.filterServerGrid);
      }
      else {
        dataView.setFilter();
      }
      VB.styleBranchServerCpuUtil();
    });

  }
}

VB.styleSessionCpuUtil = function() {
  var cpuCol;
  var columns = jQuery('div[class~="slick-header-column"]');
  columns.each(function(idx) {
    if (this.id.indexOf("cpuUtil") > 0) {
      cpuCol = idx;
    }
  });
  jQuery('div[class="slick-cell c'+cpuCol+'"]').heatcolor(
    function() {return jQuery(this).text();},
    {lightness: 0.3,
      colorStyle: 'greentored',
      maxval: 100,
      minval: 0,
      reverseOrder: true
    }
  );
}

VB.styleSessionRUIUtil = function() {
  var cpuCol;
  var columns = jQuery('div[class~="slick-header-column"]');
  columns.each(function(idx) {
    if (this.id.indexOf("rui") > 0) {
      cpuCol = idx;
    }
  });
  jQuery('div[class="slick-cell c'+cpuCol+'"]').heatcolor(
    function() {return jQuery(this).text();},
    {lightness: 0.3,
      colorStyle: 'greentored',
      maxval: 100,
      minval: 0,
      reverseOrder: true
    }
  );
}

VB.styleSessionSPIUtil = function() {
  var cpuCol;
  var columns = jQuery('div[class~="slick-header-column"]');
  columns.each(function(idx) {
    if (this.id.indexOf("spi") > 0) {
      cpuCol = idx;
    }
  });
  jQuery('div[class="slick-cell c'+cpuCol+'"]').heatcolor(
    function() {return jQuery(this).text();},
    {lightness: 0.3,
      colorStyle: 'greentored',
      maxval: 100,
      minval: 0,
      reverseOrder: true
    }
  );
}

VB.styleServerCpuUtil = function() {
  var cpuCol;
  var columns = jQuery('div[class~="slick-header-column"]');
  columns.each(function(idx) {
    if (this.id.indexOf("cpuUtil") > 0) {
      cpuCol = idx;
    }
  });
  jQuery('div[class="slick-cell c'+cpuCol+'"]').heatcolor(
    function() {return jQuery(this).text();},
    {lightness: 0.3,
      colorStyle: 'greentored',
      maxval: 100,
      minval: 0,
      reverseOrder: true
    }
  );
}

VB.styleServerMemUtil = function() {
  var memCol;
  var columns = jQuery('div[class~="slick-header-column"]');
  columns.each(function(idx) {
    if (this.id.indexOf("memUtil") > 0) {
      memCol = idx;
    }
  });
  var memColCells = jQuery("div[class='slick-cell c"+memCol+"']");
  jQuery.each(memColCells, function(idx) {
    var cell = memColCells[idx];
    var memVal = parseInt(jQuery(cell).text());
    var threshold = parseInt(jQuery("div[class='slick-cell c"+(parseInt(memCol)+1)+"']", cell.parentNode).text());
    if (memVal && threshold && memVal > threshold) {
      jQuery(cell).heatcolor(
        function() {
          return 1;
        },
        {lightness: 0.3,
          colorStyle: 'greentored',
          maxval: 1,
          minval: 0,
          reverseOrder: true
        }
      )
    }
  });
}

VB.styleBranchServerCpuUtil = function() {
  var cpuCol;
  var columns = jQuery('div[class~="slick-header-column"]');
  columns.each(function(idx) {
    if (this.id.indexOf("cpuUtil") > 0) {
      cpuCol = idx;
    }
  });
  jQuery('div[class="slick-cell c'+cpuCol+'"]').heatcolor(
    function() {return jQuery(this).text();},
    {lightness: 0.3,
      colorStyle: 'greentored',
      maxval: 100,
      minval: 0,
      reverseOrder: true
    }
  );
}

VB.styleBranchServerMemUtil = function() {
  var memCol;
  var columns = jQuery('div[class~="slick-header-column"]');
  columns.each(function(idx) {
    if (this.id.indexOf("memUtil") > 0) {
      memCol = idx;
    }
  });
  var memColCells = jQuery("div[class='slick-cell c"+memCol+"']");
  jQuery.each(memColCells, function(idx) {
    var cell = memColCells[idx];
    var memVal = parseInt(jQuery(cell).text());
    var threshold = parseInt(jQuery("div[class='slick-cell c"+(parseInt(memCol)+1)+"']", cell.parentNode).text());
    if (memVal && threshold && memVal > threshold) {
      jQuery(cell).heatcolor(
        function() {
          return 1;
        },
        {lightness: 0.3,
          colorStyle: 'greentored',
          maxval: 1,
          minval: 0,
          reverseOrder: true
        }
      )
    }
  });
}

VB.monitoring.initServerEvents = function(timestamp) {
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.getServerEventsColMap();
  VB.monitoring.renderServerEventGrid(); 
}

VB.monitoring.initSessionEvents = function(timestamp) {
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.getSessionEventsColMap();
  VB.monitoring.renderSessionEventGrid();
}

VB.monitoring.initAuditEvents = function(timestamp) {
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.getAuditEventsColMap();
  VB.monitoring.renderAuditEventGrid();
}

VB.monitoring.initUserEvents = function(timestamp) {
  var outerWidth = jQuery('#outerGridDiv').width();
  jQuery('#innerGridDiv').width(outerWidth);
  jQuery('#grid').width(outerWidth);
  jQuery('#pager').width(outerWidth);
  jQuery('#gridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.monitorTable.gotoCell(0, 0, false);
    }
  });
  jQuery('#filterToggle').button({
    icons: {primary: "ui-icon-search"},
    text: false
  });
  VB.monitoring.getUserEventsColMap();
  VB.monitoring.renderUserEventGrid();
}

VB.monitoring.getServerEvents = function(timestamp) {
	var startDate = "";
	var endDate = "";
	var eventType = "";
	var sv = jQuery('#searchVal').attr('value');
	if (sv) {
		clearTimeout(VB.monitoring.timeoutHandle);
		timestamp = jQuery('div.timestamp').attr('id');
		if (timestamp == undefined) {
			return;
		}	 
	  var dateArr = sv.split('-');
	  var dObj;
	  jQuery.each(dateArr, function(idx) {
	  	dObj = Math.round(new Date(this.toString()).getTime()/1000.0);
			if (!isNaN(dObj)) {
				if (idx == 0) {
					startDate = '&startDate='+dObj;
				}
				if (idx == 1) {
					endDate = '&endDate='+dObj;
				}
			}	  	
	  });  
	}
	var et = jQuery('#eventType').attr('value');
	if (et) {
		clearTimeout(VB.monitoring.timeoutHandle);
		timestamp = jQuery('div.timestamp').attr('id');
		if (timestamp == undefined) {
			return;
		}
		if (et != "ALL") {
			eventType = '&eventType='+et;
		}
	}
	var data = 'timestamp='+timestamp+startDate+endDate+eventType;
  jQuery.ajax({
    url: VB.appCtx+'monitoring/listServerEvents',
    data: data,
    type: "post",
    dataType: 'json',
    complete: VB.monitoring.handleServerEventResponse	
  });
}

VB.monitoring.renderServerEventGrid = function() {

  timeFormatter = function(row, cell, value, columnDef, dataContext) {
    var dObj = new Date(Math.round(value / 1000));
    return dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
      " " +
      dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
  }
  eventTypeFormatter = function(row, cell, value, columnDef, dataContext) {
    var statusStr = value;
    var displayStr;
    switch(statusStr) {
      case "SERVER_ONLINE":
        displayStr = VB.i18n.online;
        break;
      case "SERVER_OFFLINE":
        displayStr = VB.i18n.offline;
        break;
      case "SERVER_STATUS":
        displayStr = VB.i18n.status;
        break;
      case "SERVER_VERDE_START":
        displayStr = VB.i18n.start;
        break;
      case "SERVER_VERDE_STOP":
        displayStr = VB.i18n.stop;
        break;
      case "SERVER_VERDE_MSG":
        displayStr = VB.i18n.message;
        break;
      case "CM_ACTIVE":
        displayStr = VB.i18n.cm_active;
        break;
      case "CM_STANDBY":
        displayStr = VB.i18n.cm_standby;
        break;
      case "MC_SERVICE_ALERT":
        displayStr = VB.i18n.mc_service_alert;
        break;
      default:
        displayStr = statusStr;
    };
    return '<span>' + displayStr + '</span>';
  }  
  eventSevFormatter = function(row, cell, value, columnDef, dataContext) {
    var sevStr = value;
    var displayStr;
    switch(sevStr) {
      case "INFO":
        displayStr = VB.i18n.info;
        break;
      case "WARN":
        displayStr = VB.i18n.warn;
        break;
      case "ERROR":
        displayStr = VB.i18n.error;
        break;
      default:
        displayStr = sevStr;
    };
    return '<span>' + displayStr + '</span>';
  }

  serverTypeFormatter = function(row, cell, value, columnDef, dataContext) {
    var displayStr;
    if (dataContext.serverType.indexOf("CB_") == 0) {
      displayStr = '<a href="'+dataContext.branchMCURL+'" target="_blank">'+value+'</a>';
    }
    else {
      displayStr = '<b>'+value+'</b>';
    }
    return '<span>' + displayStr + '</span>';
  }
  
  resourcesFormatter = function(row, cell, value, columnDef, dataContext) {
      
    if (value) {
      var resourcesList = [];
      jQuery.each(value, function(idx) {
        resourcesList.push(this.name); 
      });
      return resourcesList;
    }
    else {
      return '';
    }
  }  

  serverTypeActionHandler = function(args) {

    var $input;

    this.init = function() {
      var cellContents = args.column.formatter(0, 0, args.item.clusterMasterFQDN, args.column, args.item);
        $input = jQuery(cellContents)
          .appendTo(args.container)
          .bind("keydown.nav", function(e) {
            if (e.keyCode === jQuery.ui.keyCode.ENTER) {
              window.open(e.target.href);
            }
          });
        jQuery('a', $input).focus();
    };

    this.destroy = function() {};

    this.focus = function() {
        $input.focus();
    };

    this.getValue = function() {
        return $input.val();
    };

    this.setValue = function(val) {};

    this.loadValue = function(item) {};

    this.serializeValue = function() {
        return $input.val();
    };

    this.applyValue = function(item,state) {};

    this.isValueChanged = function() {
        return false;
    };

    this.validate = function() {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
  }
  
  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }

  var grid;
  var loader = new VB.monitoring.RemoteServerEventModel();
  var sortcol = "";
  var sortdir = 1;
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-serverEvents-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = VB.monitoring.serverEventsColMap[key];
	  if (key != 'class' && key != 'id') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'timestamp') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 75;
      }
      if (key == "type") {
        obj['formatter'] = eventTypeFormatter;
      }
      if (key == "severity") {
        obj['formatter'] = eventSevFormatter;
        obj['width'] = 30;
      }
      if (key == 'clusterMasterFQDN') {
        obj['formatter'] = serverTypeFormatter;
        obj['editor'] = serverTypeActionHandler;
        obj['sortable'] = false;
      }
      if (key == 'mutableTags') {
        obj['width'] = 90;
        obj['formatter'] = resourcesFormatter;
        obj['sortable'] = false;
      }
      if (key == 'info') {
        obj['width'] = 120;
      }  
      userColumnList.push(obj);
    }
  });   
  
  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.monitoring.serversEventColumns;
  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = VB.monitoring.serverEventsColMap[key];
	  if (key != 'class' && key != 'id') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'timestamp') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 75;
      }
      if (key == "type") {
        obj['formatter'] = eventTypeFormatter;
      }
      if (key == "severity") {
        obj['formatter'] = eventSevFormatter;
        obj['width'] = 30;
      }
      if (key == 'clusterMasterFQDN') {
        obj['formatter'] = serverTypeFormatter;
        obj['editor'] = serverTypeActionHandler;
        obj['sortable'] = false;
      }
      if (key == 'mutableTags') {
        obj['width'] = 90;
        obj['formatter'] = resourcesFormatter;
        obj['sortable'] = false;
      }      
      if (key == 'info') {
        obj['width'] = 120;
      }
      columns.push(obj);
    }
  });
  
  var options = {
    editable: true,
    autoEdit: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    asyncEditorLoading: true,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 25,
    rowHeight:25,
    topPanelHeight:65
  };
	//if (loader.data.length < 20) {
	//	options['autoHeight'] = true;
	//}
	//else {
    jQuery('#grid').height(526);
	//}
  var loadingIndicator = null;
  grid = new Slick.Grid(jQuery("#grid"), loader.data, columns, options);
  new Slick.Controls.VBColumnPicker(columns, grid, options);
  if (userColumnList.length > 0) {
    grid.setColumns(userColumnList);
  }  
  grid.autosizeColumns();
  var attPlugin = new Slick.AutoTooltips();
  grid.registerPlugin(attPlugin);
  grid['sorted'] = undefined;
  VB.monitorTable = grid;

  var clrDateBtn = jQuery('#searchControls button#clearDate').button();
  clrDateBtn.click(function(evt) {
    jQuery('#dateRange').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });VB.monitoring.exportEventLog
  var clrSearchBtn = jQuery('#searchControls button#clearSearch').button();
  clrSearchBtn.click(function(evt) {
    jQuery('#search').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var expBtn = jQuery('#exportControls button#export').button();
  expBtn.click(function(evt) {
    VB.monitoring.exportEventLog('server');
  });
  jQuery('#eventType').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#serverType').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var dpOptions = VB.monitoring.setDateRangePickerOptions();
  jQuery('#dateRange').daterangepicker({
    presetRanges:    dpOptions.presetRanges,
    presets:         dpOptions.presets,
    rangeStartTitle: dpOptions.rangeStartTitle,
    rangeEndTitle:   dpOptions.randEndTitle,
    nextLinkText:    dpOptions.nextLinkText,
    prevLinkText:    dpOptions.prevLinkText,
    doneButtonText:  dpOptions.doneButtonText,
    datepickerOptions: {
      option: jQuery.datepicker.regional[ VB.monitoring.locale ]
    },
    onChange: function(evt) {
      grid.invalidateAllRows();
      grid.updateRowCount();
      loader.clear();
      var vp = grid.getViewport();
      loader.reloadData(vp.top, vp.bottom);
      grid.resizeCanvas();
    }
  })[0];
  jQuery('#search').keyup(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#searchControls select').selectmenu({width:175, menuWidth:175,style:'dropdown'});
  jQuery('#exportControls select').selectmenu({width:75, menuWidth:75,style:'dropdown'});

  grid.onViewportChanged.subscribe(function() {
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

grid.onSort.subscribe(function(e, args) {
  sortdir = args.sortAsc ? 1 : -1;
  sortcol = args.sortCol.field;
  loader.setSort(sortcol, sortdir);
  var vp = grid.getViewport();
  loader.ensureData(vp.top, vp.bottom);
});

loader.onDataLoading.subscribe(function() {
  if (!loadingIndicator)
  {
    loadingIndicator = jQuery("<span class='loading-indicator'><label></label></span>").appendTo(document.body);
    var $g = jQuery("#grid");

    loadingIndicator
    .css("position", "absolute")
    .css("top", $g.position().top + $g.height()/2 - loadingIndicator.height()/2)
    .css("left", $g.position().left + $g.width()/2 - loadingIndicator.width()/2)
  }

  loadingIndicator.show();
});

loader.onDataLoaded.subscribe(function(args) {
  for (var i = args.from; i <= args.to; i++) {
    grid.invalidateRow(i);
  }

  grid.updateRowCount();
  grid.render();

  loadingIndicator.fadeOut();
});

jQuery("#txtSearch").keyup(function(e) {
  if (e.which == 13) {
    loader.setSearch(jQuery(this).val());
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  }
});

// load the first page
grid.onViewportChanged.notify();
}

VB.monitoring.renderSessionEventGrid = function() {

  timeFormatter = function(row, cell, value, columnDef, dataContext) {
    var dObj = new Date(Math.round(value / 1000));
    return dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
      " " +
      dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
  }
  eventTypeFormatter = function(row, cell, value, columnDef, dataContext) {
    var statusStr = value;
    var displayStr;
    switch(statusStr) {
      case "SESSION_START":
        displayStr = VB.i18n.start;
        break;
      case "SESSION_LOGIN":
        displayStr = VB.i18n.login;
        break;
      case "SESSION_LOGOUT":
        displayStr = VB.i18n.logout;
        break;
      case "SESSION_UPDATE":
        displayStr = VB.i18n.update;
        break;
      case "SESSION_TERMINATE":
        displayStr = VB.i18n.terminate;
        break;
      case "SESSION_CONNECT":
        displayStr = VB.i18n.connect;
        break;
      case "SESSION_DISCONNECT":
        displayStr = VB.i18n.disconnect;
        break;
      case "SESSION_ERROR":
        displayStr = VB.i18n.sessionError;
        break;
      case "USER_AUTH":
        displayStr = VB.i18n.auth;
        break;
      case "USER_SYNC":
        displayStr = VB.i18n.sync;
        break;
      case "USER_CONSOLE_LOGIN":
        displayStr = VB.i18n.uc_login;
        break;       
      default:
        displayStr = statusStr;
    };
    return '<span>' + displayStr + '</span>';
  }
  eventSevFormatter = function(row, cell, value, columnDef, dataContext) {
    var sevStr = value;
    var displayStr;
    switch(sevStr) {
      case "INFO":
        displayStr = VB.i18n.info;
        break;
      case "WARN":
        displayStr = VB.i18n.warn;
        break;
      case "ERROR":
        displayStr = VB.i18n.error;
        break;
      default:
        displayStr = sevStr;
    };
    return '<span>' + displayStr + '</span>';
  }

  deploymentModeFormatter = function(row, cell, value, columnDef, dataContext) {
    var dmStr = value;
    var displayStr;
    switch(dmStr) {
      case "VDI":
        displayStr = VB.i18n.vdi;
        break;
      case "LEAF_WS":
        displayStr = VB.i18n.leaf_desktop;
        break;
      case "LEAF_DRIVE":
        displayStr = VB.i18n.leaf_drive;
        break;
      default:
        displayStr = value;
        break;
    };
    return '<span>' + displayStr + '</span>';
  }

  serverTypeFormatter = function(row, cell, value, columnDef, dataContext) {
    var typeStr = dataContext.serverType;
    var displayStr;
    switch(typeStr) {
      case "CM":
        displayStr = '<b>'+value+'</b>';
        break;
      case "VDI":
        displayStr = '<b>'+value+'</b>';
        break;
      case "CB_CM":
        displayStr = '<a href="'+dataContext.branchMCURL+'" target="_blank">'+value+'</a>';
        break;
      default:
        displayStr = '';
        break;
    };
    return '<span>' + displayStr + '</span>';
  }
  
  organizationFormatter = function(row, cell, value, columnDef, dataContext) {
    return value.name;
  }  
  
  imageFormatter = function(row, cell, value, columnDef, dataContext) {
    var orgId = dataContext.goldMasterOrg;
    if (orgId == "0") {
        return value + " (global)";
    }
    else {
        return value;
    }
  }   

  serverTypeActionHandler = function(args) {

    var $input;

    this.init = function() {
      var cellContents = args.column.formatter(0, 0, args.item.clusterMasterFQDN, args.column, args.item);
        $input = jQuery(cellContents)
          .appendTo(args.container)
          .bind("keydown.nav", function(e) {
            if (e.keyCode === jQuery.ui.keyCode.ENTER) {
              window.open(e.target.href);
            }
          });
        jQuery('a', $input).focus();
    };

    this.destroy = function() {};

    this.focus = function() {
        $input.focus();
    };

    this.getValue = function() {
        return $input.val();
    };

    this.setValue = function(val) {};

    this.loadValue = function(item) {};

    this.serializeValue = function() {
        return $input.val();
    };

    this.applyValue = function(item,state) {};

    this.isValueChanged = function() {
        return false;
    };

    this.validate = function() {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
  }

  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }

  var grid;
  var loader = new VB.monitoring.RemoteSessionEventModel();
  var sortcol = "";
  var sortdir = 1;
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-sessionEvents-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = VB.monitoring.sessionEventsColMap[key];
    if (key != 'class' && key != 'id' && key != 'deploymentMode') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'timestamp') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 110;
      }
      if (key == "type") {
        obj['formatter'] = eventTypeFormatter;
        obj['width'] = 100;
      }
      if (key == "severity") {
        obj['formatter'] = eventSevFormatter;
        obj['width'] = 50;
      }
      if (key == "organization") {
        obj['formatter'] = organizationFormatter;
      } 
      if (key == "goldMaster") {
        obj['formatter'] = imageFormatter;
      }       
      if (key == 'clusterMasterFQDN') {
        obj['formatter'] = serverTypeFormatter;
        obj['editor'] = serverTypeActionHandler;
        obj['sortable'] = false;
      }    
      userColumnList.push(obj);
    }
  });  

  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.monitoring.sessionEventColumns;
  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = VB.monitoring.sessionEventsColMap[key];
    if (key != 'class' && key != 'id' && key != 'deploymentMode') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = true;
      if (key == 'timestamp') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 110;
      }
      if (key == "type") {
        obj['formatter'] = eventTypeFormatter;
        obj['width'] = 100;
      }
      if (key == "severity") {
        obj['formatter'] = eventSevFormatter;
        obj['width'] = 50;
      }
      if (key == "organization") {
        obj['formatter'] = organizationFormatter;
      }      
      if (key == "goldMaster") {
        obj['formatter'] = imageFormatter;
      }       
      if (key == 'clusterMasterFQDN') {
        obj['formatter'] = serverTypeFormatter;
        obj['editor'] = serverTypeActionHandler;
        obj['sortable'] = false;
      }
      columns.push(obj);
    }
  });
  // deploymentMode
  obj = new Object();
  obj['name'] = VB.i18n.deploymentMode;
  obj['id'] = 'deploymentMode';
  obj['field'] = 'deploymentMode';
  obj['sortable'] = true;
  obj['formatter'] = deploymentModeFormatter;
  columns.push(obj);

  var options = {
    editable: true,
    autoEdit: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    asyncEditorLoading: true,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 25,
    rowHeight:25,
    topPanelHeight:65
  };
  //if (loader.data.length < 20) {
  //	options['autoHeight'] = true;
  //}
  //else {
  jQuery('#grid').height(526);
  //}
  var loadingIndicator = null;
  grid = new Slick.Grid(jQuery("#grid"), loader.data, columns, options);
  new Slick.Controls.VBColumnPicker(columns, grid, options);
  if (userColumnList.length > 0) {
    grid.setColumns(userColumnList);
  }   
  grid.autosizeColumns();
  var attPlugin = new Slick.AutoTooltips();
  grid.registerPlugin(attPlugin);
  grid['sorted'] = undefined;
  VB.monitorTable = grid;

  var clrDateBtn = jQuery('#searchControls button#clearDate').button();
  clrDateBtn.click(function(evt) {
    jQuery('#dateRange').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var clrSearchBtn = jQuery('#searchControls button#clearSearch').button();
  clrSearchBtn.click(function(evt) {
    jQuery('#search').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var expBtn = jQuery('#exportControls button#export').button();
  expBtn.click(function(evt) {
    VB.monitoring.exportEventLog('session');
  });
  jQuery('#eventType').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#serverType').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var dpOptions = VB.monitoring.setDateRangePickerOptions();
  jQuery('#dateRange').daterangepicker({
    presetRanges:    dpOptions.presetRanges,
    presets:         dpOptions.presets,
    rangeStartTitle: dpOptions.rangeStartTitle,
    rangeEndTitle:   dpOptions.randEndTitle,
    nextLinkText:    dpOptions.nextLinkText,
    prevLinkText:    dpOptions.prevLinkText,
    doneButtonText:  dpOptions.doneButtonText,
    datepickerOptions: {
      option: jQuery.datepicker.regional[ VB.monitoring.locale ]
    },
    onChange: function(evt) {
      grid.invalidateAllRows();
      grid.updateRowCount();
      loader.clear();
      var vp = grid.getViewport();
      loader.reloadData(vp.top, vp.bottom);
      grid.resizeCanvas();
    }
  })[0];
  jQuery('#search').keyup(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#searchControls select').selectmenu({
    width:175,
    menuWidth:175,
    style:'dropdown'
  });
  jQuery('#exportControls select').selectmenu({
    width:75,
    menuWidth:75,
    style:'dropdown'
  });

  grid.onViewportChanged.subscribe(function() {
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

  grid.onSort.subscribe(function(e, args) {
    sortdir = args.sortAsc ? 1 : -1;
    sortcol = args.sortCol.field;
    loader.setSort(sortcol, sortdir);
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

  loader.onDataLoading.subscribe(function() {
    if (!loadingIndicator)
    {
      loadingIndicator = jQuery("<span class='loading-indicator'><label></label></span>").appendTo(document.body);
      var $g = jQuery("#grid");

      loadingIndicator
      .css("position", "absolute")
      .css("top", $g.position().top + $g.height()/2 - loadingIndicator.height()/2)
      .css("left", $g.position().left + $g.width()/2 - loadingIndicator.width()/2)
    }

    loadingIndicator.show();
  });

  loader.onDataLoaded.subscribe(function(args) {
    for (var i = args.from; i <= args.to; i++) {
      grid.invalidateRow(i);
    }

    grid.updateRowCount();
    grid.render();

    loadingIndicator.fadeOut();
  });

  jQuery("#txtSearch").keyup(function(e) {
    if (e.which == 13) {
      loader.setSearch(jQuery(this).val());
      var vp = grid.getViewport();
      loader.ensureData(vp.top, vp.bottom);
    }
  });

  // load the first page
  grid.onViewportChanged.notify();
}

VB.monitoring.renderAuditEventGrid = function() {

  timeFormatter = function(row, cell, value, columnDef, dataContext) {
    var dObj = new Date(value * 1000);
    return dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
      " " +
      dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
  }

  objectTypeFormatter = function(row, cell, value, columnDef, dataContext) {
    var statusStr = value;
    var displayStr;
    switch(statusStr) {
      case "com.vbridges.mc.image.Image":
        displayStr = VB.i18n.image;
        break;
      case "com.vbridges.mc.policy.Policy":
        displayStr = VB.i18n.policy;
        break;
      case "com.vbridges.mc.policy.PolicyAssignment":
        displayStr = VB.i18n.policyAssignment;
        break;
      case "com.vbridges.mc.user.User":
        displayStr = VB.i18n.user;
        break;
      case "com.vbridges.mc.user.UserSelect":
        displayStr = VB.i18n.userSelect;
        break;
      case "AuditLogExport":
        displayStr = VB.i18n.auditLogExport;
        break;
      case "AuditLog":
        displayStr = VB.i18n.auditLog;
        break;
      case "com.vbridges.mc.chart.ChartQuery":
        displayStr = VB.i18n.capacityChartQuery;
        break;
      case "Leaf Release":
        displayStr = VB.i18n.leafRelease;
        break;
      case "Leaf Provtab":
        displayStr = VB.i18n.leafDeployment;
        break;
      case "VerdeNetCfg":
        displayStr = VB.i18n.verdeNetcfg;
        break;
      case "App Layer":
        displayStr = VB.i18n.appLayer;
        break;
      case "VERDE License":
        displayStr = VB.i18n.verdeLicense;
        break;
      case "LEAF Policy UDS Filter":
        displayStr = VB.i18n.policyUDSFilter;
        break;
      case "Monitoring":
        displayStr = VB.i18n.monitoring;
        break;
      case "VERDE Server":
        displayStr = VB.i18n.verdeServer;
        break;
      default:
        displayStr = statusStr;
    };
    return '<span>' + displayStr + '</span>';
  }

  actionTypeFormatter = function(row, cell, value, columnDef, dataContext) {
    var statusStr = value;
    var displayStr;
    switch(statusStr) {
      case "CREATE":
        displayStr = VB.i18n.create;
        break;
      case "READ":
        displayStr = VB.i18n.read;
        break;
      case "UPDATE":
        displayStr = VB.i18n.update;
        break;
      case "DELETE":
        displayStr = VB.i18n.del;
        break;
      case "LOGIN":
        displayStr = VB.i18n.login;
        break;
      case "LOGOUT":
        displayStr = VB.i18n.logout;
        break;
      case "SERVER_ONLINE":
        displayStr = VB.i18n.server_online;
        break;
      case "SERVER_OFFLINE":
        displayStr = VB.i18n.server_offline;
        break;
      case "SESSION_ABORT":
        displayStr = VB.i18n.session_abort;
        break;
      case "SESSION_REVERT":
        displayStr = VB.i18n.session_revert;
        break;
      case "SESSION_SHUTDOWN":
        displayStr = VB.i18n.session_shutdown;
        break;
      case "DOWNLOAD_FAIL":
        displayStr = VB.i18n.download_fail;
        break;
      case "DOWNLOAD_SUCCESS":
        displayStr = VB.i18n.download_success;
        break;
      default:
        displayStr = statusStr;
    };
    return '<span>' + displayStr + '</span>';
  }

  eventSevFormatter = function(row, cell, value, columnDef, dataContext) {
    var sevStr = value;
    var displayStr;
    switch(sevStr) {
      case "INFO":
        displayStr = VB.i18n.info;
        break;
      case "WARN":
        displayStr = VB.i18n.warn;
        break;
      case "ERROR":
        displayStr = VB.i18n.error;
        break;
      default:
        displayStr = sevStr;
    };
    return '<span>' + displayStr + '</span>';
  }

  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }

  var grid;
  var loader = new VB.monitoring.RemoteAuditEventModel();
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-auditEvents-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = VB.monitoring.auditEventsColMap[key];
    if (key != 'class' && key != 'id') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = false;
      if (key == 'date') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 100;
      }
      if (key == 'objName') {
        obj['formatter'] = objectTypeFormatter;
        obj['width'] = 100;
      }
      if (key == 'action') {
        obj['formatter'] = actionTypeFormatter;
        obj['width'] = 80;
      }
      if (key == "severity") {
        obj['formatter'] = eventSevFormatter;
        obj['width'] = 40;
      }
      if (key == "objValue") {
        obj['width'] = 200;
      }      
      userColumnList.push(obj);
    }
  });  

  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.monitoring.auditEventColumns;
  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = VB.monitoring.auditEventsColMap[key];
    if (key != 'class' && key != 'id') {
      var obj = new Object();
      obj['name'] = value;
      obj['id'] = key;
      obj['field'] = key;
      obj['sortable'] = false;
      if (key == 'date') {
        obj['formatter'] = timeFormatter;
        obj['width'] = 100;
      }
      if (key == 'objName') {
        obj['formatter'] = objectTypeFormatter;
        obj['width'] = 100;
      }
      if (key == 'action') {
        obj['formatter'] = actionTypeFormatter;
        obj['width'] = 80;
      }
      if (key == "severity") {
        obj['formatter'] = eventSevFormatter;
        obj['width'] = 40;
      }
      if (key == "objValue") {
        obj['width'] = 200;
      }
      columns.push(obj);
    }
  });

  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    asyncEditorLoading: true,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 25,
    rowHeight:25,
    topPanelHeight:65
  };
  //if (loader.data.length < 20) {
  //	options['autoHeight'] = true;
  //}
  //else {
  jQuery('#grid').height(526);
  //}
  var loadingIndicator = null;
  grid = new Slick.Grid(jQuery("#grid"), loader.data, columns, options);
  new Slick.Controls.VBColumnPicker(columns, grid, options);
  if (userColumnList.length > 0) {
    grid.setColumns(userColumnList);
  }
  grid.autosizeColumns();
  var attPlugin = new Slick.AutoTooltips();
  grid.registerPlugin(attPlugin);
  grid['sorted'] = undefined;
  VB.monitorTable = grid;

  var clrDateBtn = jQuery('#searchControls button#clearDate').button();
  clrDateBtn.click(function(evt) {
    jQuery('#dateRange').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var expBtn = jQuery('#exportControls button#export').button();
  expBtn.click(function(evt) {
    VB.monitoring.exportAuditLog();
  });
  var objSelect = jQuery('#objName').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var actionSelect = jQuery('#action').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var dpOptions = VB.monitoring.setDateRangePickerOptions();
  jQuery('#dateRange').daterangepicker({
    presetRanges:    dpOptions.presetRanges,
    presets:         dpOptions.presets,
    rangeStartTitle: dpOptions.rangeStartTitle,
    rangeEndTitle:   dpOptions.randEndTitle,
    nextLinkText:    dpOptions.nextLinkText,
    prevLinkText:    dpOptions.prevLinkText,
    doneButtonText:  dpOptions.doneButtonText,
    datepickerOptions: {
      option: jQuery.datepicker.regional[ VB.monitoring.locale ]
    },
    onChange: function(evt) {
      grid.invalidateAllRows();
      grid.updateRowCount();
      loader.clear();
      var vp = grid.getViewport();
      loader.reloadData(vp.top, vp.bottom);
      grid.resizeCanvas();
    }
  })[0];
  jQuery('#actor').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#searchControls select').selectmenu({
    width:175,
    menuWidth:175,
    style:'dropdown'
  });
  jQuery('#exportControls select').selectmenu({
    width:75,
    menuWidth:75,
    style:'dropdown'
  });

  grid.onViewportChanged.subscribe(function() {
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

  loader.onDataLoading.subscribe(function() {
    if (!loadingIndicator)
    {
      loadingIndicator = jQuery("<span class='loading-indicator'><label></label></span>").appendTo(document.body);
      var $g = jQuery("#grid");

      loadingIndicator
      .css("position", "absolute")
      .css("top", $g.position().top + $g.height()/2 - loadingIndicator.height()/2)
      .css("left", $g.position().left + $g.width()/2 - loadingIndicator.width()/2)
    }

    loadingIndicator.show();
  });

  loader.onDataLoaded.subscribe(function(args) {
    for (var i = args.from; i <= args.to; i++) {
      grid.invalidateRow(i);
    }

    grid.updateRowCount();
    grid.render();

    loadingIndicator.fadeOut();
  });

  jQuery("#txtSearch").keyup(function(e) {
    if (e.which == 13) {
      loader.setSearch(jQuery(this).val());
      var vp = grid.getViewport();
      loader.ensureData(vp.top, vp.bottom);
    }
  });

  // load the first page
  grid.onViewportChanged.notify();
}

VB.monitoring.renderUserEventGrid = function() {

  timeFormatter = function(row, cell, value, columnDef, dataContext) {
    var dObj = new Date(Math.round(value / 1000));
    return dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
      " " +
      dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
  }
  eventTypeFormatter = function(row, cell, value, columnDef, dataContext) {
    var statusStr = value;
    var displayStr;
    switch(statusStr) {
      case "SESSION_START":
        displayStr = VB.i18n.start;
        break;
      case "SESSION_LOGIN":
        displayStr = VB.i18n.login;
        break;
      case "SESSION_LOGOUT":
        displayStr = VB.i18n.logout;
        break;
      case "LEAF_IMAGE_UPDATE":
        displayStr = VB.i18n.update;
        break;
      case "SESSION_TERMINATE":
        displayStr = VB.i18n.terminate;
        break;
      case "SESSION_CONNECT":
        displayStr = VB.i18n.connect;
        break;
      case "SESSION_DISCONNECT":
        displayStr = VB.i18n.disconnect;
        break;
      case "USER_AUTH":
        displayStr = VB.i18n.auth;
        break;
      case "USER_DATA_SYNC":
        displayStr = VB.i18n.sync;
        break;
      case "USER_CONSOLE_LOGIN":
        displayStr = VB.i18n.uc_login;
        break;
      case "LEAF_STATUS":
        displayStr = VB.i18n.status;
        break;
      case "UC_CLIENT_STATUS":
        displayStr = VB.i18n.uc_status;
        break;         
      default:
        displayStr = statusStr;
    };
    return '<span>' + displayStr + '</span>';
  }
  
  organizationFormatter = function(row, cell, value, columnDef, dataContext) {
    return value.name;
  }  

  function comparer(a,b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }

  var grid;
  var loader = new VB.monitoring.RemoteUserEventModel();
  var sortcol = "";
  var sortdir = 1;
  
  VB.monitoring.getColumnPreferences();
  
  var prefs = VB.monitoring.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-userEvents-columns') >= 0) {
      userColumns = prefs[j].value.split(',');
    }
  }
  jQuery.each(userColumns, function(idx) {
    var key = userColumns[idx];
    var value;
    value = VB.monitoring.userEventsColMap[key];
    if (key != 'class' && key != 'id') {
      if (key != 'session') {
        var obj = new Object();
        obj['name'] = value;
        obj['id'] = key;
        obj['field'] = key;
        obj['sortable'] = true;
        if (key == 'timestamp') {
          obj['formatter'] = timeFormatter;
          obj['width'] = 100;
        }
        if (key == 'severity') {
          obj['width'] = 40;
        }
        if (key == "organization") {
            obj['formatter'] = organizationFormatter;
        }        
        if (key == "type") {
          obj['formatter'] = eventTypeFormatter;
        }
        userColumnList.push(obj);
      }
      else {
        // username column
        var obj = new Object();
        obj['name'] = VB.i18n.user;
        obj['id'] = 'session';
        obj['field'] = 'session';
        obj['sortable'] = true;
        columns.push(obj);
        // image UUID
        obj = new Object();
        obj['name'] = VB.i18n.image;
        obj['id'] = 'image';
        obj['field'] = 'image';
        obj['sortable'] = true;
        userColumnList.push(obj);
      }
    }
  });   

  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.monitoring.userEventColumns;
  jQuery.each(columnList, function(idx) {
    var key = columnList[idx];
    var value;
    value = VB.monitoring.userEventsColMap[key];
    if (key != 'class' && key != 'id') {
      if (key != 'session') {
        var obj = new Object();
        obj['name'] = value;
        obj['id'] = key;
        obj['field'] = key;
        obj['sortable'] = true;
        if (key == 'timestamp') {
          obj['formatter'] = timeFormatter;
          obj['width'] = 100;
        }
        if (key == 'severity') {
          obj['width'] = 40;
        }
        if (key == "organization") {
            obj['formatter'] = organizationFormatter;
        }        
        if (key == "type") {
          obj['formatter'] = eventTypeFormatter;
        }
        columns.push(obj);
      }
      else {
        // username column
        var obj = new Object();
        obj['name'] = VB.i18n.user;
        obj['id'] = 'session';
        obj['field'] = 'session';
        obj['sortable'] = true;
        columns.push(obj);
        // image UUID
        obj = new Object();
        obj['name'] = VB.i18n.image;
        obj['id'] = 'image';
        obj['field'] = 'image';
        obj['sortable'] = true;
        columns.push(obj);
      }
    }
  });

  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    asyncEditorLoading: true,
    forceFitColumns: true,
    syncColumnCellResize: true,
    secondaryHeaderRowHeight: 25,
    rowHeight:25,
    topPanelHeight:65
  };
  //if (loader.data.length < 20) {
  //	options['autoHeight'] = true;
  //}
  //else {
  jQuery('#grid').height(526);
  //}
  var loadingIndicator = null;
  grid = new Slick.Grid(jQuery("#grid"), loader.data, columns, options);
  new Slick.Controls.VBColumnPicker(columns, grid, options);
  if (userColumnList.length > 0) {
    grid.setColumns(userColumnList);
  }   
  grid.autosizeColumns();
  var attPlugin = new Slick.AutoTooltips();
  grid.registerPlugin(attPlugin);
  grid['sorted'] = undefined;
  VB.monitorTable = grid;

  var clrDateBtn = jQuery('#searchControls button#clearDate').button();
  clrDateBtn.click(function(evt) {
    jQuery('#dateRange').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var clrSearchBtn = jQuery('#searchControls button#clearSearch').button();
  clrSearchBtn.click(function(evt) {
    jQuery('#search').attr('value', '');
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var expBtn = jQuery('#exportControls button#export').button();
  expBtn.click(function(evt) {
    VB.monitoring.exportEventLog('user');
  });
  var eventSelect = jQuery('#eventType').change(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  var dpOptions = VB.monitoring.setDateRangePickerOptions();
  jQuery('#dateRange').daterangepicker({
    presetRanges:    dpOptions.presetRanges,
    presets:         dpOptions.presets,
    rangeStartTitle: dpOptions.rangeStartTitle,
    rangeEndTitle:   dpOptions.randEndTitle,
    nextLinkText:    dpOptions.nextLinkText,
    prevLinkText:    dpOptions.prevLinkText,
    doneButtonText:  dpOptions.doneButtonText,
    datepickerOptions: {
      option: jQuery.datepicker.regional[ VB.monitoring.locale ]
    },
    onChange: function(evt) {
      grid.invalidateAllRows();
      grid.updateRowCount();
      loader.clear();
      var vp = grid.getViewport();
      loader.reloadData(vp.top, vp.bottom);
      grid.resizeCanvas();
    }
  })[0];
  jQuery('#search').keyup(function(evt) {
    grid.invalidateAllRows();
    grid.updateRowCount();
    loader.clear();
    var vp = grid.getViewport();
    loader.reloadData(vp.top, vp.bottom);
    grid.resizeCanvas();
  });
  jQuery('#searchControls select').selectmenu({
    width:175,
    menuWidth:175,
    style:'dropdown'
  });
  jQuery('#exportControls select').selectmenu({
    width:75,
    menuWidth:75,
    style:'dropdown'
  });

  grid.onViewportChanged.subscribe(function() {
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

  grid.onSort.subscribe(function(e, args) {
    sortdir = args.sortAsc ? 1 : -1;
    sortcol = args.sortCol.field;
    loader.setSort(sortcol, sortdir);
    var vp = grid.getViewport();
    loader.ensureData(vp.top, vp.bottom);
  });

  loader.onDataLoading.subscribe(function() {
    if (!loadingIndicator)
    {
      loadingIndicator = jQuery("<span class='loading-indicator'><label></label></span>").appendTo(document.body);
      var $g = jQuery("#grid");

      loadingIndicator
      .css("position", "absolute")
      .css("top", $g.position().top + $g.height()/2 - loadingIndicator.height()/2)
      .css("left", $g.position().left + $g.width()/2 - loadingIndicator.width()/2)
    }

    loadingIndicator.show();
  });

  loader.onDataLoaded.subscribe(function(args) {
    for (var i = args.from; i <= args.to; i++) {
      grid.invalidateRow(i);
    }

    grid.updateRowCount();
    grid.render();

    loadingIndicator.fadeOut();
  });

  jQuery("#txtSearch").keyup(function(e) {
    if (e.which == 13) {
      loader.setSearch(jQuery(this).val());
      var vp = grid.getViewport();
      loader.ensureData(vp.top, vp.bottom);
    }
  });

  // load the first page
  grid.onViewportChanged.notify();
}

VB.monitoring.getServerEventsColMap = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'monitoring/getServerEventsColMap',
    success: function(resp) {
      VB.monitoring.serverEventsColMap = resp.columnMap;
    },
    cache: false
  });
}

VB.monitoring.getSessionEventsColMap = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'monitoring/getSessionEventsColMap',
    success: function(resp) {
      VB.monitoring.sessionEventsColMap = resp.columnMap;
    },
    cache: false
  });
}

VB.monitoring.getAuditEventsColMap = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'monitoring/getAuditEventsColMap',
    success: function(resp) {
      VB.monitoring.auditEventsColMap = resp.columnMap;
    },
    cache: false
  });
}

VB.monitoring.getUserEventsColMap = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'monitoring/getUserEventsColMap',
    success: function(resp) {
      VB.monitoring.userEventsColMap = resp.columnMap;
    },
    cache: false
  });
}

VB.monitoring.exportAuditLog = function() {

  var startDate = "";
  var endDate = "";
  var dr = jQuery('#dateRange').attr('value');
  if (dr) {
    var dateArr = dr.split('-');
    var dObj;
    jQuery.each(dateArr, function(idx) {
      dObj = Math.round(new Date(this.toString()).getTime()/1000.0);
      if (!isNaN(dObj)) {
        if (idx == 0) {
          startDate = dObj;
        }
        if (idx == 1) {
          endDate = dObj;
        }
      }
    });
  }
  var timestamp = jQuery('div.timestamp').attr('id');
  var actor = jQuery('#actor').attr('value');
  var objTypes = jQuery('#objName').attr('value');
  if (objTypes == 'ALL') {
    objTypes = "";
  }
  var actions = jQuery('#action').attr('value');
  if (actions == "ALL") {
    actions = '';
  }
  var format = jQuery('#exportFormat').attr('value');
  var total = VB.monitoring.serverEventsTotal;

  // create the form
  form = Highcharts.createElement('form', {
    method: 'post',
    action: VB.appCtx+'monitoring/exportAuditLog'
  }, {
    display: 'NONE'
  }, document.body);

  // add the values
  Highcharts.each(['timestamp', 'actors', 'actions', 'objTypes', 'format', 'total'], function(name) {
    if ({
      timestamp: timestamp,
      actors:    actor,
      actions:   actions,
      objTypes:  objTypes,
      format:    format,
      total:     total
    }
    [name] != "") {
      Highcharts.createElement('input', {
        type: 'HIDDEN',
        name: name,
        value: {
          timestamp: timestamp,
          actors:    actor,
          actions:   actions,
          objTypes:  objTypes,
          format:    format,
          total:     total
        }
        [name]
      }, null, form);
    }
  });

  // submit
  form.submit();

  // clean up
  Highcharts.discardElement(form);

}

VB.monitoring.exportEventLog = function(select) {

  var startDate = "";
  var endDate = "";
  var dr = jQuery('#dateRange').attr('value');
  if (dr) {
    var dateArr = dr.split('-');
    var dObj;
    jQuery.each(dateArr, function(idx) {
      dObj = Math.round(new Date(this.toString()).getTime()/1000.0);
      if (!isNaN(dObj)) {
        if (idx == 0) {
          startDate = dObj;
        }
        if (idx == 1) {
          endDate = dObj;
        }
      }
    });
  }
  var timestamp = jQuery('div.timestamp').attr('id');
  var search = jQuery('#search').attr('value');
  var eventType = jQuery('#eventType').attr('value');
  if (eventType == 'ALL') {
    eventType = "";
  }
  var serverType = jQuery('#serverType').attr('value');
  if (serverType == 'ALL') {
    serverType = "";
  }
  var format = jQuery('#exportFormat').attr('value');
  var total = VB.monitoring.serverEventsTotal;

  // create the form
  form = Highcharts.createElement('form', {
    method: 'post',
    action: VB.appCtx+'monitoring/exportEventsLog'
  }, {
    display: 'NONE'
  }, document.body);

  // add the values
  Highcharts.each(['timestamp', 'search', 'eventType', 'serverType', 'format', 'total', 'select'], function(name) {
    if ({
      timestamp:  timestamp,
      search:     search,
      eventType:  eventType,
      serverType: serverType,
      format:     format,
      total:      total,
      select:     select
    }
    [name] != "") {
      Highcharts.createElement('input', {
        type: 'HIDDEN',
        name: name,
        value: {
          timestamp:  timestamp,
          search:     search,
          eventType:  eventType,
          serverType: serverType,
          format:     format,
          total:      total,
          select:     select
        }
        [name]
      }, null, form);
    }
  });

  // submit
  form.submit();

  // clean up
  Highcharts.discardElement(form);

}

VB.monitoring.toggleFilterControls = function() {
  var panel = jQuery('#inlineFilterPanel');
  panel.slideToggle();
}

VB.monitoring.setDateRangePickerOptions = function() {
  var options = {
    presetRanges: [
      {text: VB.i18n.drp_presetRange_today, dateStart: 'today', dateEnd: 'today'},
      {text: VB.i18n.drp_presetRange_lastWeek, dateStart: 'today-7days', dateEnd: 'today'},
      {text: VB.i18n.drp_presetRange_monthToDate, dateStart: function(){return Date.parse('today').moveToFirstDayOfMonth();}, dateEnd: 'today'},
      {text: VB.i18n.drp_presetRange_yearToDate, dateStart: function(){var x= Date.parse('today');x.setMonth(0);x.setDate(1);return x;}, dateEnd: 'today'},
      {text: VB.i18n.drp_presetRange_prevMonth, dateStart: function(){return Date.parse('1 month ago').moveToFirstDayOfMonth();}, dateEnd: function(){return Date.parse('1 month ago').moveToLastDayOfMonth();}}
    ],
    presets: {
      specificDate:   VB.i18n.drp_preset_specificDate,
      allDatesBefore: VB.i18n.drp_preset_allDatesBefore,
      allDatesAfter:  VB.i18n.drp_preset_allDatesAfter,
      dateRange:      VB.i18n.drp_preset_dateRange
    },
    rangeStartTitle: VB.i18n.drp_rangeStartTitle,
    rangeEndTitle:   VB.i18n.drp_rangeEndTitle,
    nextLinkText:    VB.i18n.drp_nextLinkText,
    prevLinkText:    VB.i18n.drp_prevLinkText,
    doneButtonText:  VB.i18n.drp_doneButtonText
  };
  return options;
}

VB.monitoring.saveColumnPreferences = function(columns, uri) {
  var colList = [];
  jQuery.each(columns, function(idx) {
    if (this.field != 'sel') {
      colList.push(this.field);  
    }
  });
  var gridName = "grid-" + uri.substring(uri.lastIndexOf('/')+1, uri.length) + "-columns";
  var data = gridName+"="+colList;
  jQuery.ajax({
    type: 'post',
    url: VB.appCtx+'monitoring/saveColumnPrefs',
    data: data
  });
}

VB.monitoring.getColumnPreferences = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'monitoring/getColumnPrefs',
    success: function(prefs) {
      VB.monitoring.userPrefs = prefs;
    },
    cache: false
  });
}
