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
 * leaf.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.leaf == 'undefined') {
  VB.leaf = {};
}

VB.leaf.initReleases = function(ctx) {

  var dlBtns = jQuery('button[id^=download]');
  jQuery.each(dlBtns, function(idx) {
    var btn = jQuery(this);
    var releaseId = this.id.substring(9);
    var selector = releaseId.replace(/\./g, '');
    var dlStatus = jQuery('input#'+selector).attr('value');
    if (dlStatus == 'IN_PROGRESS' || dlStatus == 'COMPLETE') {
      btn.button({disabled: true});
    }
    else {
      btn.button({disabled: false});
    }
    btn.click(function(event) {
      jQuery(this).button({disabled: true});
      var data = 'id='+releaseId;
      jQuery.ajax({
        async: false,
        data: data,
        url: ctx+'leaf/downloadRelease',
        success: function(response) {
          jQuery.jGrowl(response, {theme: 'info'});
        },
        cache: false
      });
      VB.leaf.initProgressBar(null, selector, releaseId, ctx, VB.i18n.downloading);
    });
  });

  var delBtns = jQuery('button[id^=delete]');
  jQuery.each(delBtns, function(idx) {
    jQuery(this).addClass('listTableButton');
    jQuery(this).click(function(event) {
      var ok = VB.i18n.OK;
      var cancel = VB.i18n.cancel;
      var releaseId = this.id.substring(7);
      var buttonsObj = new Object();
      buttonsObj[ok] = function() {
        jQuery(this).dialog('close');
        VB.leaf.deleteRelease(releaseId);
      };
      buttonsObj[cancel] = function() {
        jQuery(this).dialog('close');
      };
      jQuery("#dialog-confirm-delete").dialog({
        resizable: false,
        height:180,
        modal: true,
        buttons: buttonsObj
      });
    });
  });
}

VB.leaf.deleteRelease = function(releaseId) {
  var data = 'id='+releaseId;
  jQuery.ajax({
    async: false,
    data: data,
    url: VB.appCtx+'leaf/deleteRelease',
    success: function(response) {
      if (response.error) {
        jQuery.jGrowl(response.message, {theme: 'error'});
      }
      else {
        jQuery.jGrowl(response.message, {theme: 'success'});
        var statusSpan = jQuery('#leaf-status-text-'+releaseId.replace(/\./g, ''));
        statusSpan[0].innerHTML = response.message;
        setTimeout(function() {
          location.reload(true);
        }, 1000);

      }
    },
    cache: false
  });
}

VB.leaf.initDeployments = function() {

  var deps = parseInt(jQuery('input:hidden')[0].value);
  for (var i = 1; i <= deps; i++) {
    jQuery('input[name='+i+'-uuids]:radio').change(function(evt) {
      var id = this.id.substr(0, 1);
      var uuidListText = jQuery('input:text#'+id+'-uuidList'); 
      if (jQuery('input:radio#'+id+'-list').attr('checked')) {
        uuidListText.removeAttr('disabled');
      }
      else {
        uuidListText.attr('disabled', true);
      }
    });
    if (jQuery('#'+i+'-none').attr('checked') || jQuery('#'+i+'-all').attr('checked')) {
      jQuery('input:text#'+i+'-uuidList').attr('disabled', true);
    }
  }
}

VB.leaf.confirmDeleteDeployment = function(el, event, isForm, redirectAction) {

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
      var redirect = VB.appCtx+'leaf/'+redirectAction;
      jQuery.ajax({
        url: url,
        type: 'post'
      });
      jQuery(this).dialog('close');
      setTimeout(function() {
        if (redirectAction) {
          window.location = redirect;
        }
        else {
          window.location.reload(true);
        }
      }, 500);
    }
  }
  buttonsObj[cancel] = function() {
    jQuery(this).dialog('close');
  };
  jQuery("#dialog-confirm").dialog({
    resizable: false,
    height:140,
    modal: true,
    buttons: buttonsObj
  });

}

VB.leaf.initProgressBar = function(event, selector, id, ctx, msg) {

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

  var pbImgPath = ctx + "images/progressbar.gif";
  var pbBkgPath = ctx + "images/progressbg_green.gif";
  var cfgObj = {
    boxImage: pbImgPath,
    barImage: pbBkgPath,
    steps: 1,
    ctx: ctx,
    id: selector,
    relId: id
  }

  jQuery("#leaf-progress-container-"+selector).addClass("leafProgressCntActive");
  jQuery("#leaf-progress-msg-"+selector).html(msg);

  // Init the progress bar if it doesn't exist
  var pb = jQuery("#leaf-progress-"+selector);
  pb.progressBar({
    boxImage: cfgObj.boxImage,
    barImage: cfgObj.barImage,
    steps   : cfgObj.steps
  });

  VB.leaf.updateProgressBar(cfgObj);
}

VB.leaf.updateProgressBar = function(cfgObj) {
  var actionPath = 'releaseDownloadStatus';

  var url= cfgObj.ctx + 'leaf/'+actionPath+'/' + cfgObj.relId;

  jQuery.post(url,
              {
                ctx:      cfgObj.ctx,
                boxImage: cfgObj.boxImage,
                barImage: cfgObj.barImage,
                id:       cfgObj.id,
                steps:    cfgObj.steps,
                relId:    cfgObj.relId
              },
              function(response) {

    if (response.error == false) {

      var cfgData = this.data.split('&');
      var cfgObjR = {};
      jQuery.each(cfgData, function(idx) {
        var cfg = this.split('=');
        cfgObjR[cfg[0]] = decodeURIComponent(cfg[1]);
      });
      var statusSpan = jQuery('#leaf-status-text-'+cfgObjR.id);
      statusSpan[0].innerHTML = response.message;
      if (response.enumVal.name != 'COMPLETE' && response.enumVal.name != 'FAILED') {

        var respVal = response.pct;
        if (respVal <= 0) {

          // action task not yet scheduled,
          // schedule poll again
          setTimeout(function() {
            VB.leaf.updateProgressBar(cfgObjR);
          }, 5000);
        }
        else if (respVal > 0 && respVal < 100) {

          // update progress bar
          var pb = jQuery('#leaf-progress-'+cfgObjR.id);
          pb.progressBar(respVal,
                          {
                            boxImage: cfgObjR.boxImage,
                            barImage: cfgObjR.barImage,
                            steps   : cfgObjR.steps
                          }
                        );

          // schedule poll
          setTimeout(function() {
            VB.leaf.updateProgressBar(cfgObjR);
          }, 5000);
        }
      }
      else {

        // we're finished
        jQuery('button[id=download-'+cfgObjR.relId.replace(/\./g, '\\.')+']').button({disabled: true});
        jQuery('input#'+cfgObjR.id).attr('value', 'COMPLETE');

        // clean up, empty the divs and spans
        jQuery('#leaf-progress-container-'+cfgObjR.id).removeClass('leafProgressCntActive');
        jQuery('#leaf-progress-container-'+cfgObjR.id+' script').remove();
        jQuery('#leaf-progress-msg-'+cfgObjR.id).empty();
        jQuery('#leaf-progress-'+cfgObjR.id).empty();

      }
    }
  }, 'json');
}

