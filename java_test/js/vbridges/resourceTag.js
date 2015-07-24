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
 * resourceTag.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.resourceTag == 'undefined') {
  VB.resourceTag = {};
}

VB.resourceTag.resources_init = function() {
    
    var allOrgs = jQuery('#allOrgs');
    var orgList = jQuery('#orgsList input:checkbox');
    
    allOrgs.bind('click', function(el, evt){
        if (el.target.checked) {
           jQuery.each(orgList, function(idx) {
               jQuery(this).attr('disabled', true);
           }); 
           jQuery('#orgListRow').hide();
        }
        else {
           jQuery.each(orgList, function(idx) {
               jQuery(this).attr('disabled', false);
           }); 
           jQuery('#orgListRow').show();           
        }
    });

    if (allOrgs.attr('checked')) {
        jQuery.each(orgList, function(idx) {
            jQuery(this).attr('disabled', true);
        });
        jQuery('#orgListRow').hide();        
    }
}