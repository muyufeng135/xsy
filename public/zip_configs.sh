#!/bin/bash

for line in `cat  ./zipfiles_configs.txt`
do
 filesName="${filesName} ${line}"
 done
 echo 即将压缩的问文件：$filesName
 zip -r $1.zip $filesName
 echo 压缩完成