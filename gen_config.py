from hashlib import sha256
from os import mkdir, urandom, getenv
from os.path import exists, join
from random import choices
from string import ascii_letters
from sys import argv, path


def hash(str, salt):
    return sha256((str + salt).encode()).hexdigest()


def generaterPass(password, salt):
    return hash(hash(password, salt), salt)


def generaterSalt():
    return "".join(choices(ascii_letters, k=16))


def gen_config(password, url_prefix=''):
    config = {}
    cwd = path[0]

    with open(join(cwd, 'file_mapping/config.example.py'), 'rb') as f:
        exec(f.read(), None, config)
    
    salt = generaterSalt()
    config['LOGIN_SALT'] = salt
    config['ADMIN_PASSWORD'] = generaterPass(password, salt)
    config['SECRET_KEY'] = urandom(16)
    config['URL_PREFIX'] = getenv('URL_PREFIX') or url_prefix
    config['UPLOAD_PATH'] = getenv('UPLOAD_PATH') or join(cwd, 'uploads')
    config['SQLALCHEMY_DATABASE_URI'] = getenv('SQLALCHEMY_DATABASE_URI') or config['SQLALCHEMY_DATABASE_URI']
    
    proxy = False

    if getenv('BEHIND_PROXY'):
        proxy = getenv('BEHIND_PROXY')
        if proxy.lower() == 'true' or proxy == '1':
            proxy = True
        else:
            proxy = False
    
    config['BEHIND_PROXY'] = proxy

    with open(join(path[0], 'file_mapping/config.py'), 'w') as f:
        for key in config:
            f.write(f"{key} = ")
            if type(config[key]) == str:
                f.write(f"'{config[key]}'")
            else:
                f.write(f"{config[key]}")
            f.write('\n')


if __name__ == '__main__':
    if len(argv) != 2 and len(argv) != 3:
        print(f'Usage: {argv[0]} password (url_prefix)')
    else:
        if len(argv) == 2:
            gen_config(argv[1])
        else:
            gen_config(argv[1], argv[2])
