#!/bin/bash

# 确保服务器正在运行
echo "确保GameAgent服务器正在运行..."
echo "如果服务器未运行，请在另一个终端窗口中运行 'cd gagent && npm run dev'"
echo ""

# 安装依赖（如果需要）
echo "检查依赖..."
if ! npm list socket.io-client --prefix gagent > /dev/null 2>&1; then
  echo "安装socket.io-client..."
  cd gagent && npm install socket.io-client --save-dev
  cd ..
fi

# 运行测试
echo "开始运行自动化游戏创建流程测试..."
node gagent/tests/e2e/game_creation_automation.test.js

# 检查测试结果
if [ $? -eq 0 ]; then
  echo "测试成功完成！"
  exit 0
else
  echo "测试失败。"
  exit 1
fi
