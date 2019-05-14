FROM ubuntu:18.04
MAINTAINER rmb122 me@rmb122.cn

ENV DEBIAN_FRONTEND noninteractive
RUN sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
RUN apt update && \
    apt upgrade -y && \
    apt install uwsgi uwsgi-plugin-python3 python3 python3-pip nginx-full supervisor -y && \
    rm -rf /var/lib/apt/lists/*
RUN python3 -m pip install flask flask_login flask_wtf flask_sqlalchemy pymysql -i https://mirrors.ustc.edu.cn/pypi/web/simple

COPY default /etc/nginx/sites-enabled/default
COPY supervisord.conf /etc/supervisor/
COPY entrypoint.sh /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["sh", "entrypoint.sh"]