# OPENSPEC:START
# OpenSpec shell completions configuration
fpath=("/Users/spidey/.oh-my-zsh/custom/completions" $fpath)
autoload -Uz compinit
compinit
# OPENSPEC:END

# Path to oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Initialize Homebrew
eval "$(/opt/homebrew/bin/brew shellenv)"
eval "$(mise activate)"

source ~/.profile
export VIRTUAL_ENV=$(pwd)/.venv

# Theme configuration
ZSH_THEME="robbyrussell"

# Enable command auto-correction
#ENABLE_CORRECTION="true"

# Plugins configuration
plugins=(
    fzf                     # Fuzzy finder integration
    z                       # Quick directory jumping
    zsh-autosuggestions     # Fish-like autosuggestions
    direnv                  # Directory-specific environment variables
)

# Environment variables
export PATH="/opt/homebrew/bin:$PATH"
export PATH="$PATH:/opt/homebrew/opt/postgresql@15/bin"
export PATH="$PATH:$HOME/.local/bin"
export PATH="$PATH:~/.local/share/mise/shims"
export PATH="$PATH:~/.local/share/mise/installs/node/24.7.0/bin/node"

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

# aliases
alias gst='git status'
alias gp='git pull'
alias gf='git fetch'
alias glog10='git log -10 --oneline'
alias gb='git branch'
alias gs='git stash -u'
alias gsp='git stash pop'
alias gc='git clone'
alias ggc='git gc'
alias gcm='git checkout main && git pull origin main'

export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools7
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# Added by Antigravity
export PATH="$HOME/.antigravity/antigravity/bin:$PATH"
export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"

export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"

# pnpm
export PNPM_HOME="$HOME/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end

# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

alias claude-mem='bun "$HOME/.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs"'
