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
 * policy.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.policy == 'undefined') {
  VB.policy = {};
}

VB.policy.initTabs = function() {

  var selectedTab = jQuery('#tab');
  var tabVal = Number(selectedTab.attr('value'));
  var tabs = jQuery('#tabs').tabs({
    selected: tabVal,
    select:   function(event, ui) {
      selectedTab.attr('value', ui.index);
    },
    fx: {opacity: 'toggle'}
  });

  // Disable and clear VLAN tag field if NAT networking type is selected
  var type    = jQuery('input[value="WIN4_NIC2_TYPE"]').next('select');
  var options = jQuery('option', type);
  var vlanTag = jQuery('input[value="WIN4_NIC2_VLAN"]').next('input:text');
  var interf  = jQuery('#prop-WIN4_NIC2_BRIDGE');
  VB.policy.networkTypeHandler(type, vlanTag, interf, options.size() > 1);
  
  // Handle virtual network and display protocol limits
  var virtualNetworkToggle = jQuery('#virtualNetworkLimit');
  var displayBandwidthToggle = jQuery('#displayProtocolLimit');
  var networkLimit = jQuery('input[value="VERDE_TAP_RATE_LIMIT"]').next('input:text');
  var burstLimit = jQuery('input[value="VERDE_TAP_BURST_RATE_LIMIT"]').next('input:text');
  var rdpNxLimit = jQuery('input[value="VERDE_RDPNX_RATE_LIMIT"]').next('input:text');
  var spiceLimit = jQuery('input[value="VERDE_SPICE_RATE_LIMIT"]').next('input:text');

  virtualNetworkToggle.bind('click', function(el, evt) {
    if (el.target.checked) {
      VB.policy.enableLimit(networkLimit);
      VB.policy.enableLimit(burstLimit);
    }
    else {
      VB.policy.disableLimit(networkLimit);
      VB.policy.disableLimit(burstLimit);
    }
  });
  
  displayBandwidthToggle.bind('click', function(el, evt) {
    if (el.target.checked) {
      VB.policy.enableLimit(rdpNxLimit);
      VB.policy.enableLimit(spiceLimit);
    }
    else {
      VB.policy.disableLimit(rdpNxLimit);
      VB.policy.disableLimit(spiceLimit);
    }
  });
  
  // Disable save button if burst value is not greater than 
  // network limit value - unless they are both 0.
//  var saveBtn   = jQuery('.ui-dialog-buttonset button:last');
//  
//  networkLimit.bind('blur', function(el, evt) {
//    var netVal = parseInt(networkLimit.val());
//    var burstVal = parseInt(burstLimit.val());
//    if (netVal > 0 && burstVal > 0 && burstVal > netVal) {
//      saveBtn.button({disabled: false});
//    }
//    else if (netVal == 0 && burstVal == 0) {
//      saveBtn.button({disabled: false});
//    }
//    else {
//      saveBtn.button({disabled: true});
//    }
//  });
//  
//  burstLimit.bind('blur', function(el,evt) {
//    var netVal = parseInt(networkLimit.val());
//    var burstVal = parseInt(burstLimit.val());
//    if (netVal > 0 && burstVal > 0 && burstVal > netVal) {
//      saveBtn.button({disabled: false});
//    }
//    else if (netVal == 0 && burstVal == 0) {
//      saveBtn.button({disabled: false});
//    }
//    else {
//      saveBtn.button({disabled: true});
//    } 
//  });
  
  // Handle leaf user image size
  var leafUserImageSizeToggle = jQuery('#leafImgSizeToggle');
  var leafUserImageSize = jQuery('input[value="VERDE_LEAF_USERIMG_SIZE"]').next('input:text');

  leafUserImageSizeToggle.bind('click', function(el, evt) {
    if (el.target.checked) {
      if (leafUserImageSize[0]) {

        // Enable the text field and remove the hidden field
        leafUserImageSize.attr('disabled', false);
        jQuery('input:hidden[id="'+leafUserImageSize[0].id+'"]').remove();

      }
    }
    else {
      if (leafUserImageSize[0]) {

        var propId = leafUserImageSize[0].name.split('.')[1];
        var defVal = jQuery("#propDefaultVal\\."+propId).val();

        // Create a hidden field with default value to clear
        // any override previously entered.
        var hiddenVal = jQuery('<input type="hidden">');
        hiddenVal.attr('id', leafUserImageSize[0].id);
        hiddenVal.attr('name', leafUserImageSize[0].name);
        hiddenVal.attr('value', defVal);

        var hiddenOverride = jQuery('#propOverrides\\.'+propId);
        hiddenOverride.attr('value', '');

        leafUserImageSize.val(defVal);
        leafUserImageSize.attr('disabled', true);
        leafUserImageSize.after(hiddenVal);

      }
    }
  }); 
  
  // init sliders on advanced tab
  var niceSliderLow = jQuery('<span style="margin-right:10px;">'+VB.i18n.low+'</span>');
  var niceSliderHigh = jQuery('<span style="margin-left:10px;">'+VB.i18n.high+'</span>');    
  var bootNice   = jQuery('input[value="WIN4_GUEST_BOOT_NICE"]').next('input:text');
  bootNice.css('width', '40px');
  bootNice.css('margin-right', '10px');
  bootNice.css('border', 'none');
  var bootSlider = jQuery('<div id="#bootNiceSlider" style="display:inline-block;width:175px;"></div>');
  bootNice.after(niceSliderLow);
  niceSliderLow.after(bootSlider);
  bootSlider.after(niceSliderHigh);
  bootSlider.slider({
    min: -19,
    max: 19,
    step: 1,
    slide: function( event, ui ) {
      bootNice.val(-ui.value);
      VB.policy.togglePolicyOverride(bootNice[0]);
    }
  });  
  bootSlider.slider("value", -bootNice.val());
  
  niceSliderLow = jQuery('<span style="margin-right:10px;">'+VB.i18n.low+'</span>');
  niceSliderHigh = jQuery('<span style="margin-left:10px;">'+VB.i18n.high+'</span>');
  var logonNice   = jQuery('input[value="WIN4_GUEST_LOGON_NICE"]').next('input:text');
  logonNice.css('width', '40px');
  logonNice.css('margin-right', '10px');
  logonNice.css('border', 'none');
  var logonSlider = jQuery('<div id="#logonNiceSlider" style="display:inline-block;width:175px;"></div>');
  logonNice.after(niceSliderLow);
  niceSliderLow.after(logonSlider);
  logonSlider.after(niceSliderHigh);
  logonSlider.slider({
    min: -19,
    max: 19,
    step: 1,
    slide: function( event, ui ) {
      logonNice.val(-ui.value);
      VB.policy.togglePolicyOverride(logonNice[0]);
    }
  });
  logonSlider.slider("value", -logonNice.val());

  niceSliderLow = jQuery('<span style="margin-right:10px;">'+VB.i18n.low+'</span>');
  niceSliderHigh = jQuery('<span style="margin-left:10px;">'+VB.i18n.high+'</span>');
  var runtimeNice   = jQuery('input[value="WIN4_GUEST_RUNTIME_NICE"]').next('input:text');
  runtimeNice.css('width', '40px');
  runtimeNice.css('margin-right', '10px');
  runtimeNice.css('border', 'none');
  var runtimeSlider = jQuery('<div id="#runtimeNiceSlider" style="display:inline-block;width:175px;"></div>');
  runtimeNice.after(niceSliderLow);
  niceSliderLow.after(runtimeSlider);
  runtimeSlider.after(niceSliderHigh);
  runtimeSlider.slider({
    min: -19,
    max: 19,
    step: 1,
    slide: function( event, ui ) {
      runtimeNice.val(-ui.value);
      VB.policy.togglePolicyOverride(runtimeNice[0]);
    }
  });
  runtimeSlider.slider("value", -runtimeNice.val());
  
  var clockIntHF = jQuery('<span style="margin-right:10px;">'+VB.i18n.high_fidelity+'</span>');
  var clockIntHD = jQuery('<span style="margin-left:10px;">'+VB.i18n.high_density+'</span>');  
  var clockInt   = jQuery('input[value="WIN4_KVM_UNIX_CLOCK_INT"]').next('input:text');
  clockInt.css('width', '40px');
  clockInt.css('margin-right', '10px');
  clockInt.css('border', 'none');
  var clockIntSlider = jQuery('<div id="#clockIntSlider" style="display:inline-block;width:125px;"></div>');
  clockInt.after(clockIntHF);
  clockIntHF.after(clockIntSlider);
  clockIntSlider.after(clockIntHD);
  clockIntSlider.slider({
    min: 999,
    max: 21999,
    step: 500,
    slide: function( event, ui ) {
      clockInt.val(ui.value);
      VB.policy.togglePolicyOverride(clockInt[0]);
    }
  });
  clockIntSlider.slider("value", clockInt.val());  
  
  // Linux SSO in advanced tab
  var linuxSSO       = jQuery('input[value="WIN4_LINUX_SSIGNON"]').next().next();
  var linuxSSOCreate = jQuery('input[value="WIN4_LINUX_SSIGNON_CREATE"]').next().next();
  linuxSSO.bind('click', function(el, evt) {
    if (el.target.checked) {
      linuxSSOCreate.attr('disabled', true);
    }
    else {
      linuxSSOCreate.attr('disabled', false);
    }
  });
  if (!jQuery('#defaultPolicy')[0]) {
    if (linuxSSOCreate.attr('checked')) {
      linuxSSOCreate.attr('disabled', true);
    }
    else {
      linuxSSOCreate.attr('disabled', false);
    }  
  }
  
  // Maximum user image size
  var maxImgSize = jQuery('input[value="WIN4_USERIMG_MAXSIZE"]').next('input:text');
  var maxImgSizeMaxObj = maxImgSize.next('input:hidden');
  var maxImgSizeMax = maxImgSizeMaxObj.val();
  var maxImgSizeMB = maxImgSizeMaxObj.next('input:hidden');
  maxImgSize.css('width', '40px');
  maxImgSize.css('margin-right', '10px');
  maxImgSize.css('border', 'none');
  var maxImgSizeSlider = jQuery('<div id="#maxImgSizeSlider" style="display:inline-block;width:250px;"></div>'); 
  maxImgSize.after(maxImgSizeSlider);
  maxImgSizeSlider.slider({
    min:  0,
    max:  maxImgSizeMax != '' ? parseInt(maxImgSizeMax) : 256,
    step: 1,
    slide: function( event, ui ) {
      maxImgSize.val(ui.value);
      maxImgSizeMB.val(parseInt(ui.value) * 1024);
      VB.policy.togglePolicyOverride(maxImgSizeMB[0]);
    }
  });
  maxImgSizeSlider.slider("value", maxImgSize.val()); 
  
  maxImgSize.bind('keyup', function(evt) {
    maxImgSizeSlider.slider("value", maxImgSize.val());
    var dispVal = jQuery(this).val();
    if (!isNaN(parseInt(dispVal))) {
      maxImgSizeMB.val(parseInt(dispVal) * 1024);  
    }
    else {
      maxImgSizeMB.val(0);  
    }
    maxImgSizeMB.trigger('change');
  });
  
}

VB.policy.initNetworkTab = function() {

  var type    = jQuery('input[value="WIN4_NIC2_TYPE"]').next('select');
  var options = jQuery('option', type);
  var vlanTag = jQuery('input[value="WIN4_NIC2_VLAN"]').next('input:text');
  var interf  = jQuery('#prop-WIN4_NIC2_BRIDGE');

  // Disable and clear VLAN tag field if NAT networking type is selected
  type.bind('change', function(el, evt){
    VB.policy.networkTypeHandler(type, vlanTag, interf, options.size() > 1);
  });
}
  
VB.policy.networkTypeHandler = function(type, vlanTag, interf, options) {

  var typeVal = type.val();
  
  if (vlanTag[0]) {

    if (typeVal == 'NAT') {

      // Create a hidden field with empty value to clear
      // any override previously entered.
      var hiddenVal = jQuery('<input type="hidden">');
      hiddenVal.attr('id', vlanTag[0].id);
      hiddenVal.attr('name', vlanTag[0].name);
      hiddenVal.attr('value', '');

      vlanTag.val('');
      vlanTag.attr('disabled', true);
      vlanTag.after(hiddenVal);
      
      interf.attr('disabled', true);

    }
    else {

      // Enable the VLAN tag field and remove the hidden field
      vlanTag.attr('disabled', false);
      interf.attr('disabled', false);
      if (options) {
        jQuery('input:hidden[id="'+vlanTag[0].id+'"]').remove();
      }
    }
    
  }
}

VB.policy.enableLimit = function(limitTag) {
  
  if (limitTag[0]) {

    // Enable the limit field and remove the hidden field
    limitTag.attr('disabled', false);
    jQuery('input:hidden[id="'+limitTag[0].id+'"]').remove();

  }
}

VB.policy.disableLimit = function(limitTag) {
  
  if (limitTag[0]) {
    
    var propId = limitTag[0].name.split('.')[1];
    var defVal = jQuery("#propDefaultVal\\."+propId).val();
  
    // Create a hidden field with default value to clear
    // any override previously entered.
    var hiddenVal = jQuery('<input type="hidden">');
    hiddenVal.attr('id', limitTag[0].id);
    hiddenVal.attr('name', limitTag[0].name);
    hiddenVal.attr('value', defVal);
    
    var hiddenOverride = jQuery('#propOverrides\\.'+propId);
    hiddenOverride.attr('value', '');

    limitTag.val(defVal);
    limitTag.attr('disabled', true);
    limitTag.after(hiddenVal);
    
  }
}

VB.policy.initPolicyCheckToggles = function() {

  // Set change handler to execute when the user
  // changes the form property value.
  var propVals = jQuery('[id^="prop\\."]');
  propVals.each(function(idx) {
    jQuery(this).bind('change', function(evt) {
      VB.policy.togglePolicyOverride(this);
    });
  });
}

VB.policy.togglePolicyOverride = function(el) {

  var policyId = el.id.substring(5);
  var over = jQuery('#propOverrides\\.'+policyId);
  var origValue = jQuery('#propDefaultVal\\.'+policyId).attr('value');
  var $el = jQuery(el);

  if (over[0]) {
    if (el.type == 'checkbox' && $el.attr('checked') != undefined) {
      if (origValue != $el.attr('checked').toString()) {
        over.attr('value', 'on');
      }
      else {
        over.attr('value', '');
      }
    }
    // special case to handle clearing of AD admin password field
    else if (el.type == 'password' && origValue != el.value && el.value == '') {
      over.attr('value', '');      
    }
    else {
      if (origValue != el.value) {
        over.attr('value', 'on');
      }
      else {
        over.attr('value', '');
      }
    }
  }

}

VB.policy.initUSBDev = function() {

  // init buttons
  jQuery('.policyUsbTbl button.addBtn').button();
  jQuery('.policyUsbTbl button.remBtn').button();

  // set up change handler for the usb enable/disable checkbox
  var usbAllow = jQuery('#usbAllow');
  usbAllow.click(function(evt) {
    if (usbAllow.attr('checked')) {
      jQuery('.usbDev').removeAttr('disabled');
      jQuery('#usbDev').attr('checked', 'true');
      jQuery('#usbDevGlobCnt').removeAttr('disabled');
      jQuery('#usbDevCnt').removeAttr('disabled');
    }
    else {
      jQuery('.usbDev').attr('disabled', 'true');
      jQuery('.policyUsbTbl input:text').attr('disabled', 'true');
      jQuery('.policyUsbTbl button').button("option", "disabled", true);
      jQuery('#usbDevGlobCnt').attr('disabled', 'true');
      jQuery('#usbDevCnt').attr('disabled', 'true');
    }
  });

  // set up the change handler for the all devs except HID radio button
  var usbDev = jQuery('#usbDev');
  usbDev.click(function(evt) {
    if (usbDev.attr('checked')) {
      jQuery('.policyUsbTbl input:text').attr('disabled', 'true');
      jQuery('.policyUsbTbl button').button("option", "disabled", true);
      jQuery('#usbDevGlobCnt').attr('disabled', 'true');
      jQuery('#usbDevCnt').attr('disabled', 'true');
    }
  });

  // set up the change handler for the usb device include list radio
  var usbList = jQuery('#usbList');
  usbList.click(function(evt) {
    if (usbList.attr('checked')) {
      jQuery('.policyUsbTbl input:text').removeAttr('disabled');
      jQuery('.policyUsbTbl button').button("option", "disabled", false);
      jQuery('#usbDevGlobCnt').removeAttr('disabled');
      jQuery('#usbDevCnt').removeAttr('disabled');
    }
  });

  // set up handlers for adding/removing devices
  jQuery('button.addBtn').click(function(evt) {
    VB.policy.addUSBDevice(evt);
  });
  jQuery('button.remBtn').click(function(evt) {
    VB.policy.remUSBDevice(evt);
  });

  // set some default state
  if (usbAllow.attr('checked')) {
    jQuery('.usbDev').removeAttr('disabled');
  }
  else {
    jQuery('.usbDev').attr('disabled', 'true');
    jQuery('.policyUsbTbl input:text').attr('disabled', 'true');
    jQuery('.policyUsbTbl button').button("option", "disabled", true);
    jQuery('#usbDevGlobCnt').attr('disabled', 'true');
    jQuery('#usbDevCnt').attr('disabled', 'true');
  }
}

VB.policy.addUSBDevice = function(event) {
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

  // add the hidden device node (li) to the list,
  // and modify the id and name attrs with the
  // device count
  var usbDevGlobCntNode = jQuery('#usbDevGlobCnt')[0];
  var usbDevGlobCnt = parseInt(usbDevGlobCntNode.value) + 1;
  usbDevGlobCntNode.value = usbDevGlobCnt;

  var usbDevCntNode = jQuery('#usbDevCnt')[0];
  var usbDevCnt = parseInt(usbDevCntNode.value) + 1;
  usbDevCntNode.value = usbDevCnt;
  var newDevNode = jQuery('#hiddenDevListItm li').clone()[0];
  newDevNode.id = newDevNode.id + usbDevGlobCnt;
  jQuery('input:text', newDevNode).each(function() {
    this.name = this.name + usbDevGlobCnt;
  });
  jQuery('label', newDevNode).each(function() {
    this.htmlFor = this.htmlFor + usbDevGlobCnt;
  });
  jQuery('button', newDevNode).each(function() {
    this.id = this.id + usbDevGlobCnt;
  });
  var curDevNode = jQuery(event.target.parentNode);
  curDevNode.after(newDevNode);

  // init the new buttons
  jQuery('button:first', newDevNode).button().next().button();

  // set up handlers for adding/removing devices
  jQuery('button.addBtn', newDevNode).click(function(evt) {
    VB.policy.addUSBDevice(evt);
  });
  jQuery('button.remBtn', newDevNode).click(function(evt) {
    VB.policy.remUSBDevice(evt);
  });
}

VB.policy.remUSBDevice = function(event) {
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

  // remove the current list node
  var usbDevCntNode = jQuery('#usbDevCnt')[0];
  var usbDevCnt = parseInt(usbDevCntNode.value) - 1;
  usbDevCntNode.value = usbDevCnt;
  jQuery(event.target.parentNode).remove();

}

VB.policy.initNetCfg = function(exists) {

  jQuery('#importNetCfg').button();
  jQuery('#exportNetCfg').button({disabled: !exists});
  jQuery('#deleteNetCfg').button({disabled: !exists});

  function handleImportResponse(data) {
    var txt = jQuery(data).text();
    try {
      var json = jQuery.parseJSON(txt);
      jQuery.jGrowl(json.message, {theme: 'info'});
      if (!json.error) {
        jQuery('#exportNetCfg').button({disabled: false});
        jQuery('#deleteNetCfg').button({disabled: false});
        jQuery('#fileUpload').attr('value', '');
      }
    }
    catch (e) {

      var loginFlag = '<!-- VERDE Console Login -->';
      var errorFlag = '<!-- VERDE Console Error -->';

      if (data.indexOf(loginFlag) >= 0) {
        window.location = VB.appCtx;
      }
      else if (data.indexOf(errorFlag) >= 0) {
        jQuery('html').html(txt);
        jQuery("#droppyMenus").droppy();
      }
      else {
        jQuery.jGrowl(data, {theme: 'error'});
      }

    }
  }

  jQuery('#uploadForm').submit(function() {
    jQuery(this).ajaxSubmit({
      success: handleImportResponse
    });
    return false; // <-- important!
  });

  jQuery('#fileUpload').bind('change', function() {
    jQuery('#importNetCfg').button({disabled: false});
  });

  jQuery('#exportNetCfg').click(function(event) {

    // create the form
    var form = document.createElement('form');
    jQuery.extend(form, {
      method: 'post',
      action: VB.appCtx+'policy/exportNetCfg'
    }, {
      display: 'NONE'
    });
    jQuery(form).appendTo(jQuery(document.body));

    // submit
    form.submit();

    // clean up
    jQuery(form).remove();

  });

  jQuery('#deleteNetCfg').click(function(event) {

    var ok = VB.i18n.OK;
    var cancel = VB.i18n.cancel;
    var buttonsObj = new Object();
    buttonsObj[ok] = function() {
      VB.policy.deleteNetCfg();
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

  });
}

VB.policy.deleteNetCfg = function() {
  jQuery.ajax({
    async: false,
    url: VB.appCtx+'policy/deleteNetCfg',
    cache: false,
    type: 'post',
    dataType: 'html',
    success: function(resp) {
      try {
        var json = jQuery.parseJSON(resp);
        jQuery.jGrowl(json.message, {theme: 'success'});
        if (!json.error) {
          jQuery('#exportNetCfg').button({disabled: false});
          jQuery('#deleteNetCfg').button({disabled: false});
          jQuery('#fileUpload').attr('value', '');
        }
      }
      catch (e) {

        var loginFlag = '<!-- VERDE Console Login -->';
        var errorFlag = '<!-- VERDE Console Error -->';

        if (resp.indexOf(loginFlag) >= 0) {
          window.location = VB.appCtx;
        }
        else if (resp.indexOf(errorFlag) >= 0) {
          var txt = jQuery(resp).text();
          jQuery('html').html(txt);
          jQuery("#droppyMenus").droppy();
        }
        else {
          jQuery.jGrowl(resp, {theme: 'error'});
        }

      }
    }
  });
  jQuery('#exportNetCfg').button({disabled: true});
  jQuery('#deleteNetCfg').button({disabled: true});
}

VB.policy.policyUDSFilterInit = function() {

  VB.policy.cancelBtn = jQuery('#cancelBtn').button();
  VB.policy.updateBtn = jQuery('#updateBtn').button({disabled: true});
  VB.policy.addTopBtn = jQuery('#addUDSFilter').button();

  VB.policy.addTopBtn.click(function(event) {
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
    var filterCount = parseInt(jQuery('#filterCount').val());
    jQuery.ajax({
      async: false,
      url: VB.appCtx+'policy/renderNewUDSFilter',
      data: {filterCount: filterCount},
      cache: false,
      type: 'post',
      dataType: 'html',
      success: function(resp) {
        var container = jQuery('#addUDSFilter').parent().parent();
        jQuery(resp).appendTo(container);
        var tbl = jQuery('table[id^="filterTable-"]:last');
        var pos = parseInt(tbl[0].id.split('-')[1]);
        jQuery('#filterCount').val(pos);
        jQuery('#filterPosition-'+pos).val(pos);
        VB.policy.updateBtn.button({disabled: false});
        jQuery('#advancedSettings input').bind('keyup', function(evt) {
          if (jQuery(this).val() != '') {
            VB.policy.updateBtn.button({disabled: false});
          }
          else {
            VB.policy.updateBtn.button({disabled: true});  
          }
        });
      }
    });
  });

  jQuery('#advancedSettings input').bind('keyup', function(evt) {
    if (jQuery(this).val() != '') {
    VB.policy.updateBtn.button({disabled: false});
    }
    else {
    VB.policy.updateBtn.button({disabled: true});  
    }
  });

}

VB.policy.removeUDSFilter = function(el, event) {

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

  var remLink = jQuery(el);
  var filterId = remLink[0].id.substring(7);
  jQuery('#filterTable-'+filterId).remove();
  jQuery('#uuid-'+filterId).remove();

  // Decrement count of filters
  var filterCount = jQuery('#filterCount');
  var count = parseInt(filterCount.val());
  filterCount.val(count-1);


}

VB.policy.validateUDSFilters = function(event) {

  var filterPos = jQuery('input[id^="filterPosition-"]');
  VB.policy.vals = [];
  VB.policy.badEntry = false;
  jQuery.each(filterPos, function(idx) {
    VB.policy.vals[idx] = this.value;
    if (this.value <= 0) {
      VB.policy.badEntry = true;
    }
  });
  if (hasDuplicate(VB.policy.vals)) {
      // Prevent href from firing
      if (event.preventDefault) {
        event.preventDefault();
      }
      else {
        // for IE
        event.returnValue = false;
      }
      jQuery.jGrowl(VB.i18n.duplicate_filter_pos, {theme: 'warn'});
  }
  if (VB.policy.badEntry) {
      // Prevent href from firing
      if (event.preventDefault) {
        event.preventDefault();
      }
      else {
        // for IE
        event.returnValue = false;
      }
      jQuery.jGrowl(VB.i18n.bad_entry, {theme: 'error'});
  }

  // fall out and let the form submit


  function hasDuplicate(arr) {
    var i = arr.length, j, val;

    while (i--) {
      val = arr[i];
      j = i;
      while (j--) {
        if (arr[j] === val) {
          return true;
        }
      }
    }
    return false;
  }

}

VB.policy.confirmCancel = function(el, event, confText) {

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

  var updateBtn = jQuery('#updateBtn').button();
  if (updateBtn.attr('disabled')) {
    window.location = el.href;
  }
  else {

    var ok = VB.i18n.ok;
    var cancel = VB.i18n.cancel;
    var buttonsObj = new Object();

    buttonsObj[ok] = function() {
      var url = el.href;
      jQuery.ajax({
        url: url,
        type: 'post',
        async: false
      });
      jQuery(this).dialog('close');
      setTimeout(function() {
        window.location = el.href;
      }, 500);
    }

    buttonsObj[cancel] = function() {
      jQuery(this).dialog('close');
    };
    if (confText) {
      jQuery("#dialog-confirm-text").html(confText);
    }
    jQuery("#dialog-confirm").dialog({
      resizable: false,
      modal: true,
      buttons: buttonsObj
    });

  }

}

VB.policy.initBranchClusterEditables = function() {

  var editLnk = jQuery('.editNameLink');
  editLnk.button();
  editLnk.bind('click', function(el) {
    var uuid = jQuery(el.currentTarget).attr('id').substring(9);
    jQuery('#editFields-'+uuid).css('display', 'inline-block');
    var displayName = jQuery('#branchName-'+uuid);
    var nameStr = displayName[0].innerHTML;
    displayName.css('display', 'none');
    jQuery('#name-'+uuid)[0].innerHTML = nameStr;
  });

  var saveBtns = jQuery('button[id^="save-"]');
  saveBtns.button();
  saveBtns.bind('click', function(el) {
    var uuid = jQuery(el.currentTarget).attr('id').substring(5);
    var name = jQuery('#name-'+uuid).val();
    jQuery.ajax({
      type: 'post',
      data: {uuid: uuid, name: name},
      url: VB.appCtx+'policy/setClusterName',
      complete: responseHandler
    });
    var displayName = jQuery('#branchName-'+uuid);
    displayName[0].innerHTML = name;
    displayName.css('display', 'inline-block');
    jQuery('#editFields-'+uuid).css('display', 'none');
  });

  var cancelBtns = jQuery('button[id^="cancel-"]');
  cancelBtns.button();
  cancelBtns.bind('click', function(el) {
    var uuid = jQuery(el.currentTarget).attr('id').substring(7);
    jQuery('#editFields-'+uuid).css('display', 'none');
    jQuery('#branchName-'+uuid).css('display', 'inline-block');
  });

  var responseHandler = function(response) {
    if (response.responseText == 'true') {
      jQuery.jGrowl(VB.i18n.update_ok, {theme: 'success'});
    }
    else if (response.responseText == 'false') {
      jQuery.jGrowl(VB.i18n.update_failed, {theme: 'error'});
    }
    else {
      jQuery.jGrowl(response.responseText, {theme: 'error'});
    }
  }
}

VB.policy.initCertControls = function() {
  
    var certDN         = jQuery('#certDN');
    var exportBtn      = jQuery('#csrExportBtn');
  
    exportBtn.bind('click', function(el) {
      
        var dn = certDN.val();
        var exportUrl = VB.appCtx + 'policy/getCSRText';

        // create the form
        var form = document.createElement('form');
        jQuery.extend(form, {
            method: 'post',
            action: exportUrl
        }, {
            display: 'NONE'
        });
        
        // Optional DN; add it to the form
        var dnInp = document.createElement('input');
        dnInp.type = 'hidden';
        dnInp.id = 'dn'
        dnInp.name = 'dn';
        dnInp.value = dn;
        jQuery(form).append(dnInp);        
        jQuery(form).appendTo(jQuery(document.body));

        // submit
        form.submit();

        // clean up
        jQuery(form).remove();    
        
        var $dialog = jQuery('<div style="display:none;text-align:left" id="dialog-confirm-export"></div>').append(VB.i18n.export_csr_body);
        $dialog.append('<br/><br/>'+VB.i18n.export_csr_instructions);
        jQuery("body").append($dialog); 
  
        var ok = VB.i18n.OK;
        var buttonsObj = new Object();
        buttonsObj[ok] = function() {
            jQuery(this).dialog('close');
            certDN.val('');
        };          

        jQuery("#dialog-confirm-export").dialog({
            title: VB.i18n.export_csr_title,
            resizable: false,
            modal: false,
            width: 400,
            buttons: buttonsObj
        });
  });  
}

VB.policy.initImportCertControls = function() {
    
    var applyCertsBtn = jQuery('#applyCertsBtn'); 
    var serverCertBtn = jQuery('#serverCertBtn');
    var rootCertBtn   = jQuery('#rootCertBtn');
    
    applyCertsBtn.button({disabled: true});
    
    serverCertBtn.bind('change', function() {
        if (rootCertBtn.val() != '' && serverCertBtn.val() != '') {
            applyCertsBtn.button({disabled: false});
        }
        else {
            applyCertsBtn.button({disabled: true});
        }
    });
    rootCertBtn.bind('change', function() {
        if (rootCertBtn.val() != '' && serverCertBtn.val() != '') {
            applyCertsBtn.button({disabled: false});
        }
        else {
            applyCertsBtn.button({disabled: true});
        }
    });

    applyCertsBtn.bind('click', function(el) {

        var form = jQuery('#uploadCertsForm');

        // Prevent page refresh
        if (el.preventDefault) {
            el.preventDefault();
        }
        else {
        // for IE
            el.event.returnValue = false;
        }
        
        jQuery('.ui-dialog-buttonset button').button({disabled: true}); 
        
        form.ajaxSubmit({
            success: importResponseHandler
        });                      
       
    });
    
    var importResponseHandler = function(resp) {
        
        var loginFlag = '<!-- VERDE Console Login -->';
        var errorFlag = '<!-- VERDE Console Error -->';        

        if (resp.indexOf(loginFlag) >= 0) {
            window.location = VB.appCtx;
        }
        else if (resp.indexOf(errorFlag) >= 0) {
            jQuery('html').html(resp);
            jQuery("#droppyMenus").droppy();
        }
        else {
            jQuery('.ui-widget-overlay').remove();
            jQuery('.ui-dialog').remove();
            jQuery('#modalDiv').remove();
            var $dialog = jQuery('<div id="modalDiv"></div>').html(resp);
            var buttons = jQuery('.botBtnDiv a, .botBtnDiv input:submit', $dialog);
            var closeTxt;
            var buttonsObj = new Object();
            buttons.each(function(button) {
                var href = buttons[button].href;
                var buttonTxt = buttons[button].innerHTML;
                if (!buttonTxt || buttonTxt == '') {
                buttonTxt = buttons[button].value;
                }                
                closeTxt = buttonTxt;
                buttonsObj[buttonTxt] = function() {
                    window.location = href;
                }
            });
            $dialog.dialog({
                title: applyCertsBtn.attr('title'),
                modal: true,
                open: function(event, ui) {
                    VB.modalPageInit(event, ui);
                },
                close: buttonsObj[closeTxt],
                buttons: buttonsObj
            });            
        }
    }    
}

VB.policy.initClusterRestart = function() {
    
    // TODO: IMPLEMENT ACTUAL RESTART FUNCTIONALITY
    var restartBtn = jQuery('#restartBtn').button();
    restartBtn.bind('click', function() {
        jQuery.jGrowl('This needs implementation!');
    });    
}
