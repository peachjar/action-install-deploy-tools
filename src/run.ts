import * as im from '@actions/exec/lib/interfaces'
import { MoveOptions } from '@actions/io'

export type MvFn = (source: string, dest: string, options?: MoveOptions) => Promise<void>
export type ExtractTarFn = (file: string, dest?: string, flags?: string) => Promise<string>
export type DownloadToolFn = (url: string, dest?: string) => Promise<string>
export type ExecFn = (commandLine: string, args?: string[], options?: im.ExecOptions) => Promise<number>

const Downloads = {
    kubectl: 'https://storage.googleapis.com/kubernetes-release/release/v1.13.2/bin/linux/amd64/kubectl',
    awsIamAuthenticator: 'https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/0.4.0-alpha.1/aws-iam-authenticator_0.4.0-alpha.1_linux_amd64',
    helm: 'https://storage.googleapis.com/kubernetes-helm/helm-v2.10.0-linux-amd64.tar.gz',
    argo: 'https://github.com/argoproj/argo/releases/download/v2.2.1/argo-linux-amd64',
}

export default async function run(
    exec: ExecFn,
    downloadTool: DownloadToolFn,
    extractTar: ExtractTarFn,
    mv: MvFn,
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

        core.debug('Downloading tools.')

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

        core.debug('Extracting Helm archive')

        await extractTar(helmPath)

        core.debug('Moving tools to /usr/local/bin')

        await Promise.all([
            mv(kubectlPath, '/usr/local/bin/kubectl'),
            mv('linux-amd64/helm', '/usr/local/bin/helm'),
            mv(awsIamAuthenticatorPath, '/usr/local/bin/aws-iam-authenticator'),
            mv(argoPath, '/usr/local/bin/argo'),
        ])

        core.debug('Making tools executable')

        await Promise.all([
            exec('chmod', ['+x',  '/usr/local/bin/kubectl']),
            exec('chmod', ['+x',  '/usr/local/bin/helm']),
            exec('chmod', ['+x',  '/usr/local/bin/aws-iam-authenticator']),
            exec('chmod', ['+x',  '/usr/local/bin/argo']),
        ])

        core.debug('Cloning deployment repos')

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
