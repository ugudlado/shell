 ForEach ($ext in Get-Content ..\initial-vs-code-extensions.txt) { code --install-extension $ext }