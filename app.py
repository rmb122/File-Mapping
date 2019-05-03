from sys import path
from os.path import join


def try_fix_config():
    example = {}
    with open(join(path[0], 'file_mapping/config.example.py'), 'rb') as f:
        exec(f.read(), example)

    config = {}
    with open(join(path[0], 'file_mapping/config.py'), 'rb') as f:
        exec(f.read(), config)

    with open(join(path[0], 'file_mapping/config.py'), 'a') as f:
        for key in example:
            if key not in config:
                f.write(f"\n{key} = ")
                if type(example[key]) == str:
                    f.write(f"'{example[key]}'")
                else:
                    f.write(f"{example[key]}")


try_fix_config()

from file_mapping import app

if __name__ == "__main__":
    app.run()
