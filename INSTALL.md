需要 uwsgi + python3 插件, python3 本体, nginx  

config:  
可以按照下面生成配置文件  
如果要更好性能, 可以把 sqlite 换成 mysql 服务器  
UPLOAD_PATH 填一个绝对路径, 最后不要带 `/` 分隔符, 而且注意需要运行用户可写  

```sh
cp config.example.py config.py
```
```python
from file_mapping.utils import urandom, generaterSalt, generaterPass

password = 'modify this to your own password here'
salt = generaterSalt()
hash = generaterPass(password, salt)
print('SECRET_KEY =', urandom(16))
print('ADMIN_PASSWORD =', hash)
print('LOGIN_SALT =', salt)

```

uwsgi:  
```bash
uwsgi --ini app.ini --plugins=python3
```
nginx:  
```nginx
location / {
    include uwsgi_params;
    uwsgi_pass unix:/tmp/app.sock;
}
```

systemd-file:  
```
[Unit]
Description=uWSGI instance to serve myproject
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=你的保存路径
Environment="PATH=你的保存路径"
ExecStart=/usr/bin/uwsgi --ini app.ini --plugins=python3

[Install]
WantedBy=multi-user.target
```