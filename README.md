<p align="center">
  <a href="https://github.com/peachjar/action-install-deploy-tools/actions"><img alt="typescript-action status" src="https://github.com/peachjar/action-install-deploy-tools/workflows/build-test/badge.svg"></a>
</p>

# Github Action: Install Deploy Tools

Installs Peachjar's Deployment Toolset.  If you are not Peachjar, this is not for you.

## Usage

```
uses: peachjar/action-install-deploy-tools@v1
with:
    githubUser: ${{ secrets.GITHUB_DEPLOY_USER }}
    githubToken: ${{ secrets.GITHUB_DEPLOY_TOKEN }}
```
