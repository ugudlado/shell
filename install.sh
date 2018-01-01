#Installations

add-apt-repository ppa:git-core/ppa
apt update 
apt install git
sudo apt-get install git
sudo apt-get install git-cola
sudo apt-get install meld
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
curl -sSL https://get.rvm.io | bash
wget -qO- https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Visual source code
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt-get update
sudo apt-get install code # or code-insiders

# Fish shell
sudo apt-add-repository ppa:fish-shell/release-2
sudo apt-get install fish


## Fish shell plugins using Fisher
curl -Lo ~/.config/fish/functions/fisher.fish --create-dirs https://git.io/fisher

fisher oh-my-fish/theme-robbyrussell
fisher nvm
fisher rvm

chsh -s /usr/bin/fish

# Copy config files
meld ~/.gitconfig ./.gitconfig
meld ~/.profile ./.profile
meld ~/.config/fish/config.fish ./config.fish
