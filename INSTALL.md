需要 uwsgi + python3 插件, python3 本体 (>= 3.6), nginx  
```sh
sudo apt install uwsgi uwsgi-plugin-python3 python3 python3-pip nginx-full
sudo python3 -m pip install -r requirements.txt
```

config:  
可以按照下面生成配置文件  
如果要更好性能, 可以把 sqlite 换成 mysql 服务器  
`UPLOAD_PATH` 填一个绝对路径, 最后不要带 `/` 分隔符, 而且注意需要运行用户可写  
`URL_PREFIX` 为后台管理的路由前缀, 需要注意以 `/` 开头, 不以 `/` 结尾, 例如 `/test`, 如果不需要此功能请留空.  

```sh
cp config.example.py config.py # 不要用 mv, example 将会作为配置的缺省值
```
```python
from file_mapping.utils import urandom, generaterSalt, generaterPass

password = 'modify this to your own password here'
salt = generaterSalt()
hash = generaterPass(password, salt)
print(f"SECRET_KEY = {urandom(16)}")
print(f"ADMIN_PASSWORD = '{hash}'")
print(f"LOGIN_SALT = '{salt}'")
```

uwsgi:  
```bash
uwsgi --ini app.ini --plugins=python3
```
nginx:  
```nginx
server {
        listen 80;
        listen [::]:80;

        server_name example.com;

        location / {
                include uwsgi_params;
                uwsgi_pass                      unix:/tmp/app.sock;
                uwsgi_param Host                $host;
                uwsgi_param X-Real-IP           $remote_addr;
                uwsgi_param X-Forwarded-For     $proxy_add_x_forwarded_for;
                uwsgi_param X-Forwarded-Proto   $http_x_forwarded_proto;
        }

        proxy_http_version              1.1;
        proxy_cache_bypass              $http_upgrade;
        proxy_set_header Upgrade        $http_upgrade;
        proxy_set_header Connection     "upgrade";
        proxy_set_header Host           $host;
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