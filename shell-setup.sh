
# Zsh shell
apt-get install zsh
sh -c "(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"  

## Plugins
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# Copy config files
code -d --wait ~/.gitconfig ./.gitconfig
code -d --wait ~/.profile ./.profile
code -d --wait ~/.zshrc ./zshrc

#Change default shell to zsh
chsh -s /bin/zsh
