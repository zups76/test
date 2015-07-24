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
if (typeof VB.roles == 'undefined') {
  VB.roles = {};
}

VB.roles.initPermissionGrid = function() {

  var grid1,grid2,$selected,$available;
  var availData = [];
  var availJSON;
  var selectedJSON;
  var selectedData = [];
  var cancelBtn = jQuery('[class~="ui-dialog-buttonpane"] button:first');

  // Format select/remove links
  actionFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value == VB.i18n.select)
      return '<a href=\"#\" id=\"'+dataContext.name+'\" onclick=\"VB.roles.select('+row+');\">'+value+'</a>';
    else
      return '<a href=\"#\" id=\"'+dataContext.name+'\" onclick=\"VB.roles.deselect('+row+');\">'+value+'</a>';
  }

  modesFormatter = function(row, cell, value, columnDef, dataContext) {
    var modesVal = '';
    var readVal  = '';
    var anySelected = false;
    jQuery.each(value, function() {
      var val = this.toString();
      var type = (val.indexOf("_READ")<0)?"checkbox":"hidden";
      if (type == "checkbox") {
        var selected = false;
        if (dataContext.selectedModes) {
            selected = (jQuery.inArray(val, dataContext.selectedModes) > -1)?true:false;
        }      
        modesVal = modesVal + 
                  '<input type=\"checkbox\" name=\"mode-'+
                  val+'\" '+ (selected?'checked=\"checked\"':'') +' value=\"'+val+
                  '\"/><label for=\"mode-'+val+'\">'+
                  VB.i18n[val.toLowerCase()]+'</label>';
      }
      else {
        readVal = '<input type=\"hidden\" name=\"mode-'+
                   val+'\"  value=\"'+val+'\"/>';        
      }
      if (selected) {
          anySelected = true;
      }
    });
    if (!anySelected) {
        modesVal = readVal + modesVal;
    } 
    return modesVal;
  }

  nameFormatter = function(row, cell, value, columnDef, dataContext) {
    var nameVal = VB.i18n[value.toLowerCase()]; 
    return nameVal;
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
      {id:"name",     name:VB.i18n.name,   field:"name",     width: 183, formatter: nameFormatter},
      {id:"action",   name:VB.i18n.action, field:"action",   width: 50,  formatter: actionFormatter, editor: actionHandler}
  ];

  // Columns for selected grid
  var columns2 = [
      {id:"name",     name:VB.i18n.name,    field:"name",    width: 110, formatter: nameFormatter},
      {id:"modes",    name:VB.i18n.modes,   field:"modes",   width: 200, formatter: modesFormatter},
      {id:"action",   name:VB.i18n.action,  field:"action",  width: 50,  formatter: actionFormatter, editor: actionHandler}
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

  // Callback to prepare grid data for the list of available permissions
  availResponseHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {
      
      VB.roles.availJSON = [];
      jQuery.each(json.permList, function(idx) {
        var obj = {};
        obj.name = idx;
        var modes = [];
        jQuery.each(this, function(idx) {
          modes.push(this.name);
        });
        obj.modes = modes;
        VB.roles.availJSON.push(obj);
      });
      availJSON = VB.roles.availJSON;

      jQuery.each(availJSON, function(idx) {

        availData[idx] = {
          name: this.name,
          modes: this.modes,
          action: VB.i18n.select
        }
      });
    }
  }

  // Callback to prepare grid data for list of selected permissions
  selectedResponseHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {
      
      VB.roles.selectedJSON = [];
      jQuery.each(json.permList, function(idx) {
        var obj = {};
        obj.name = idx;
        var modes = [];
        var selectedModes = [];
        jQuery.each(this, function(idx) {
          selectedModes.push(this.name);
        });
        jQuery.each(VB.roles.availJSON, function(idx) {
          if (this.name == obj.name) {
            modes = this.modes;
          }
        });     
        obj.modes = modes;
        obj.selectedModes = selectedModes;
        VB.roles.selectedJSON.push(obj);
      });
      selectedJSON = VB.roles.selectedJSON;      

      jQuery.each(selectedJSON, function(idx) {

        selectedData[idx] = {
          name: this.name,
          modes: this.modes,
          selectedModes: this.selectedModes,
          action: VB.i18n.remove
        }
      });
    }
  }

  // Request available permissions
  jQuery.ajax({
    url: VB.appCtx+'user/listPermissionJSON',
    type: 'post',
    async: false,
    dataType: 'json',
    complete: availResponseHandler
  });

  // Request selected permissionss for this role
  var name = jQuery('#name').val();
  if (name != "") {
    jQuery.ajax({
      url: VB.appCtx+'user/listPermissionJSON',
      data: {'name': name},
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
  VB.roles.available = grid1;
  jQuery('#searchResultsRowCount')[0].innerHTML = grid1.getDataLength();

  // Render the selected grid
  $selected = jQuery('#selectedGrid');
  grid2 = new Slick.Grid("#selectedGrid", selectedData, columns2, options);
  $selected.height(275);
  grid2.autosizeColumns();
  grid2.resizeCanvas();
  VB.roles.selected = grid2;
  jQuery('#selectedRowCount')[0].innerHTML = grid2.getDataLength();

  jQuery("[id$='Grid']").show();

  // Hidden form elements with the list of selected permissions
  jQuery.each(selectedData, function(idx) {
    jQuery('<input type="hidden" id="perm-'+
           this.name+'" name="perm-'+
           this.name+'" value="'+
           this.name+'"/>').appendTo('#selectedList');
  });

  // Select the cancel button on ENTER from selected grid
  VB.roles.selected.onKeyDown.subscribe(function(e, args) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      cancelBtn.focus();
    }
  });

  // Keyboard access to search results grid
  jQuery('#searchResultsGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.roles.available.gotoCell(0, 0, false);
      $available.effect('highlight', {}, 'slow');
    }
    if (e.keyCode === jQuery.ui.keyCode.TAB) {
      VB.roles.selected.gotoCell(0, 0, false);
      $selected.effect('highlight', {}, 'slow');
    }
  });

  // Keyboard access to selected grid
  jQuery('#selectedGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.roles.selected.gotoCell(0, 0, false);
      $selected.effect('highlight', 'slow');
    }
  });
  
  // Event handler - remove the _READ mode if any of the other
  // modes are selected.  Restore the _READ mode if all the other
  // modes are deselected
  jQuery('#selectedGrid input:checkbox').bind('click', function(e) {
      
    var chkbox = jQuery(this);
    
    if (chkbox.attr('checked')) {
        
      // remove the hidden field
      var hidden = jQuery("input:hidden", chkbox[0].parentNode);
      hidden.remove();
      
    }
    else {
      var chkboxen = jQuery("input:checkbox", chkbox[0].parentNode);
      var checked = false;
      
      jQuery.each(chkboxen, function(idx) {
        if (jQuery(this).attr('checked')) {
          checked = true;
        }
      });
      
      if (!checked) {
        // restore hidden field
        var perm = chkbox.val().split('_')[0];
        var nodeTxt = '<input type=\"hidden\" name=\"mode-'+perm+'_READ\"  value=\"'+perm+'_READ\"/>';  
        jQuery(chkbox[0].parentNode).prepend(jQuery(nodeTxt));
      }
    }
  }); 
  
  // Init
}

VB.roles.select = function(row) {

  var avail = VB.roles.available;
  var availData = avail.getData();
  var newData = [];
  jQuery.each(availData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var selected = VB.roles.selected;
  var allData = selected.getData();
  var rowData = avail.getDataItem(row);

  var chg = true;
  var modesMap = {};
  
  // maintain map of modes which are selected for each row
  jQuery.each(allData, function(idx) {
    
    var modesChecks = jQuery('div[row="'+idx+'"] input', '#selectedList');
    var modesList = [];
    jQuery.each(modesChecks, function(zdx) {
      if (jQuery(this).attr('checked')) {
        modesList.push(this.name);
      }
    })
    modesMap[idx] = modesList;
    
    if (this.name == rowData.name) {
      chg = false;
    }
  });

  // Don't allow selection of a permission
  // which is already in the selected list
  if (chg) {
    rowData.action = VB.i18n.remove;
    allData.unshift(rowData);
    selected.invalidateAllRows();
    selected.setData(allData, true);
    selected.resizeCanvas();
    jQuery('#selectedRowCount')[0].innerHTML = selected.getDataLength();
    
    // recheck the checkboxes which had previously been checked
    jQuery.each(allData, function(idx) {
      var mode = modesMap[idx];
      if (mode) {
        jQuery.each(mode, function(zdx) {
          jQuery('input[name="'+this.toString()+'"]').attr('checked', true);
        });        
      }
    });

    jQuery('<input type="hidden" id="perm-'+
           rowData.name+'" name="perm-'+
           rowData.name+'" value="'+
           rowData.name+'"/>').appendTo('#selectedList');

    avail.invalidateAllRows();
    avail.setData(newData, true);
    avail.resizeCanvas();
    jQuery('#searchResultsRowCount')[0].innerHTML = avail.getDataLength();
    
    // Event handler - remove the _READ mode if any of the other
    // modes are selected.  Restore the _READ mode if all the other
    // modes are deselected
    jQuery('#selectedGrid input:checkbox').bind('click', function(e) {

        var chkbox = jQuery(this);

        if (chkbox.attr('checked')) {

        // remove the hidden field
        var hidden = jQuery("input:hidden", chkbox[0].parentNode);
        hidden.remove();

        }
        else {
        var chkboxen = jQuery("input:checkbox", chkbox[0].parentNode);
        var checked = false;

        jQuery.each(chkboxen, function(idx) {
            if (jQuery(this).attr('checked')) {
            checked = true;
            }
        });

        if (!checked) {
            // restore hidden field
            var perm = chkbox.val().split('_')[0];
            var nodeTxt = '<input type=\"hidden\" name=\"mode-'+perm+'_READ\"  value=\"'+perm+'_READ\"/>';  
            jQuery(chkbox[0].parentNode).prepend(jQuery(nodeTxt));
        }
        }
    });    
    
//    VB.roles.validateRoles();
    
  }
  else {
    jQuery.jGrowl(VB.i18n.already_selected, {theme: 'info'})
  }

}

VB.roles.deselect = function(row) {

  var selected = VB.roles.selected;
  var allData = selected.getData();
  var rowData = selected.getDataItem(row);
  var newData = [];
  jQuery.each(allData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var avail = VB.roles.available;
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

  jQuery('#perm-'+rowData.name, '#selectedList').remove();
  jQuery.each(rowData.modes, function(idx) {
    jQuery('#mode-'+this, '#selectedList').remove();
  })

  selected.invalidateAllRows();
  selected.setData(newData, true);
  selected.resizeCanvas();
  jQuery('#selectedRowCount')[0].innerHTML = selected.getDataLength();
  
//  VB.roles.validateRoles();

}

VB.roles.search = function(event, el) {

  var grid = VB.roles.available;
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

VB.roles.validateRoles = function() {
  
  var selected = VB.roles.selected;
  var selData = selected.getData();
  var provision = false, image = false, policy = false, app_layer = false, desktop_pool = false;
  var saveBtn   = jQuery('.ui-dialog-buttonset button:last');
  
  for (var i = 0; i < selData.length; i++) {
    switch(selData[i].name) {
      case "PROVISION":
        provision = true;
        break;
      case "IMAGE":
        image = true;
        break;
      case "POLICY":
        policy = true;
        break;
      case "APP_LAYER":
        app_layer = true;
        break;
      case "DESKTOP_POOL":
        desktop_pool = true;
        break;
    };
  }

  var info = jQuery('#privilegeInfo');
  if (provision) {
    if (image && policy && app_layer && desktop_pool) {
      info[0].innerHTML = "";
      saveBtn.button({disabled: false});
    }
    else {
      var list = '';
      var privs = ['image', 'policy', 'app_layer', 'desktop_pool' ];
      for (var j = 0; j < privs.length; j++) {
        if (!eval(privs[j])) {
          var delim = (j == privs.length-1)?"":", ";
          list = list + VB.i18n[privs[j]] + delim;
        }        
      }
      info[0].innerHTML = VB.i18n.provision_req+list;
      saveBtn.button({disabled: true});
    }
  }
  else {
    info[0].innerHTML = "";
    saveBtn.button({disabled: false});
  }
    
}
