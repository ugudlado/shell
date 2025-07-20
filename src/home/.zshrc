# Path to oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

export NETLIFY_API_TOKEN="nfp_zLjVdcUBbGK8nW1dx1PYkBiufB42H82Nb06f"

source ~/.profile
export VIRTUAL_ENV=$(pwd)/.venv

# Theme configuration
ZSH_THEME="robbyrussell"

# Enable command auto-correction
ENABLE_CORRECTION="true"

# Plugins configuration
plugins=(
    fzf                     # Fuzzy finder integration
    z                       # Quick directory jumping
    zsh-autosuggestions     # Fish-like autosuggestions
    direnv                  # Directory-specific environment variables
    python                  # Python support and aliases
    pip                     # Pip completion and aliases
    docker                  # Docker commands and completion
    docker-compose          # Docker-compose support
    copypath               # Copy current directory path
    copyfile               # Copy file contents
    history                # Better history handling
    jsontools             # JSON tools and prettifier
    web-search            # Quick web searches from terminal
)

# Environment variables
export PATH="/opt/homebrew/bin:$PATH"
export PATH="$PATH:/opt/homebrew/opt/postgresql@15/bin"
export PATH="$PATH:$HOME/.local/bin"
export PATH="$PATH:~/.local/share/mise/shims"

# FZF configuration
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_DEFAULT_OPTS='--height 40% --layout=reverse --border'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"

# Python configuration (using uv)
export PYTHONPATH="${PYTHONPATH}:${HOME}/.local/lib/python3.11/site-packages"
export VIRTUAL_ENV_DISABLE_PROMPT=1

# Load oh-my-zsh
source $ZSH/oh-my-zsh.sh

# Initialize starship prompt (after oh-my-zsh)
eval "$(starship init zsh)"

# Custom aliases
alias py="python"
alias pym="python -m"
alias pyv="python -V"
alias pip="uv pip"
alias pipi="uv pip install"
alias pipun="uv pip uninstall"
alias pipup="uv pip install --upgrade"
alias pipl="uv pip list"
alias pipf="uv pip freeze"
alias venv="python -m venv"
alias activate="source ./venv/bin/activate"

# Directory aliases
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias ~="cd ~"
alias -- -="cd -"

# Productivity aliases
alias zshrc="code ~/.zshrc"     # Edit zshrc in VSCode
alias reload="source ~/.zshrc"   # Reload zsh configuration
alias c="clear"
alias h="history"
alias ports="lsof -i -P -n | grep LISTEN"  # Show listening ports
alias ip="curl -s https://ipinfo.io/ip"    # Show public IP
alias localip="ipconfig getifaddr en0"     # Show local IP

# direnv configuration
eval "$(direnv hook zsh)"

# mise configuration
eval "$(mise activate zsh)"

# Custom functions
# Create and enter directory
mkcd() {
    mkdir -p "$1" && cd "$1"
}

# ZSH history configuration
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_FIND_NO_DUPS
setopt INC_APPEND_HISTORY

# Load custom scripts if they exist
[[ -f ~/.zsh_functions ]] && source ~/.zsh_functions
[[ -f ~/.zsh_secrets ]] && source ~/.zsh_secrets
export TZ=UTC

# Task Master aliases added on 27/6/2025
alias tm='task-master'
alias taskmaster='task-master'
. "/Users/spidey/.deno/env"
