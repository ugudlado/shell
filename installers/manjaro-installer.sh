#Installations
# References: 
# https://github.com/Jguer/yay

pacman -S --needed git base-devel
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si

sudo yay -Syu zsh code fzf direnv asciinema meld

../shell-setup.sh