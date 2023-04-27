# shell

These will be installed for setting dev environment:
* Visual source code : Editor
* Meld : Merge tool
* git : Source control
* git-cola : Git GUI (better one for ubuntu)
* Fish : shell
* Fisher : Fish shell plugin manager
* nvm : Node package manager
* rvm : Ruby package manager
* Heroku : Tools needed for deploying in Heroku


install.sh should install all needed packages for dev environment and opens merge tool to compare and copy configuration into existing files.

Run following commands:

```
git clone git@github.com:ugudlado/shell.git
./install.sh
```

For installing ruby or node, 
try :
```
rvm install 2.5.0
```
or
```
nvm install 8.9.3
```

Issues
* Couldn't verfiy because NO PUBKEY (https://github.com/Microsoft/vscode/issues/27970)
```
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'
```

References
* https://code.visualstudio.com/docs/setup/setup-overview
* http://fishshell.com/docs/current/index.html
* https://fisherman.github.io/
