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
 * image.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.image == 'undefined') {
  VB.image = {};
}

VB.image.initProgressBar = function(event, action, selector, appCtx, msg, offset, max, row, sort, order) {

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

  var pbImgPath = appCtx + "images/progressbar.gif";
  var pbBkgPath = appCtx + "images/progressbg_green.gif";
  var pbIndPath = appCtx + "images/progressbg__indeterminate.gif";
  var cfgObj = {
    width: 121,
    action: action,
    ctx: appCtx,
    boxImage: pbImgPath,
    barImage: pbBkgPath,
    id: selector,
    steps: 1,
    offset: offset,
    max: max,
    row: row,
    sort: sort,
    order: order,
    init: 'true'
  }

  // Don't add progress bar if create
  if (action != 'create') {

    // Add the message markup here, rather than creating the
    // span in the GSP with 0 width. This fixes a rendering problem
    // in Chrome.
    var container = jQuery("#image-progress-container-"+selector);
    jQuery('#image-error-msg-'+selector).fadeOut('slow').remove();
    container.addClass("imageProgressCntActive");
    var msgCnt = jQuery('#image-progress-msg-'+selector);
    if (msgCnt[0]) {
      msgCnt.text(VB.image.i18nGetAction(action).toUpperCase());
    }
    else {
      var newMsgCnt = jQuery(document.createElement('span'));
      newMsgCnt.attr('id', 'image-progress-msg-'+selector);
      newMsgCnt.addClass('imageProgressMsg');
      newMsgCnt.text(VB.image.i18nGetAction(action).toUpperCase());
      container.prepend(newMsgCnt).fadeIn('slow');
    }

    // Init the progress bar
    var pb = jQuery("#image-progress-"+selector);
    pb.progressBarInd(0, {
      width: cfgObj.width,
      boxImage: cfgObj.boxImage,
      barImage: pbIndPath,
      steps   : cfgObj.steps,
      showText: false
    }).hide().fadeIn('slow');
  }
  
  if (action == 'create' || action == 'delete') {
    VB.image.pollPending(cfgObj.id, cfgObj);
  }
  else {
    setTimeout(function() {
      VB.image.updateProgressBar(cfgObj);
    }, 1000);
  }
}

VB.image.i18nGetAction = function(action) {
  var displayStr;
  switch(action) {
    case "create":
      displayStr = VB.i18n.create;
      break;
    case "checkout":
      displayStr = VB.i18n.checkout;
      break;
    case "clone":
      displayStr = VB.i18n.clone;
      break;
    case "checkin":
      displayStr = VB.i18n.checkin;
      break;
    case "delete":
      displayStr = VB.i18n.delAction;
      break;
    case "publish":
      displayStr = VB.i18n.publish;
      break;
    case "cancelCheckout":
      displayStr = VB.i18n.cancelCheckout;
      break;
    case "cancelClone":
      displayStr = VB.i18n.cancelClone;
      break;
    case "cancelCheckin":
      displayStr = VB.i18n.cancelCheckin;
      break;
    case "cancelPublish":
      displayStr = VB.i18n.cancelPublish;
      break;
    default:
      displayStr = action;
  };
  return displayStr;
}

VB.image.updateProgressBar = function(cfgObj) {
  var actionPath;
  if (cfgObj.action == 'checkout') {
    actionPath = 'getCheckoutProgress';
    if (jQuery('#image-progress-msg-'+cfgObj.id).text() == VB.i18n.aborting) {
      return;
    }
  }
  else if (cfgObj.action == 'clone') {
    actionPath = 'getCloneProgress';
  }
  else if (cfgObj.action == 'checkin') {
    actionPath = 'getCheckinProgress';
  }
  else if (cfgObj.action == 'publish') {
    actionPath = 'getPublishProgress';
  }

  var url= cfgObj.ctx + 'image/'+actionPath+'/' + cfgObj.id;
  jQuery.post(url,
              {
                action:   cfgObj.action,
                ctx:      cfgObj.ctx,
                boxImage: cfgObj.boxImage,
                barImage: cfgObj.barImage,
                id:       cfgObj.id,
                steps:    cfgObj.steps,
                init:     cfgObj.init,
                offset:   cfgObj.offset,
                max:      cfgObj.max,
                row:      cfgObj.row,
                sort:     cfgObj.sort,
                order:    cfgObj.order
              },
              function(response) {
    
    var respVal = parseInt(response);
    
    // Check to see if we received the login page as
    // a response - the response will be HTML and will
    // not parse to an integer. If so, forward the browser
    // to the login page.
    if (isNaN(respVal)) {
      window.location = cfgObj.ctx;
    }
    
    var cfgData = this.data.split('&');
    var cfgObjR = {};
    jQuery.each(cfgData, function(idx) {
      var cfg = this.split('=');
      cfgObjR[cfg[0]] = decodeURIComponent(cfg[1]);
    });
    if (respVal == -1) {

      cfgObjR.init = 'false';

      // action pending,
      // schedule poll again
      setTimeout(function() {
        cfgObjR.init = 'false';
        VB.image.pollPending(cfgObjR.id, cfgObjR, true);
      }, 5000);
      VB.image.updateAfterAction(cfgObjR.id, cfgObjR.ctx, cfgObjR.offset, cfgObjR.max, cfgObjR.row, cfgObjR.sort, cfgObjR.order, cfgObjR.action);
    }
    else if (respVal >= 0 && respVal < 100) {

      cfgObjR.init = 'false';

      // update progress bar
      jQuery('#image-progress-'+cfgObjR.id).progressBar(respVal, {
        width:     cfgObjR.width,
        boxImage: cfgObjR.boxImage,
        barImage: cfgObjR.barImage,
        steps:    cfgObjR.steps,
        showText: true
      });

      // schedule poll
      setTimeout(function() {
        cfgObjR.init = 'false';
        VB.image.updateProgressBar(cfgObjR);
      }, 5000);
      
      VB.image.updateAfterAction(cfgObjR.id, cfgObjR.ctx, cfgObjR.offset, cfgObjR.max, cfgObjR.row, cfgObjR.sort, cfgObjR.order, cfgObjR.action);

    }
    else if (respVal == 100 || respVal == -2) {

      var evtUrl = VB.appCtx + 'monitoring/listMCEvents';
      var evtList = [];

      // See if any system events occurred during the action
      // which need to be displayed.
      var respHandler = function(response) {
        evtList = response.events;
        jQuery.each(evtList, function() {
          jQuery.jGrowl(VB.errorStr + ": " + this,{theme: 'error'});
        });
      }

      jQuery.ajax({
        type: 'post',
        url: evtUrl,
        success: respHandler,
        dataType: 'json',
        async: false
      });

      // Update delete buttons after a clone
      if (cfgObjR.action == 'clone') {
        VB.image.updateAllDeletes(cfgObjR.offset, cfgObjR.max, cfgObjR.row, cfgObjR.sort, cfgObjR.order);
      }

      // clean up, empty the divs and spans
      jQuery('#image-progress-container-'+cfgObjR.id).removeClass('imageProgressCntActive');
      jQuery('#image-progress-container-'+cfgObjR.id+' script').fadeOut('slow').remove();
      jQuery('#image-progress-msg-'+cfgObjR.id).fadeOut('slow').remove();
      jQuery('#image-progress-'+cfgObjR.id).fadeOut('slow').empty();

      // update action buttons
      VB.image.updateAfterAction(cfgObjR.id, cfgObjR.ctx, cfgObjR.offset, cfgObjR.max, cfgObjR.row, cfgObjR.sort, cfgObjR.order, cfgObjR.action);

    }
  }, 'html');
  }

VB.image.startImageAction = function(event, ctx, action, selector, offset, max, row, sort, order) {

  if (event && action != 'clone') {
    // Prevent href from firing
    if (event.preventDefault) {
      event.preventDefault();
    }
    else {
      // for IE
      event.returnValue = false;
    }
  }

  // Disable clone button
  if (jQuery('#image-clone-'+selector+' img')) {
    jQuery('#image-clone-'+selector).empty();
    var imgEl = document.createElement("img");
    imgEl.setAttribute('border', '0');
    imgEl.setAttribute('src', ctx+'images/vbridges/cloneoff.png');
    jQuery('#image-clone-'+selector).html(imgEl);
  }

  // Disable action button
  var actionBtn = jQuery('#image-actions-'+selector+' a.ui-button');
  if (actionBtn[0]) {
    actionBtn.button({disabled: true});
    actionBtn[0].setAttribute('disabled', 'disabled');
  }

  var container = jQuery("#image-progress-container-"+selector);
  jQuery('#image-error-msg-'+selector).fadeOut('slow').remove();
  container.addClass("imageProgressCntActive");
  var msgCnt = jQuery('#image-progress-msg-'+selector);
  if (msgCnt[0]) {
    msgCnt.text(VB.image.i18nGetAction(action).toUpperCase());
  }
  else {
    var newMsgCnt = jQuery(document.createElement('span'));
    newMsgCnt.attr('id', 'image-progress-msg-'+selector);
    newMsgCnt.addClass('imageProgressMsg');
    newMsgCnt.text(VB.image.i18nGetAction(action).toUpperCase());
    container.prepend(newMsgCnt).fadeIn('slow');
  }

  var pbImgPath = ctx + "images/progressbar.gif";
  var pbBkgPath = ctx + "images/progressbg__indeterminate.gif";
  jQuery('#image-progress-'+selector).progressBarInd( {
    width:    121,
    boxImage: pbImgPath,
    barImage: pbBkgPath,
    steps:    1,
    showText: false
  }).hide().fadeIn('slow');

  // Currently these values come from form fields in a modal
  // dialog for checkout where the user selects either data
  // center or a specific branch cluster for deployment.
  var deployment = jQuery('[name="deployment"]:checked').val();
  var uuid = jQuery('[name="uuid"]').val();

  var actionUrl = ctx + 'image/' + action + '/' + selector;
  
  var respHandler = function(response) {

    try {
      var resp = jQuery.parseJSON(response.responseText);
    }
    catch (e) {
      window.location = ctx;
    }

    var cfgData = this.data.split('&');
    var cfgObjR = {};
    jQuery.each(cfgData, function(idx) {
      var cfg = this.split('=');
      cfgObjR[cfg[0]] = decodeURIComponent(cfg[1]);
    });
    
    if (resp != null && resp.error) {
      jQuery.jGrowl(VB.errorStr + ": " + resp.error, {theme: 'error'});
      cfgObjR.action = 'error';
    }

    if (cfgObjR.action.indexOf('cancel') >= 0 || cfgObjR.action == 'delete') {
      setTimeout(function() {
        VB.image.pollPending(selector, cfgObjR);
      }, 2500);
    }
    else if (cfgObjR.action != 'checkout' && cfgObjR.action != 'clone' && cfgObjR.action != 'checkin' && cfgObjR.action != 'publish') {

      setTimeout(function() {

        // clean up, empty the divs and spans
        jQuery('#image-progress-container-'+cfgObjR.selector).removeClass('imageProgressCntActive');
        jQuery('#image-progress-container-'+cfgObjR.selector+' script').fadeOut('slow').remove();
        jQuery('#image-progress-msg-'+cfgObjR.selector).fadeOut('slow').remove();
        jQuery('#image-progress-'+cfgObjR.selector).fadeOut('slow').empty();

        VB.image.updateAfterAction(cfgObjR.selector, cfgObjR.ctx, cfgObjR.offset, cfgObjR.max, cfgObjR.row, cfgObjR.sort, cfgObjR.order, cfgObjR.action);

        var evtUrl = VB.appCtx + 'monitoring/listMCEvents';
        var evtList = [];

        // See if any system events occurred during the action
        // which need to be displayed.
        var respHandler = function(response) {

          evtList = response.events;
          jQuery.each(evtList, function() {
            jQuery.jGrowl(VB.errorStr + ": " + this,{theme: 'error'});
          });
        }

        jQuery.ajax({
          type: 'post',
          data: {'cfgObjR': cfgObjR},
          url: evtUrl,
          success: respHandler,
          dataType: 'json',
          async: false
        });

      }, 2000);
    }
  }
  jQuery.ajax({
    type: 'post',
    data: {ctx: ctx,
           action: action,
           selector: selector,
           deployment: deployment,
           uuid: uuid,
           offset: offset,
           max: max,
           row: row,
           sort: sort,
           order: order},
     url: actionUrl,
     complete: respHandler,
     dataType: 'json'
  });

}

VB.image.pollPending = function(selector, cfgObjR, progress) {

      var url1= VB.appCtx + 'image/checkForActions/' + selector;
      jQuery.ajax({
        type: 'post',
        url: url1,
        data: {'cfgObjR': cfgObjR},
        async: false,
        success: function(resp) {

          var loginFlag = '<!-- VERDE Console Login -->';
          var errorFlag = '<!-- VERDE Console Error -->';

          if (resp.indexOf(loginFlag) >= 0 || resp.indexOf(errorFlag) >= 0) {
            // Session has timed out and
            // we got the login page, or an error
            // occurred during the service method
            // and we got the error page.
            return;
          }

          var cfgData = this.data.split('&');
          var cfgObjR = {};
            jQuery.each(cfgData, function(idx) {
              var cfg = this.split('=');
              var member = decodeURIComponent(cfg[0]);
              member = member.substring(member.indexOf('[')+1, member.indexOf(']'));
              cfgObjR[member] = decodeURIComponent(cfg[1]);
            });
          if (resp.indexOf('pending') >= 0) {
            setTimeout(function() {
              VB.image.pollPending(selector, cfgObjR, progress);
            }, 5000);
          }
          else {
            if (progress && resp != 'null') {
              VB.image.updateProgressBar(cfgObjR);
            }
            else {
                
              if (cfgObjR.action == 'checkin') {
                // poll again - there may be a publish operation
                // to follow
                cfgObjR.action = 'publish';
                setTimeout(function() {
                  VB.image.pollPending(selector, cfgObjR, progress);
                }, 7000);
              }
              else {
                setTimeout(function() {

                    var selector = (cfgObjR.id)?cfgObjR.id:cfgObjR.selector;

                    // clean up, empty the divs and spans
                    jQuery('#image-progress-container-'+selector).removeClass('imageProgressCntActive');
                    jQuery('#image-progress-container-'+selector+' script').fadeOut('slow').remove();
                    jQuery('#image-progress-msg-'+selector).fadeOut('slow').remove();
                    jQuery('#image-progress-'+selector).fadeOut('slow').empty();

                    VB.image.updateAfterAction(selector, cfgObjR.ctx, cfgObjR.offset, cfgObjR.max, cfgObjR.row, cfgObjR.sort, cfgObjR.order, cfgObjR.action);

                    var evtUrl = VB.appCtx + 'monitoring/listMCEvents';
                    var evtList = [];

                    // See if any system events occurred during the action
                    // which need to be displayed.
                    var respHandler = function(response) {

                    evtList = response.events;
                    jQuery.each(evtList, function() {
                        jQuery.jGrowl(VB.errorStr + ": " + this,{theme: 'error'});
                    });

                    }

                    jQuery.ajax({
                    type: 'post',
                    data: {'cfgObjR': cfgObjR},
                    url: evtUrl,
                    success: respHandler,
                    dataType: 'json',
                    async: false
                    });

                }, 2500);
              }
            }
          }
        }
      });

}

VB.image.confirmDeleteImageAction = function(el, event, confText, selector, offset, max, row, sort, order) {

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

  var del = VB.i18n.del;
  var cancel = VB.i18n.cancel;
  
  var buttonsObj = new Object();
  buttonsObj[cancel] = function() {
    jQuery(this).dialog('close');
  };

  buttonsObj[del] = function() {
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
    VB.image.startImageAction(event, VB.appCtx, 'delete', selector, offset, max, row, sort, order);
    jQuery(this).dialog('close');
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

VB.image.updateAllDeletes = function(offset, max, row, sort, order) {

  var deleteCells = jQuery('[id^="image-delete-"]');
  jQuery.each(deleteCells, function() {
    var id = jQuery(this).attr('id').substring(13);
    var deleteButtonUrl = VB.appCtx+'image/listDelete/'+id;
    jQuery.ajax({
      type: 'post',
      data: {
        selector: id,
        offset: offset,
        max: max, 
        row: row,
        sort: sort,
        order: order
      },
      url: deleteButtonUrl,
      dataType: 'html',
      success: function(response) {
        var params = this.data.split('&');
        var sel;
        jQuery.each(params, function(idx) {
          if (params[idx].indexOf('selector') >= 0) {
            sel = params[idx].substring(9);
          }
        });
        jQuery('#image-delete-'+sel).empty();
        jQuery('#image-delete-'+sel).html(response);
      }
      
    });
  });
 
}

VB.image.updateAfterAction = function(selector, appCtx, offset, max, row, sort, order, action) {

  // Renew list of action buttons
  var actionButtonUrl = appCtx+'image/listActions/'+selector;
  var renderHandler = function(response) {
    if (response == 'null') {
      VB.image.updateListTable(appCtx);
      return;
    }
    var params = this.data.split('&');
    var sel;
    jQuery.each(params, function(idx) {
      if (params[idx].indexOf('selector') >= 0) {
        sel = params[idx].substring(9);
      }
    });
    jQuery('#image-actions-'+sel).empty();
    jQuery('#image-actions-'+sel).html(response);
    VB.image.initImageListButtons();
  }
  jQuery.ajax({
    type: 'post',
    data: {selector: selector, offset: offset, max: max, row: row, sort: sort, order: order},
    async: false,
    url: actionButtonUrl,
    success: renderHandler,
    dataType: 'html'
  });

  // Rerender clone button
  var cloneButtonUrl = appCtx+'image/listClone/'+selector;
  var cloneHandler = function(response) {
    var params = this.data.split('&');
    var sel;
    jQuery.each(params, function(idx) {
      if (params[idx].indexOf('selector') >= 0) {
        sel = params[idx].substring(9);
      }
    });
    jQuery('#image-clone-'+sel).empty();
    jQuery('#image-clone-'+sel).html(response);
  }
  jQuery.ajax({
    type: 'post',
    data: {selector: selector, offset: offset, max: max, sort: sort, order: order},
    async: false,
    url: cloneButtonUrl,
    success: cloneHandler,
    dataType: 'html'
  });

  // Update status text
  var statusUrl = appCtx+"image/getImageStatusJSON/"+selector;
  var statusHandler = function(response) {
    var params = this.data.split('&');
    var cfgObj = {};
    jQuery.each(params, function(idx) {
      var pair = params[idx].split('=');
      cfgObj[pair[0]] = decodeURIComponent(pair[1]);
    });
    jQuery('#image-status-text-'+cfgObj.selector).empty();
    jQuery('#image-status-text-'+cfgObj.selector).html(response.imageStatus);
    jQuery('#image-ops-text-'+cfgObj.selector).empty();
    if (response.opStatus != 'null') {
        jQuery('#image-ops-text-'+cfgObj.selector).html(response.opStatus);
    }
    jQuery('#image-owner-'+cfgObj.selector).empty();
    jQuery('#image-owner-'+cfgObj.selector).html(response.checkoutUser);
    
    if (response.exception != 'null') {
      jQuery('.imageException').remove();
      var errMsgCnt = jQuery('#image-error-msg-'+cfgObj.selector);
      if (!errMsgCnt[0]) {
        errMsgCnt = jQuery(document.createElement('span'));
        errMsgCnt.attr('id', 'image-error-msg-'+cfgObj.selector);
        errMsgCnt.addClass('imageException');
      }
      errMsgCnt.text((response.exception).toUpperCase());
      var alrtIcon = jQuery(document.createElement('div'));
      alrtIcon.addClass('alert_icon');
      errMsgCnt.prepend(alrtIcon);
      jQuery('#image-progress-container-'+cfgObj.selector).before(errMsgCnt).hide();
      errMsgCnt.effect('highlight');

      // Update again, there may have been a rollback
      setTimeout(function() {
        var data = {selector: cfgObj.selector, offset: cfgObj.offset, max: cfgObj.max, row: cfgObj.row, sort: cfgObj.sort, order: cfgObj.order};
        jQuery.ajax({
          type: 'post',
          data: data,
          async: false,
          url: actionButtonUrl,
          success: renderHandler,
          dataType: 'html'
        });
        jQuery.ajax({
          type: 'post',
          data: data,
          async: false,
          url: cloneButtonUrl,
          success: cloneHandler,
          dataType: 'html'
        });
        jQuery.ajax({
          type: 'post',
          data: data,
          async: false,
          url: deleteButtonUrl,
          success: deleteHandler,
          dataType: 'html'
        });
      }, 1000);
    }
    else {
      if (action == 'delete' || action == 'cancelClone') {
        jQuery('td#image-delete-'+cfgObj.selector).parent().remove();
      }
    }
  }
  jQuery.ajax({
    type: 'post',
    data: {selector: selector, ctx: VB.appCtx, offset: offset, max: max, row: row, sort: sort, order: order},
    async: false,
    url: statusUrl,
    success: statusHandler,
    dataType: 'json'
  });

  // Rerender delete button
  var deleteButtonUrl = appCtx+'image/listDelete/'+selector;
  var deleteHandler = function(response) {
    var params = this.data.split('&');
    var sel;
    jQuery.each(params, function(idx) {
      if (params[idx].indexOf('selector') >= 0) {
        sel = params[idx].substring(9);
      }
    });
    jQuery('#image-delete-'+sel).empty();
    jQuery('#image-delete-'+sel).html(response);
  }
  jQuery.ajax({
    type: 'post',
    data: {selector: selector, offset: offset, max: max, row: row, sort: sort, order: order},
    async: false,
    url: deleteButtonUrl,
    success: deleteHandler,
    dataType: 'html'
  });
}

VB.image.updateListTable = function(appCtx) {
  var listTableUrl = appCtx+'image/listTable';
  var tableHandler = function(response) {
    jQuery('.listTableContainer').empty();
    jQuery('.listTableContainer').html(response);
    jQuery(".listTable table tfoot td:last-child").addClass("lastChild");
    jQuery(".listTable table tbody td:last-child").addClass("lastChild");
  }
  jQuery.post(listTableUrl, tableHandler, 'html');
}

VB.image.mediaLocationHandler = function() {
  var selected = false;
  var txtFld = jQuery(jQuery('[name="image\\.installMediaLocation"]'));
  txtFld.unbind('focus');
  txtFld.siblings('input:radio').each(function() {
    var radio = jQuery(this);
    if (radio.attr('checked')) {
      selected = true;
    }
    if (radio.val() == 'ISO') {
      txtFld.focus(function() {
        radio.attr('checked', true);
      });
      radio.change(function() {
        if (this.checked) {
          txtFld.focus();
        }
      });
    }
    else {
      radio.change(function() {
        if (this.checked) {
          txtFld.val('');
        }
      });
    }
  });
  // if no radios are checked, select the first
  if (!selected) {
    txtFld.siblings('input:first').attr('checked', true);
  }
}

VB.image.toggleMediaLocation = function() {
  var txtFld = jQuery('#MB_content input:text')[0];
  if (!txtFld.disabled) {
    txtFld.value = '';
  }
//  txtFld.disabled = txtFld.disabled ? false : true;
}

VB.image.deploymentHandler = function() {
  var selectFld = jQuery(jQuery('#deployment_branch_uuid'));
  selectFld.unbind('focus');
  selectFld.siblings('input:radio').each(function() {
    var radio = jQuery(this);
    if (radio.val() == 'branch') {
      selectFld.focus(function() {
        radio.attr('checked', true);
      });
      radio.change(function() {
        if (this.checked) {
          selectFld.focus();
        }
      });
    }
  });
}

VB.image.initImageListButtons = function() {
  var actionContainer = jQuery('[id|=image-actions]');
  var anchors = jQuery('a[class!=abortLink]', actionContainer);
  jQuery.each(anchors, function(anchor) {
    var btn = jQuery(this);
    if (btn.attr['disabled']) {
      btn.button({disabled: true});
    }
    else {
      btn.button();
    }
  });
}

VB.image.checkForMCErrors = function() {
  
  var evtUrl = VB.appCtx + 'monitoring/listMCEvents';
  var evtList = [];

  // See if any system events occurred during the action
  // which need to be displayed.
  var respHandler = function(response) {
    evtList = response.events;
    jQuery.each(evtList, function() {
      jQuery.jGrowl(VB.errorStr + ": " +this,{theme: 'error'});
    });
  }

  jQuery.ajax({
    type: 'post',
    url: evtUrl,
    success: respHandler,
    dataType: 'json',
    async: false
  });
}

VB.image.macAddressHandler = function() {

  var macInputs = jQuery('input[name^="octet-"]');

  // Only allow hex input
  macInputs.mask("hh");

  // Handlers for octets
  macInputs.bind('change blur', function(el, evt) {
    octetHandler(el.currentTarget);
  });

  function octetHandler(el) {
    var me = jQuery(el);
    var val = me.val().toUpperCase();
    me.val(val);
  }

}

VB.image.initGroupGrids = function() {

  var grid1,grid2,$selected,$available;
  var availData = [];
  var selectedData = [];
  var cancelBtn = jQuery('[class~="ui-dialog-buttonpane"] button:first');

  // Format select/remove links
  actionFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value == VB.i18n.select)
      return '<a href=\"#\" onclick=\"VB.image.selectGroup('+row+');\">'+value+'</a>';
    else
      return '<a href=\"#\" onclick=\"VB.image.deselectGroup('+row+');\">'+value+'</a>';
  }

  // Activate select/remove links via keyboard
  actionHandler = function(args) {

    var $input;

    this.init = function() {
      var cellContents = args.column.formatter(0, 0, args.item.action, args.column, args.item);
        $input = jQuery(cellContents)
          .appendTo(args.container)
          .bind("keydown.nav", function(e) {
            if (e.keyCode === jQuery.ui.keyCode.ENTER) {
              jQuery(e.target).click();             
              cancelBtn.focus();
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
        return true;
    };

    this.validate = function() {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
  }

  // Columns for available grid
  var columns1 = [
      {id:"name",     name:VB.i18n.name,   field:"name"},
      {id:"action",   name:VB.i18n.action, field:"action",   width: 50, formatter: actionFormatter, editor: actionHandler}
  ];

  // Columns for selected grid
  var columns2 = [
      {id:"name",       name:VB.i18n.name,       field:"name"},
      {id:"action",     name:VB.i18n.action,     field:"action",     width: 50, formatter: actionFormatter, editor: actionHandler}
  ];

  // Common grid options
  var options = {
      editable: true,
      autoEdit: false,
      enableCellNavigation: true,
      enableColumnReorder: false,
      forceFitColumns: true,
      syncColumnCellResize: true,
      rowHeight: 25
  };

  // Callback to prepare grid data for the list of available groups
  availResponseHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);
    var groupOwners = jQuery("#selectedGroupsList input");
    var groupOwnersList = [];
    jQuery.each(groupOwners, function() {
      groupOwnersList.push(this.value);
    });    

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {
      var availIdx = 0;
      var selectedIdx = 0;      
      jQuery.each(json.groupList, function(idx) {
        if (jQuery.inArray(this.toString(), groupOwnersList) == -1) {
          availData[availIdx] = {
            name: this,
            action: VB.i18n.select
          }
          availIdx++;
        }
        else {
          selectedData[selectedIdx] = {
            name: this,
            action: VB.i18n.remove
          }
          selectedIdx++;
        }
      });
    }
  }  

  // Request available groups
  jQuery.ajax({
    url: VB.appCtx+'user/listOrgGroupsJSON',
    type: 'post',
    async: false,
    dataType: 'json',
    complete: availResponseHandler
  });


  // Render the available/search results grid
  $available = jQuery('#searchGroupsResultsGrid');
  grid1 = new Slick.Grid("#searchGroupsResultsGrid", availData, columns1, options);
  $available.height(101);
  grid1.autosizeColumns();
  grid1.resizeCanvas();
  VB.image.availableGroups = grid1;
  jQuery('#searchGroupsResultsRowCount')[0].innerHTML = grid1.getDataLength();
  
  // Render the selected groups grid
  $selected = jQuery('#selectedGroupsGrid');
  grid2 = new Slick.Grid("#selectedGroupsGrid", selectedData, columns2, options);
  $selected.height(101);
  grid2.autosizeColumns();
  grid2.resizeCanvas();
  VB.image.selectedGroups = grid2;
  jQuery('#selectedGroupsRowCount')[0].innerHTML = grid2.getDataLength();

  jQuery("[id$='Grid']").show();

  // Select the cancel button on ENTER from selected grid
  VB.image.selectedGroups.onKeyDown.subscribe(function(e, args) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      cancelBtn.focus();
    }
  });

  // Keyboard access to search results grid
  jQuery('#searchGroupsResultsGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.image.availableGroups.gotoCell(0, 0, false);
      $available.effect('highlight', {}, 'slow');
    }
    if (e.keyCode === jQuery.ui.keyCode.TAB) {
      VB.image.selectedGroups.gotoCell(0, 0, false);
      $selected.effect('highlight', {}, 'slow');
    }
  });

  // Keyboard access to selected grid
  jQuery('#selectedGroupsGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.image.selected.gotoCell(0, 0, false);
      $selected.effect('highlight', 'slow');
    }
  });
}

VB.image.selectGroup = function(row) {

  var avail = VB.image.availableGroups;
  var availData = avail.getData();
  var newData = [];
  jQuery.each(availData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var selected = VB.image.selectedGroups;
  var allData = selected.getData();
  var rowData = avail.getDataItem(row);

  var chg = true;
  jQuery.each(allData, function(idx) {
    if (this.name == rowData.name) {
      chg = false;
    }
  });

  // Don't allow selection of a group
  // which is already in the selected list
  if (chg) {
    rowData.action = VB.i18n.remove;
    allData.unshift(rowData);
    selected.invalidateAllRows();
    selected.setData(allData, true);
    selected.resizeCanvas();
    jQuery('#selectedGroupsRowCount')[0].innerHTML = selected.getDataLength();

    jQuery('<input type="hidden" id="group-'+
           rowData.name.replace(/[\.\@]/g, '')+'" name="group-'+
           rowData.name.replace(/[\.\@]/g, '')+'" value="'+
           rowData.name+'"/>').appendTo('#selectedGroupsList');

    avail.invalidateAllRows();
    avail.setData(newData, true);
    avail.resizeCanvas();
    jQuery('#searchGroupsResultsRowCount')[0].innerHTML = avail.getDataLength();
  }
  else {
    jQuery.jGrowl(VB.i18n.group_already_selected, {theme: 'info'})
  }

}

VB.image.deselectGroup = function(row) {

  var selected = VB.image.selectedGroups;
  var allData = selected.getData();
  var rowData = selected.getDataItem(row);
  var newData = [];
  jQuery.each(allData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var avail = VB.image.availableGroups;
  var availData = avail.getData();

  var chg = true;
  jQuery.each(availData, function(idx) {
    if (rowData.name == this.name)
      chg = false;
  });

  // Don't add to the available list if
  // it's already there
  if (chg) {
    rowData.action = VB.i18n.select;
    availData.unshift(rowData);
    avail.invalidateAllRows();
    avail.setData(availData, true);
    avail.resizeCanvas();
    jQuery('#searchGroupsResultsRowCount')[0].innerHTML = avail.getDataLength();
  }

  jQuery('#group-'+rowData.name.replace(/[\.\@]/g, ''), '#selectedGroupsList').remove();

  selected.invalidateAllRows();
  selected.setData(newData, true);
  selected.resizeCanvas();
  jQuery('#selectedGroupsRowCount')[0].innerHTML = selected.getDataLength();

}

VB.image.searchGroups = function(event, el) {

  var grid = VB.image.availableGroups;
  var availData = [];
  var availJSON;

  respHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {

      availJSON = json.groupList;

      jQuery.each(availJSON, function(idx) {

        availData[idx] = {
          name: this,
          action: VB.i18n.select
        }
      });

      grid.invalidateAllRows();
      grid.setData(availData, true);
      grid.resizeCanvas();
      jQuery('#searchGroupsResultsRowCount')[0].innerHTML = grid.getDataLength();

    }
  }

  if (event.stopPropagation) {
    event.stopPropagation();
  }
  else {
    // for IE
    event.cancelBubble = true;
  }

  var searchName, searchTag, imageId;
  var ctx = jQuery(el);
  var conditionsDiv = jQuery(el).parent().prev();
  if (ctx.attr('id') == 'clearGroups') {
    searchName = "";
    jQuery('#searchGroupName', conditionsDiv).val("");
  }
  else {
    searchName = jQuery('#searchGroupName', conditionsDiv).val();
  }

  var url = VB.appCtx+'user/listOrgGroupsJSON';
  jQuery.ajax({
    url: url,
    data: {'searchName':searchName},
    type: 'post',
    dataType: 'json',
    complete: respHandler
  });
}

VB.image.initUserGrids = function() {

  var grid1,grid2,$selected,$available;
  var availData = [];
  var selectedData = [];
  var cancelBtn = jQuery('[class~="ui-dialog-buttonpane"] button:first');

  // Format select/remove links
  actionFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value == VB.i18n.select)
      return '<a href=\"#\" onclick=\"VB.image.selectUser('+row+');\">'+value+'</a>';
    else
      return '<a href=\"#\" onclick=\"VB.image.deselectUser('+row+');\">'+value+'</a>';
  }

  // Activate select/remove links via keyboard
  actionHandler = function(args) {

    var $input;

    this.init = function() {
      var cellContents = args.column.formatter(0, 0, args.item.action, args.column, args.item);
        $input = jQuery(cellContents)
          .appendTo(args.container)
          .bind("keydown.nav", function(e) {
            if (e.keyCode === jQuery.ui.keyCode.ENTER) {
              jQuery(e.target).click();             
              cancelBtn.focus();
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
        return true;
    };

    this.validate = function() {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
  }

  // Columns for available grid
  var columns1 = [
      {id:"username", name:VB.i18n.name,   field:"username"},
      {id:"action",   name:VB.i18n.action, field:"action",   width: 50, formatter: actionFormatter, editor: actionHandler}
  ];

  // Columns for selected grid
  var columns2 = [
      {id:"username",   name:VB.i18n.name,       field:"username"},
      {id:"action",     name:VB.i18n.action,     field:"action",     width: 50, formatter: actionFormatter, editor: actionHandler}
  ];

  // Common grid options
  var options = {
      editable: true,
      autoEdit: false,
      enableCellNavigation: true,
      enableColumnReorder: false,
      forceFitColumns: true,
      syncColumnCellResize: true,
      rowHeight: 25
  };

  // Callback to prepare grid data for the list of available users
  availResponseHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);
    var userOwners = jQuery("#selectedUsersList input");
    var userOwnersList = [];
    jQuery.each(userOwners, function() {
      userOwnersList.push(this.value);
    });

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {
      
      var availIdx = 0;
      var selectedIdx = 0;       
      
      jQuery.each(json.userList, function(idx) {       
        
        if (jQuery.inArray(this.toString(), userOwnersList) == -1) {
          availData[availIdx] = {
            username: this,
            action: VB.i18n.select
          }
          availIdx++;
        }
        else {
          selectedData[selectedIdx] = {
            username: this,
            action: VB.i18n.remove
          }
          selectedIdx++;
        }
      });
    }
  }

  // Request available users
  jQuery.ajax({
    url: VB.appCtx+'user/listOrgUsersJSON',
    type: 'post',
    async: false,
    data: {'permType': 'image'},
    dataType: 'json',
    complete: availResponseHandler
  });

  // Render the available/search results grid
  $available = jQuery('#searchUsersResultsGrid');
  grid1 = new Slick.Grid("#searchUsersResultsGrid", availData, columns1, options);
  $available.height(101);
  grid1.autosizeColumns();
  grid1.resizeCanvas();
  VB.image.availableUsers = grid1;
  jQuery('#searchUsersResultsRowCount')[0].innerHTML = grid1.getDataLength();
  
  // Render the selected app layers grid
  $selected = jQuery('#selectedUsersGrid');
  grid2 = new Slick.Grid("#selectedUsersGrid", selectedData, columns2, options);
  $selected.height(101);
  grid2.autosizeColumns();
  grid2.resizeCanvas();
  VB.image.selectedUsers = grid2;
  jQuery('#selectedUsersRowCount')[0].innerHTML = grid2.getDataLength();

  jQuery("[id$='Grid']").show();

  // Select the cancel button on ENTER from selected grid
  VB.image.selectedUsers.onKeyDown.subscribe(function(e, args) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      cancelBtn.focus();
    }
  });

  // Keyboard access to search results grid
  jQuery('#searchUsersResultsGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.image.availableUsers.gotoCell(0, 0, false);
      $available.effect('highlight', {}, 'slow');
    }
    if (e.keyCode === jQuery.ui.keyCode.TAB) {
      VB.image.selectedUsers.gotoCell(0, 0, false);
      $selected.effect('highlight', {}, 'slow');
    }
  });

  // Keyboard access to selected grid
  jQuery('#selectedUsersGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.image.selectedUsers.gotoCell(0, 0, false);
      $selected.effect('highlight', 'slow');
    }
  });
}

VB.image.selectUser = function(row) {

  var avail = VB.image.availableUsers;
  var availData = avail.getData();
  var newData = [];
  jQuery.each(availData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var selected = VB.image.selectedUsers;
  var allData = selected.getData();
  var rowData = avail.getDataItem(row);

  var chg = true;
  jQuery.each(allData, function(idx) {
    if (this.username == rowData.username) {
      chg = false;
    }
  });

  // Don't allow selection of a user
  // which is already in the selected list
  if (chg) {
    rowData.action = VB.i18n.remove;
    allData.unshift(rowData);
    selected.invalidateAllRows();
    selected.setData(allData, true);
    selected.resizeCanvas();
    jQuery('#selectedUsersRowCount')[0].innerHTML = selected.getDataLength();

    jQuery('<input type="hidden" id="user-'+
           rowData.username.replace(/[\.\@]/g, '')+'" name="user-'+
           rowData.username.replace(/[\.\@]/g, '')+'" value="'+
           rowData.username+'"/>').appendTo('#selectedUsersList');

    avail.invalidateAllRows();
    avail.setData(newData, true);
    avail.resizeCanvas();
    jQuery('#searchUsersResultsRowCount')[0].innerHTML = avail.getDataLength();
  }
  else {
    jQuery.jGrowl(VB.i18n.user_already_selected, {theme: 'info'})
  }

}

VB.image.deselectUser = function(row) {

  var selected = VB.image.selectedUsers;
  var allData = selected.getData();
  var rowData = selected.getDataItem(row);
  var newData = [];
  jQuery.each(allData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var avail = VB.image.availableUsers;
  var availData = avail.getData();

  var chg = true;
  jQuery.each(availData, function(idx) {
    if (rowData.username == this.username)
      chg = false;
  });

  // Don't add to the available list if
  // it's already there
  if (chg) {
    rowData.action = VB.i18n.select;
    availData.unshift(rowData);
    avail.invalidateAllRows();
    avail.setData(availData, true);
    avail.resizeCanvas();
    jQuery('#searchUsersResultsRowCount')[0].innerHTML = avail.getDataLength();
  }

  jQuery('#user-'+rowData.username.replace(/[\.\@]/g, ''), '#selectedUsersList').remove();

  selected.invalidateAllRows();
  selected.setData(newData, true);
  selected.resizeCanvas();
  jQuery('#selectedUsersRowCount')[0].innerHTML = selected.getDataLength();

}

VB.image.searchUsers = function(event, el) {

  var grid = VB.image.availableUsers;
  var availData = [];
  var availJSON;

  respHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {

      availJSON = json.userList;

      jQuery.each(availJSON, function(idx) {

        availData[idx] = {
          username: this,
          action: VB.i18n.select
        }
      });

      grid.invalidateAllRows();
      grid.setData(availData, true);
      grid.resizeCanvas();
      jQuery('#searchUsersResultsRowCount')[0].innerHTML = grid.getDataLength();

    }
  }

  if (event.stopPropagation) {
    event.stopPropagation();
  }
  else {
    // for IE
    event.cancelBubble = true;
  }

  var searchName, searchTag, imageId;
  var ctx = jQuery(el);
  var conditionsDiv = jQuery(el).parent().prev();
  if (ctx.attr('id') == 'clearUsername') {
    searchName = "";
    jQuery('#searchUsername', conditionsDiv).val("");
  }
  else {
    searchName = jQuery('#searchUsername', conditionsDiv).val();
  }

  var url = VB.appCtx+'user/listOrgUsersJSON';
  jQuery.ajax({
    url: url,
    data: {'searchUsername':searchName, 'permType': 'image'},
    type: 'post',
    dataType: 'json',
    complete: respHandler
  });
}

VB.image.initSysImgSizeSlider = function() {

  var saveBtn    = jQuery('.ui-dialog-buttonset button:last');
  var imgSize    = jQuery('#maxSysImgSize');
  var imgSizeMax = jQuery('#maxSysImgSizeMax');
  imgSize.css('width', '30px');
  imgSize.css('margin-right', '10px');
  imgSize.css('border', 'none');
  var imgSizeSlider = jQuery('<div id="#imgSizeSlider" style="display:inline-block;width:175px;"></div>');
  imgSize.after(imgSizeSlider);
  imgSizeSlider.slider({
    min: parseInt(imgSize.val()),
    max: parseInt(imgSizeMax.val()),
    step: 1,
    slide: function( event, ui ) {
      imgSize.val(ui.value);
    }
  });  
  imgSizeSlider.slider("value", imgSize.val());
  
  imgSize.bind('keyup', function(evt) {
    var dispVal = jQuery(this).val();
    if (isNaN(parseInt(dispVal))) {
      saveBtn.button({disabled: true});  
    }
    else {
      saveBtn.button({disabled: false}); 
      var val;
      if (parseInt(dispVal) > imgSizeMax.val()) {
        val = imgSizeMax.val();  
      }
      else {
        val = parseInt(dispVal);
      }
      imgSizeSlider.slider("value", val);
      imgSize.val(val);
    }
  });

}
