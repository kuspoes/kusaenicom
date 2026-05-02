#!/usr/bin/env bash
#
# ini adalah script dari Netlify
set -e
# install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

# verify
deno --version

# run Lume build (pin the same version you use locally; adjust URL/version as needed)
deno run -A https://cdn.jsdelivr.net/gh/lumeland/lume@3.2.4/cli.ts build
