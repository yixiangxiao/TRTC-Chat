## centos 9 安装ffmpeg
1.RPM Fusion 存储库依赖于EPEL 软件存储库，如果您的系统上未启用 EPEL，请使用以下命令：
```shell
sudo yum install epel-release
```
2.接下来，通过安装 rpm 包启用 RPM Fusion 存储库 ：
```shell
sudo dnf install https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm
sudo dnf install https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm
```
3.安装 ffmpeg：启用了这些仓库之后，你就可以使用 dnf 命令来安装 ffmpeg 了：
```
sudo dnf install ffmpeg
```
4.验证安装：安装完成后，你可以使用以下命令来验证 ffmpeg 是否已经成功安装：
```shell
ffmpeg -version
```
## centos 安装minio 
[地址](https://juejin.cn/post/7163902827603951653])
记得在云服务器防火墙放开对应端口 代码上用的端口为9000 如果你在安装minio时配置的不一样，记得去修改 egg代码config.default.js minio对应的端口，ip要填你的公网ip

## Centos7 安装coturn部署一套 STUN/TURN 服务 webRTC打洞服务器(Centos9也可使用)
[地址](https://blog.csdn.net/haeasringnar/article/details/94607464)