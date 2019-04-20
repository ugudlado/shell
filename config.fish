# ~/.config/fish/config.fish

source ~/.profile

set -x RAILS_ENV development
set ANDROID_HOME ~/android-sdk-linux
set PATH $PATH ~/android-sdk-linux/tools
set PATH $PATH ~/android-sdk-linux/platform-tools
set PATH $PATH /opt/gradle/gradle-4.7/bin

# aliases
alias gst 'git status'
alias gp 'git pull'
alias gf 'git fetch'
alias glog10 'git log -10 --oneline'
alias gb 'git branch'
alias gs 'git stash'
alias gsp 'git stash pop'
alias gsl 'git stash list'

alias gffs 'git flow feature start'
alias gfff 'git flow feature finish'
alias gffp 'git flow feature publish'
alias gfrs 'git flow release start'
alias gfrf 'git flow release finish'
alias gfrp 'git flow release publish'
alias gfhs 'git flow hotfix start'
alias gfhf 'git flow hotfix finish'
alias gfhp 'git flow hotfix publish'
alias gfbs 'git flow bugfix start'
alias gfbf 'git flow bugfix finish'
alias gfbp 'git flow bugfix publish'
