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
 * appLayers.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.appLayers == 'undefined') {
  VB.appLayers = {};
}

VB.appLayers.initFileUploader = function() {

    var saveBtn = jQuery('.ui-dialog-buttonpane button:last');
    saveBtn.button({disabled: true});

    var nameFld    = jQuery('#name');
    var revTagFld  = jQuery('#revisionTag');
    var osTypesFld = jQuery('.osVals');
    var hiddenFld  = jQuery('#uploadedToFile');

    nameFld.bind('change', function(evt) {
      var ostChecked = false;
      jQuery.each(osTypesFld, function() {
        if (jQuery(this).attr('checked'))
          ostChecked = true;
      });
      if (nameFld.attr('value') != '' && 
          revTagFld.attr('value') != '' &&
          hiddenFld.attr('value') != '' &&
          ostChecked) {
        saveBtn.button({disabled: false});
      }
      else {
        saveBtn.button({disabled: true});
      }
    });
    revTagFld.bind('change', function(evt) {
      if (nameFld[0]) {
        var ostChecked = false;
        jQuery.each(osTypesFld, function() {
          if (jQuery(this).attr('checked'))
            ostChecked = true;
        });
        if (nameFld.attr('value') != '' &&
            revTagFld.attr('value') != '' &&
            hiddenFld.attr('value') != '' &&
            ostChecked) {
          saveBtn.button({disabled: false});
        }
        else {
          saveBtn.button({disabled: true});
        }
      }
      else {
        if (revTagFld.attr('value') != '' &&
            hiddenFld.attr('value') != '') {
          saveBtn.button({disabled: false});
        }
        else {
          saveBtn.button({disabled: true});
        }
      }      
    });
    osTypesFld.bind('change', function(evt) {
      var ostChecked = false;
      jQuery.each(osTypesFld, function() {
        if (jQuery(this).attr('checked'))
          ostChecked = true;
      });
      if (nameFld.attr('value') != '' &&
          revTagFld.attr('value') != '' &&
          hiddenFld.attr('value') != '' &&
          ostChecked) {
        saveBtn.button({disabled: false});
      }
      else {
        saveBtn.button({disabled: true});
      }
    });

    var uploader = new qq.FileUploader({
        element: jQuery('#file-uploader')[0],
        action: VB.appCtx+'image/uploadAppLayerPkg',
        multiple: false,
        allowedExtensions: ['exe', 'EXE', 'msi', 'MSI'],
        messages: {
          typeError: VB.i18n.typeError,
          sizeError: VB.i18n.sizeError,
          minSizeError: VB.i18n.minSizeError,
          emptyError: VB.i18n.emptyError,
          onLeave: VB.i18n.onLeave
        },
        sizeLimit: 2147483648,
        onSubmit: function(id, fileName) {
          jQuery('.qq-upload-button').css('display', 'none');
        },
        onCancel: function(id, fileName) {
          jQuery('.qq-upload-button').css('display', 'block');
        },
        onComplete: function(id, fileName, responseJSON){
          if (responseJSON.success) {
            var fn = fileName.substring(0, fileName.lastIndexOf('.'));
            jQuery('#uploadedToFile').attr('value', fileName);
            jQuery.jGrowl(VB.i18n.uploaded_conf+' \''+fn+'\'', {theme: 'success'});
            jQuery('.qq-upload-button').css('display', 'none');
            if (nameFld[0]) {
              var ostChecked = false;
              jQuery.each(osTypesFld, function() {
                if (jQuery(this).attr('checked'))
                  ostChecked = true;
              });
              if (nameFld.attr('value') != '' &&
                  revTagFld.attr('value') != '' &&
                  hiddenFld.attr('value') != '' &&
                  ostChecked) {
                saveBtn.button({disabled: false});
              }
            }
            else {
              if (revTagFld.attr('value') != '' &&
                  hiddenFld.attr('value') != '') {
                saveBtn.button({disabled: false});
              }
            }
          }
          else {
            jQuery.jGrowl(VB.i18n.uploaded_failed+' \''+fn+'\'', {theme: 'error'});
            jQuery('.qq-upload-button').css('display', 'block');
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

VB.appLayers.initAppLayersListButtons = function() {
  var actionContainer = jQuery('[id|=al-actions]');
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

VB.appLayers.startAppLayerAction = function(event, ctx, action, selector) {

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

  // Disable action button
  var actionBtn = jQuery('#al-actions-'+selector+' a.ui-button');
  if (actionBtn[0]) {
    actionBtn.button({disabled: true});
    actionBtn[0].setAttribute('disabled', 'disabled');
  }

  var actionUrl = ctx + 'image/' + action + '/' + selector;

  var respHandler = function(response) {
    window.location = ctx + 'image/listAppLayers'
  }

  jQuery.ajax({
    type: 'post',
    //data: {ctx: ctx, action: action, selector: selector},
    url: actionUrl,
    success: respHandler,
    dataType: 'html'
  });

}

VB.appLayers.initDeploymentGrids = function() {

  var grid1,grid2,$selected,$available;
  var availData = [];
  var availJSON;
  var selectedJSON;
  var selectedData = [];
  var cancelBtn = jQuery('[class~="ui-dialog-buttonpane"] button:first');

  // Format select/remove links
  actionFormatter = function(row, cell, value, columnDef, dataContext) {
    if (value == VB.i18n.select)
      return '<a href=\"#\" onclick=\"VB.appLayers.select('+row+');\">'+value+'</a>';
    else
      return '<a href=\"#\" onclick=\"VB.appLayers.deselect('+row+');\">'+value+'</a>';
  }

  // Format deployment form controls
  deploymentFormatter = function(row, cell, value, columnDef, dataContext) {
    var useLatest = dataContext.useLatest;
    var useStaged = dataContext.useStaged;
    var uuid = dataContext.uuid;
    var revs = dataContext.revisions;
    var tags = dataContext.tags;
    if (useLatest === undefined) {
      // adding app layer not previously selected,
      // these are defaults
      useLatest = true;
      useStaged = false;
    }
    var optionStr = "";
    jQuery.each(revs, function(idx) {
      optionStr = optionStr + '<option value=\"'+this+'\">' + tags[idx] + '</option>';
    });
    return '<input type=\"radio\" name=\"version-'+uuid+'\" '+ (useLatest?'checked':'') +' value=\"latest\">'+ VB.i18n.latest +'</input>' +
           '<input type=\"radio\" name=\"version-'+uuid+'\" '+ (useStaged?'checked':'') +' value=\"staged\">'+ VB.i18n.staging +'</input>' +
           '<input type=\"radio\" name=\"version-'+uuid+'\" '+ ((value>0)?'checked':'') +' value=\"specific\">'+ VB.i18n.version +'</input>' +
           '<select name=\"specificVersion-'+uuid+'\">'+optionStr+'</select>';
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
      {id:"targetOS", name:VB.i18n.os,     field:"targetOS", width: 183},
      {id:"action",   name:VB.i18n.action, field:"action",   width: 50, formatter: actionFormatter, editor: actionHandler}
  ];

  // Columns for selected grid
  var columns2 = [
      {id:"name",       name:VB.i18n.name,       field:"name",       width: 110},
      {id:"targetOS",   name:VB.i18n.os,         field:"targetOS",   width: 110},
      {id:"revision",   name:VB.i18n.deployment, field:"revision",   width: 248, formatter: deploymentFormatter},
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

  // Callback to prepare grid data for the list of available app layers
  availResponseHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {

      availJSON = json.appLayerList;
      var revisions = json.revisions;
      var tags = json.tags;
      var osMap = json.osMap;

      jQuery.each(availJSON, function(idx) {

        var osList = [];
        jQuery.each(this.osTypes, function(idx) {
          osList.push(osMap[this.name]);
        });

        availData[idx] = {
          name: this.name,
          tags:  tags[idx],
          targetOS: osList,
          status: this.status.name,
          action: VB.i18n.select,
          uuid: this.uuid,
          revisions: revisions[idx]
        }
      });
    }
  }

  // Callback to prepare grid data for list of selected app layers
  selectedResponseHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {

      selectedJSON = json.appLayerList;
      var assignments = json.appLayerAssignments;
      var revisions = json.revisions;
      var tags = json.tags;
      var osMap = json.osMap;

      jQuery.each(selectedJSON, function(idx) {

        var osList = [];
        jQuery.each(this.osTypes, function(idx) {
          osList.push(osMap[this.name]);
        });

        selectedData[idx] = {
          name: this.name,
          tags:  tags[idx],
          targetOS: osList,
          status: this.status.name,
          action: VB.i18n.remove,
          uuid: this.uuid,
          revision: assignments[idx].revision,
          useStaged: assignments[idx].useStaged,
          useLatest: assignments[idx].useLatest,
          revisions: revisions[idx]
        }
      });
    }
  }

  // Request provisionable app layers
  var imageId = jQuery("[name=image\\.id]").val();
  var name;
  if (imageId == undefined) {
    var poolImage = jQuery("[name=image\\.uuid]");
    if (poolImage[0]) {
      var entry = jQuery("option:selected", poolImage);
      name = entry.text();
      var idx = name.indexOf(" (global)");
      if (idx > 0) {
          name = name.substring(0, idx);
      }
      imageId = entry.val();
    }
  }
  var data = {
    'imageId': imageId,
    'name': name
  };
  jQuery.ajax({
    url: VB.appCtx+'policyAssignment/listAppLayersJSON',
    type: 'post',
    data: data,
    async: false,
    dataType: 'json',
    complete: availResponseHandler
  });

  // Request selected app layers for this policy assignment or desktop pool
  var data;
  var paId = jQuery('#policyAssignmentId').val();
  if (paId) {
      data = {'policyAssignmentId': paId};
  }
  else {
    var desktopPool = jQuery('#desktopPoolName').val();
    if (desktopPool != "") {
      data = {'desktopPoolName': desktopPool};
    }
  }
  jQuery.ajax({
    url: VB.appCtx+'policyAssignment/listAppLayersAssignmentsJSON',
    data: data,
    type: 'post',
    async: false,
    dataType: 'json',
    complete: selectedResponseHandler
  });

  // Render the available/search results grid
  $available = jQuery('#searchResultsGrid');
  grid1 = new Slick.Grid("#searchResultsGrid", availData, columns1, options);
  $available.height(101);
  grid1.autosizeColumns();
  grid1.resizeCanvas();
  VB.appLayers.available = grid1;
  jQuery('#searchResultsRowCount').html(grid1.getDataLength());

  // Render the selected app layers grid
  $selected = jQuery('#selectedGrid');
  grid2 = new Slick.Grid("#selectedGrid", selectedData, columns2, options);
  $selected.height(101);
  grid2.autosizeColumns();
  grid2.resizeCanvas();
  VB.appLayers.selected = grid2;
  jQuery('#selectedRowCount').html(grid2.getDataLength());

  jQuery("[id$='Grid']").show();

  // Hidden form elements with the list of selected app layers
  jQuery.each(selectedData, function(idx) {
    jQuery('<input type="hidden" id="al-'+
           this.uuid+'" name="appLayer-'+
           this.uuid+'" value="'+
           this.uuid+'"/>').appendTo('#selectedList');
  });

  // Select the cancel button on ENTER from selected grid
  VB.appLayers.selected.onKeyDown.subscribe(function(e, args) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      cancelBtn.focus();
    }
  });

  // Keyboard access to search results grid
  jQuery('#searchResultsGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.appLayers.available.gotoCell(0, 0, false);
      $available.effect('highlight', {}, 'slow');
    }
    if (e.keyCode === jQuery.ui.keyCode.TAB) {
      VB.appLayers.selected.gotoCell(0, 0, false);
      $selected.effect('highlight', {}, 'slow');
    }
  });

  // Keyboard access to selected app layers grid
  jQuery('#selectedGridLauncher').bind("keydown.nav", function(e) {
    if (e.keyCode === jQuery.ui.keyCode.ENTER) {
      VB.appLayers.selected.gotoCell(0, 0, false);
      $selected.effect('highlight', 'slow');
    }
  });

  jQuery('select[name^="image"]').bind("change", function(e) {

    var gridAvail = VB.appLayers.available;
    var gridSel = VB.appLayers.selected;
    var availData = [];
    var availJSON;
    
    var name;
    if (this.name.indexOf('uid') > 0) {
      name = jQuery('option[value="'+this.value+'"]').text();
    }

    respHandler = function(resp) {

      jQuery('[id^="al-"]', '#selectedList').remove();
      gridSel.invalidateAllRows();
      gridSel.setData([], true);
      gridSel.resizeCanvas();
      VB.appLayers.selected = gridSel;
      jQuery('#selectedRowCount').html(0);

      var json = jQuery.parseJSON(resp.responseText);

      if (json.errors) {
        jQuery.jGrowl(json.errors, {theme: 'error'});
      }
      else {

        availJSON = json.appLayerList;
        var osMap = json.osMap;
        var revisions = json.revisions;
        var tags = json.tags;

        jQuery.each(availJSON, function(idx) {

          var osList = [];
          jQuery.each(this.osTypes, function(idx) {
            osList.push(osMap[this.name]);
          });

          availData[idx] = {
            name: this.name,
            tags:  tags[idx],
            targetOS: osList,
            status: this.status.name,
            action: VB.i18n.select,
            uuid: this.uuid,
            revisions: revisions[idx]
          }
        });

        gridAvail.invalidateAllRows();
        gridAvail.setData(availData, true);
        gridAvail.resizeCanvas();
        VB.appLayers.available = gridAvail;
        jQuery('#searchResultsRowCount').html(gridAvail.getDataLength());

      }
    }

    if (e.stopPropagation) {
      e.stopPropagation();
    }
    else {
      // for IE
      e.cancelBubble = true;
    }

    var data = {'imageId': this.value, 'name': name};
    var url = VB.appCtx+'policyAssignment/listAppLayersJSON';
    
    jQuery.ajax({
      url: url,
      data: data,
      type: 'post',
      dataType: 'json',
      complete: respHandler
    });
  });
}

VB.appLayers.select = function(row) {

  var avail = VB.appLayers.available;
  var availData = avail.getData();
  var newData = [];
  jQuery.each(availData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var selected = VB.appLayers.selected;
  var allData = selected.getData();
  var rowData = avail.getDataItem(row);

  var chg = true;
  jQuery.each(allData, function(idx) {
    if (this.uuid == rowData.uuid) {
      chg = false;
    }
  });

  // Don't allow selection of an app layer
  // which is already in the selected list
  if (chg) {
    rowData.revision = 'latest';
    rowData.action = VB.i18n.remove;
    allData.unshift(rowData);
    selected.invalidateAllRows();
    selected.setData(allData, true);
    selected.resizeCanvas();
    jQuery('#selectedRowCount')[0].innerHTML = selected.getDataLength();

    jQuery('<input type="hidden" id="al-'+
           rowData.uuid+'" name="appLayer-'+
           rowData.uuid+'" value="'+
           rowData.uuid+'"/>').appendTo('#selectedList');

    avail.invalidateAllRows();
    avail.setData(newData, true);
    avail.resizeCanvas();
    jQuery('#searchResultsRowCount')[0].innerHTML = avail.getDataLength();
  }
  else {
    jQuery.jGrowl(VB.i18n.already_selected, {theme: 'info'})
  }

}

VB.appLayers.deselect = function(row) {

  var selected = VB.appLayers.selected;
  var allData = selected.getData();
  var rowData = selected.getDataItem(row);
  var newData = [];
  jQuery.each(allData, function(idx) {
    if (idx != row)
      newData.push(this);
  });

  var avail = VB.appLayers.available;
  var availData = avail.getData();

  var chg = true;
  jQuery.each(availData, function(idx) {
    if (rowData.uuid == this.uuid)
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

  jQuery('#al-'+rowData.uuid, '#selectedList').remove();

  selected.invalidateAllRows();
  selected.setData(newData, true);
  selected.resizeCanvas();
  jQuery('#selectedRowCount')[0].innerHTML = selected.getDataLength();

}

VB.appLayers.search = function(event, el) {

  var grid = VB.appLayers.available;
  var availData = [];
  var availJSON;

  respHandler = function(resp) {

    var json = jQuery.parseJSON(resp.responseText);

    if (json.errors) {
      jQuery.jGrowl(json.errors, {theme: 'error'});
    }
    else {

      availJSON = json.appLayerList;
      var osMap = json.osMap;
      var revisions = json.revisions;
      var tags = json.tags;

      jQuery.each(availJSON, function(idx) {

        var osList = [];
        jQuery.each(this.osTypes, function(idx) {
          osList.push(osMap[this.name]);
        });

        availData[idx] = {
          name: this.name,
          tags:  tags[idx],
          targetOS: osList,
          status: this.status.name,
          action: VB.i18n.select,
          uuid: this.uuid,
          revisions: revisions[idx]
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

  var searchName, searchTag, imageId, name;
  var ctx = jQuery(el);
  var conditionsDiv = jQuery(el).parent().prev();
  if (ctx.attr('id') == 'clear') {
    searchName = "";
    searchTag = "";
    jQuery('#searchName', conditionsDiv).val("");
    jQuery('#searchTag', conditionsDiv).val("");
  }
  else {
    searchName = jQuery('#searchName', conditionsDiv).val();
    searchTag = jQuery('#searchTag', conditionsDiv).val();
  }

  imageId = jQuery("[name=image\\.id]").val();
  if (imageId == undefined) {
    var poolImage = jQuery("[name=image\\.uuid]");
    if (poolImage[0]) {
      var entry = jQuery("option:selected", poolImage);
      name = entry.text();
      imageId = entry.val();
    }
  }

  var data = {
    'searchName':searchName,
    'searchTag':searchTag,
    'imageId': imageId,
    'name': name
  };

  var url = VB.appCtx+'policyAssignment/listAppLayersJSON';
  jQuery.ajax({
    url: url,
    data: data,
    type: 'post',
    dataType: 'json',
    complete: respHandler
  });
}
