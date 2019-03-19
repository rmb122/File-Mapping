from functools import wraps
from hashlib import sha256
from json import dumps
from os import urandom
from os.path import basename
from random import choices
from string import ascii_letters

from flask import Flask, Response, escape, make_response

from file_mapping.config import LOGIN_SALT


def hash(str, salt=LOGIN_SALT):
    return sha256((str + salt).encode()).hexdigest()


def generaterPass(password, salt=LOGIN_SALT):
    return hash(hash(password, salt), salt)


def generaterSalt():
    return "".join(choices(ascii_letters, k=16))


def escapeDict(dict):
    tmp = {}
    for k in dict:
        tmp[escape(k)] = escape(dict[k])
    return tmp


def formatRegion(region):
    region = region['region'].decode()
    region = region.split('|')
    tmp = []
    for k in region:
        if k != '0':
            tmp.append(k)
        if k == '内网IP':
            return '局域网'
    return ''.join(tmp)


def safe(func):
    @wraps(func)
    def _safe(*args, **kwargs):
        response = func(*args, **kwargs)
        if type(response) != Response:
            response = make_response(response)
        response.headers['Content-Security-Policy'] = "default-src 'self';style-src 'self' cdn.bootcss.com;font-src cdn.bootcss.com;script-src 'self' cdn.bootcss.com;img-src 'self' data:;frame-src 'none';object-src 'none';"
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
