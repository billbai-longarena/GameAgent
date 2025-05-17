#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 打印标题
echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}   GameAgent 端到端测试运行脚本   ${NC}"
echo -e "${BLUE}==================================${NC}"

# 检查命令行参数
RUN_MODE="run"
if [ "$1" == "open" ]; then
  RUN_MODE="open"
fi

# 确保应用正在运行
echo -e "\n${YELLOW}确保GameAgent应用已经在另一个终端启动 (npm run dev)${NC}"
echo -e "${YELLOW}如果应用尚未启动，请在另一个终端窗口运行 'npm run dev'${NC}\n"

read -p "应用是否已启动? (y/n): " APP_RUNNING

if [ "$APP_RUNNING" != "y" ] && [ "$APP_RUNNING" != "Y" ]; then
  echo -e "${RED}请先启动应用，然后再运行此脚本。${NC}"
  exit 1
fi

# 设置测试环境变量
export CYPRESS_BASE_URL=http://localhost:3000

# 运行Cypress测试
if [ "$RUN_MODE" == "open" ]; then
  # 交互模式
  echo -e "\n${YELLOW}在Cypress测试浏览器中运行测试...${NC}\n"
  npx cypress open
else
  # 命令行模式
  echo -e "\n${YELLOW}在命令行中运行所有Cypress测试...${NC}\n"
  npx cypress run
  
  # 检查Cypress测试结果
  CYPRESS_EXIT_CODE=$?
  if [ $CYPRESS_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ 所有端到端测试通过！${NC}"
  else
    echo -e "\n${RED}❌ 端到端测试失败，请查看上面的错误信息。${NC}"
    echo -e "${YELLOW}尝试使用 './run_e2e_tests.sh open' 在浏览器中调试。${NC}"
  fi
fi

echo -e "\n${BLUE}==================================${NC}"
echo -e "${BLUE}   测试运行结束                   ${NC}"
echo -e "${BLUE}==================================${NC}"

# 在命令行模式下，返回Cypress的退出码
if [ "$RUN_MODE" == "run" ]; then
  exit $CYPRESS_EXIT_CODE
fi