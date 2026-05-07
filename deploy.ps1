# ==========================================
#  deploy.ps1 - 博客一键同步脚本 (Windows)
# ==========================================

$ErrorActionPreference = "Stop"

Write-Host "`n--- Step 1: Saving changes ---" -ForegroundColor Cyan
git add .
git commit -m "Update blog: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "  OK: Changes committed locally." -ForegroundColor Green

Write-Host "`n--- Step 2: Pushing to GitHub ---" -ForegroundColor Cyan
git push origin main
Write-Host "  OK: Code pushed to GitHub." -ForegroundColor Green

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  DONE! Now run 'bash ~/blog/deploy.sh' "
Write-Host "  on your Taishan Pi to finish update. "
Write-Host "==========================================`n" -ForegroundColor Green
