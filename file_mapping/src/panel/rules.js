import he from './he.js';
import toast from './toast.js';

$(document).ready(function () {
    $("#btnAddRule").click(addRule);
    $("#btnModifyRule").click(modifyRule);
    $("#btnGetRules").click(getRules);
});

var rules = {};
var currIndex = getMaxElement() + 1;

function getMaxElement() {
    var max = 0;
    for (var key in rules) {
        key = Number(key);
        if (key > max) {
            max = key;
        }
    }
    return max;
}

function HTMLencode(dict) {
    for (var key in dict) {
        if (typeof (dict[key]) == 'string') {
            dict[key] = he.encode(dict[key]);
        }
    }
    return dict;
}

function HTMLdecode(dict) {
    for (var key in dict) {
        if (typeof (dict[key]) == 'string') {
            dict[key] = he.decode(dict[key]);
        }
    }
    return dict;
}

function addRule() {
    $('#newRule').modal('hide');
    var route = $("#newRuleRoute").val();
    var filename = $("#newRuleFilename").val();
    var memo = $("#newRuleMemo").val();
    var rule = {
        "route": route,
        "filename": filename,
        'memo': memo
    };
    if ($("#newRuleRecord")[0].checked) {
        rule['record'] = true;
    } else {
        rule['record'] = false;
    }
    $.post(
        'addrule',
        rule,
        function (json) {
            if (json['success']) {
                $("#newRuleRoute").val('');
                $("#newRuleFilename").val('');
                $("#newRuleRecord")[0].checked = false;
                $("#newRuleMemo").val('');
                if (currIndex == 1) {
                    getRules();
                } else {
                    rule = HTMLencode(rule);
                    rules[currIndex] = rule;
                    currIndex += 1;
                    generateRuleTable(rules);
                }
                toast('添加成功', 'info');
            } else {
                toast(json['error'], 'danger');
            }
        }
    );
}

function getRules() {
    $.get(
        'getrules',
        {},
        function (json) {
            rules = json;
            currIndex = getMaxElement(rules) + 1;
            generateRuleTable(json);
        }
    );
}

function generateRuleTable(rules) {
    $("#container")[0].className = 'container';
    $("#table")[0].classList.remove("sm-font");
    $("#controller")[0].classList.add("hidden");
    var t = $('#table')[0];
    t.innerHTML = '';
    var temp = '<thead><tr><th scope="col" class="text-center w-3rem">ID</th><th scope="col">路由</th><th scope="col">文件名</th><th scope="col">备注</th><th scope="col" class="text-center w-3rem">记录</th><th scope="col" class="text-center w-5rem">操作</th></tr></thead><tbody>';
    for (var id in rules) {
        var dict = rules[id];
        var template = '<tr><td class="text-center align-middle">{{id}}</td><td class="align-middle">{{route}}</td><td class="align-middle">{{filename}}</td><td class="align-middle">{{memo}}</td><td class="align-middle text-center"><i class="fa {{record}}" aria-hidden="true"></i></td><td class="align-middle text-center"><a class="modifyRule fa fa-pencil-square-o" href="#" ruleid="{{id}}"></a> / <a class="text-danger delRule fa fa-trash-o" href="#" ruleid="{{id}}"></a></td></tr>';
        template = template.replace(/{{id}}/g, String(id));
        template = template.replace(/{{route}}/g, dict['route']);
        template = template.replace(/{{filename}}/g, dict['filename']);
        if (dict['record']) {
            template = template.replace(/{{record}}/g, 'fa-check-square');
        } else {
            template = template.replace(/{{record}}/g, 'fa-square-o');
        }
        template = template.replace(/{{memo}}/g, dict['memo']);
        temp += template;
    }
    temp += '</tbody>';
    t.innerHTML = temp;

    $(".modifyRule").click(function () {
        showModifyRule($(this).attr('ruleid'));
    });
    $(".delRule").click(function () {
        delRule($(this).attr('ruleid'));
    });
}

function delRule(id) {
    if (!confirm('确定删除么?')) {
        return;
    }
    $.post(
        'delrule',
        {
            'id': id
        },
        function (json) {
            if (json['success']) {
                delete rules[id];
                toast('删除成功', 'info');
                generateRuleTable(rules);
            } else {
                toast(json['error'], 'danger');
            }
        }
    );
}

function showModifyRule(id) {
    var dict = rules[id];
    dict = HTMLdecode(dict);
    $("#modifyRuleID").val(String(id));
    $("#modifyRuleRoute").val(dict['route']);
    $("#modifyRuleFilename").val(dict['filename']);
    $("#modifyRuleMemo").val(dict['memo']);
    if (dict['record']) {
        $("#modifyRuleRecord")[0].checked = true;
    } else {
        $("#modifyRuleRecord")[0].checked = false;
    }
    $('#modifyRule').modal('show');
}

function modifyRule() {
    $('#modifyRule').modal('hide');
    var id = $("#modifyRuleID").val();
    var route = $("#modifyRuleRoute").val();
    var filename = $("#modifyRuleFilename").val();
    var memo = $("#modifyRuleMemo").val();
    var rule = {
        'id': id,
        "route": route,
        "filename": filename,
        'memo': memo
    };
    if ($("#modifyRuleRecord")[0].checked) {
        rule['record'] = true;
    } else {
        rule['record'] = false;
    }
    $.post(
        'modifyrule',
        rule,
        function (json) {
            if (json['success']) {
                rule = HTMLencode(rule);
                rules[id] = rule;
                generateRuleTable(rules);
                toast('修改成功', 'info');
            } else {
                toast(json['error'], 'danger');
            }
        }
    );
}