## Docker

1. 安装 docker

```sh
sudo apt install docker.io
sudo apt install docker-compose
```

2. clone

```sh
git clone https://github.com/rmb122/File-Mapping.git
```

3. 安装  

修改 docker-comose 里面的 environment 成想要的配置,  
`LOGIN_PASSWORD` 为登录密码, 其他可以不用修改.  

然后
```sh
sudo systemctl enable docker
sudo systemctl status docker
sudo docker-compose up
```
即可.


## 手工安装

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
python3 gen_config.py password (url_prefix)
```

这将自动生成大部分的配置文件, 其中 `UPLOAD_PATH` 和 `SQLALCHEMY_DATABASE_URI` 根据自己的实际情况配置,  
再次注意 `UPLOAD_PATH` 需要 `uwsgi` 的运行用户可写  

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