---
title: "SS Manager 折腾笔记"
date: 2018-10-04
tags: ["无价值", "折腾"]
---

因为我也拿着 RB 叔叔某一辆车的钥匙，而另一辆车上某些乘客又需要转移过来，因此我需要给他们都准备一下配置。

众所周知（？）`shadowsocks-libev` 是不资瓷 `port_passward` 这种配置方便但是管理不便的配置项的，所以仍然是在 RB 叔叔的提醒下，我了解到了 `shadowsocks-manager`。

虽然在写下这段话的时候，我才刚打开 `ss-manager` 的 GitHub 页面，但是我对于成功有着强烈的信心。

**本文未包含任何有深度的内容**

<!-- more -->

## 一言以蔽之

`ss-manager` 通过 `--manager-address` 选项监听端口 `port 1`，而 `ssmgr (type s)` 作为它的前台，会发送指令到 `port 1`，同时监听 `port 2`，`ssmgr (type m)` 就是最终的总管，（通过插件提供的各种方式）管理一系列 `ssmgr (type s)`。

## 正文

首先当然是读 Readme 安装了，因为突然发现这辆车没有 `node`，所以先去装了 `node`。

```bash
curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
sudo yum -y install nodejs
sudo npm i -g shadowsocks-manager --unsafe-perm
```

安装 `shadowsocks-libev` 的过程略。

接下来是写给 `ssmgr (type s)` 使用的配置文件，它会作为上述 `ss-manager` 的前台，方便起见，我选择直接改默认配置文件 `~/.ssmgr/default.yml`：

```yaml
# ~/.ssmgr/default.yml
type: s

shadowsocks:
  address: 127.0.0.1:端口1

manager:
  address: 0.0.0.0:端口2
  password: '密码'

db: 'db.sqlite'
```

接下来是管理器，项目的 Readme 里面列了四种管理方式，有兴趣自己去看，配置方式大同小异。仍然是出于方便考虑及个人兴趣，我选择了 `telegram`。

首先去找 [BotFather](https://telegram.me/BotFather) 新建了个机器人，获得 token，接下来写配置，新建配置于 `~/.ssmgr/telegram.yml`：

```yaml
# ~/.ssmgr/telegram.yml
type: m

manager:
  address: 127.0.0.1:端口2
  password: '密码'

plugins:
  telegram:
    use: true
    token: 'token'

db: 'telegram.sqlite'
```

然后写启动脚本，放在一个我开心就好的地方：

```bash
#!/bin/bash

setsid ss-manager -m 加密方式 -u --manager-address 127.0.0.1:端口1 &
setsid ssmgr &
setsid ssmgr -c ~/.ssmgr/telegram.yml &
```

试运行一下，没有问题，那就可以准备添加开机启动了，至于如何添加开机启动，那就请大家根据自己的情况，另请高明吧。
