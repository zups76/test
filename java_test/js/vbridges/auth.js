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
 * auth.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.auth == 'undefined') {
  VB.auth = {};
}

VB.auth.initServerTypeHandlers = function() {

  var serverType = jQuery('#serverType');
  
  var tabs = jQuery('#tabs');
  var noTabs = jQuery('#no-tabs');

  function enableTabs() {
    noTabs.hide();
    tabs.show();
  }

  function disableTabs() {
    noTabs.show();
    tabs.hide();
  } 
  
  if (serverType.val() != 'ACTIVE_DIRECTORY') {
    noTabs.hide();
    tabs.show();
  }
  
  serverType.bind('change', function(evt) {
    if (this.value != 'ACTIVE_DIRECTORY') {
      enableTabs();
    }
    else {
      disableTabs();
    }
  });
}
