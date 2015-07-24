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
 * dashboard.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.dashboard == 'undefined') {
  VB.dashboard = {};
  VB.dashboard.chart = {};
  VB.dashboard.granularity = {};
  VB.dashboard.lang = {};
  VB.dashboard.timers = {};
}

VB.monitorTable;
VB.dashboard.searchString = "";
VB.dashboard.serversColumnList = ['serverAddr', 'serverId', 'currentSessions', 'reservedSessions', 'cpuUtil', 'memUtil', 'memThreshold', 'status'];
VB.dashboard.serversSearchColumns = ['serverAddr', 'serverId', 'currentSessions', 'reservedSessions', 'cpuUtil', 'memUtil', 'memThreshold', 'status'];
VB.dashboard.gridDataView;
VB.dashboard.timoutHandle;

/*
 * Configuration object describing the default
 * layout for charts page: 2 columns ("west" and
 * "center") for the charts. The "north" pane is
 * the header containing the page title and a toolbar
 * with action buttons for the page.
 */
VB.dashboard.defaultLayout = {
  north: {
    closable: false,
    resizable: false
  },
  west: {
    size: '50%',
    closable: false,
    resizable: false
  },
  center: {
    size: '50%'
  }
};

VB.dashboard.col1List;
VB.dashboard.col2List;
VB.dashboard.col1DefList = [];
VB.dashboard.col2DefList = [];
VB.dashboard.defaultCharts;

VB.dashboard.userLayout;
VB.dashboard.userPrefs;
VB.dashboard.layoutObj;

VB.dashboard.granularity.MINUTE  = 60;
VB.dashboard.granularity.HOUR    = 3600;
VB.dashboard.granularity.DAY     = 86400;
VB.dashboard.granularity.WEEK    = 604800;
VB.dashboard.granularity.MONTH   = 2592000;

VB.dashboard.granularity.MINUTE_PTS = 12;
VB.dashboard.granularity.HOUR_PTS   = 12;
VB.dashboard.granularity.DAY_PTS    = 12;
VB.dashboard.granularity.WEEK_PTS   = 16;
VB.dashboard.granularity.MONTH_PTS  = 12;

VB.dashboard.granularitySel = {
  1: 'MINUTE',
  2: 'HOUR',
  3: 'DAY',
  4: 'WEEK',
  5: 'MONTH'
}
VB.dashboard.granularityMap;

VB.dashboard.createChart = function(id, startX, endX, granularity, noTimer) {
  var thisChart;
  var dataTypeMap;
  var granularityMap;
  var compTypeMap;
  var sampleTypeMap;
  var displayName;

  // Request the chart data from the server, specifying
  // startX/endX if zooming or granularity if the user
  // has specified an override
  var data = 'id='+id;
  if (startX && endX) {
    data = data + '&startX='+startX+'&endX='+endX;
  }
  if (granularity) {
    var numPtsStr = 'VB.dashboard.granularity.'+granularity+'_PTS';
    var context = window;
    var namespace = numPtsStr.split('.');
    var variableName = namespace.pop();
    for (var k = 0; k < namespace.length; k++) {
      context = context[namespace[k]];
    }
    var numPts = context[variableName];
    data = data + '&granularity='+ granularity + '&numDataPoints=' + numPts;
  }
  jQuery.ajax({
    async: false,
    data: data,
    url: VB.appCtx+'chartQuery/getChart',
    success: function(resp) {
      thisChart = resp.chart;
      displayName = resp.displayName;
      dataTypeMap = resp.dataTypeMap;
      granularityMap = resp.granularityMap;
      VB.dashboard.granularityMap = granularityMap;
      compTypeMap = resp.compTypeMap;
      sampleTypeMap = resp.sampleTypeMap;
    },
    cache: false
  });

  if (thisChart == null) {
    jQuery.jGrowl(VB.i18n.server_error, {theme: 'error'});
    return;
  }
  if (!granularity) {
    granularity = thisChart.chartQuery.granularity.name;
  }
  
  zoomSelection =  function(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    // request a new chart based on the selected start and end times on the X axis
    var chartId = event.target.container.parentNode.id.substring(6);
    var container = jQuery('#chart-'+chartId)[0].parentNode;
    var granularityStr = jQuery('.granularity', container)[0].innerHTML;
    var enumVal;
    jQuery.each(VB.dashboard.granularityMap, function(key, value) {
      if (value === granularityStr) {
        enumVal = key;
      }
    });
    if (VB.dashboard.timers[chartId]) {
      clearTimeout(VB.dashboard.timers[chartId]);
      VB.dashboard.timers[chartId] = null;
    }
    VB.dashboard.createChart(chartId, Math.round(event.xAxis[0].min), Math.round(event.xAxis[0].max), enumVal, true);

    // add button to reset selection
    var chart = VB.dashboard.chart[chartId];
    var lang = chart.options.lang;
    chart.renderer.button(lang.resetZoom, chart.chartWidth-90, 50, VB.dashboard.resetZoom).add();
  }

  timerLoad = function(event) {

    event.preventDefault();
    event.stopImmediatePropagation();

    var chartId = this.container.parentNode.id.substring(6);

    var slider = jQuery('#slider_'+chartId);
    jQuery.each([1,2,3,4,5], function(idx) {
      if (VB.dashboard.granularitySel[this] == 'MINUTE') {
        slider.slider('value', this);
      }
    });

    // set up updates
    if (VB.dashboard.timers[chartId] !== null) {
      VB.dashboard.timers[chartId] = setTimeout(function() {
        VB.dashboard.createChart(chartId, null, null, 'MINUTE');
      }, 60000);
    }
  }

  var eventsObj = {};
  eventsObj['selection'] = zoomSelection;
  if (granularity == 'MINUTE' && !noTimer) {
    eventsObj['load'] = timerLoad;
  }

  var chartData = [];
  var yAxes = [];
  var axisObjPct = {};
  axisObjPct['minPadding'] = 0.2;
  axisObjPct['maxPadding'] = 0.2;
  axisObjPct['min']        = 0;
//  axisObjPct['max']        = 100;
  axisObjPct['title']      = {'text': VB.i18n.percentage};
  var axisObjCnt = {};
  axisObjCnt['minPadding'] = 0.2;
  axisObjCnt['maxPadding'] = 0.2;
  axisObjCnt['min']        = 0;
  axisObjCnt['title']      = {'text': VB.i18n.count};

  // configuration of the x axis
  var xAxisLabelCnf = {};
  xAxisLabelCnf['rotation'] = 90;
  xAxisLabelCnf['align'] = 'left';
  if (granularity == 'DAY') {
    xAxisLabelCnf['formatter'] = function() {
      return Highcharts.dateFormat('%a %d', this.value);
    }
  }

  // Set up the chart data
  var count = false;
  var pct   = false;
  var renderLines = thisChart.lines;
  renderLines.sort(function(a, b) {
    return a.lineQuery.id - b.lineQuery.id;
  });
  jQuery.each(renderLines, function(idx) {
    var lineObj = {};
    lineObj['name'] = dataTypeMap[this.lineQuery.dataType.name];
    var data = [];
    var vals = this.values;
    vals.sort(function(a,b) {
      return a[0] - b[0];
    });    
    jQuery.each(vals, function(idx) {
      var point = [Math.round(this[0]), this[1]];
      data.push(point);
    });
    lineObj['data'] = data;
    lineObj['dataType'] = this.lineQuery.dataType.name;
    if (this.lineQuery.dataType.name.indexOf("COUNT") > 0) {
      count = true;
    }
    else {
      pct = true;
    }
    lineObj['compType'] = compTypeMap[this.lineQuery.computationType.name];
    lineObj['sampleType'] = sampleTypeMap[this.lineQuery.sampleType.name];
    chartData.push(lineObj);
  });
  if (count && pct) {
    yAxes.push(axisObjPct);
      axisObjCnt['opposite']   = true;
      axisObjCnt['title'] = {
        margin: 25,
        text: axisObjCnt['title'].text
      }
    yAxes.push(axisObjCnt);

    // assign lines to an axis
    jQuery.each(chartData, function(idx) {
      if (this.dataType.indexOf("COUNT") > 0) {
        this['yAxis'] = 1;
      }
      else {
        this['yAxis'] = 0;
      }
    });
  }
  else if (pct && !count) {
    yAxes.push(axisObjPct);
  }
  else if (count && !pct) {
    yAxes.push(axisObjCnt);
  }

  // set interval (in seconds) between ticks on the x axis
  var xTickInterval = (granularity) ? VB.dashboard.granularity[granularity] :
    VB.dashboard.granularity[thisChart.chartQuery.granularity.name];

  // set global Highcharts options
  Highcharts.setOptions({
    global: {
      useUTC: false
    },
    lang: {
      exportButtonTitle: VB.i18n.exportButtonTitle,
      months:            Date.CultureInfo.abbreviatedMonthNames,
      printButtonTitle:  VB.i18n.printButtonTitle,
      resetZoom:         VB.i18n.resetZoom,
      resetZoomTitle:    VB.i18n.resetZoomTooltip,
      weekdays:          Date.CultureInfo.abbreviatedDayNames
    }
  });

  // create the chart
  VB.dashboard.chart[id] = new Highcharts.Chart({
    chart: {
      renderTo: 'chart-'+id,
      defaultSeriesType: 'line',
      zoomType: 'x',
      events: eventsObj
    },
    credits: {
      enabled: false
    },
    title: {
      text: displayName
    },
    xAxis: {
      type: 'datetime',
      maxPadding: 0.05,
      labels: xAxisLabelCnf
    },
    yAxis: yAxes,
    legend: {
      margin: 25,
      itemStyle: {
        fontSize:   '10px',
        fontFamily: 'verdana, arial, helvetica, sans-serif'
      }
    },
    tooltip: {
      formatter: function() {
        var pThis = this,
        series = pThis.series,
        xAxis = series.xAxis,
        x = pThis.x;
        var dObj = new Date(x);
        var dateStr =  dObj.toString(Date.CultureInfo.formatPatterns.shortDate).replace(/'/g, " ") +
          " " +
          dObj.toString(Date.CultureInfo.formatPatterns.longTime).replace(/'/g, " ");
        return '<b>'+ (pThis.point.name || series.name) +'</b><br/>'+
        (x ?
        VB.i18n.tooltip_date +' '+
        (xAxis && xAxis.options.type == 'datetime' ? dateStr : x) +'<br/>':'')+
        VB.i18n.tooltip_value+' '+ pThis.y +'<br/>' +
        VB.i18n.tooltip_sampleType+' ' + series.options.sampleType +'<br/>' +
        VB.i18n.tooltip_compType+' ' + series.options.compType;
      }
    },
    exporting: {
      url: VB.appCtx+'monitoring/convertSVG',
      buttons: {
        exportButton: {
          menuItems: [{
            text: VB.dashboard.lang.downloadPNG,
            onclick: function() {
              this.exportChart();
            }
          }, {
//            text: VB.dashboard.lang.downloadJPEG,
//            onclick: function() {
//              this.exportChart({
//                type: 'image/jpeg'
//              });
//            }
//          }, {
//            text: VB.dashboard.lang.downloadPDF,
//            onclick: function() {
//              this.exportChart({
//                type: 'application/pdf'
//              });
//            }
//          }, {
            text: VB.dashboard.lang.downloadCSV,
            onclick: function() {
              VB.dashboard.exportChartCSV(this);
            }
          },
          null,
          null]
        }
      }
    },
    series: chartData
  });
  VB.dashboard.chart[id].redraw();

  // set up the granularity override slider
  var slider = jQuery('#slider_'+id);
  slider.slider({
    min: 1,
    max: 5,
    slide: function(event, ui) {
      var val = VB.dashboard.granularityMap[VB.dashboard.granularitySel[ui.value]];
      var chartId = ui.handle.parentNode.id.substring(7);
      clearTimeout(VB.dashboard.timers[chartId]);
      if (ui.value > 1) {
        VB.dashboard.timers[chartId] = null;
      }
      else {
        delete VB.dashboard.timers[chartId];
      }
      jQuery('.granularity', ui.handle.parentNode.parentNode)[0].innerHTML = val;
      VB.dashboard.createChart(chartId, null, null, VB.dashboard.granularitySel[ui.value]);
    }
  });
  slider.css({
    width: '75px',
    display: 'inline-block',
    marginLeft: '7px',
    marginTop: '2px'
  });

    var container = jQuery('#chart-'+id)[0].parentNode;
    var gran = (granularity)?granularity:thisChart.chartQuery.granularity.name;
    jQuery('.granularity', container)[0].innerHTML = VB.dashboard.granularityMap[gran];
    jQuery.each([1,2,3,4,5], function(idx) {
      if (VB.dashboard.granularitySel[this] == gran) {
        slider.slider('value', this);
      }
    });

}

VB.dashboard.initDashboard = function() {

  VB.dashboard.lang = {
    downloadPNG: VB.i18n.downloadPNG,
    downloadJPEG: VB.i18n.downloadJPEG,
    downloadPDF: VB.i18n.downloadPDF,
    downloadCSV: VB.i18n.downloadCSV,
    exportButtonTitle: VB.i18n.exportButtonTitle,
    printButtonTitle: VB.i18n.printButtonTitle
  };
	
  // get the user layout preferences
  var layoutCfg = VB.dashboard.getDefaultLayoutCfg();
  
  // create the layout
  var layout = jQuery('#layout');
  VB.dashboard.layoutObj = layout.layout(layoutCfg);

  // generate the charts
  var prefList = [];
  VB.dashboard.getDefaultCharts();
  var prefObj = {};
  prefObj['charts-col-1-list'] = [];
  prefObj['charts-col-2-list'] = [];
  jQuery.each(VB.dashboard.defaultCharts, function(idx) {
    if (idx%2 != 0) {
      prefObj['charts-col-1-list'].push(this.chartQuery.guid);
    }
    else {
      prefObj['charts-col-2-list'].push(this.chartQuery.guid);
    }
  });
  VB.dashboard.col1DefList = prefObj['charts-col-1-list'];
  VB.dashboard.col2DefList = prefObj['charts-col-2-list'];
  var prepObj = new Object();
  prepObj.name = 'charts-col-1-list';
  prepObj.value = prefObj['charts-col-1-list'].toString();
  prefList.push(prepObj);
  prepObj = new Object();
  prepObj.name = 'charts-col-2-list';
  prepObj.value = prefObj['charts-col-2-list'].toString();
  prefList.push(prepObj);

  jQuery.each(prefList, function(idx) {
    if (this.value != null && this.value != '') {
      var prefName = this.name;
      var prefVal  = this.value.split(',');
      if (prefName == 'charts-col-1-list') {
        var list1 = [];
        jQuery.each(prefVal, function(idx) {
          if (this != null && this != '') {
            list1.push(this);
          }
        });
        var c1List = list1;
        if (c1List.length == 0) {
          c1List = VB.dashboard.col1List;
        }
        else {
          VB.dashboard.col1List = c1List;
        }
        jQuery.each(c1List, function(idx) {
          var chartId = this;
          VB.dashboard.generateChartNode(chartId, 1);
          VB.dashboard.createChart(chartId);
        });
      }
      else if (prefName == 'charts-col-2-list') {
        var list2 = [];
        jQuery.each(prefVal, function(idx) {
          if (this != null && this != '') {
            list2.push(this);
          }
        });
        var c2List = list2;
        if (c2List.length == 0) {
          c2List = VB.dashboard.col2List;
        }
        else {
          VB.dashboard.col2List = c2List;
        }
        jQuery.each(c2List, function(idx) {
          var chartId = this;
          VB.dashboard.generateChartNode(chartId, 2);
          VB.dashboard.createChart(chartId);
        });
      }
    }
  });
  
  // perform any layout resizing
  var height;
  var pane1 = jQuery('.ui-layout-west');
  var pane2 = jQuery('.ui-layout-center');
  var border1 = parseInt(pane1.css("borderTopWidth")) + parseInt(pane1.css("borderBottomWidth"));
  if (isNaN(border1)) {
    border1 = 0;
  }
  var border2 = parseInt(pane2.css("borderTopWidth")) + parseInt(pane2.css("borderBottomWidth"));
  if (isNaN(border2)) {
    border2 = 0;
  }
  var pane1Height = pane1.position().top + border1 + pane1[0].scrollHeight;
  var pane2Height = pane2.position().top + border2 + pane2[0].scrollHeight;
  height = (pane1Height >= pane2Height)?pane1Height:pane2Height;
  layout.height(height);
  VB.dashboard.layoutObj.resizeAll();
  setTimeout(function() {
    jQuery('#overlay').hide().removeClass('overlay').fadeIn('slow');
  }, 500);

}

VB.dashboard.getDefaultCharts = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'chartQuery/getDefaultCharts',
    success: function(charts) {
      var chartList = [];
      jQuery.each(charts, function() {
        if (this.chartQuery.name == 'monitoring.serverEvtMap.clusterMasterFQDN' ||
            this.chartQuery.name == 'chart.query.dataType.CPU_CONSUMPTION') {
          chartList.push(this);
        }
      });
      VB.dashboard.defaultCharts = chartList;
    },
    cache: false
  });
}

VB.dashboard.getDefaultLayoutCfg = function() {
  var layoutCfg = {	
    north: {
      closable: false,
      resizable: false
    },
    west: {
      size: '50%',
      closable: false,
      resizable: false
    },
    center: {
      size: '50%',
      resizable: false
    }
  };
  return layoutCfg;
}

VB.dashboard.generateChartNode = function(id, column) {
  var nodeStr = '<li class=\"widget\" id=\"widget_'+id+
  '\"><div class=\"widget-head\"><div class=\"slider\" id=\"slider_'+id+'\" title=\"'+VB.i18n.chartGranularity+'\"></div>'+
  '<div class=\"chartDrag\"><label for=\"slider_'+id+'\"><span class=\"granularityLabel\">'+VB.i18n.granularityLabel+
  '</span><span class=\"granularity\"></span></label></div>'+
  '</div><div class=\"widget-content\" id=\"chart-'+id+
  '\"></div></li>';
  jQuery(nodeStr).appendTo(jQuery('#column'+column));
}

VB.dashboard.exportChartCSV = function(chart) {

  var chartData = [];
  jQuery.each(chart.series[0].data, function(didx) {
    var point = this;
    var pointData = [];
    pointData.push(point.x);
    jQuery.each(chart.series, function(sidx) {
      pointData.push(this.data[didx].y)
    });
    chartData.push(pointData);
  });

  // create the form
  form = Highcharts.createElement('form', {
    method: 'post',
    action: VB.appCtx+'chartQuery/exportChartCSV'
  }, {
    display: 'NONE'
  }, document.body);

  // add the values
  jQuery.each(chartData, function(idx) {
    Highcharts.createElement('input', {
      type: 'HIDDEN',
      name: idx,
      value: this.toString()
    }, null, form);
  });

  // submit
  form.submit();

  // clean up
  Highcharts.discardElement(form);
}

VB.dashboard.charts2PDF = function() {
  var svgMap = {};
  jQuery.each(VB.dashboard.col1List, function(idx) {
    svgMap['0_'+idx] = VB.dashboard.chart[this].getSVG();
  });
  jQuery.each(VB.dashboard.col2List, function(idx) {
    svgMap['1_'+idx] = VB.dashboard.chart[this].getSVG();
  });

  // create the form
  form = Highcharts.createElement('form', {
    method: 'post',
    action: VB.appCtx+'monitoring/charts2PDF'
  }, {
    display: 'NONE'
  }, document.body);

  // add the values
  jQuery.each(svgMap, function(idx) {
    Highcharts.createElement('input', {
      type: 'HIDDEN',
      name: idx,
      value: this
    }, null, form);
  });

  // submit
  form.submit();

  // clean up
  Highcharts.discardElement(form);
}

VB.dashboard.resetZoom = function() {

  // reset zoom, maintaining granularity
  var me = this.element.parentNode?this.element.parentNode:this.element.parentElement;
  var chartContainer = jQuery(me).closest('.widget-content');
  var chartId = chartContainer[0].id.substring(6);
  var granularityStr = jQuery('.granularity', chartContainer[0].parentNode)[0].innerHTML;
  var enumVal;
  jQuery.each(VB.dashboard.granularityMap, function(key, value) {
    if (value === granularityStr) {
      enumVal = key;
    }
  });

  if (enumVal != 'MINUTE') {
    VB.dashboard.timers[chartId] = null;
  }
  else {
    delete VB.dashboard.timers[chartId];
  }
  VB.dashboard.createChart(chartId, null, null, enumVal);
}

VB.dashboard.initServers = function(timestamp) {
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
    icons: {
      primary: "ui-icon-search"
    },
    text: false
  });
  jQuery('[id^="action"]').button({disabled: true});
  jQuery('#filterToggle').button({disabled: false});
  VB.dashboard.requestServerData(timestamp);
}

VB.dashboard.requestServerData = function(timestamp) {
  var url = VB.appCtx+'monitoring/listServers';
  jQuery.ajax({
    url: url,
    data: 'timestamp='+timestamp,
    type: "post",
    dataType: 'json',
    complete: VB.dashboard.handleServerResponse
  });
}

VB.dashboard.handleServerResponse = function(xhr) {

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
  var selectedRowIds = [];
  var columns = [];
  var columnList = VB.dashboard.serversColumnList;

  var checkboxSelector = new Slick.CheckboxSelectColumn({
    cssClass: "slick-cell-checkboxsel"
  });
  var checkbox_column = checkboxSelector.getColumnDefinition();
  columns.push(checkbox_column);

  VB.dashboard.getColumnPreferences();
  
  var prefs = VB.dashboard.userPrefs;
  var userColumns = [];
  var userColumnList = [];
  userColumnList.push(checkbox_column);
  for (var j = 0; j < prefs.length; j++) {
    if (prefs[j].name.indexOf('grid-dashboard-columns') >= 0) {
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
  jQuery('#grid').height(250);
  if (VB.monitorTable) {
    selectedRowIds = VB.monitorTable.getSelectedRows();
    var sortAsc = VB.monitorTable.sorted;
    VB.dashboard.gridDataView.setItems(data);
    VB.dashboard.gridDataView.setPagingOptions({pageSize:10});
    if (sortAsc != undefined) {
      VB.monitorTable.trigger(VB.monitorTable.onSort, {sortAsc:sortAsc});
    }
    VB.monitorTable.setSelectedRows(selectedRowIds);
    VB.dashboard.styleServerCpuUtil();
    VB.dashboard.styleServerMemUtil();
  }
  else {

    var dataView = new Slick.Data.DataView();
    VB.dashboard.gridDataView = dataView;
    dataView.setItems(data);
    dataView.setPagingOptions({pageSize:10});
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
    VB.dashboard.styleServerCpuUtil();
    VB.dashboard.styleServerMemUtil();

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
      VB.dashboard.styleServerCpuUtil();
      VB.dashboard.styleServerMemUtil();
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
        restoreRows.push(VB.dashboard.gridDataView.getRowById(this));   
      });
      VB.monitorTable.setSelectedRows(restoreRows);

      VB.dashboard.styleServerCpuUtil();
      VB.dashboard.styleServerMemUtil();

    });

    dataView.onPagingInfoChanged.subscribe(function(pagingInfo) {
      VB.monitorTable.setSelectedRows([]);
      dataView.refresh();
      grid.invalidateAllRows();
      grid.render();
      VB.dashboard.styleServerCpuUtil();
      VB.dashboard.styleServerMemUtil();
    });

    // wire up the search textbox to apply the filter to the model
    jQuery("#txtSearch,#txtSearch2").keyup(function(e) {
      Slick.GlobalEditorLock.cancelCurrentEdit();

      // clear on Esc
      if (e.which == 27)
        this.value = "";

      VB.dashboard.searchString = this.value;
      if (this.value != "") {
        dataView.setFilter(VB.dashboard.filterServerGrid);
      }
      else {
        dataView.setFilter();
      }
      VB.dashboard.styleServerCpuUtil();
      VB.dashboard.styleServerMemUtil();
    });

  }
  setTimeout(function() {
    VB.dashboard.requestServerData(timestamp);
  }, 10000);
}

VB.dashboard.toggleFilterRow = function() {
    var grid = VB.monitorTable;
    if (jQuery(grid.getTopPanel()).is(":visible"))
        grid.hideTopPanel();
    else
        grid.showTopPanel();
}

VB.dashboard.toggleServer = function(event, serverId, status, ts) {

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
  if (serverId == undefined) {
    var rows = VB.monitorTable.getSelectedRows();
    jQuery.each(rows, function(idx) {
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
        type: 'post'
      });        
    }  
    if (onlineServerIds.length > 0) {
      url = VB.appCtx+'monitoring/onlineServer';
      jQuery.ajax({
        url: url,
        data: onlineServerIds,
        type: 'post'
      });        
    }          
    VB.monitorTable.setSelectedRows([]);
    setTimeout(function() {
    VB.dashboard.requestServerData();
    }, 500);
    jQuery(this).dialog('close');
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

//VB.dashboard.toggleServer = function(event, serverId, status, ts) {
//
//  if (event) {
//    // Prevent href from firing
//    if (event.preventDefault) {
//      event.preventDefault();
//    }
//    else {
//      // for IE
//      event.returnValue = false;
//    }
//  }
//
//  // TODO: Temporary solution until the
//  // service methods can accept a list.
//  if (serverId == undefined) {
//    var rows = VB.monitorTable.getSelectedRows();
//    var item = VB.monitorTable.getDataItem(rows[0]);
//    if (item == undefined) {
//      // This shouldn't occur.
//      jQuery.jGrowl(VB.i18n.no_selection, {theme: 'warn'});
//      return;
//    }
//    serverId = item.serverId;
//    status = item.status;
//    ts = item.timestamp;
//  }
//
//  var offline = VB.i18n.offline;
//  var cancel = VB.i18n.cancel;
//  var buttonsObj = new Object();
//  buttonsObj[offline] = function() {
//    var url = VB.appCtx+'monitoring/offlineServer';
//    jQuery.ajax({
//      url: url,
//      data: 'serverId='+serverId,
//      type: 'post'
//    });
//    VB.monitorTable.setSelectedRows([]);
//    setTimeout(function() {
//      VB.dashboard.requestServerData(ts);
//    }, 500);
//    jQuery(this).dialog('close');
//  };
//  buttonsObj[cancel] = function() {
//    jQuery(this).dialog('close');
//  };
//  if (status == 'ONLINE') {
//    jQuery("#dialog-confirm").dialog({
//      resizable: false,
//      height:'auto',
//      modal: true,
//      buttons: buttonsObj
//    });
//  }
//  else {
//    var url = VB.appCtx+'monitoring/onlineServer';
//    jQuery.ajax({
//      url: url,
//      data: 'serverId='+serverId,
//      type: 'post'
//    });
//    VB.monitorTable.setSelectedRows([]);
//    setTimeout(function() {
//      VB.dashboard.requestServerData(ts);
//    }, 500);
//  }
//}

VB.dashboard.styleServerCpuUtil = function() {
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

VB.dashboard.styleServerMemUtil = function() {
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

VB.dashboard.filterServerGrid = function(item) {
  var found = false;
  if (VB.dashboard.searchString != "") {
    jQuery.each(VB.dashboard.serversSearchColumns, function(idx) {
      var col = VB.dashboard.serversSearchColumns[idx];
      var itemStr = item[col].toString();
      if (itemStr.indexOf(VB.dashboard.searchString) >= 0) {
        found = true;
      }
    });
  }
  return found;
}

VB.dashboard.saveColumnPreferences = function(columns, uri) {
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

VB.dashboard.getColumnPreferences = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'monitoring/getColumnPrefs',
    success: function(prefs) {
      VB.dashboard.userPrefs = prefs;
    },
    cache: false
  });
}
