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
 * organization.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.organization == 'undefined') {
  VB.organization = {};
}

VB.organization.init = function() {

  var selectedTab = jQuery('#tab');
  var tabVal = Number(selectedTab.attr('value'));
  var tabs = jQuery('#tabs').tabs({
    selected: tabVal,
    select:   function(event, ui) {
      selectedTab.attr('value', ui.index);
    },
    fx: {opacity: 'toggle'}
  });
  
  var webName = jQuery('#webName');
  var hint    = jQuery('#webName_hint');
  webName.bind('keyup', function(e) {
    var val = jQuery(this).val();
    hint.text(val).effect('highlight'); 
  });
  
  // Maximum user image size
  var maxImgSize = jQuery('input[name="disp-WIN4_USERIMG_MAXSIZE"]');
  var maxImgSizeMB = maxImgSize.next('input:hidden');
  maxImgSize.css('width', '40px');
  maxImgSize.css('margin-right', '10px');
  maxImgSize.css('border', 'none');
  var maxImgSizeSlider = jQuery('<div id="#maxImgSizeSlider" style="display:inline-block;width:250px;"></div>'); 
  maxImgSize.after(maxImgSizeSlider);
  maxImgSizeSlider.slider({
    min:  0,
    max:  256,
    step: 1,
    slide: function( event, ui ) {
      maxImgSize.val(ui.value);
      maxImgSizeMB.val(parseInt(ui.value) * 1024);
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
  });  

}

VB.organization.initUserGrids = function() {  

  var grid1,grid2,$selected,$available;
  var availData = [];
  var selectedData = [];
  var cancelBtn = jQuery('[class~="ui-dialog-buttonpane"] button:first');

  // Format select/remove links
  actionFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value == VB.i18n.select)
      return '<a href=\"#\" onclick=\"VB.organization.selectUser('+row+');\">'+value+'</a>';
    else
      return '<a href=\"#\" onclick=\"VB.organization.deselectUser('+row+');\">'+value+'</a>';
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
    
    // concat the JSON response with the list of selected admins and dedupe 
    var users = VB.organization.arrayUnique(userOwnersList.concat(json.userList));

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {
      
      var availIdx = 0;
      var selectedIdx = 0;       
      
      jQuery.each(users, function(idx) {       
        
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
    data: {'permType': 'org'},
    async: false,
    dataType: 'json',
    complete: availResponseHandler
  });

  // Render the available/search results grid
  $available = jQuery('#searchUsersResultsGrid');
  grid1 = new Slick.Grid("#searchUsersResultsGrid", availData, columns1, options);
  $available.height(101);
  grid1.autosizeColumns();
  grid1.resizeCanvas();
  VB.organization.availableUsers = grid1;
  jQuery('#searchUsersResultsRowCount')[0].innerHTML = grid1.getDataLength();
  
  // Render the selected app layers grid
  $selected = jQuery('#selectedUsersGrid');
  grid2 = new Slick.Grid("#selectedUsersGrid", selectedData, columns2, options);
  $selected.height(101);
  grid2.autosizeColumns();
  grid2.resizeCanvas();
  VB.organization.selectedUsers = grid2;
  jQuery('#selectedUsersRowCount')[0].innerHTML = grid2.getDataLength();

  jQuery("[id$='Grid']").show();

  // Select the cancel button on ENTER from selected grid
  VB.organization.selectedUsers.onKeyDown.subscribe(function(e, args) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      cancelBtn.focus();
    }
  });

  // Keyboard access to search results grid
  jQuery('#searchUsersResultsGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.organization.availableUsers.gotoCell(0, 0, false);
      $available.effect('highlight', {}, 'slow');
    }
    if (e.keyCode === jQuery.ui.keyCode.TAB) {
      VB.organization.selectedUsers.gotoCell(0, 0, false);
      $selected.effect('highlight', {}, 'slow');
    }
  });

  // Keyboard access to selected grid
  jQuery('#selectedUsersGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.organization.selectedUsers.gotoCell(0, 0, false);
      $selected.effect('highlight', 'slow');
    }
  });
}

VB.organization.selectUser = function(row) {

  var avail = VB.organization.availableUsers;
  var availData = avail.getData();
  var newData = [];
  jQuery.each(availData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var selected = VB.organization.selectedUsers;
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

VB.organization.deselectUser = function(row) {

  var selected = VB.organization.selectedUsers;
  var allData = selected.getData();
  var rowData = selected.getDataItem(row);
  var newData = [];
  jQuery.each(allData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var avail = VB.organization.availableUsers;
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

VB.organization.searchUsers = function(event, el) {

  var grid = VB.organization.availableUsers;
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
    data: {'searchUsername':searchName, 'permType': 'org'},
    type: 'post',
    dataType: 'json',
    complete: respHandler
  });
}

VB.organization.initFileUploader = function(orgId) {

    var hiddenFld  = jQuery('#uploadedToFile'+orgId);

    var uploader = new qq.FileUploader({
        element: jQuery('#file-uploader-'+orgId)[0],
        action: VB.appCtx+'organization/uploadCustomImage',
        multiple: false,
        allowedExtensions: ['png', 'PNG'],
        messages: {
          typeError: VB.i18n.typeError,
          sizeError: VB.i18n.sizeError,
          minSizeError: VB.i18n.minSizeError,
          emptyError: VB.i18n.emptyError,
          onLeave: VB.i18n.onLeave
        },
        params: {'orgId': orgId},
        sizeLimit: 2147483648,
        onSubmit: function(id, fileName) {
          jQuery('#file-uploader-'+orgId+' .qq-upload-button').css('display', 'none');
        },
        onCancel: function(id, fileName) {
          jQuery('#file-uploader-'+orgId+' .qq-upload-button').css('display', 'block');
        },
        onComplete: function(id, fileName, responseJSON){
          if (responseJSON.success) {
            var fn = fileName.substring(0, fileName.lastIndexOf('.'));
            jQuery('#uploadedToFile').attr('value', fileName);
            jQuery.jGrowl(VB.i18n.uploaded_conf+' \''+fn+'\'', {theme: 'success'});
            jQuery('#file-uploader-'+orgId+' .qq-upload-button').css('display', 'none');
            VB.organization.loadOrgLogo('org-'+orgId);
          }
          else {
            jQuery.jGrowl(VB.i18n.uploaded_failed+' \''+fn+'\'', {theme: 'error'});
            jQuery('#file-uploader-'+orgId+' .qq-upload-button').css('display', 'block');
          }
        },
        showMessage: function(message){
          var $dialog = jQuery('<div id="modalDiv2"></div>').append(message);
          var ok = VB.i18n.ok;
          var buttonsObj = new Object();
          buttonsObj[ok] = function() {
            jQuery(this).dialog('close');
          }
          $dialog.dialog({
            title: VB.i18n.error,
            width: 520,
            modal: true,
            buttons: buttonsObj
          });
        },
        template: '<div class="qq-uploader">' +
                '<div class="qq-upload-drop-area"><span>' + VB.i18n.drop_file_here + '</span></div>' +
                '<div class="qq-upload-button">' + VB.i18n.upload + '</div>' +
                '<ul class="qq-upload-list"></ul>' +
             '</div>',

        // template for one item in file list
        fileTemplate: '<li>' +
                '<span class="qq-upload-file"></span>' +
                '<span class="qq-upload-spinner"></span>' +
                '<span class="qq-upload-size"></span>' +
                '<a class="qq-upload-cancel" href="#">' + VB.i18n.cancel + '</a>' +
                '<span class="qq-upload-failed-text">' + VB.i18n.failed + '</span>' +
            '</li>'
    });
  }
  
VB.organization.switch_confirm = function(el, event, confText, orgId) {

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

    var swich = VB.i18n.swich;
    var cancel = VB.i18n.cancel;
    var buttonsObj = new Object();
    buttonsObj[cancel] = function() {
        jQuery(this).dialog('close');
    };

    buttonsObj[swich] = function() {
        var url = el.href;
        jQuery.ajax({
            url: url,
            type: 'post',
            async: false
        });
        jQuery(this).dialog('close');
        if (orgId != "org-0") {
          window.location = VB.appCtx + "reporting/sessions?ts=" + new Date().getTime();  
        }
        else {
          window.location = VB.appCtx + "?ts=" + new Date().getTime();   
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

VB.organization.loadOrgLogo = function(orgId) {
    
    if (orgId) {
        
        var url = "/verde-custom/" + orgId + "/images/masthead_logo.png";
        
        jQuery.ajax({
            url: url,
            type: 'get',
            cache: false,
            success: function(resp) {
                var img = jQuery('<img src="'+url+'"/>');
                jQuery("#orgLogo-"+orgId).html(img);
            },
            error: function(resp) {
                // nothing
            }
        });        
        
    }
}

VB.organization.arrayUnique = function(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j, 1);
        }
    }

    return a;
};
