from functools import wraps
from hashlib import sha256
from json import dumps, loads
from os.path import basename

from flask import Flask, Response, escape, make_response

from file_mapping.config import LOGIN_SALT


def hash(str, salt=LOGIN_SALT):
    return sha256((str + salt).encode()).hexdigest()


def escape_dict(dict):
    tmp = {}
    for k in dict:
        tmp[escape(k)] = escape(dict[k])
    return tmp


def format_region(region):
    region = region['region'].decode()
    region = region.split('|')
    tmp = []
    for k in region:
        if k != '0':
            tmp.append(k)
        if k == '内网IP':
            return '局域网'
    return ''.join(tmp)


def format_logs(logs, ip2Region):
    result = []

    for log in logs:
        if log.ip != "":
            region = ""
            retry = 0
            while not region and retry < 6:
                try:
                    region = ip2Region.btreeSearch(log.ip)
                except Exception:
                    retry += 1
                    pass
            region = format_region(region)
        else:
            region = "不支持 IPv6 地址查询"

        result.append({
            'Method': escape(log.method),
            'IP': escape(log.ip),
            'Region': escape(region),
            'Time': log.time.strftime('%Y-%m-%d %H:%M:%S'),
            'Route': escape(log.route),
            'Header': escape_dict(loads(log.header)),
            'GET': escape_dict(loads(log.get)),
            'POST': escape_dict(loads(log.post)),
            'ID': log.id
        })

    return result


def safe(func):
    @wraps(func)
    def _safe(*args, **kwargs):
        response = func(*args, **kwargs)
        if type(response) != Response:
            response = make_response(response)
        response.headers['Content-Security-Policy'] = "default-src 'self';style-src 'self' 'unsafe-inline';worker-src 'self' blob:;img-src 'self' data:;object-src 'none';"
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    return _safe


def nocache(func):
    @wraps(func)
    def _nocache(*args, **kwargs):
        response = func(*args, **kwargs)
        if type(response) != Response:
            response = make_response(response)
        if 'ETag' in response.headers.keys():
            response.headers.pop('ETag')
            response.headers.pop('Expires')
            response.headers.pop('Last-Modified')
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    return _nocache


class NoServerHeaderFlask(Flask):
    def process_response(self, response):
        super(NoServerHeaderFlask, self).process_response(response)
        response.headers['X-Powered-By'] = 'PHP/7.3.2'
        response.headers['Server'] = 'Apache/2.4.38 (Unix) PHP/7.3.2'
        return response
