from json import dumps
from os.path import exists

from flask import Blueprint, request, send_file
from werkzeug.utils import secure_filename

from file_mapping import app, csrf, db
from file_mapping.config import ALLOWED_METHODS, UPLOAD_PATH, BEHIND_PROXY
from file_mapping.models import Log, Rule
from file_mapping.utils import nocache

index = Blueprint('index', __name__, static_folder=None)

@csrf.exempt
@index.route('/', methods=ALLOWED_METHODS)
@index.route('/<path:path>', methods=ALLOWED_METHODS)
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
            else:
                data = request.get_data()
                try:
                    if len(data) > 0:
                        post = dumps({'RAW_DATA': data.decode('utf-8')})
                    else:
                        post = '{}'
                except Exception:
                    post = '{}'
            
            if BEHIND_PROXY:
                ip = request.headers.get('X-Real-IP', '').split(',')[0]
            else:
                ip = request.remote_addr
            if ip.find(":", 0, 5) != -1:  # 判断是不是 ipv6
                ip = ""
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

app.register_blueprint(index)
