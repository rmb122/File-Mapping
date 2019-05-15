from hashlib import sha256
from os import mkdir, urandom
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
    if exists('/.dockerenv'):
        with open(join(cwd, 'file_mapping/config.docker.py'), 'rb') as f:
            exec(f.read(), None, config)
    else:
        with open(join(cwd, 'file_mapping/config.example.py'), 'rb') as f:
            exec(f.read(), None, config)

    if not exists(join(cwd, 'uploads')):
        mkdir(join(cwd, 'uploads'))
    
    salt = generaterSalt()
    config['LOGIN_SALT'] = salt
    config['ADMIN_PASSWORD'] = generaterPass(password, salt)
    config['SECRET_KEY'] = urandom(16)
    config['URL_PREFIX'] = url_prefix
    config['UPLOAD_PATH'] = join(cwd, 'uploads')

    with open(join(path[0], 'file_mapping/config.py'), 'w') as f:
        for key in config:
            f.write(f"\n{key} = ")
            if type(config[key]) == str:
                f.write(f"'{config[key]}'")
            else:
                f.write(f"{config[key]}")


if __name__ == '__main__':
    if len(argv) != 2 and len(argv) != 3:
        print(f'Usage: {argv[0]} password (url_prefix)')
    else:
        if len(argv) == 2:
            gen_config(argv[1])
        else:
            gen_config(argv[1], argv[2])
