#!/usr/bin/env fish
set command 'gemini'
set -a command $argv
echo "'$command'"
bwrap \
    --ro-bind /usr /usr \
    --ro-bind /etc /etc \
    --ro-bind ~/.local/bin ~/.local/bin \
    --bind ~/.gemini ~/.gemini  \
    --symlink usr/bin /bin \
    --symlink usr/sbin /sbin \
    --symlink usr/lib /lib \
    --symlink usr/lib64 /lib64 \
    --bind $PWD /project \
    --dev /dev \
    --proc /proc \
    --unshare-user --uid 1000 \
    --chdir /project \
    /usr/bin/env bash -c "source .envrc && $command"
