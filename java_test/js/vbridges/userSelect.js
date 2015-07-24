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
 * userSelect.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.userSelect == 'undefined') {
  VB.userSelect = {};
}

VB.userSelect.initUserSelectToggles = function() {
  var checkToggles = jQuery('.checkToggle');
  checkToggles.each(function(idx, check){
    var cb = jQuery(check);
    cb.button();
    if (cb.click) {
      cb.unbind('click');
    }
    cb.click(function() {
      VB.userSelect.toggleUserSelectText(cb[0]);
    });
    jQuery(cb.siblings('label')).tooltip({

      // place tooltip on the right edge
      position: "top center",

      // a little tweaking of the position
      offset: [-15, 0],

      // use the built-in fadeIn/fadeOut effect
      effect: "fade",

      // custom opacity setting
      opacity: 0.7,

      // position relative
      relative: true

    });
    var label = cb.siblings('label');
    label.removeClass();
  });
  jQuery('.listTableInternal input.modeToggle').button();
}

VB.userSelect.toggleUserSelectText = function(el) {
  var cb = jQuery(el);
  var policyId = '#' + el.id.substr(0, el.id.lastIndexOf(".")) +'.policy.id';
  if (cb.attr('checked')) {
    var yesTxt = jQuery('#yesTxt')[0].value;
    if (!yesTxt) {
      yesTxt = 'Yes';
    }
    cb.button('option', 'label', yesTxt);
    // enable the value form element and remove
    // hidden element (if it exists)
    var elm = jQuery(policyId.replace(/\./g, '\\.'))[0];
    elm.disabled = false;
    jQuery('input:hidden', elm.parentNode).remove();
  }
  else {
    var noTxt = jQuery('#noTxt')[0].value;
    if (!noTxt) {
      noTxt = 'No';
    }
    cb.button('option', 'label', noTxt);
    // disable the value form element
    var policyValCtrl = jQuery(policyId.replace(/\./g, '\\.'));
    var option = jQuery(policyId.replace(/\./g, '\\.')+' option:selected');
    option[0].selected = false;
    policyValCtrl[0].disabled = true;
    // create a hidden element to submit the "empty" value
    var hiddenNode = document.createElement("input");
    hiddenNode.type = "hidden";
    hiddenNode.name = policyValCtrl[0].name;
    hiddenNode.value = 'null';
    policyValCtrl.after(hiddenNode);
  }
}

VB.userSelect.initEditables = function() {

  var editName = jQuery('.editName');
  editName.editable(VB.appCtx+'userSelect/updateName',{
    event : 'editNameClick',
    id    : 'elementid',
    name  : 'value',
    width : '70px',
    callback : function(resp) {
      var edit = jQuery(this);
      edit.css({'text-decoration': 'underline'});
      window.location.reload();
    },
    onblur: function() {
      var edit = jQuery(this);
      edit.prev().css({'display':'inline'});
      edit.css({'display':'none'});
    }
  });

  var editNameLink = jQuery('.editNameLink')
  editNameLink.bind('click', function(e) {
    e.stopImmediatePropagation();
    var link = jQuery(this);
    var trig = link.next();
    trig.trigger('editNameClick');
    trig.css({'display':'inline'});
    link.css({'display':'none'});
    jQuery(':input:visible:enabled:first', trig).focus();
    return false;
  });
  editName.bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ESCAPE) {
      var edit = jQuery(this);
      edit.prev().css({'display':'inline'});
      edit.css({'display':'none'});
    }
  });

  var editOrder = jQuery('.editOrder');
  editOrder.editable(VB.appCtx+'userSelect/updateOrder',{
    event: 'editOrderClick',
    id   : 'elementid',
    name : 'value',
    width: '20px',
    callback : function(resp) {
      var edit = jQuery(this);
      edit.css({'text-decoration': 'underline'});
      window.location.reload();
    },
    onblur: function() {
      var edit = jQuery(this);
      edit.prev().css({'display':'inline'});
      edit.css({'display':'none'});
    }
  });

  var editOrderLink = jQuery('.editOrderLink')
  editOrderLink.bind('click', function(e) {
    e.stopImmediatePropagation();
    var link = jQuery(this);
    var trig = link.next();
    trig.trigger('editOrderClick');
    trig.css({'display':'inline'});
    link.css({'display':'none'});
    jQuery(':input:visible:enabled:first', trig).focus();
    return false;
  });
  editOrder.bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ESCAPE) {
      var edit = jQuery(this);
      edit.prev().css({'display':'inline'});
      edit.css({'display':'none'});
    }
    else if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.userSelect.validatePolicyOrder(e);
    }
  });
}

VB.userSelect.validatePolicyOrder = function(event) {

  VB.userSelect.badEntry = false;
  var rulePos = jQuery('span[id^="order-"] input');
  if (rulePos.val() <= 0)
    VB.userSelect.badEntry = true;
  var id = rulePos[0].parentNode.parentNode.id.substring(6);
  var origValue = jQuery('a[id^="eol-'+id+'"]')[0].innerHTML;

  VB.userSelect.vals = [];
  jQuery.each(jQuery('a[id^="eol-"]'), function(idx) {
    if (this.id.substring(4) == id)
      VB.userSelect.vals[idx] = rulePos.val();
    else
      VB.userSelect.vals[idx] = this.innerHTML;
  });
  if (hasDuplicate(VB.userSelect.vals)) {
      // Prevent href from firing
      if (event.preventDefault) {
        event.preventDefault();
      }
      else {
        // for IE
        event.returnValue = false;
      }
      jQuery.jGrowl(VB.i18n.duplicate_rule_pos, {theme: 'warn'});
      rulePos.val(origValue);
  }
  if (VB.userSelect.badEntry) {
      // Prevent href from firing
      if (event.preventDefault) {
        event.preventDefault();
      }
      else {
        // for IE
        event.returnValue = false;
      }
      jQuery.jGrowl(VB.i18n.bad_entry, {theme: 'error'});
      rulePos.val(origValue);
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

VB.userSelect.initDeploymentModeHandlers = function() {

  // Set up global vars so they can be referenced
  // in the change handlers
  VB.userSelect.staticBtn    = jQuery('#STATIC').button();
  VB.userSelect.vdiBtn       = jQuery('#VDI').button();
  VB.userSelect.vdiDynBtn    = jQuery('#vdi-dynamic').button();
  VB.userSelect.leafWSBtn    = jQuery('#LEAF_WS').button();
  VB.userSelect.leafDRBtn    = jQuery('#LEAF_DRIVE').button();
  VB.userSelect.leafDynBtn   = jQuery('#leaf-dynamic').button();
  VB.userSelect.branchBtn    = jQuery('#BRANCH').button();
  VB.userSelect.branchList   = jQuery('#branchList input');
  VB.userSelect.vdiRadios    = jQuery('[id^="VDI-"],[id^="VDI_"]');
  VB.userSelect.leafRadios   = jQuery('[id^="LEAF-"]');
  VB.userSelect.imageSel     = jQuery('[name="image\\.id"]');
  VB.userSelect.isGlobal     = jQuery('input[name="global"]');
  VB.userSelect.enableLEAF   = jQuery('input[name="enableLEAF"]');
  VB.userSelect.enableBranch = jQuery('input[name="enableBranch"]');

  // Return if this init is called from the SHOW modal
  // (because these buttons don't exist)
  if (!VB.userSelect.vdiBtn[0]) {
    return;
  }
  
  // Initial conditions for VDI radios
  if (!VB.userSelect.vdiBtn[0].checked || VB.userSelect.staticBtn[0].checked) {
    VB.userSelect.vdiRadios.attr('disabled', 'true');
  }

  // Initial conditions for LEAF radios
  if (!VB.userSelect.leafWSBtn[0].checked && !VB.userSelect.leafDRBtn[0].checked) {
    VB.userSelect.leafRadios.attr('disabled', 'true');
  }

  // Initial conditions for BRANCH mode button
  if (!VB.userSelect.branchBtn[0].checked) {
    VB.userSelect.branchList.attr('disabled', 'true');
  }

  // Handler for the STATIC button
  VB.userSelect.staticBtn.bind('change', function(evt) {
    if (jQuery(this).attr('checked')) {
      // Turn off dynamic buttons
      VB.userSelect.vdiDynBtn[0].checked = false;
      VB.userSelect.vdiDynBtn.button('refresh');
      VB.userSelect.leafDynBtn[0].checked = false;
      VB.userSelect.leafDynBtn.button('refresh');
      // Disable radios
      VB.userSelect.vdiRadios.attr('disabled', 'true');
      VB.userSelect.leafRadios.attr('disabled', 'true');
    }
    else {
      // Turn on dynamic buttons
      VB.userSelect.vdiDynBtn[0].checked = true;
      VB.userSelect.vdiDynBtn.button('refresh');
      VB.userSelect.leafDynBtn[0].checked = true;
      VB.userSelect.leafDynBtn.button('refresh');
      if (VB.userSelect.vdiBtn[0].checked) {
        // Enable VDI radios and set long
        VB.userSelect.vdiRadios.removeAttr('disabled');
        jQuery('[id^="VDI_"]')[0].checked = true;
      }
      if (VB.userSelect.leafWSBtn[0].checked || VB.userSelect.leafDRBtn[0].checked) {
        // Enable LEAF radios and set long
        VB.userSelect.leafRadios.removeAttr('disabled');
        jQuery('[id^="LEAF-long"]')[0].checked = true;
      }
    }
  });

  // Handler for VDI Dynamic button
  VB.userSelect.vdiDynBtn.bind('change', function(evt) {
    if (jQuery(this).attr('checked')) {
      // Enable radios
      VB.userSelect.vdiRadios.removeAttr('disabled');
      jQuery('[id^="VDI_"]')[0].checked = true;
      VB.userSelect.leafRadios.removeAttr('disabled');
      jQuery('[id^="LEAF-long"]')[0].checked = true;
      // Turn off Static button
      VB.userSelect.staticBtn[0].checked = false;
      VB.userSelect.staticBtn.button('refresh');
      // Turn on LEAF Dynamic button
      VB.userSelect.leafDynBtn[0].checked = true;
      VB.userSelect.leafDynBtn.button('refresh');
    }
    else {
      // Disable radios
      VB.userSelect.vdiRadios.attr('disabled', 'true');
      VB.userSelect.leafRadios.attr('disabled', 'true');
      // Turn on Static button
      VB.userSelect.staticBtn[0].checked = true;
      VB.userSelect.staticBtn.button('refresh');
      // Turn off LEAF Dynamic button
      VB.userSelect.leafDynBtn[0].checked = false;
      VB.userSelect.leafDynBtn.button('refresh');
    }
  });

  // Handler for LEAF Dynamic button
  VB.userSelect.leafDynBtn.bind('change', function(evt) {
    if (jQuery(this).attr('checked')) {
      // Turn off Static button
      VB.userSelect.staticBtn[0].checked = false;
      VB.userSelect.staticBtn.button('refresh');
      // Turn on VDI Dynamic button
      VB.userSelect.vdiDynBtn[0].checked = true;
      VB.userSelect.vdiDynBtn.button('refresh');
      // Enable radios
      VB.userSelect.vdiRadios.removeAttr('disabled');
      jQuery('[id^="VDI_"]')[0].checked = true;
      VB.userSelect.leafRadios.removeAttr('disabled');
      jQuery('[id^="LEAF-long"]')[0].checked = true;
    }
    else {
      // Turn on static button
      VB.userSelect.staticBtn[0].checked = true;
      VB.userSelect.staticBtn.button('refresh');
      // Turn off VDI Dynamic button
      VB.userSelect.vdiDynBtn[0].checked = false;
      VB.userSelect.vdiDynBtn.button('refresh');
      // Disable radios
      VB.userSelect.vdiRadios.attr('disabled', 'true');
      VB.userSelect.leafRadios.attr('disabled', 'true');
    }
  });

  // Handler for VDI mode button
  VB.userSelect.vdiBtn.bind('change', function(evt) {
    if (jQuery(this).attr('checked')) {
      if (!VB.userSelect.staticBtn[0].checked) {
        // Enable VDI radios and set normal on
        VB.userSelect.vdiRadios.removeAttr('disabled');
        jQuery('[id^="VDI-"]')[0].checked = true;
      }
    }
    else {
      if (!VB.userSelect.staticBtn[0].checked) {
        // Disable VDI radios
        VB.userSelect.vdiRadios.attr('disabled', 'true');
      }
    }
  });

  // Handler for LEAF_WS mode button
  VB.userSelect.leafWSBtn.bind('change', function(evt) {
    if (jQuery(this).attr('checked')) {
      if (!VB.userSelect.staticBtn[0].checked) {
        // Enable LEAF radios
        VB.userSelect.leafRadios.removeAttr('disabled');
        if (!VB.userSelect.leafDRBtn[0].checked) {
          // Set normal on
          jQuery('[id^="LEAF-normal"]')[0].checked = true;
        }
      }
    }
    else {
      if (!VB.userSelect.staticBtn[0].checked && !VB.userSelect.leafDRBtn[0].checked) {
        // Disable LEAF radios
        VB.userSelect.leafRadios.attr('disabled', 'true');
      }
    }
  });

  // Handler for LEAF_DRIVE mode button
  VB.userSelect.leafDRBtn.bind('change', function(evt) {
    if (jQuery(this).attr('checked')) {
      if (!VB.userSelect.staticBtn[0].checked) {
        // Enable LEAF radios
        VB.userSelect.leafRadios.removeAttr('disabled');
        if (!VB.userSelect.leafWSBtn[0].checked) {
          // Set normal on
          jQuery('[id^="LEAF-normal"]')[0].checked = true;
        }
      }
    }
    else {
      if (!VB.userSelect.staticBtn[0].checked && !VB.userSelect.leafWSBtn[0].checked) {
        // Disable LEAF radios
        VB.userSelect.leafRadios.attr('disabled', 'true');
      }
    }
  });

  // Handler for BRANCH mode button
  VB.userSelect.branchBtn.bind('change', function(evt) {
    if (jQuery(this).attr('checked')) {
      VB.userSelect.branchList.removeAttr('disabled');
    }
    else {
      VB.userSelect.branchList.attr('disabled', 'true');
    }
  });
  
  // Initial conditions for STATIC button
  if (VB.userSelect.isGlobal.val() != 'true') {
    if (VB.userSelect.imageSel[0].type == 'hidden') {
        var lbl = VB.userSelect.imageSel.next('span');
        if (lbl[0].innerHTML.indexOf('(')) {
            // Turn off Static button
            VB.userSelect.staticBtn.attr('disabled', true);
            var lbl = VB.userSelect.staticBtn.next('label');
            lbl.hide();
            lbl.next('span').hide();        
        }
    }
    else {
        var imageName = VB.userSelect.imageSel[0][VB.userSelect.imageSel[0].selectedIndex].text;
        if (imageName.indexOf('(') > 0) {
            // Turn off Static button
            VB.userSelect.staticBtn.attr('disabled', true);
            var lbl = VB.userSelect.staticBtn.next('label');
            lbl.hide();
            lbl.next('span').hide();
        }      
    }
  }
  
  // Handler for gold image select menu
  if (VB.userSelect.isGlobal.val() != 'true') {
    VB.userSelect.imageSel.bind('change', function(evt) {
        var displayedImage = jQuery(this);
        if (displayedImage[0]) {
            var imageName = displayedImage[0][displayedImage[0].selectedIndex].text;
            if (imageName.indexOf('(') > 0) {
                // Turn off Static button
                VB.userSelect.staticBtn.attr('disabled', true);
                var lbl = VB.userSelect.staticBtn.next('label');
                lbl.hide();
                lbl.next('span').hide();
            }
            else {
                // Turn on static button
                VB.userSelect.staticBtn.attr('disabled', false);  
                var lbl = VB.userSelect.staticBtn.next('label');
                lbl.show();
                lbl.next('span').show();            
            }
        }

    }); 
  }
  
  // Tenant organizational constraints
  if (VB.userSelect.enableLEAF.val() != 'true') {
      // Turn off leaf controls
      VB.userSelect.leafRadios.attr('disabled', 'true');
      VB.userSelect.leafWSBtn.attr('disabled', true);
      VB.userSelect.leafDRBtn.attr('disabled', true);
      VB.userSelect.leafDynBtn.attr('disabled', true);
      jQuery('tr.leafControls').hide();
  }
  if (VB.userSelect.enableBranch.val() != 'true') {
      // Turn off branch controls
      VB.userSelect.branchBtn.attr('disabled', true);
      VB.userSelect.branchList.attr('disabled', true);
      jQuery('tr.branchControls').hide();
  }
}

VB.userSelect.initAssignmentTypeHandlers = function() {

  var assignmentRadio = jQuery('[id^="assignmentType-"]');
  assignmentRadio.bind('change', function(evt) {

    var tabs = jQuery('#tabs');
    var poolRow = jQuery('#poolRow');
    var imageRow = jQuery('#imageRow');
    var settingsRow = jQuery('#settingsRow');
    var poolBranch = jQuery('#poolBranchModeRow');
    var poolModeRow = jQuery('#poolModeRow');
    var poolMode = jQuery('#poolVDI');
    var depModesControls = jQuery('#tabs-1 input');

    function enablePool() {
      imageRow.hide();
      settingsRow.hide();
      tabs.hide();
      poolRow.show();
      poolModeRow.show();
      poolMode.attr({disabled: false});
      poolBranch.show();
      depModesControls.attr({disabled: true});
    }

    function disablePool() {
      poolRow.hide();
      poolModeRow.hide();
      poolMode.attr({disabled: true});
      poolBranch.hide();
      imageRow.show();
      settingsRow.show();
      tabs.show();
      depModesControls.attr({disabled: false});
    }

    if (this.value == 'pool') {
      enablePool();
    }
    else {
      disablePool();
    }
  });
}
