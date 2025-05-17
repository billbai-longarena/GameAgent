#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 打印标题
echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}   GameAgent 单元测试运行脚本     ${NC}"
echo -e "${BLUE}==================================${NC}"

# 检查操作系统类型并设置适当的命令
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  JEST_CMD="npx jest"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  JEST_CMD="npx jest"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  # Windows
  JEST_CMD="npx jest"
else
  # 其他操作系统
  echo -e "${YELLOW}未知操作系统，使用默认命令。${NC}"
  JEST_CMD="npx jest"
fi

# 运行所有单元测试
echo -e "\n${YELLOW}运行所有单元测试...${NC}\n"
$JEST_CMD

# 检查Jest测试结果
JEST_EXIT_CODE=$?
if [ $JEST_EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}✅ 所有单元测试通过！${NC}"
else
  echo -e "\n${RED}❌ 单元测试失败，请查看上面的错误信息。${NC}"
  echo -e "${YELLOW}尝试使用 'npm test -- --watch' 进行调试。${NC}"
fi

# 提示Cypress测试
echo -e "\n${BLUE}=== Cypress端到端测试 ===${NC}"
echo -e "${YELLOW}要运行Cypress测试，请使用以下命令：${NC}"
echo -e "  npx cypress open   ${GREEN}# 打开Cypress测试浏览器${NC}"
echo -e "  npx cypress run    ${GREEN}# 在命令行中运行所有Cypress测试${NC}"

echo -e "\n${BLUE}==================================${NC}"
echo -e "${BLUE}   测试运行结束                   ${NC}"
echo -e "${BLUE}==================================${NC}"

# 返回Jest的退出码
exit $JEST_EXIT_CODE