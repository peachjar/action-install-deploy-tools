import * as im from '@actions/exec/lib/interfaces'

export type ExtractTarFn = (file: string, dest?: string, flags?: string) => Promise<string>
export type DownloadToolFn = (url: string, dest?: string) => Promise<string>
export type ExecFn = (commandLine: string, args?: string[], options?: im.ExecOptions) => Promise<number>

const Downloads = {
    // Original URLs:
    // kubectl: 'https://storage.googleapis.com/kubernetes-release/release/v1.13.2/bin/linux/amd64/kubectl',
    // awsIamAuthenticator: 'https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/0.4.0-alpha.1/aws-iam-authenticator_0.4.0-alpha.1_linux_amd64',
    // helm: 'https://storage.googleapis.com/kubernetes-helm/helm-v2.10.0-linux-amd64.tar.gz',
    // argo: 'https://github.com/argoproj/argo-workflows/releases/download/v3.1.1/argo-linux-amd64.gz',

    // Peachjar mirrors:
    // https://peachjar-assets.s3.amazonaws.com/engineering-infra/
    kubectl: 'https://peachjar-assets.s3.amazonaws.com/engineering-infra/kubectl',
    awsIamAuthenticator: 'https://peachjar-assets.s3.amazonaws.com/engineering-infra/aws-iam-authenticator_0.4.0-alpha.1_linux_amd64',
    helm: 'https://peachjar-assets.s3.amazonaws.com/engineering-infra/helm-v3.14.4-linux-amd64.tar.gz',
    argo: 'https://peachjar-assets.s3.amazonaws.com/engineering-infra/argo-linux-amd64.gz',
}

export default async function run(
    exec: ExecFn,
    downloadTool: DownloadToolFn,
    extractTar: ExtractTarFn,
    core: {
        getInput: (key: string, opts?: { required: boolean }) => string,
        info: (...args: any[]) => void,
        debug: (...args: any[]) => void,
        setFailed: (message: string) => void,
        [k: string]: any,
    }
): Promise<any> {

    try {
        core.info('Installing deployment toolset.')

        const githubUsername = core.getInput('githubUsername') || ''
        const githubToken = core.getInput('githubToken') || ''

        if (!githubUsername || !githubToken) {
            return core.setFailed('Github username or token is invalid.')
        }

        core.info('Downloading tools.')

        const [
            kubectlPath,
            awsIamAuthenticatorPath,
            helmPath,
            argoPath,
        ] = await Promise.all([
            downloadTool(Downloads.kubectl),
            downloadTool(Downloads.awsIamAuthenticator),
            downloadTool(Downloads.helm),
            downloadTool(Downloads.argo),
        ])

        core.info('Extracting Helm archive')

        await exec('mkdir', ['-p', '/tmp/helm'])
        await extractTar(helmPath, '/tmp/helm')

        core.info('Extracting Argo archive')

        await exec('mkdir', ['-p', '/tmp/argo'])
        await exec('sudo', ['mv', argoPath, '/tmp/argo/argo-linux-amd64.gz']),
        await exec('gunzip', ['-d', '/tmp/argo/argo-linux-amd64.gz'])

        core.info('Moving tools to /usr/local/bin')

        await Promise.all([
            exec('sudo', ['mv', kubectlPath, '/usr/local/bin/kubectl']),
            exec('sudo', ['mv', '/tmp/helm/linux-amd64/helm', '/usr/local/bin/helm']),
            exec('sudo', ['mv', awsIamAuthenticatorPath, '/usr/local/bin/aws-iam-authenticator']),
            exec('sudo', ['mv', '/tmp/argo/argo-linux-amd64', '/usr/local/bin/argo']),
        ])

        core.info('Making tools executable')

        await Promise.all([
            exec('sudo', ['chmod', '+x',  '/usr/local/bin/kubectl']),
            exec('sudo', ['chmod', '+x',  '/usr/local/bin/helm']),
            exec('sudo', ['chmod', '+x',  '/usr/local/bin/aws-iam-authenticator']),
            exec('sudo', ['chmod', '+x',  '/usr/local/bin/argo']),
        ])

        core.info('Cloning deployment repos')

        await Promise.all([
            exec('git', [
                'clone', `https://${githubUsername}:${githubToken}@github.com/peachjar/kilauea.git`,
            ]),
            exec('git', [
                'clone', `https://${githubUsername}:${githubToken}@github.com/peachjar/peachjar-aloha.git`,
            ])
        ])

        core.info('Tools installed')

    } catch (error) {

        core.setFailed(error.message)
    }
}
