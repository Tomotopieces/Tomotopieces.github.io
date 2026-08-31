@echo off
rem 新建一篇笔记（docs/posts/YYYY-MM-DD_NN.md），双击运行即可
cd /d "%~dp0"
node scripts/new-post.mjs
pause
