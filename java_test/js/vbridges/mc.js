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
 * VERDE Console
 * mc.js
 */
jQuery.noConflict();

/*
 * Declare our namespace
 */
if (typeof VB == 'undefined') {
  VB = {};
}

/*
 * Global vars
 */
VB.errorStr;
VB.appCtx;
VB.i18n = new Object();

VB.updatei18nMap = function(newi18nMap) {
	for(key in newi18nMap){
		VB.i18n[key] = newi18nMap[key];
	}
}

VB.setLoginProgress = function(el, event) {
  var errorList = jQuery('#loginMessages ul');
  if (errorList) {
    errorList.empty();
    errorList.remove();
  }
  jQuery("#loginMessages .loginProgress").fadeIn();
}

VB.loadModal = function(el, event, inFlow, height, loginCtx, width) {

  var loginFlag = '<!-- VERDE Console Login -->';
  var errorFlag = '<!-- VERDE Console Error -->';

  // If height specified, use it. Else use
  // 'auto'.
  height = height ? VB.trimQuotes(height) : 'auto';

  // Prevent page refresh
  if (event.preventDefault) {
    event.preventDefault();
  }
  else {
    // for IE
    event.returnValue = false;
  }

  // Find the form element we need to submit
  var form = jQuery(el).closest("form");

  // submitButtons need to send their value
  // for web flows to work
  var url = el.href;
  if (url) {
    if (inFlow && el.id && el.value) {
      url = url + "?"+el.id+"="+el.value;
    }
  }
  else {
      url = event.target.href;
  }

  // Prep to send the form
  var dataToSend = form.serialize();

  var responseHandler = function(xhr) {

    if (xhr.responseText.indexOf(loginFlag) >= 0) {
      window.location = loginCtx;
    }
    else if (xhr.responseText.indexOf(errorFlag) >= 0) {
      jQuery('html').html(xhr.responseText);
      jQuery("#droppyMenus").droppy();
    }
   else {
      jQuery('.ui-widget-overlay').remove();
      jQuery('.ui-dialog').remove();
      jQuery('#modalDiv').remove();
      var $dialog = jQuery('<div id="modalDiv"></div>').append(xhr.responseText);
      var buttons = jQuery('.botBtnDiv a, .botBtnDiv input:submit', $dialog);
      var closeTxt;
      var buttonsObj = new Object();
      buttons.each(function(button) {
        var jsTxt = buttons[button].attributes['onclick'];
        if (jsTxt && !jsTxt.constructor) {
          jsTxt = jQuery(this).attr("onclick");
        }
        var href = buttons[button].href;
        var buttonTxt = buttons[button].innerHTML;
        if (!buttonTxt || buttonTxt == '') {
          buttonTxt = buttons[button].value;
        }
        if (jsTxt) {
          var js;
          if (jsTxt.value) {
            js = jsTxt.value.split(':')[1];
          }
          else {
            js = jsTxt.toString().split('\n')[2];
          }
          var jsArgList = (js.substring(js.indexOf('(')+1, js.indexOf(')'))).split(",");
          var functionName = js.substring(0,js.indexOf('(')+1);
          buttonsObj[buttonTxt] = function() {
            if (functionName.indexOf('printPage') > 0) {
              VB.printPage();
            }
            else if (functionName.indexOf('loadModal') > 0) {
              VB.loadModal(buttons[button],
                           event,
                           VB.stringToBoolean(jsArgList[2]),
                           VB.trimQuotes(jsArgList[3]),
                           VB.trimQuotes(jsArgList[4]),
                           (jsArgList[5])?VB.trimQuotes(jsArgList[5]):null);
            }
            else if (functionName.indexOf('submitModal') > 0) {
              if (VB.appLayers) {
                var thisBtn = jQuery('.ui-dialog-buttonpane button:last');
                thisBtn.button({disabled: true});
                jQuery('#importing').css('display', 'block');
                jQuery('#file-uploader').css('display', 'none');
              }
              VB.submitModal(buttons[button],
                             event,
                             VB.stringToBoolean(jsArgList[2]),
                             VB.trimQuotes(jsArgList[3]),
                             VB.trimQuotes(jsArgList[4]),
                             (jsArgList[5])?VB.trimQuotes(jsArgList[5]):null);
            }
          }
        }
        else if (href) {
          closeTxt = buttonTxt;
          buttonsObj[buttonTxt] = function() {
            window.location = href;
          }
        }
        else {
          buttonsObj[buttonTxt] = function() {
            var form = jQuery("form", this);
            var cancelInp = document.createElement('input');
            cancelInp.type = 'hidden';
            cancelInp.id = buttons[button].id;
            cancelInp.name = buttons[button].name;
            cancelInp.value = buttons[button].value;
            form.append(cancelInp);
            form[0].submit();
          }
        }
      });
      $dialog.dialog({
        title: el.title,
        width: (width)?width:520,
        height: height,
        maxHeight: height,
        modal: true,
        open: function(event, ui) {
          VB.modalPageInit(event, ui);
        },
        close: buttonsObj[closeTxt],
        buttons: buttonsObj
      });
    }
  }

  jQuery.ajax({
    url: url,
    data: dataToSend,
    type: "post",
    dataType: 'html',
    complete: responseHandler
  });
}

VB.loadModalImageAction = function(el, event, inFlow, height, loginCtx, width) {

  var loginFlag = '<!-- VERDE Console Login -->';
  var errorFlag = '<!-- VERDE Console Error -->';

  // If height specified, use it. Else use
  // 'auto'.
  height = height ? VB.trimQuotes(height) : 'auto';

  // Prevent page refresh
  if (event.preventDefault) {
    event.preventDefault();
  }
  else {
    // for IE
    event.returnValue = false;
  }

  var url = el.href;

  var responseHandler = function(xhr) {

    if (xhr.responseText.indexOf(loginFlag) >= 0) {
      window.location = loginCtx;
    }
    else if (xhr.responseText.indexOf(errorFlag) >= 0) {
      jQuery('html').html(xhr.responseText);
      jQuery("#droppyMenus").droppy();
    }
   else {
      jQuery('.ui-widget-overlay').remove();
      jQuery('.ui-dialog').remove();
      jQuery('#modalDiv').remove();
      var $dialog = jQuery('<div id="modalDiv"></div>').append(xhr.responseText);
      var buttons = jQuery('.botBtnDiv a, .botBtnDiv input:submit', $dialog);
      var closeTxt;
      var buttonsObj = new Object();
      buttons.each(function(button) {
        var jsTxt = buttons[button].attributes['onclick'];
        if (jsTxt && !jsTxt.constructor) {
          jsTxt = jQuery(this).attr("onclick");
        }
        var href = buttons[button].href;
        var buttonTxt = buttons[button].innerHTML;
        if (!buttonTxt || buttonTxt == '') {
          buttonTxt = buttons[button].value;
        }
        if (jsTxt) {
          var js;
          if (jsTxt.value) {
            js = jsTxt.value.split(':')[1];
          }
          else {
            js = jsTxt.toString().split('\n')[2];
          }
          buttonsObj[buttonTxt] = function() {
            eval(js);
            setTimeout(function() {
                $dialog.dialog('close');
            }, 50);            
          }
        }
        else if (href) {
          closeTxt = buttonTxt;
          buttonsObj[buttonTxt] = function() {
            window.location = href;
          }
        }
      });
      $dialog.dialog({
        title: el.title,
        width: (width)?width:520,
        height: height,
        maxHeight: height,
        modal: true,
        open: function(event, ui) {
          VB.modalPageInit(event, ui);
        },
        close: buttonsObj[closeTxt],
        buttons: buttonsObj
      });
    }
  }

  jQuery.ajax({
    url: url,
    type: "post",
    dataType: 'html',
    complete: responseHandler
  });
}

VB.submitModal = function(el, event, inFlow, height, loginCtx, width) {

  var loginFlag = '<!-- VERDE Console Login -->';
  var errorFlag = '<!-- VERDE Console Error -->';

  // If height specified, use it. Else use
  // 'auto'.
  height = height ? VB.trimQuotes(height) : 'auto';

  // Find the form element we need to submit
  var form = jQuery(el).closest("form");

  // Prevent page refresh
  if (event.preventDefault) {
    event.preventDefault();
  }
  else {
    // for IE
    event.returnValue = false;
  }

  // Form action URL
  var url = form.attr('action');

  // submitButtons need to send their value
  // for web flows to work
  if (inFlow && el.id && el.value) {
    url = url + "&"+el.id+"="+el.value;
  }

  // Prep to send the form
  var dataToSend = form.serialize();

  var responseHandler = function(xhr) {

    if (xhr.responseText.indexOf(loginFlag) >= 0) {
      window.location = loginCtx;
    }
    else if (xhr.responseText.indexOf(errorFlag) >= 0) {
      jQuery('html').html(xhr.responseText);
      jQuery("#droppyMenus").droppy();
    }
    else {
      jQuery('.ui-widget-overlay').remove();
      jQuery('.ui-dialog').remove();
      jQuery('#modalDiv').remove();
      var $dialog = jQuery('<div id="modalDiv"></div>').html(xhr.responseText);
      var buttons = jQuery('.botBtnDiv a, .botBtnDiv input:submit', $dialog);
      var closeTxt;
      var buttonsObj = new Object();
      buttons.each(function(button) {
        var jsTxt = buttons[button].attributes['onclick'];
        if (jsTxt && !jsTxt.constructor) {
          jsTxt = jQuery(this).attr("onclick");
        }
        var href = buttons[button].href;
        var buttonTxt = buttons[button].innerHTML;
        if (!buttonTxt || buttonTxt == '') {
          buttonTxt = buttons[button].value;
        }
        if (jsTxt) {
          var js;
          if (jsTxt.value) {
            js = jsTxt.value.split(':')[1];
          }
          else {
            js = jsTxt.toString().split('\n')[2];
          }
          var jsArgList = (js.substring(js.indexOf('(')+1, js.indexOf(')'))).split(",");
          var functionName = js.substring(0,js.indexOf('(')+1);
          buttonsObj[buttonTxt] = function() {
            if (functionName.indexOf('printPage') > 0) {
              VB.printPage();
            }
            else if (functionName.indexOf('loadModal') > 0) {
              VB.loadModal(buttons[button], 
                           event,
                           VB.stringToBoolean(jsArgList[2]),
                           VB.trimQuotes(jsArgList[3]),
                           VB.trimQuotes(jsArgList[4]),
                           (jsArgList[5])?VB.trimQuotes(jsArgList[5]):null);
            }
            else if (functionName.indexOf('submitModal') > 0) {
              VB.submitModal(buttons[button], 
                             event,
                             VB.stringToBoolean(jsArgList[2]),
                             VB.trimQuotes(jsArgList[3]),
                             VB.trimQuotes(jsArgList[4]),
                             (jsArgList[5])?VB.trimQuotes(jsArgList[5]):null);
            }
          }
        }
        else if (href) {
          closeTxt = buttonTxt;
          buttonsObj[buttonTxt] = function() {
            window.location = href;
          }
        }
        else {
          buttonsObj[buttonTxt] = function() {
            var form = jQuery("form", this);
            var cancelInp = document.createElement('input');
            cancelInp.type = 'hidden';
            cancelInp.id = buttons[button].id;
            cancelInp.name = buttons[button].name;
            cancelInp.value = buttons[button].value;
            form.append(cancelInp);
            form[0].submit();
          }
        }
      });
      $dialog.dialog({
        title: el.title,
        height: height,
        maxHeight: height,
        width: (width)?width:520,
        modal: true,
        open: function(event, ui) {
          VB.modalPageInit(event, ui);
        },
        close: buttonsObj[closeTxt],
        buttons: buttonsObj
      });
    }
  }

  jQuery('.ui-dialog-buttonset button').button({disabled: true});
  jQuery.ajax({
    url: url,
    type: "post",
    data: dataToSend,
    dataType: 'html',
    complete: responseHandler
  });
}

VB.stringToBoolean = function(string) {
  var str = jQuery.trim(string);
  switch(str.toLowerCase()){
    case "true": case "yes": case "1":return true;
    case "false": case "no": case "0": case null:return false;
    default:return Boolean(string);
  }
}

VB.trimQuotes = function(string) {
  var str = string.replace(/['"]/, "");
  return jQuery.trim(str);
}

VB.revealErrorDetails = function(event) {
  var errorDiv = jQuery('.errorDetailsHidden')[0];
  errorDiv.style.display='block';
}

VB.printPage = function() {
  if (window.print) {
    window.print();
  }
  else {
    var browserObj = '<OBJECT ID="WebBrowser1" WIDTH=0 HEIGHT=0 CLASSID="CLSID:8856F961-340A-11D0-A96B-00C04FD705A2"></OBJECT>';
    document.body.insertAdjacentHTML('beforeEnd', browserObj);
    browserObj.ExecWB(6, 1);//Use a 1 vs. a 2 for a prompting dialog box    
  }
}

VB.modalPageInit = function(event, ui) {
//  var formInputs = jQuery("#modalDiv input");
//  if (formInputs[0]) {
//      var parent = jQuery(formInputs[0]).parent();
//      if (parent[0].tagName != 'FIELDSET')
//        formInputs[0].focus();
//  }
  if (VB.policy) {
    VB.policy.initPolicyCheckToggles();
    VB.policy.initUSBDev();
    VB.policy.initTabs();
    VB.policy.initNetworkTab();
  }
  if (VB.charts) {
    VB.charts.initAccordion();
  }
  if (VB.userSelect) {
    VB.userSelect.initDeploymentModeHandlers();
    VB.userSelect.initAssignmentTypeHandlers();
    setTimeout(function() {
      jQuery('#tabs').tabs({fx: {opacity: 'toggle'}});
      if (jQuery('#searchResultsGrid')[0]) {
        VB.appLayers.initDeploymentGrids();
        jQuery('#tabs-1').show();
      }
      jQuery('input[name$="-lifetime"]').cluetip({
        closePosition: 'bottom',
        closeText: VB.i18n.close,
        cluezIndex: 5000,
        local: true,
        cluetipClass: 'rounded',
        dropShadow: false,
        arrows: true,
        showTitle: false,
        sticky: false,
        cursor: 'pointer',
        fx:     {open: 'fadeIn', openSpeed: '600'},
        hoverIntent: {
          sensitivity: 3,
          interval:    300,
          timeout:     0
        }        
      });

      var poolSelect = jQuery('#pool');
      var saveBtn   = jQuery('.ui-dialog-buttonset button:last');
      var type = jQuery('input[name="assignmentType"]');
 
      type.bind('change', function(el, evt) {
        if (this.value == 'pool') {
            if (poolSelect.val() == null) {
                saveBtn.button({disabled: true});
            }
            else {
                saveBtn.button({disabled: false});
            }
        }
        else {
            saveBtn.button({disabled: false});
        }
      });
  
    }, 250);
  }
  if (VB.user) {
    setTimeout(function() {
      if (jQuery('#searchResultsGrid')[0]) {
        VB.user.initUserTypeHandlers();
        VB.user.initGroupGrids();
      }
      else if (jQuery('#rolesList')[0]) {
        VB.user.initGroupTypeHandlers();
      }
    }, 250);
  }
  if (VB.appLayers && jQuery('#selectPackage')[0]) {
    VB.appLayers.initFileUploader();
  }
  if (!VB.userSelect && VB.appLayers) {
    setTimeout(function() {
      if (jQuery('#searchResultsGrid')[0]) {
        VB.appLayers.initDeploymentGrids();
      }
    }, 250);
  }
  if (VB.auth) {
    setTimeout(function() {
      jQuery('#tabs').tabs({fx: {opacity: 'toggle'}});
      VB.auth.initServerTypeHandlers();
    }, 250);    
  } 
  if (VB.organization) {
    VB.organization.init();
  }
  if (VB.resourceTag) {
    VB.resourceTag.resources_init();
  }  
  if (VB.roles) {
    setTimeout(function() {
      if (jQuery('#searchResultsGrid')[0]) {
        VB.roles.initPermissionGrid();
      }
    }, 250);
  }  
}

VB.confirm = function(el, event, isForm, confText) {

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

  var form = jQuery(el).closest('form');
  var del = VB.i18n.del;
  var cancel = VB.i18n.cancel;
  var buttonsObj = new Object();
  buttonsObj[cancel] = function() {
    jQuery(this).dialog('close');
  };
  if (isForm) {
    buttonsObj[del] = function() {
      var cancelInp = document.createElement('input');
      cancelInp.type = 'hidden';
      cancelInp.name = el.name;
      form.append(cancelInp);
      form[0].submit();
      jQuery(this).dialog('close');
    };
  }
  else {
    buttonsObj[del] = function() {
      var url = el.href;
      var params = el.search.substring(1).split('&');
      var offset, pageSize, row, sort, order;
      jQuery.each(params, function(idx) {
        if (params[idx].indexOf('offset') >= 0) {
          offset = params[idx].substring(7);
        }
        if (params[idx].indexOf('pageSize') >= 0) {
          pageSize = params[idx].substring(9);
        }
        if (params[idx].indexOf('row') >= 0) {
          row = params[idx].substring(4);
        }
        if (params[idx].indexOf('sort') >= 0) {
          sort = params[idx].substring(5);
        }
        if (params[idx].indexOf('order') >= 0) {
          order = params[idx].substring(6);
        }
      });
      if (parseInt(row) == 0) {
        var newOffset = parseInt(offset) - parseInt(pageSize);
        offset = (newOffset >= 0) ? newOffset : 0
      }
      jQuery.ajax({
        url: url,
        type: 'post',
        async: false
      });
      jQuery(this).dialog('close');
      setTimeout(function() {
        var params = "";
        if (offset != undefined) {
          params = '?offset='+offset+'&max='+pageSize+'&sort='+sort+'&order='+order;
        }
        var uriPos = window.location.href.indexOf('?');
        if (uriPos == -1) {
          window.location = window.location.href + params;
        }
        else {
          window.location = window.location.href.substring(0, uriPos) + params;
        }
      }, 500);
    }
  }
  if (confText) {
    jQuery("#dialog-confirm-text").html(confText);
  }
  jQuery("#dialog-confirm").dialog({
    resizable: false,
    modal: true,
    buttons: buttonsObj
  });

}

VB.initListButtons = function() {

  var btnContainer = jQuery('table.tblControls');
  var anchors = jQuery('a, input:submit, button', btnContainer);
  jQuery.each(anchors, function(anchor) {
    if (anchors[anchor].getAttribute('disabled')) {
      jQuery(anchors[anchor]).button({disabled: true});
    }
    else {
      var btn = jQuery(anchors[anchor]);
      btn.button();
    }
  });

  if (VB.userSelect) {
    jQuery('div[class="vdi-branch"]').each(function(idx) {
      var div = jQuery(this);
      jQuery('[name*="LEAF_"]', this).each(function(idx) {
        div.after(this);
        jQuery(this).button();
      });
      jQuery('[for*="LEAF_"]', this).each(function(idx) {
        div.after(this);
      });
    });
    jQuery('div.vdi-branch input.modeToggle').button().parent().buttonset();

    jQuery('div.vdi-branch input.modeToggle[id$="VDI"]').click(function(evt) {
      var branchBtn = jQuery('input.modeToggle[id$="BRANCH"]', this.parentNode);
      if (jQuery(this).attr("checked")) {
        branchBtn.button("option", "disabled", false);
      }
      else {
        branchBtn.button("option", "disabled", true);
      }
    });
  }

  if (VB.organization) {
    var switchBtns = jQuery('.orgSwitch a');
    jQuery.each(switchBtns, function() {
      jQuery(this).button();
    });
  }
}

VB.htmlEncode = function(value){ 
  return jQuery('<div/>').text(value).html(); 
} 

VB.htmlDecode = function(value){ 
  return jQuery('<div/>').html(value).text(); 
}

VB.continueFromError = function(ctx) {
  window.location = ctx;
}

VB.loadCustomFiles = function() {
  jQuery("<link>", {
    rel: 'stylesheet',
    type: 'text/css',
    href: VB.appCtx+'css/console_custom.css'
  }).appendTo('head');
}

VB.initSlider = function() {
  var sliderCloser = jQuery("#sliderClose");
  sliderCloser.button({ label: "&times;" });
  sliderCloser.click(function() {
    jQuery('#slider').hide('highlight');
  })
}

VB.removeCert = function() {
  window.location = VB.appCtx+"staticlogout.gsp?ctx="+VB.appCtx;
}

VB.initInitialSetup = function() {

  // For VDSB LAP instructions
  var continueBtn = jQuery('#continueBtn');
  if (continueBtn[0]) {
    continueBtn.button();
  }
  else {

    // MC initial setup form
    jQuery('#mcrootUsername')[0].focus();
    var saveBtn = jQuery('td.formSubmit input:submit');
    saveBtn.button({disabled: true});
    jQuery('#eulaAccept').bind('click', function() {
      if (this.checked) {
        saveBtn.button({disabled: false});
      }
      else {
        saveBtn.button({disabled: true});
      }
    });

  }
}

VB.loadEULAModal = function(el, event) {

  // Prevent page refresh
  if (event.preventDefault) {
    event.preventDefault();
  }
  else {
    // for IE
    event.returnValue = false;
  }

  var responseHandler = function(xhr) {

    var $dialog = jQuery('<div id="modalDiv"></div>').append(xhr.responseText);

    // Set the modal title from the TITLE tag in the response
    var title = jQuery("title", $dialog);
    if (title[0]) {
      title = title[0].innerHTML;
    }
    else {
      // safari may not find title
      title = undefined;
    }

    var buttonsObj = {
      "Accept": function() {
        jQuery(this).dialog("close");
        jQuery('#eulaAccept').attr('checked', true);
        jQuery('td.formSubmit input:submit').button({disabled: false});
      },
      "Cancel": function() {
        jQuery(this).dialog("close");
        jQuery('#eulaAccept').attr('checked', false);
        jQuery('td.formSubmit input:submit').button({disabled: true});
      }
    }

    $dialog.dialog({
      title: title,
      cache: false,
      width: 800,
      height: 400,
      maxHeight: 400,
      modal: true,
      open: function(event, ui) {
        //VB.modalPageInit(event, ui);
      },
      buttons: buttonsObj
    });
  }

  jQuery.ajax({
    url: VB.appCtx+'EULA.html',
    type: "get",
    dataType: 'html',
    complete: responseHandler
  });
}

VB.initMaintUtils = function() {

  var debugToggle = jQuery('#debugToggleBtn').button();
  debugToggle.bind('click', function() {
    jQuery.ajax({
      url: VB.appCtx+'app/toggleDebug',
      type: "get",
      dataType: 'html',
      complete: debugResponseHandler
    });
  });
  var debugResponseHandler = function(xhr) {
    window.location.reload();
  }

  jQuery( "#purgeLogDatepicker , #purgeEventDatepicker" ).datepicker({
    showOn: "both",
    buttonImage: "../images/vbridges/calendar.gif",
    buttonImageOnly: true
  });

  var purgeLogs    = jQuery('#logPurgeBtn').button();
  purgeLogs.bind('click', function() {
    var date = jQuery('#purgeLogDatepicker').val();
    var dateStr = '';
    if (date) {
      date = Math.round(new Date(date.toString()).getTime()/1000.0);
      dateStr = 'date='+date;
    }
    jQuery.ajax({
      url: VB.appCtx+'app/purgeLogs',
      data: dateStr,
      type: 'post',
      dataType: 'html',
      complete: purgeLogsResponseHandler
    });
  });
  var purgeLogsResponseHandler = function(xhr) {
    var status = jQuery('#logPurgeStatus');
    if (xhr.responseText == 'true') {
      status.text(VB.i18n.purge_logs_conf);
    }
    else if (xhr.responseText == 'false') {
      status.text(VB.i18n.purge_logs_default_conf);
    }
    else {
      status.text(VB.i18n.purge_error);
    }
  }

  var purgeEvents  = jQuery('#eventPurgeBtn').button();
  purgeEvents.bind('click', function() {
    var date = jQuery('#purgeEventDatepicker').val();
    var dayStr = '';
    if (date) {
      date = Math.round(new Date(date.toString()).getTime()/1000.0);
      var today = Math.round(new Date(Date.today().toString()).getTime()/1000.0);
      var days = (today - date)/86400;
      dayStr = 'days='+days;
    }
    jQuery.ajax({
      url: VB.appCtx+'app/purgeEvents',
      data: dayStr,
      type: 'post',
      dataType: 'html',
      complete: purgeEventsResponseHandler
    });
  });
  var purgeEventsResponseHandler = function(xhr) {
    var status = jQuery('#eventPurgeStatus');
    if (xhr.responseText == 'true') {
      status.text(VB.i18n.purge_events_conf);
    }
    else if (xhr.responseText == 'false') {
      status.text(VB.i18n.purge_events_default_conf);
    }
    else {
      status.text(VB.i18n.purge_error);
    }
  }
}

VB.initAdminClueTip = function() {
  jQuery('#loggedInUser').cluetip({
    width: 400,
    closePosition: 'bottom',
    closeText: VB.i18n.close,
    cluezIndex: 5000,
    local: true,
    cluetipClass: 'rounded',
    dropShadow: false,
    arrows: true,
    showTitle: false,
    sticky: false,
    cursor: 'pointer',
    fx: {open: 'fadeIn', openSpeed: '600'},
    hoverIntent: {
      sensitivity: 3,
      interval:    300,
      timeout:     0
    }    
  });  
}

VB.initBuildInfoClueTip = function() {
  jQuery('#helpLink').cluetip({
    width: 400,
    closePosition: 'bottom',
    closeText: VB.i18n.close,
    cluezIndex: 5000,
    local: true,
    cluetipClass: 'rounded',
    dropShadow: false,
    arrows: true,
    showTitle: false,
    sticky: false,
    cursor: 'pointer',
    fx:     {open: 'fadeIn', openSpeed: '600'},
    hoverIntent: {
      sensitivity:  3,
      interval:     300,
      timeout:      0
    }
  });  
}

VB.loadMastheadLogo = function(orgId) {
    
    if (orgId) {
        
        var url = "/verde-custom/" + orgId + "/images/masthead_logo.png";
        
        jQuery.ajax({
            url: url,
            type: 'get',
            cache: false,
            success: function(resp) {
                jQuery("#mastheadVBLogo img").attr("src", url);
            },
            error: function(resp) {
                if (orgId != 'org-0') {
                    VB.loadMastheadLogo("org-0");
                }
            }
        });        
        
    }
}

VB.loadLoginLogo = function() {    
        
    var url = "/verde-custom/org-0/images/masthead_logo.png";

    jQuery.ajax({
        url: url,
        type: 'get',
        cache: false,
        success: function(resp) {
            var img = jQuery('<img src="'+url+'"/>');
            jQuery("#loginImg").html(img);
        },
        error: function(resp) {
            url = VB.appCtx+"images/vbridges/VB_logo_greenblue_120.png";
            var img = jQuery('<img src="'+url+'"/>');
            jQuery("#loginImg").html(img)
        }
    });        
}
