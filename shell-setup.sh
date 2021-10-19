
# Zsh shell setup

#Change default shell to zsh
chsh -s /bin/zsh

# install zsh plugins
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

## Plugins
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

curl -s https://raw.githubusercontent.com/rupa/z/master/z.sh > ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/z.sh

# create needed dot files
touch ~/.gitconfig
touch ~/.profile
touch ~/.zshrc

# Copy config files
code -d --wait ~/.gitconfig ./.gitconfig
code -d --wait ~/.profile ./.profile
code -d --wait ~/.zshrc ./.zshrc


# install VS code extensions
cat ./initial-vs-code-extensions.txt | xargs code --install-extension

echo 'Setup complete'