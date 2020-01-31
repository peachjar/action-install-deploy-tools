import * as core from '@actions/core'
import { downloadTool, extractTar } from '@actions/tool-cache'
import { exec } from '@actions/exec'

import run from './run'

run(exec, downloadTool, extractTar, core)
