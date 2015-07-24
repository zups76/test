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
 * fileUpload.js
 */

/*
 * Declare our namespace
 */
if (typeof VB.fileUpload == 'undefined') {
    VB.fileUpload = {};
}

VB.fileUpload.init = function() {   

    // set up for progress bar
    var pbImgPath    = VB.appCtx + "images/progressbar.gif";
    var pbBkgPath    = VB.appCtx + "images/progressbg_green.gif";
    var pbIndPath    = VB.appCtx + "images/progressbg__indeterminate.gif";
    var pbConfig     = {
        width: 121,
        boxImage: pbImgPath,
        barImage: pbBkgPath,
        steps: 1,
        showText: true
    } 
    pbConfig.barImage = pbIndPath;
    var pb = jQuery("#progress").progressBarInd(0, pbConfig).hide();    
    
    // set up for other controls
    var jqXHR;
    var delete_url;  
    var file_type;
    var actionBtn = jQuery('#actionBtn').button({disabled: true});
    var closeBtn = jQuery('.ui-dialog-buttonpane button:last');
    var uploadBtn = jQuery('#uploadBtn').button();
    var info = jQuery('#info'); 
    var size = jQuery('#size');
    var time = jQuery('#time');

    // main file upload init
    jQuery('#fileupload').fileupload({
        
        dataType: 'json',
        maxChunkSize: 10485760,
        
        add: function (e, data) {
            
            var that = this;
            
            size.text(VB.fileUpload.formatFileSize(data.files[0].size));
            uploadBtn.button({disabled: true});
            
            // check to see if we have a partial upload
            jQuery.ajax({
                async: false,
                type: 'post',
                dataType: 'json',
                url: VB.appCtx+'fileUpload/checkFile/',
                data: {file: data.files[0].name},
                success: function (result) {
                    
                    // a previous partial upload exists
                    if (result.name) {
                        
                        // handler for abort of an upload in progress
                        actionBtn.button({disabled: false, label: "Stop"});
                        actionBtn.unbind('click');
                        actionBtn.bind('click', function (e) {
                            data.abort();
                        });                        
                        
                        // resume from where we left off
                        data.uploadedBytes = result.uploadedBytes;
                        jQuery.blueimp.fileupload.prototype.options.add.call(that, e, data);  
                        
                    }
                    else {
                        
                        // if not a previous partial upload, start from the beginning
                        jqXHR = data.submit();
                    }
                }
            });                       
        },     
        
        change: function (e, data) {      
            
            jQuery('#files').text(data.files[0].name);
            actionBtn.button({disabled: false});
            
            // Init indeterminate progress bar
            pb.progressBarInd(0, pbConfig).fadeIn('slow');
            
        },
        
        done: function (e, data) {            
            
            // file uploads complete
            var filename = data.result[0].name;
            delete_url   = data.result[0].delete_url;
            delete_url   = delete_url.substring(0, delete_url.lastIndexOf(".part"));
            file_type    = data.result[0].file_type;
            
            
            info.text('Upload complete. Processing...');
            time.text('');
            actionBtn.button({disabled: true});  
            closeBtn.button({disabled: true});
            
            // Init indeterminate progress bar
            pbConfig.barImage = pbIndPath;
            pb.progressBarInd(100, pbConfig);
                
            setTimeout(function() {

                // combine file chunks
                jQuery.ajax({
                    async: false,
                    type: 'post',
                    url: data.result[0].url,
                    data: {'id': filename, 'file_type':file_type}
                });
                
                // delete file chunks
                var idx = data.result[0].name.lastIndexOf('.part');
                if (idx > 0) {
                    jQuery.ajax({
                        async: true,
                        type: 'post',
                        url: VB.appCtx+'fileUpload/deleteParts/',
                        data: {
                            id: filename
                        }
                    });
                }    
                
                pb.html("&nbsp;");
                info.text('Finished.');
                closeBtn.button({disabled: false});
                
                // override the click handler with one to delete
                // the uploaded file.
                actionBtn.button({disabled: false, label: "Delete"});
                actionBtn.unbind('click');
                actionBtn.bind('click', function(el) {
                    jQuery.ajax({
                        type: 'post',
                        url: delete_url,
                        data: {'file_type': file_type},
                        complete: function() {
                            info.text("Deleted");
                            actionBtn.button({disabled: true});
                        }
                    });
                });                
                
            }, 500);                

        },
        
        progress: function (e, data) {           
            
            var progress = parseInt(data.uploadedBytes / data.total * 100, 10);
            
            // update progress bar
            pbConfig.barImage = pbBkgPath;
            pb.progressBar(progress, pbConfig);
            
            // update bit rate
            var bitRate = VB.fileUpload.formatBitrate(data.bitrate);
            info.text(bitRate);
            
            // update time
            var remaining = VB.fileUpload.formatTime((data.total - data.loaded) * 8 / data.bitrate);
            time.text(remaining);
        },
        
        error: function (jqXHR, textStatus, errorThrown) {
            
            var fu = this;
            
            if (errorThrown === 'abort') {
                info.text('File Upload has been stopped.');
                time.text('');
                actionBtn.button({disabled: false, label: "Resume"});
                actionBtn.unbind('click');
                actionBtn.bind('click', function(el) {
                    $('#fileupload').fileupload('add', {files: fu.files});
                });                    
            }
        }
    });
    
    // handler for abort of an upload in progress
    actionBtn.bind('click', function (e) {
        jqXHR.abort();
    });    
}
    
VB.fileUpload.formatFileSize = function (bytes) {
    if (typeof bytes !== 'number') {
        return '';
    }
    if (bytes >= 1000000000) {
        return (bytes / 1000000000).toFixed(2) + ' GB';
    }
    if (bytes >= 1000000) {
        return (bytes / 1000000).toFixed(2) + ' MB';
    }
    return (bytes / 1000).toFixed(2) + ' KB';
}

VB.fileUpload.formatBitrate = function (bits) {
    if (typeof bits !== 'number') {
        return '';
    }
    if (bits >= 1000000000) {
        return (bits / 1000000000).toFixed(2) + ' Gbit/s';
    }
    if (bits >= 1000000) {
        return (bits / 1000000).toFixed(2) + ' Mbit/s';
    }
    if (bits >= 1000) {
        return (bits / 1000).toFixed(2) + ' kbit/s';
    }
    return bits.toFixed(2) + ' bit/s';
}

VB.fileUpload.formatTime = function (seconds) {
    var date = new Date(seconds * 1000),
        days = Math.floor(seconds / 86400);
    days = days ? days + 'd ' : '';
    return days +
        ('0' + date.getUTCHours()).slice(-2) + ':' +
        ('0' + date.getUTCMinutes()).slice(-2) + ':' +
        ('0' + date.getUTCSeconds()).slice(-2);
}
