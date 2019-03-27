from json import dumps, loads
from os import listdir, remove, rename
from os.path import exists, getsize, isfile

from flask import (Flask, escape, flash, jsonify, redirect, render_template,
                   request, send_file, url_for)
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.utils import secure_filename

from file_mapping import app, csrf, db, ip2Region
from file_mapping.config import (ADMIN_PASSWORD, ALLOWED_METHODS, LOGIN_SALT,
                                 UPLOAD_PATH)
from file_mapping.forms import LoginForm
from file_mapping.models import Log, Rule, User
from file_mapping.utils import escapeDict, formatRegion, hash, nocache, safe


@app.route('/admin', methods=['GET', 'POST'])
@safe
def login():
    if current_user.is_authenticated:
        return redirect(url_for('panel'))

    form = LoginForm()
    if request.method == 'POST' and form.validate_on_submit():
        if hash(form.password.data) == ADMIN_PASSWORD:
            user = User(1)
            login_user(user)
            return redirect(url_for('panel'))
        else:
            flash('Password error')
    
    return render_template('login.html', title='Login', form=form, salt=LOGIN_SALT)


@app.route('/admin/panel')
@safe
@login_required
def panel():
    return render_template('panel.html', title='管理面板')


@app.route('/admin/logout')
@safe
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/admin/addrule', methods=['POST'])
@safe
@login_required
def addrule():
    route = request.form.get('route', None, str)
    filename = secure_filename(request.form.get('filename', '', str))
    record = request.form.get('record', 'false', str)
    memo = request.form.get('memo', ' ', str)
    response = {}
    if route and filename:
        rule = Rule.query.filter_by(route=route).first()
        if rule is None:
            if record == 'true':
                record = True
            else:
                record = False
            rule = Rule(route=route, filename=filename, record=record, memo=memo)
            if exists(f'{UPLOAD_PATH}/{filename}'):
                db.session.add(rule)
                db.session.commit()
                response = {'success': True, 'error': ''}
            else:
                response = {'success': False, 'error': '文件不存在'}
        else:
            response = {'success': False, 'error': '规则已存在'}
    else:
        response = {'success': False, 'error': '无效参数'}
    return jsonify(response)


@app.route('/admin/delrule', methods=['POST'])
@safe
@login_required
def delrule():
    id = request.form.get('id', None, int)
    if id:
        rule = Rule.query.filter_by(id=id).first()
        if rule: 
            db.session.delete(rule)
            db.session.commit()
            response = {'success': True, 'error': ''}
        else:
            response = {'success': False, 'error': '规则不存在'}
    else:
        response = {'success': False, 'error': '无效参数'}
    return jsonify(response) 


@app.route('/admin/modifyrule', methods=['POST'])
@safe
@login_required
def modifyrule():
    id = request.form.get('id', None, int)
    route = request.form.get('route', None, str)
    filename = secure_filename(request.form.get('filename', '', str))
    record = request.form.get('record', 'false', str)
    memo = request.form.get('memo', ' ', str)
    if id and route and filename:
        if exists(f'{UPLOAD_PATH}/{filename}'):
            rule = Rule.query.filter_by(id=id).first()
            if rule:
                if record == 'true':
                    record = True
                else:
                    record = False
                rule.filename = filename
                rule.route = route
                rule.record = record 
                rule.memo = memo
                db.session.commit()
                response = {'success': True, 'error': ''}
            else:
                response = {'success': False, 'error': '规则不存在'}
        else:
            response = {'success': False, 'error': '文件不存在'}
    else:
        response = {'success': False, 'error': '无效参数'}
    return jsonify(response) 


@app.route('/admin/getrules')
@safe
@login_required
def getrules():
    ruls = Rule.query.all()
    tmp = {}
    for rule in ruls:
        tmp[rule.id] = {'route': escape(rule.route), 'filename': escape(rule.filename), 'record': rule.record, 'memo': escape(rule.memo)}
    return jsonify(tmp)


@app.route('/admin/addfile', methods=['POST'])
@safe
@login_required
def addfile():
    file = request.files.get('file', None)
    if file:
        filename = secure_filename(file.filename)
        if filename:
            uploadPath = f'{UPLOAD_PATH}/{filename}'
            if not exists(uploadPath):
                file.save(uploadPath)
                response = {'success': True, 'error': ''}
            else:
                response = {'success': False, 'error': '同名文件已存在'}
        else:
            response = {'success': False, 'error': '无效参数'}
    else:
        response = {'success': False, 'error': '无效参数'}
    return jsonify(response)


@app.route('/admin/delfile', methods=['POST'])
@safe
@login_required
def delfile():
    filename = secure_filename(request.form.get('filename', '', str))
    if filename:
        path = f'{UPLOAD_PATH}/{filename}'
        if exists(path):
            remove(path)
            response = {'success': True, 'error': ''}
        else:
            response = {'success': False, 'error': '文件不存在'}
    else:
        response = {'success': False, 'error': '无效参数'}
    return jsonify(response)


@app.route('/admin/getfile', methods=['POST'])
@safe
@login_required
def getfile():
    filename = secure_filename(request.form.get('filename', '', str))
    preview = request.form.get('preview', 'false', str)
    path = f'{UPLOAD_PATH}/{filename}'
    if preview == 'true':
        if filename:
            if exists(path) and getsize(path) < 20480 and isfile(path):
                try:
                    f = open(path, 'rb')
                    c = f.read().decode()
                    response = {'success': True, 'error': '', 'content': c}
                    f.close()
                    response = jsonify(response)
                except Exception:
                    response = {'success': False, 'error': '文件不是纯文本文件, 无法预览'}
                    response = jsonify(response)
            else:
                response = {'success': False, 'error': '文件过大或者是文件夹, 无法预览'}
                response = jsonify(response)
        else:
            response = {'success': False, 'error': '无效参数'}
            response = jsonify(response)
    else:
        if exists(path) and isfile(path) and filename:
            response = send_file(path, as_attachment=True, attachment_filename=filename)
        else:
            response = ('', 404)
    return response


@app.route('/admin/modifyfile', methods=['POST'])
@safe
@login_required
def modifyfile():
    filename = secure_filename(request.form.get('filename', '', str))
    usedname = secure_filename(request.form.get('usedname', '', str))
    content = request.form.get('content', False, str)

    if filename:
        path = f'{UPLOAD_PATH}/{filename}'
        usedPath = f'{UPLOAD_PATH}/{usedname}'
        if content or content == '':
            if usedname and exists(usedPath):
                remove(usedPath)
            f = open(path, 'w')
            f.write(content)
            f.close()
            response = {'success': True, 'error': '保存成功'}
        else:
            rename(usedPath, path)
            response = {'success': True, 'error': '保存成功'}
    else:
        response = {'success': False, 'error': '无效参数'}
    return jsonify(response)


@app.route('/admin/getfilelist')
@safe
@login_required
def getfilelist():
    response = []
    filelist = listdir(UPLOAD_PATH)
    for filename in filelist:
        size = getsize(f'{UPLOAD_PATH}/{filename}')
        response.append({'filename': escape(filename), 'size': size})
    return jsonify(response)


@app.route('/admin/getlogs')
@safe
@login_required
def getlogs():
    page = request.args.get('page', 1, int)
    if page < 1:
        page = 1
    response = {}
    logs = Log.query.order_by(db.text('-id')).offset((page - 1) * 35).limit(35).all()
    count, = db.session.query(db.func.count(Log.id)).one()
    response['count'] = count
    response['logs'] = []
    
    for log in logs:
        region = False
        while not region:
            try:
                region = ip2Region.btreeSearch(log.ip)
            except Exception:
                pass
        region = formatRegion(region)
        response['logs'].append({
            'Method': escape(log.method),
            'IP': escape(log.ip),
            'Region': escape(region),
            'Time': log.time.strftime('%Y-%m-%d %H:%M:%S'),
            'Route': escape(log.route),
            'Header': escapeDict(loads(log.header)),
            'GET': escapeDict(loads(log.get)),
            'POST': escapeDict(loads(log.post)),
            'ID': log.id
        })
    return jsonify(response)


@app.route('/admin/getlogscount')
@safe
@login_required
def getlogscount():
    count, = db.session.query(db.func.count(Log.id)).one()
    response = {
        "count": count,
    }
    return jsonify(response)


@app.route('/admin/dellogs', methods=['POST'])
@safe
@login_required
def dellogs():
    delete = request.form.get('delete', None, str)
    if delete:
        Log.query.delete()
        db.session.commit()
        response = {'success': True, 'error': '清空成功'}
    else:
        response = {'success': False, 'error': '无效参数'}
    return jsonify(response)


@csrf.exempt
@app.route('/', methods=ALLOWED_METHODS)
@app.route('/<path:path>', methods=ALLOWED_METHODS)
@nocache
def mapping(path=''):
    path = request.path
    rule = Rule.query.filter_by(route=path).first()
    if rule:
        if rule.record:
            method = request.method
            header = dumps(dict(request.headers))
            get = dumps(dict(request.args))

            type = request.headers.get('Content-Type', '').lower()
            if type == 'application/x-www-form-urlencoded':
                post = dumps(dict(request.form))
            elif type == 'application/json':
                try:
                    post = dumps(request.get_json())
                except Exception:
                    post = '{}'
            else:
                data = request.get_data()
                try:
                    if len(data) > 0:
                        post = dumps({'RAW_DATA': data.decode('utf-8')})
                    else:
                        post = '{}'
                except Exception:
                    post = '{}'
            
            ip = request.remote_addr
            log = Log(route=path, header=header, get=get, post=post, ip=ip, method=method)
            db.session.add(log)
            db.session.commit()

        filename = secure_filename(rule.filename)
        filepath = f'{UPLOAD_PATH}/{filename}'
        if filename and exists(filepath):
            response = send_file(filepath)
        else:
            response = ('', 404)
    else:
        response = ('', 404)
    return response