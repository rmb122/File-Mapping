import UAParser from './ua-parser.js';
import toast from './toast.js';

$(document).ready(function () {
    var token = $('meta[name=csrf-token]').attr('content');
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", token)
            }
        }
    });

    $("#btnGetLogs").click(function () {
        $('title').text('管理面板');
        $('#btnGetLogs')[0].classList.remove('text-danger');
        filters['page'] = 1;
        getLogs(filters);
        currPage = 1;
    });
    $("#pagePre").click(function () {
        if (currPage - 1 != 0) {
            currPage -= 1;
            filters['page'] = currPage;
            getLogs(filters);
        }
    });
    $("#pageNext").click(function () {
        if (currPage + 1 <= pageCount) {
            currPage += 1;
            filters['page'] = currPage;
            getLogs(filters);
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
            filters['page'] = currPage;
            getLogs(filters);
        }
    });
    $("#btnDellogs").click(function () {
        if (confirm('确定清空记录么?')) {
            dellogs();
        }
    });
    $('#btnFilter').click(function () {
        $('#filter').modal('show');
    });
    $('#btnSubmitFilter').click(function () {
        var filtersID = { '#filterIP': 'ip', '#filterMethod': 'method', '#filterRoute': 'route', '#filterAfter': 'after', '#filterBefore': 'before' };
        var filtered = false;
        for (var key in filtersID) {
            var val = $(key).val().trim();
            $(key).val(val);
            if (val !== '') {
                filtered = true;
            }
            filters[filtersID[key]] = val;
        }
        currPage = 1;
        filters['page'] = 1;
        if (filtered) {
            $('#btnFilter')[0].classList.add('btn-danger');
        } else {
            $('#btnFilter')[0].classList.remove('btn-danger');
        }
        $('#filter').modal('hide');
        getLogs(filters);
    });
    $('#btnClearFilter').click(function () {
        var filtersID = {'#filterIP': 'ip', '#filterMethod': 'method', '#filterRoute': 'route', '#filterAfter': 'after', '#filterBefore': 'before'};
        for (var key in filtersID) {
            $(key).val('');
            filters[filtersID[key]] = '';
        }
        currPage = 1;
        filters['page'] = 1;
        $('#btnFilter')[0].classList.remove('btn-danger');
        $('#filter').modal('hide');
        getLogs(filters);
    });
    $("a").hover(function () {
        $('[data-toggle="popover"]').popover('hide');
    });
    $("button").hover(function () {
        $('[data-toggle="popover"]').popover('hide');
    });

    filters['page'] = 1;
    getLogs(filters);
    setInterval(fetchUpdate, 2000);
});

$(document).on('click', function (e) {
    $('[data-toggle="popover"]').each(function () {
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(this).popover('hide');
        }
    });
});

var filters = {};
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

function getLogs(filters) {
    $("#container")[0].className = 'container-fluid';
    $("#table")[0].classList.add("sm-font");
    $("#controller")[0].classList.remove("hidden");
    var t = $("#table")[0];
    t.innerHTML = "";
    var temp = '<thead><tr><th scope="col" class="text-center w-3rem">ID</th><th scope="col" class="text-center w-9rem">时间</th><th scope="col" class="text-center w-7rem">IP</th><th scope="col" class="text-center w-12rem">地区</th><th scope="col" class="text-center w-16rem">UA</th><th scope="col" class="text-center w-3rem">类型</th><th scope="col">数据</th></tr></thead><tbody>';
    $.post(
        'getlogs',
        filters,
        function (json) {
            var count = json['count'];
            if (count === 0) {
                pageCount = 1;
            } else {
                pageCount = Math.ceil(count / 35);
            }
            $("#currPage")[0].innerText = String(filters['page']);
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
        'dellogs',
        {
            'delete': 'delete',
        },
        function (json) {
            if (json['success']) {
                filters['page'] = 1;
                getLogs(filters);
                toast('清空成功', 'info');
            } else {
                toast(json['error'], 'danger');
            }
        }
    )
}

function fetchUpdate() {
    $.get(
        'getlogscount',
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