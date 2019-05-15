from os.path import join
from sys import argv, path

from gen_config import generaterPass


def change_pass(password):
    config = {}
    with open(join(path[0], 'file_mapping/config.py'), 'rb') as f:
        exec(f.read(), None, config)

    salt = config['LOGIN_SALT']
    config['ADMIN_PASSWORD'] = generaterPass(password, salt)

    with open(join(path[0], 'file_mapping/config.py'), 'w') as f:
        for key in config:
            f.write(f"\n{key} = ")
            if type(config[key]) == str:
                f.write(f"'{config[key]}'")
            else:
                f.write(f"{config[key]}")


if __name__ == '__main__':
    if len(argv) != 2:
        print(f'Usage: {argv[0]} new_pass')
    else:
        change_pass(argv[1])