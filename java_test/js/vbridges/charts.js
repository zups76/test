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
 * charts.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.charts == 'undefined') {
  VB.charts = {};
  VB.charts.chart = {};
  VB.charts.granularity = {};
  VB.charts.lang = {};
  VB.charts.timers = {};
}

/*
 * Configuration object describing the default
 * layout for charts page: 2 columns ("west" and
 * "center") for the charts. The "north" pane is
 * the header containing the page title and a toolbar
 * with action buttons for the page.
 */
VB.charts.defaultLayout = {
  north: {
    closable: false,
    resizable: false
  },
  west: {
    size: '50%',
    closable: false
  },
  center: {
    size: '50%'
  }
};

VB.charts.col1List;
VB.charts.col2List;
VB.charts.col1DefList = [];
VB.charts.col2DefList = [];
VB.charts.defaultCharts;

VB.charts.userLayout;
VB.charts.userPrefs;
VB.charts.layoutObj;

VB.charts.granularity.MINUTE  = 60;
VB.charts.granularity.HOUR    = 3600;
VB.charts.granularity.DAY     = 86400;
VB.charts.granularity.WEEK    = 604800;
VB.charts.granularity.MONTH   = 2592000;

VB.charts.granularity.MINUTE_PTS = 12;
VB.charts.granularity.HOUR_PTS   = 12;
VB.charts.granularity.DAY_PTS    = 12;
VB.charts.granularity.WEEK_PTS   = 16;
VB.charts.granularity.MONTH_PTS  = 12;

VB.charts.granularitySel = {
  1: 'MINUTE',
  2: 'HOUR',
  3: 'DAY',
  4: 'WEEK',
  5: 'MONTH'
}
VB.charts.granularityMap;

VB.charts.createChart = function(id, startX, endX, granularity, noTimer) {
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
    var numPtsStr = 'VB.charts.granularity.'+granularity+'_PTS';
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
      VB.charts.granularityMap = granularityMap;
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
    jQuery.each(VB.charts.granularityMap, function(key, value) {
      if (value === granularityStr) {
        enumVal = key;
      }
    });
    if (VB.charts.timers[chartId]) {
      clearTimeout(VB.charts.timers[chartId]);
      VB.charts.timers[chartId] = null;
    }
    VB.charts.createChart(chartId, Math.round(event.xAxis[0].min), Math.round(event.xAxis[0].max), enumVal, true);

    // add button to reset selection
    var chart = VB.charts.chart[chartId];
    var lang = chart.options.lang;
    chart.renderer.button(lang.resetZoom, chart.chartWidth-90, 50, VB.charts.resetZoom).add();
  }

  timerLoad = function(event) {

    event.preventDefault();
    event.stopImmediatePropagation();

    var chartId = this.container.parentNode.id.substring(6);

    var slider = jQuery('#slider_'+chartId);
    jQuery.each([1,2,3,4,5], function(idx) {
      if (VB.charts.granularitySel[this] == 'MINUTE') {
        slider.slider('value', this);
      }
    });

    // set up updates
    if (VB.charts.timers[chartId] !== null) {
      VB.charts.timers[chartId] = setTimeout(function() {
        VB.charts.createChart(chartId, null, null, 'MINUTE');
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
  var xTickInterval = (granularity) ? VB.charts.granularity[granularity] :
    VB.charts.granularity[thisChart.chartQuery.granularity.name];

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
  VB.charts.chart[id] = new Highcharts.Chart({
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
            text: VB.charts.lang.downloadPNG,
            onclick: function() {
              this.exportChart();
            }
          }, {
//            text: VB.charts.lang.downloadJPEG,
//            onclick: function() {
//              this.exportChart({
//                type: 'image/jpeg'
//              });
//            }
//          }, {
//            text: VB.charts.lang.downloadPDF,
//            onclick: function() {
//              this.exportChart({
//                type: 'application/pdf'
//              });
//            }
//          }, {
            text: VB.charts.lang.downloadCSV,
            onclick: function() {
              VB.charts.exportChartCSV(this);
            }
          },
          null,
          null]
        }
      }
    },
    series: chartData
  });
  VB.charts.chart[id].redraw();

  // set up the granularity override slider
  var slider = jQuery('#slider_'+id);
  slider.slider({
    min: 1,
    max: 5,
    slide: function(event, ui) {
      var val = VB.charts.granularityMap[VB.charts.granularitySel[ui.value]];
      var chartId = ui.handle.parentNode.id.substring(7);
      clearTimeout(VB.charts.timers[chartId]);
      if (ui.value > 1) {
        VB.charts.timers[chartId] = null;
      }
      else {
        delete VB.charts.timers[chartId];
      }
      jQuery('.granularity', ui.handle.parentNode.parentNode)[0].innerHTML = val;
      VB.charts.createChart(chartId, null, null, VB.charts.granularitySel[ui.value]);
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
    jQuery('.granularity', container)[0].innerHTML = VB.charts.granularityMap[gran];
    jQuery.each([1,2,3,4,5], function(idx) {
      if (VB.charts.granularitySel[this] == gran) {
        slider.slider('value', this);
      }
    });

}

VB.charts.addAccordionPanel = function(event, el) {
  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    else {
      // for IE
      event.cancelBubble = true;
    }
  }
  var currentHdr = el.parentNode;
  var accordionContainer = currentHdr.parentNode;
  var lines = jQuery('input:hidden[name=lines]');
  handleResponse = function(xhr) {
    var newAcc = jQuery(jQuery(accordionContainer).after(xhr.responseText)).next();
    VB.charts.initAccordion(newAcc[0]);
    VB.charts.chartOptionsHandler(newAcc[0], false);
  }
  var url = VB.appCtx+'chartQuery/addLineQuery';
  jQuery.ajax({
    url: url,
    data: 'index='+lines.size(),
    type: 'post',
    complete: handleResponse
  });
}

VB.charts.remAccordionPanel = function(event, el, index) {
  if (event) {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    else {
      // for IE
      event.cancelBubble = true;
    }
  }
  var currentHdr = el.parentNode;
  var accordionContainer = currentHdr.parentNode;
  var hiddenLine = jQuery(accordionContainer).prev();
  var headers = jQuery('.header', accordionContainer);
  var index;
  var divs = jQuery('.content', accordionContainer);
  jQuery.each(headers, function(idx) {
    if (jQuery.contains(headers[idx], el)) {
      index = idx;
    }
  });
  var currentDiv = jQuery(divs[index]);
  currentHdr = jQuery(headers[index]);
  currentDiv.remove();
  currentHdr.remove();
  hiddenLine.remove();
}

VB.charts.dataTypeHandler = function(ctx) {
  var dataType = jQuery('select[id$=dataType]', ctx);
  dataType.change(function(evt) {
    var dt = jQuery(this);
    var id = this.id.substring(10, 11);
    var computationType = jQuery('input:radio[id=lineQuery.'+id+'.computationType]', ctx);
    var serverId = jQuery('select[id=lineQuery.'+id+'.serverId]', ctx);
    if (dt.attr('value') == 'LEAF_SESSION_COUNT' || dt.attr('value') == 'BRANCH_SESSION_COUNT') {
      computationType.each(function(idx) {
        var ct = jQuery(this);
        if (ct.attr('value') != 'CLUSTER_TOTAL') {
          ct.attr('disabled', true);
          serverId.attr('disabled', true);
        }
        else {
          ct.removeAttr('disabled');
        }
        if (ct.attr('value') == 'CLUSTER_TOTAL') {
          ct.attr('checked', true);
        }
      });
    }
    else if (dt.attr('value') == 'TOTAL_SESSION_COUNT') {
      computationType.each(function(idx) {
        var ct = jQuery(this);
        ct.removeAttr('disabled');
        if (ct.attr('value') == 'CLUSTER_TOTAL') {
          ct.attr('checked', true);
        }
      });
    }
    else if (dt.attr('value') == 'SESSION_COUNT') {
      computationType.each(function(idx) {
        var ct = jQuery(this);
        if (ct.attr('value') == 'SERVER') {
          ct.attr('disabled', true);
          serverId.attr('disabled', true);
        }
        else {
          ct.removeAttr('disabled');
        }
        if (ct.attr('value') == 'CLUSTER_TOTAL') {
          ct.attr('checked', true);
        }
      });
    }
    else if (dt.attr('value') == 'CPU_CONSUMPTION' || dt.attr('value') == 'MEMORY_USAGE') {
      computationType.each(function(idx) {
        var ct = jQuery(this);
        if (ct.attr('value') == 'CLUSTER_TOTAL') {
          ct.attr('disabled', true);
        }
        else {
          ct.removeAttr('disabled');
        }
        if (ct.attr('value') == 'CLUSTER_MAX') {
          ct.attr('checked', true);
        }
      });
    }
  });
}

VB.charts.chartOptionsHandler = function(ctx, disableSave) {
  var svrFld = jQuery('select[id$=serverId]', ctx);
  svrFld.attr('disabled', 'disabled');
  svrFld.siblings('input:radio').each(function() {
    var radio = jQuery(this);
    if (radio.val() == 'SERVER') {
      svrFld.focus(function() {
        radio.attr('checked', true);
      });
      radio.change(function() {
        if (this.checked) {
          svrFld.attr('disabled', '');
        }
      });
    }
    else {
      radio.change(function() {
        if (this.checked) {
          svrFld.attr('disabled', 'disabled');
        }
      });
    }
  });
  var saveBtn = jQuery('.ui-dialog-buttonpane button:last');
  if (disableSave) {
    saveBtn.button({disabled: true});
  }
  jQuery('#name').keyup(function() {
    if (this.value != '') {
      saveBtn.button({disabled: false});
    }
    else {
      saveBtn.button({disabled: true});
    }
  });
}

jQuery.fn.hint = function (blurClass) {
  if (!blurClass) {
    blurClass = 'blur';
  }

  return this.each(function () {
    // get jQuery version of 'this'
    var $input = jQuery(this),

    // capture the rest of the variable to allow for reuse
    title = $input.attr('title'),
    $form = jQuery(this.form),
    $win = jQuery(window);

    function remove() {
      if ($input.val() === title && $input.hasClass(blurClass)) {
        $input.val('').removeClass(blurClass);
      }
    }

    // only apply logic if the element has the attribute
    if (title) {
      // on blur, set value to title attr if text is blank
      $input.blur(function () {
        if (this.value === '') {
          $input.val(title).addClass(blurClass);
        }
      }).focus(remove).blur(); // now change all inputs to title

      // clear the pre-defined text when form is submitted
      $form.submit(remove);
      $win.unload(remove); // handles Firefox's autocomplete
    }
  });
}

VB.charts.initAccordion = function(ctx) {
  var selector = '.header .toggle a';
  if (!ctx) {
    ctx = 'body';
    selector = '.accordion .header .toggle a';
  }
  jQuery(selector, ctx).click(function() {
    jQuery(this.parentNode.parentNode).next().toggle('slow');
    var toggle = jQuery('.ui-icon-triangle-1-s', ctx);
    if (toggle[0]) {
      toggle.removeClass('ui-icon-triangle-1-s');
      toggle.addClass('ui-icon-triangle-1-e')
    }
    else {
      toggle = jQuery('.ui-icon-triangle-1-e', ctx);
      toggle.removeClass('ui-icon-triangle-1-e');
      toggle.addClass('ui-icon-triangle-1-s');
    }
    return false;
  });
}

VB.charts.handleChartLineName = function(content) {
  var hidden = jQuery('input:hidden', this[0].parentNode);
  hidden[0].value = content.current;
}

VB.charts.removeChart = function(el) {
  var chartEl = jQuery(el).closest('li');
  var chartId = chartEl.attr('id').split('_')[1];
  chartEl.remove();
  
  // ask the server to delete it
  jQuery.ajax({
    async: false,
    data: 'guid='+chartId,
    url: VB.appCtx+'chartQuery/delete',
    success: function(resp) {
      //
    }
  });

  // update preferences
  VB.charts.saveChartLayout(true);
}

VB.charts.confirmRemoveChart = function(el, event) {

  var chartEl = el;

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

  var ok = VB.i18n.OK;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[ok] = function() {
    VB.charts.removeChart(chartEl);
    jQuery(this).dialog('close');
  };
  buttonsObj[cancel] = function() {
    jQuery(this).dialog('close');
  };
  jQuery("#dialog-confirm-remove").dialog({
    resizable: false,
    height:180,
    modal: true,
    buttons: buttonsObj
  });

}

VB.charts.confirmResetLayout = function(event) {

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

  var ok = VB.i18n.OK;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[ok] = function() {
    VB.charts.resetChartLayout('chartLayout');
    jQuery(this).dialog('close');
  };
  buttonsObj[cancel] = function() {
    jQuery(this).dialog('close');
  };
  jQuery("#dialog-confirm-reset").dialog({
    resizable: false,
    height:180,
    modal: true,
    buttons: buttonsObj
  });

}

VB.charts.saveChartLayout = function(skipreload) {
  var layout = VB.charts.layoutObj;
  var westCfg = "charts-col-1-width="+escape(VB.charts.defaultLayout.west.size);
  var centerCfg = "charts-col-2-width="+escape(VB.charts.defaultLayout.center.size);
  var list = [];
  jQuery('ul#column1 div.widget-content').each(function() {
    var cntId = this.id.substr(6);
    list.push(cntId)
  });
  var westList = "charts-col-1-list="+list;
  list = [];
  jQuery('ul#column2 div.widget-content').each(function() {
    var cntId = this.id.substr(6);
    list.push(cntId)
  }); 
  var centerList = "charts-col-2-list="+list;
  var data = westCfg+"&"+westList+"&"+centerCfg+"&"+centerList;
  jQuery.ajax({
    type: 'post',
    url: VB.appCtx+'user/updatePrefs',
    data: data
  });
  if (!skipreload) {
    location.reload(true);
  }
}

VB.charts.resetChartLayout = function(layoutName) {
  VB.charts.getDefaultCharts();
  var prefObj = {};
  prefObj['charts-col-1-list'] = [];
  prefObj['charts-col-2-list'] = [];
  jQuery.each(VB.charts.defaultCharts, function(idx) {
    if (idx%2 != 0) {
      prefObj['charts-col-1-list'].push(this.chartQuery.guid);
    }
    else {
      prefObj['charts-col-2-list'].push(this.chartQuery.guid);
    }
  });
  VB.charts.col1DefList = prefObj['charts-col-1-list'];
  VB.charts.col2DefList = prefObj['charts-col-2-list'];
  var layout = VB.charts.layoutObj;
  var westCfg = "charts-col-1-width="+escape(VB.charts.defaultLayout.west.size);
  var westList = "charts-col-1-list="+VB.charts.col1DefList;
  var centerCfg = "charts-col-2-width="+escape(VB.charts.defaultLayout.center.size);
  var centerList = "charts-col-2-list="+VB.charts.col2DefList;
  var data = westCfg+"&"+westList+"&"+centerCfg+"&"+centerList;
  jQuery.ajax({
    async: false,
    type: 'post',
    url: VB.appCtx+'user/updatePrefs',
    data: data
  });
  location.reload(true);
}

VB.charts.initCharts = function() {

  VB.charts.lang = {
    downloadPNG: VB.i18n.downloadPNG,
    downloadJPEG: VB.i18n.downloadJPEG,
    downloadPDF: VB.i18n.downloadPDF,
    downloadCSV: VB.i18n.downloadCSV,
    exportButtonTitle: VB.i18n.exportButtonTitle,
    printButtonTitle: VB.i18n.printButtonTitle
  };
	
  // get the user layout preferences
  VB.charts.getUserPrefs();
  var layoutCfg;
  if (VB.charts.userPrefs && VB.charts.userPrefs.length > 0) {
    layoutCfg = VB.charts.getUserLayoutCfg(VB.charts.userPrefs);
  }
  else {
    layoutCfg = VB.charts.getDefaultLayoutCfg();
  }
  
  // create the layout
  VB.charts.layoutObj = jQuery('#layout').layout(layoutCfg);
  
  // set up the move handler
  jQuery(".column").sortable({
    handle:         "div.chartDrag",
    connectWith:	jQuery(".column"),
    placeholder:	'widget-placeholder',
    cursor:			'move',
    helper:			function (evt, ui) {
      return jQuery(ui).clone().appendTo('body').show();
    },
    over:			  function (evt, ui) {
      var $target_UL	= jQuery(ui.placeholder).parent(),
      targetWidth	= $target_UL.width(),
      helperWidth	= ui.helper.width(),
      padding		  = parseInt( ui.helper.css('paddingLeft') )
      + parseInt( ui.helper.css('paddingRight') )
      + parseInt( ui.helper.css('borderLeftWidth') )
      + parseInt( ui.helper.css('borderRightWidth') );
      //if (( (helperWidth + padding) - targetWidth ) > 20)
      ui.helper.height('auto').width( targetWidth - padding );
    }
  });

  // generate the charts based on user preferences
  var prefList = VB.charts.userPrefs;
  var savePrefs = false;
  if (prefList.length == 0) {
    savePrefs = true;
    VB.charts.getDefaultCharts();
    var prefObj = {};
    prefObj['charts-col-1-list'] = [];
    prefObj['charts-col-2-list'] = [];
    jQuery.each(VB.charts.defaultCharts, function(idx) {
      if (idx%2 != 0) {
        prefObj['charts-col-1-list'].push(this.chartQuery.guid);
      }
      else {
        prefObj['charts-col-2-list'].push(this.chartQuery.guid);
      }
    });
    VB.charts.col1DefList = prefObj['charts-col-1-list'];
    VB.charts.col2DefList = prefObj['charts-col-2-list'];
    var prepObj = new Object();
    prepObj.name = 'charts-col-1-list';
    prepObj.value = prefObj['charts-col-1-list'].toString();
    prefList.push(prepObj);
    prepObj = new Object();
    prepObj.name = 'charts-col-2-list';
    prepObj.value = prefObj['charts-col-2-list'].toString();
    prefList.push(prepObj);
  }
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
          c1List = VB.charts.col1List;
        }
        else {
          VB.charts.col1List = c1List;
        }
        jQuery.each(c1List, function(idx) {
          var chartId = this;
          VB.charts.generateChartNode(chartId, 1);
          VB.charts.createChart(chartId);
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
          c2List = VB.charts.col2List;
        }
        else {
          VB.charts.col2List = c2List;
        }
        jQuery.each(c2List, function(idx) {
          var chartId = this;
          VB.charts.generateChartNode(chartId, 2);
          VB.charts.createChart(chartId);
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
  jQuery('#layout').height(height);
  VB.charts.layoutObj.resizeAll();

  if (savePrefs) {
    VB.charts.saveChartLayout(true);
  }
}

VB.charts.getUserPrefs = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'user/getPrefs',
    success: function(prefs) {
      VB.charts.userPrefs = prefs;
    },
    cache: false
  });
}

VB.charts.getDefaultCharts = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'chartQuery/getDefaultCharts',
    success: function(charts) {
      VB.charts.defaultCharts = charts;
    },
    cache: false
  });
}

VB.charts.getUserLayoutCfg = function(prefs) {
  var layoutCfg = VB.charts.getDefaultLayoutCfg();
  jQuery.each(prefs, function(idx) {
    if (this.name == 'charts-col-1-width') {
      layoutCfg.west.size = VB.charts.defaultLayout.west.size;
    }
    else if (this.name == 'charts-col-2-width') {
      layoutCfg.center.size = VB.charts.defaultLayout.center.size;
    }
  });
  return layoutCfg;
}

VB.charts.getDefaultLayoutCfg = function() {
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

VB.charts.generateChartNode = function(id, column) {
  var nodeStr = '<li class=\"widget\" id=\"widget_'+id+
  '\"><div class=\"widget-head\"><div class=\"slider\" id=\"slider_'+id+'\" title=\"'+VB.i18n.chartGranularity+'\"></div>'+
  '<div class=\"chartDrag\"><label for=\"slider_'+id+'\"><span class=\"granularityLabel\">'+VB.i18n.granularityLabel+
  '</span><span class=\"granularity\"></span></label></div>'+
  '<a href=\"#\" onclick=\"VB.charts.confirmRemoveChart(this, event);\" title=\"'+VB.i18n.removeChart+'\">'+
  '<span class=\"ui-icon ui-icon-closethick\">'+
  'Close'+
  '</span></a></div><div class=\"widget-content\" id=\"chart-'+id+
  '\"></div></li>';
  jQuery(nodeStr).appendTo(jQuery('#column'+column));
}

VB.charts.exportChartCSV = function(chart) {

  var chartData = [];
  jQuery.each(chart.series, function() {
    jQuery.each(this.data, function(didx) {
      var point = this;
      var pointData = [];
      pointData.push(point.x);
      jQuery.each(chart.series, function(sidx) {
        if (this.data[didx])
          pointData.push(this.data[didx].y);
        else
          pointData.push('');
      });
      chartData.push(pointData);
    });
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

VB.charts.charts2PDF = function() {
  var svgMap = {};
  jQuery.each(VB.charts.col1List, function(idx) {
    svgMap['0_'+idx] = VB.charts.chart[this].getSVG();
  });
  jQuery.each(VB.charts.col2List, function(idx) {
    svgMap['1_'+idx] = VB.charts.chart[this].getSVG();
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

VB.charts.resetZoom = function() {

  // reset zoom, maintaining granularity
  var me = this.element.parentNode?this.element.parentNode:this.element.parentElement;
  var chartContainer = jQuery(me).closest('.widget-content');
  var chartId = chartContainer[0].id.substring(6);
  var granularityStr = jQuery('.granularity', chartContainer[0].parentNode)[0].innerHTML;
  var enumVal;
  jQuery.each(VB.charts.granularityMap, function(key, value) {
    if (value === granularityStr) {
      enumVal = key;
    }
  });

  if (enumVal != 'MINUTE') {
    VB.charts.timers[chartId] = null;
  }
  else {
    delete VB.charts.timers[chartId];
  }
  VB.charts.createChart(chartId, null, null, enumVal);
}

