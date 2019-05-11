import toast from './toast.js';

$(document).ready(function () {
    $("#fileInput").change(uploadFile);
    $("#btnAddFile").click(addFile);
    $("#btnGetFiles").click(getFileList);
    $("#btnmodifyFile").click(uploadModifyFile);
});

function uploadFile() {
    var formData = new FormData();
    formData.append('file', $('#fileInput')[0].files[0]);

    $.ajax({
        url: 'addfile',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (json) {
            if (json['success']) {
                toast('上传成功', 'info');
            } else {
                toast(json['error'], 'danger');
            }
            getFileList();
        }
    });
    $('#fileInput')[0].value = '';
}

function downloadFile(filename) {
    var form = $('<form method="POST" target="_blank"></form>');
    form.attr('action', 'getfile');
    var token = $('meta[name=csrf-token]').attr('content');
    var input = $('<input type="hidden" name="filename" value="' + filename + '"></input>')
    var csrf = $('<input type="hidden" name="csrf_token" value="' + token + '"></input>')
    $(document.body).append(form);
    $(form).append(input);
    $(form).append(csrf);
    form.submit();
    form.remove();
}

function getFileSize(byteSize) {
    var i = -1;
    var byteUnits = [' KB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        byteSize = byteSize / 1024;
        i++;
    } while (byteSize > 1024);
    return Math.max(byteSize, 0.1).toFixed(1) + byteUnits[i];
};

function getFileList() {
    $("#container")[0].className = 'container';
    $("#table")[0].classList.remove("sm-font");
    $("#controller")[0].classList.add("hidden");
    var t = $("#table")[0];
    t.innerHTML = "";
    var temp = '<thead><tr><th scope="col">文件名</th><th scope="col" class="text-center w-7rem">大小</th><th scope="col" class="text-center w-7rem">操作</th></tr></thead><tbody>';
    $.get(
        'getfilelist',
        {},
        function (json) {
            json = json.sort(function (a, b) {
                return b['size'] - a['size'];
            });
            json.map(function (dict) {
                var template = '<tr><td class="align-middle">{{filename}}</td><td class="align-middle text-center">{{size}}</td><td class="align-middle text-center"><a class="downloadFile fa fa-download" href="#" filename="{{filename}}"></a> / <a class="modifyFile fa fa-pencil-square-o" href="#" filename="{{filename}}"></a> / <a class="text-danger delFile fa fa-trash-o" href="#" filename="{{filename}}"></a></td>';
                template = template.replace(/{{filename}}/g, dict['filename']);
                template = template.replace(/{{size}}/g, getFileSize(dict['size']));
                temp += template;
            });
            temp += '</tbody>';
            t.innerHTML = temp;
            
            $(".downloadFile").click(function () {
                downloadFile($(this).attr('filename'));
            })
            $(".modifyFile").click(function () {
                modifyFile($(this).attr('filename'));
            })
            $(".delFile").click(function () {
                delFile($(this).attr('filename'));
            })
        }
    );
}

function modifyFile(filename) {
    $.post(
        'getfile',
        {
            'filename': filename,
            'preview': true,
        },
        function (json) {
            $('#modifyFileUsedName').val(filename);
            $('#modifyFileName').val(filename);
            if (json['success']) {
                var editor = ace.edit("modifyFileEditor");
                var modelist = ace.require("ace/ext/modelist");
                var mode = modelist.getModeForPath(filename).mode;
                editor.setValue(json['content'], -1);
                editor.setReadOnly(false);
                editor.setTheme("ace/theme/tomorrow");
                editor.session.setMode(mode);
            } else {
                var editor = ace.edit("modifyFileEditor");
                editor.setValue(json['error'], -1);
                editor.setReadOnly(true);
            }
            $('#modifyFile').modal('show');
        }
    )
}

function addFile() {
    $('#modifyFileUsedName').val('');
    $('#modifyFileName').val('');
    var editor = ace.edit("modifyFileEditor");
    editor.session.setMode('ace/mode/text');
    editor.setReadOnly(false);
    editor.setValue('', -1);
    $('#modifyFile').modal('show');
}

function uploadModifyFile() {
    var usedname = $('#modifyFileUsedName').val();
    var filename = $('#modifyFileName').val();

    var editor = ace.edit("modifyFileEditor");
    var content = editor.getValue();
    var disabled = editor.getReadOnly();

    var data = {
        'filename': filename,
        'usedname': usedname,
    };
    if (!disabled) {
        data['content'] = content;
    }
    $.post(
        'modifyfile',
        data,
        function (json) {
            $('#modifyFile').modal('hide');
            if (json['success']) {
                toast('保存成功', 'info');
            } else {
                toast(json['error'], 'danger');
            }
            getFileList();
        }
    )
}

function delFile(filename) {
    if (!confirm('确定删除么?')) {
        return;
    }
    $.post(
        'delfile',
        {
            'filename': filename
        },
        function (json) {
            if (json['success']) {
                toast('删除成功', 'info');
            } else {
                toast(json['error'], 'danger');
            }
            getFileList();
        }
    );
}
