@echo off
rem 一键提交并推送（更新文章后双击运行；可带参数指定提交信息，如：commit-push.bat 修复错别字）
chcp 65001 >nul
cd /d "%~dp0"

set "MSG=%*"
if "%MSG%"=="" set "MSG=更新文章"

echo 正在提交...
git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo 没有需要提交的更改，已跳过推送。
  goto :end
)

echo 正在推送到 GitHub...
git push origin master
if errorlevel 1 (
  echo 推送失败，请检查网络或代理设置。
  goto :end
)

echo 完成：已提交并推送。
:end
pause
