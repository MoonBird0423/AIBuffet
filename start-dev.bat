@echo off
echo 启动开发环境...

echo 1. 启动Nginx...
cd nginx-1.24.0
start nginx.exe
cd ..

echo 2. 启动后端服务...
cd backend
start mvn spring-boot:run
cd ..

echo 3. 启动前端开发服务器...
cd frontend
start npm start
cd ..

echo 开发环境启动完成！
echo 请访问: http://lovesuyi.cn
pause 