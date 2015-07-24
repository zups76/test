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
 * user.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.user == 'undefined') {
  VB.user = {};
}

VB.user.initGroupGrids = function() {

  var grid1,grid2,$selected,$available;
  var availData = [];
  var availJSON;
  var selectedJSON;
  var selectedData = [];
  var cancelBtn = jQuery('[class~="ui-dialog-buttonpane"] button:first');

  // Format select/remove links
  actionFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value == VB.i18n.select)
      return '<a href=\"#\" onclick=\"VB.user.select('+row+');\">'+value+'</a>';
    else
      return '<a href=\"#\" onclick=\"VB.user.deselect('+row+');\">'+value+'</a>';
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
      {id:"name",     name:VB.i18n.name,   field:"name",     width: 183},
      {id:"action",   name:VB.i18n.action, field:"action",   width: 50, formatter: actionFormatter, editor: actionHandler}
  ];

  // Columns for selected grid
  var columns2 = [
      {id:"name",       name:VB.i18n.name,       field:"name",       width: 110},
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

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {

      availJSON = json.groupList;

      jQuery.each(availJSON, function(idx) {

        availData[idx] = {
          name: this.name,
          action: VB.i18n.select
        }
      });
    }
  }

  // Callback to prepare grid data for list of selected groups
  selectedResponseHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {

      selectedJSON = json.groupList;

      jQuery.each(selectedJSON, function(idx) {

        selectedData[idx] = {
          name: this.name,
          action: VB.i18n.remove
        }
      });
    }
  }

  // Request available groups
  jQuery.ajax({
    url: VB.appCtx+'user/listGroupsJSON',
    type: 'post',
    async: false,
    dataType: 'json',
    complete: availResponseHandler
  });

  // Request selected groups for this user
  var username = jQuery('#username').val();
  if (username != "") {
    jQuery.ajax({
      url: VB.appCtx+'user/listGroupMembershipsJSON',
      data: {'username': username},
      type: 'post',
      async: false,
      dataType: 'json',
      complete: selectedResponseHandler
    });
  }

  // Render the available/search results grid
  $available = jQuery('#searchResultsGrid');
  grid1 = new Slick.Grid("#searchResultsGrid", availData, columns1, options);
  $available.height(101);
  grid1.autosizeColumns();
  grid1.resizeCanvas();
  VB.user.available = grid1;
  jQuery('#searchResultsRowCount')[0].innerHTML = grid1.getDataLength();

  // Render the selected app layers grid
  $selected = jQuery('#selectedGrid');
  grid2 = new Slick.Grid("#selectedGrid", selectedData, columns2, options);
  $selected.height(101);
  grid2.autosizeColumns();
  grid2.resizeCanvas();
  VB.user.selected = grid2;
  jQuery('#selectedRowCount')[0].innerHTML = grid2.getDataLength();

  jQuery("[id$='Grid']").show();

  // Hidden form elements with the list of selected groups
  jQuery.each(selectedData, function(idx) {
    jQuery('<input type="hidden" id="group-'+
           this.name+'" name="group-'+
           this.name+'" value="'+
           this.name+'"/>').appendTo('#selectedList');
  });

  // Select the cancel button on ENTER from selected grid
  VB.user.selected.onKeyDown.subscribe(function(e, args) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      cancelBtn.focus();
    }
  });

  // Keyboard access to search results grid
  jQuery('#searchResultsGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.user.available.gotoCell(0, 0, false);
      $available.effect('highlight', {}, 'slow');
    }
    if (e.keyCode === jQuery.ui.keyCode.TAB) {
      VB.user.selected.gotoCell(0, 0, false);
      $selected.effect('highlight', {}, 'slow');
    }
  });

  // Keyboard access to selected grid
  jQuery('#selectedGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.user.selected.gotoCell(0, 0, false);
      $selected.effect('highlight', 'slow');
    }
  });
}

VB.user.select = function(row) {

  var avail = VB.user.available;
  var availData = avail.getData();
  var newData = [];
  jQuery.each(availData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var selected = VB.user.selected;
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
    jQuery('#selectedRowCount')[0].innerHTML = selected.getDataLength();

    jQuery('<input type="hidden" id="group-'+
           rowData.name+'" name="group-'+
           rowData.name+'" value="'+
           rowData.name+'"/>').appendTo('#selectedList');

    avail.invalidateAllRows();
    avail.setData(newData, true);
    avail.resizeCanvas();
    jQuery('#searchResultsRowCount')[0].innerHTML = avail.getDataLength();
  }
  else {
    jQuery.jGrowl(VB.i18n.already_selected, {theme: 'info'})
  }

}

VB.user.deselect = function(row) {

  var selected = VB.user.selected;
  var allData = selected.getData();
  var rowData = selected.getDataItem(row);
  var newData = [];
  jQuery.each(allData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var avail = VB.user.available;
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
    jQuery('#searchResultsRowCount')[0].innerHTML = avail.getDataLength();
  }

  jQuery('#group-'+rowData.name, '#selectedList').remove();

  selected.invalidateAllRows();
  selected.setData(newData, true);
  selected.resizeCanvas();
  jQuery('#selectedRowCount')[0].innerHTML = selected.getDataLength();

}

VB.user.search = function(event, el) {

  var grid = VB.user.available;
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
          name: this.name,
          action: VB.i18n.select
        }
      });

      grid.invalidateAllRows();
      grid.setData(availData, true);
      grid.resizeCanvas();
      jQuery('#searchResultsRowCount')[0].innerHTML = grid.getDataLength();

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
  if (ctx.attr('id') == 'clear') {
    searchName = "";
    jQuery('#searchName', conditionsDiv).val("");
  }
  else {
    searchName = jQuery('#searchName', conditionsDiv).val();
  }

  var url = VB.appCtx+'user/listGroupsJSON';
  jQuery.ajax({
    url: url,
    data: {'searchName':searchName},
    type: 'post',
    dataType: 'json',
    complete: respHandler
  });
}

VB.user.initUserTypeHandlers = function() {

  var ldapNameRow     = jQuery('#ldapNameRow');
  var ldapName        = jQuery('#ldapName');
  var passwordRow     = jQuery('#passwordRow');
  var passwordCnfRow  = jQuery('#passwordCnfRow');
  var groupsDiv       = jQuery('#groupsDiv');
  var saveBtn         = jQuery('.ui-dialog-buttonset button:last');
    
  var assignmentRadio = jQuery('[id^="userType-"]');
  var ar              = assignmentRadio[0];
  
  if (!ar || 
      (jQuery(ar).attr('type') == 'hidden' && jQuery(ar).attr('value') == 'local') || 
      (jQuery(ar).attr('type') == 'radio'  && jQuery(ar).attr('checked'))) {
    enableLocal();    
  }
  else {
    disableLocal(); 
    if (ldapName.val() == null) {
      saveBtn.button({disabled: true});
    }
    else {
      saveBtn.button({disabled: false});
    }
  }
  
  assignmentRadio.bind('change', function(evt) {
    if (this.value == 'local') {
      enableLocal();
    }
    else {
      disableLocal();
    }
  });
  
  function enableLocal() {
    ldapNameRow.hide();
    ldapName.hide();
    ldapName.attr('disabled', true);
    passwordRow.show();
    passwordCnfRow.show();
    groupsDiv.show();
  }

  function disableLocal() {
    ldapNameRow.show();
    ldapName.show();
    ldapName.attr('disabled', false);
    passwordRow.hide();
    passwordCnfRow.hide();
    groupsDiv.hide();
  }  
}

VB.user.initGroupTypeHandlers = function() {

  var ldapNameRow    = jQuery('#ldapNameRow');
  var ldapName       = jQuery('#ldapName');
  var saveBtn        = jQuery('.ui-dialog-buttonset button:last');
    
  var assignmentRadio = jQuery('[id^="groupType-"]');
  var ar              = assignmentRadio[0];
  
  if (!ar || 
      (jQuery(ar).attr('type') == 'hidden' && jQuery(ar).attr('value') == 'local') || 
      (jQuery(ar).attr('type') == 'radio'  && jQuery(ar).attr('checked'))) {
    enableLocal();    
  }
  else {
    disableLocal();
    if (ldapName.val() == null) {
      saveBtn.button({disabled: true});
    }
    else {
      saveBtn.button({disabled: false});
    }    
  }
  
  assignmentRadio.bind('change', function(evt) {
    if (this.value == 'local') {
      enableLocal();
    }
    else {
      disableLocal();
    }
  });
  
  function enableLocal() {
    ldapNameRow.hide();
    ldapName.attr('disabled', true);
  }

  function disableLocal() {
    ldapNameRow.show();
    ldapName.attr('disabled', false);
  }  
}
