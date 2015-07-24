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
 * macAddressPools.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.macAddressPools == 'undefined') {
  VB.macAddressPools = {};
}

VB.macAddressPools.macAddrInit = function() {

  var macName   = jQuery('input[name="name"]');
  var macInputs = jQuery('input[name^="octet-"]');
  var macStart  = jQuery('input[name="rangeStart"]');
  var macEnd    = jQuery('input[name="rangeEnd"]');
  var saveBtn   = jQuery('.ui-dialog-buttonset button:last');

  // Only allow hex input in each octet
  macInputs.mask("hh");

  // Initialize
  var validOctets = (macInputs.val())?true:false;
  var validStart  = true;
  var validEnd    = true;
  var validName   = (macName.val())?true:false;
  var blankOctets;
  var gaps = false;
  var disableStartEnd = false;
  updateBlankOctets(macInputs[0]);
  updateHexMasks();
  updateStartEnd();
  validate();
  macInputs.css('background-color', 'white');

  // Handlers for name
  macName.bind('change blur keyup', function(el, evt){
    if (macName.val() != '')
      validName = true;
    else
      validName = false;
    validate();
  });

  // Handlers for octets
  macInputs.bind('change blur', function(el, evt) {
    octetHandler(el.currentTarget);
    validate();
  });
  macInputs.bind('click focus', function(el, evt) {
    jQuery(el.currentTarget).css('background-color', 'white');
    validate();
  });

  // Change handler for start pool value (uppercase)
  macStart.bind('change', function(evt) {
    var me = jQuery(this);
    var val = me.val().toUpperCase();
    me.val(val);
    if (val >= macEnd.val()) {
      validStart = false;
      jQuery('#invalidStartMsg').css('display', 'inline-block');
    }
    else {
      validStart = true;
      validEnd = true;
      jQuery('#invalidStartMsg').css('display', 'none');
      jQuery('#invalidEndMsg').css('display', 'none');
    }
    validate();
  });

  // Change handler for end pool value (uppercase)
  macEnd.bind('change', function(evt) {
    var me = jQuery(this);
    var val = me.val().toUpperCase();
    me.val(val);
    if (val <= macStart.val()) {
      validEnd = false;
      jQuery('#invalidEndMsg').css('display', 'inline-block');
    }
    else {
      validStart = true;
      validEnd = true;
      jQuery('#invalidStartMsg').css('display', 'none');
      jQuery('#invalidEndMsg').css('display', 'none');
    }
    validate();
  });

  // Handler for save button
  saveBtn.bind('submit', function(el, evt) {
    macStart.trigger('change');
    macEnd.trigger('change');
    if (!validate()) {
      return false;
    }
    else {
      saveBtn.trigger('submit');
      return true;
    }
  });

  function octetHandler(el) {
    var me = jQuery(el);
    var val = me.val().toUpperCase();
    me.val(val);
    updateBlankOctets(el);
    updateHexMasks();
    updateStartEnd();
    if (gaps) {
      validOctets = false;
      jQuery('#invalidOctetMsg').css('display', 'inline-block');
    }
    else {
      validOctets = true;
      jQuery('#invalidOctetMsg').css('display', 'none');
    }
  }

  // Convert decimal to hex with padding
  function dec2hexPad(i, pad) {
    var padStr = '0x1';
    for (var j = 0; j < pad; j++) {
      padStr = padStr + '00';
    }
    var padVal = (eval(padStr)+i).toString(16);
    return (padVal).slice(-(2*pad)).toUpperCase();
  }

  function d2h(d) {return d.toString(16);}
  function h2d(h) {return parseInt(h,16);}

  // Change the hex mask length for start and end
  function updateHexMasks() {
    var mask = '';
    for (var j = 0; j < blankOctets; j++) {
      mask = mask + 'hh';
    }
    macStart.mask(mask);
    macEnd.mask(mask);
  }

  // Update number of blank octet fields
  function updateBlankOctets(el) {
    blankOctets = 0;
    var resetGaps = true;
    var octets = [];
    jQuery.each(macInputs, function(idx) {
      octets.push(jQuery(this).val());
    });
    var lastOctet = undefined;

    // Look for the last octet filled, if more
    // empty octets are found they are gaps
    for (var i = octets.length-1; i >= 0; i--) {
      if (octets[i] == '' && lastOctet === undefined) {
        blankOctets += 1;
      }
      else if (octets[i] == '' && lastOctet) {
        gaps = true;
        resetGaps = false;
        jQuery('input[name="octet-'+i+'"]').css('background-color', 'red');
      }
      else if (octets[i] != '' && !lastOctet) {
        lastOctet = i;
      }
    }
    // If no gaps were found, reset the flag
    if (resetGaps) {
      gaps = false;
    }

    // Disable start/end if all octets are filled
    if (lastOctet == octets.length-1) {
      disableStartEnd = true;
    }
    else {
      disableStartEnd = false;
    }
  }

  // Update the Start and End pool values
  function updateStartEnd() {
    if (disableStartEnd) {
      macStart.val('');
      macStart.attr('disabled', true);
      macEnd.val('');
      macEnd.attr('disabled', true);
    }
    else {
      macStart.attr('disabled', false);
      macEnd.attr('disabled', false);

      var startVal = macStart.val();
      if (!startVal)
        startVal = 0;
      else
        startVal = h2d(startVal);
      macStart.val(dec2hexPad(startVal, blankOctets));

      var endVal = macEnd.val();
      if (!endVal)
        endVal = Math.pow(2, (blankOctets*8))-1
      else
        endVal = h2d(endVal);
      macEnd.val(dec2hexPad(endVal, blankOctets));
    }
  }

  function validate() {
    if (validName && validOctets && validStart && validEnd) {
      if (jQuery('html').attr('class').indexOf('chrome') <= 0) {
        saveBtn.button({disabled: false});
      }      
      return true;
    }
    else {
      if (jQuery('html').attr('class').indexOf('chrome') <= 0) {
        saveBtn.button({disabled: true});
      }
      return false;
    }
  }

}
