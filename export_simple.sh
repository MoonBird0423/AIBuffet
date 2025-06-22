#!/bin/bash

# 简单的数据导出脚本
# 只导出 prompt_templates 和 models 表

echo "开始导出关键表数据..."

# 导出 prompt_templates 表
echo "导出 prompt_templates 表..."
mysqldump -hlocalhost -P3305 -uroot -pPeng@0423 --single-transaction aibuffet prompt_templates > prompt_templates.sql

# 导出 models 表
echo "导出 models 表..."
mysqldump -hlocalhost -P3305 -uroot -pPeng@0423 --single-transaction aibuffet models > models.sql

# 合并为一个文件
echo "合并导出文件..."
cat prompt_templates.sql models.sql > critical_tables.sql

echo "导出完成！"
echo "文件："
echo "- critical_tables.sql (合并文件)"
echo "- prompt_templates.sql (单独文件)"
echo "- models.sql (单独文件)"
