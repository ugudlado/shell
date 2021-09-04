#Installations

# Zsh shell
add-apt-repository ppa:git-core/ppa
apt update 
apt-get install git
 
# Visual source code
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
apt-get update
apt-get install code # or code-insiders

apt-get install zsh fzf direnv asciinema meld

# install nvm for nodejs version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

../shell-setup.sh