import UAParser from './ua-parser.js';
import toast from './toast.js';

$(document).ready(function () {
    $("#btnGetLogs").click(function () {
        $('title').text('管理面板');
        $('#btnGetLogs')[0].classList.remove('text-danger');
        getLogs(1);
        currPage = 1;
    });
    $("#pagePre").click(function () {
        if (currPage - 1 != 0) {
            currPage -= 1;
            getLogs(currPage);
        }
    });
    $("#pageNext").click(function () {
        if (currPage + 1 <= pageCount) {
            currPage += 1;
            getLogs(currPage);
        }
    });
    $("#btnJump").click(function () {
        var page = $("#pageJump").val();
        var pageInt = parseInt($("#pageJump").val());
        if (String(pageInt) !== page || pageInt === NaN || pageInt <= 0 || pageInt > pageCount) {
            toast('输入正确的页码', 'warning')
        } else {
            $("#pageJump").val('');
            currPage = pageInt;
            getLogs(String(page));
        }
    });
    $("#btnDellogs").click(function () {
        if (confirm('确定清空记录么?')) {
            dellogs();
        }
    });
    $("a").hover(function () {
        $('[data-toggle="popover"]').popover('hide');
    })
    $("button").hover(function () {
        $('[data-toggle="popover"]').popover('hide');
    })
    getLogs(1);
    setInterval(fetchUpdate, 2000);
});

$(document).on('click', function (e) {
    $('[data-toggle="popover"]').each(function () {
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(this).popover('hide');
        }
    });
});

var currPage = 1;
var pageCount = 0;
var logs;
var logcount = 9007199254740992;

function formatUA(ua) {
    if (ua) {
        var result = '';
        var parser = new UAParser(ua);
        var browser = parser.getBrowser();
        var os = parser.getOS();
        if (os['name']) {
            result += os['name'];
            if (os['version']) {
                result += '/';
                result += os['version'];
            }
        }
        if (browser['name']) {
            if (result !== '') {
                result += ' ';
            }
            result += browser['name'];
            if (browser['version']) {
                result += '/';
                result += browser['version'];
            }
        }
        if (result === '') {
            result = '未知浏览器';
        }
        return result;
    } else {
        return '未知浏览器';
    }
}

function formatCookie(cookies) {
    cookies = cookies.split(';');
    var keys = [];
    cookies.map(function (cookie) {
        var index = cookie.indexOf('=');
        keys = keys.concat(cookie.slice(0, index));
    })
    return keys;
}

function highlightJSON(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 4);
    }
    json = json.replace(/\n/g, '<br>');
    json = json.replace(/ /g, '&nbsp;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function getLogs(page) {
    $("#container")[0].className = 'container-fluid';
    $("#table")[0].classList.add("sm-font");
    $("#controller")[0].classList.remove("hidden");
    var t = $("#table")[0];
    t.innerHTML = "";
    var temp = '<thead><tr><th scope="col" class="text-center w-3rem">ID</th><th scope="col" class="text-center w-9rem">时间</th><th scope="col" class="text-center w-7rem">IP</th><th scope="col" class="text-center w-12rem">地区</th><th scope="col" class="text-center w-16rem">UA</th><th scope="col" class="text-center w-3rem">类型</th><th scope="col">数据</th></tr></thead><tbody>';
    $.get(
        '/admin/getlogs',
        {
            'page': page,
        },
        function (json) {
            var count = json['count'];
            if (count === 0) {
                pageCount = 1;
            } else {
                pageCount = Math.ceil(count / 35);
            }
            $("#currPage")[0].innerText = String(page);
            $("#pageCount")[0].innerText = String(pageCount);
            logs = json['logs'];
            logs.map(function (dict, index) {
                var template = '<tr data-container="body" data-toggle="popover" data-placement="bottom" logindex="{{index}}"><td class="text-center">{{id}}</td><td class="text-center">{{time}}</td><td class="text-center">{{ip}}</td><td class="text-center">{{region}}</td><td class="text-center">{{ua}}</td><td class="text-center">{{method}}</td><td class="align-middle">{{data}}</td></tr>';
                var data = {};
                if (Object.keys(dict['GET']).length) {
                    data['GET'] = Object.keys(dict['GET']);
                }
                if (Object.keys(dict['POST']).length) {
                    data['POST'] = Object.keys(dict['POST']);
                }
                if (dict['Header']['Cookie']) {
                    data['COOKIE'] = formatCookie(dict['Header']['Cookie']);
                }
                data = JSON.stringify(data);
                template = template.replace(/{{index}}/g, String(index));
                template = template.replace(/{{id}}/g, dict['ID']);
                template = template.replace(/{{time}}/g, dict['Time']);
                template = template.replace(/{{ip}}/g, dict['IP']);
                template = template.replace(/{{region}}/g, dict['Region']);
                template = template.replace(/{{ua}}/g, formatUA(dict['Header']['User-Agent']));
                template = template.replace(/{{method}}/g, dict['Method']);
                template = template.replace(/{{data}}/g, data);
                temp += template;
            });
            temp += '</tbody>';
            t.innerHTML = temp;

            $('tr[logindex]').popover({
                content: function () {
                    var index = parseInt($(this).attr('logindex'));
                    var data = highlightJSON(logs[index]);
                    return data;
                },
                html: true,
            });
        }
    );
}

function dellogs() {
    $.post(
        '/admin/dellogs',
        {
            'delete': 'delete',
        },
        function (json) {
            if (json['success']) {
                getLogs(1);
                toast('清空成功', 'info');
            } else {
                toast(json['error'], 'danger');
            }
        }
    )
}

function fetchUpdate() {
    $.get(
        '/admin/getlogscount',
        {},
        function (json) {
            var tmp = json['count'];
            if (tmp > logcount) {
                $('title').text('[新消息] 管理面板');
                $('#btnGetLogs')[0].classList.add('text-danger');
            }
            logcount = tmp;
        }
    )
}