ls -Ap | grep -v '/$' | grep '^\.'| command xargs -I % sh -c 'meld ~/% %'
