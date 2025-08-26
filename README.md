# broyale

Browser Battle Royale Online Game

## Installation

- Install [mkcert](https://github.com/FiloSottile/mkcert) to host
- Install [vscode](https://code.visualstudio.com/) and [Remote Development
  extension](https://vscode.dev/redirect?url=vscode://extension/ms-vscode-remote.vscode-remote-extensionpack)
- Install
  [docker-compatible](https://code.visualstudio.com/remote/advancedcontainers/docker-options)
  container runtime

### Windows 11 + WSL2(Ubuntu 24.04 LTS) Sample

```sh
$ gh repo clone yamayuski/broyale
$ cd broyale
$ mkcert.exe -cert-file packages/server-field/cert.pem -key-file packages/server-field/key.pem broyale.localhost "*.broyale.localhost"
```

And `Reopen in container`
