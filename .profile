# ~/.profile: executed by the command interpreter for login shells.
# This file is not read by bash(1), if ~/.bash_profile or ~/.bash_login
# exists.
# see /usr/share/doc/bash/examples/startup-files for examples.
# the files are located in the bash-doc package.

# the default umask is set in /etc/profile; for setting the umask
# for ssh logins, install and configure the libpam-umask package.
#umask 022

# if running bash
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
	. "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# aliases
alias gst='git status'
alias gp='git pull'
alias gf='git fetch'
alias glog10='git log -10 --oneline'
alias gb='git branch'
alias gs='git stash'
alias gsp='git stash pop'

alias gffs='git flow feature start'
alias gfff='git flow feature finish'
alias gffp='git flow feature publish'
alias gfrs='git flow release start'
alias gfrf='git flow release finish'
alias gfrp='git flow release publish'
alias gfhs='git flow hotfix start'
alias gfhf='git flow hotfix finish'
alias gfhp='git flow hotfix publish'
alias gfbs='git flow bugfix start'
alias gfbf='git flow bugfix finish'
alias gfbp='git flow bugfix publish'