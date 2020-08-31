#Installations

# Fish shell
add-apt-repository ppa:git-core/ppa
apt update 
apt-get install git

# Meld
apt-get install meld

# Visual source code
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
apt-get update
apt-get install code # or code-insiders

apt-get install fzf
apt-get install z
apt-get install silversearcher-ag
apt-get install tldr
apt-get install locate

# Rebuild search db with needed paths for faster search using locate
updatedb --localpaths="/home"

cat ./initial-vs-code-extensions.txt | xargs code --install-extension
