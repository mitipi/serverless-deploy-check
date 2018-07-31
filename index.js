const exec = require('child_process').exec

/**
 * Plugin to prevent us from deploying the wrong Git branch to the wrong environment
 */
class CheckGitBranchBeforeDeploy {
  constructor (serverless, options) {
    this.commands = {
      deploy: {
        lifecycleEvents: [
          'resources',
        ]
      }
    }

    this.hooks = {
      'before:deploy:resources': () => checkGitBranch(serverless),
    }
  }
}

const checkGitBranch = serverless => {
  const stage = serverless.service.provider.stage
  const requiredBranch = serverless.service.custom.checkGitBranchBeforeDeploy[stage]

  if (!requiredBranch) {
    serverless.cli.log(`[CheckGitBranchBeforeDeploy] No branch requirement for stage "${stage}"`)
    return
  }

  serverless.cli.log(`[CheckGitBranchBeforeDeploy] Checking branch requirement "${requiredBranch}" for stage "${stage}"`)

  return promiseExec('git rev-parse --abbrev-ref HEAD').then(({stdout}) => {
    const currentBranch = stdout.split('\n')[0]

    if (currentBranch !== requiredBranch) {
      throw `[CheckGitBranchBeforeDeploy]\n\n
      Current branch "${currentBranch}" and required branch "${requiredBranch}" mismatch.\n
      Do a "git fetch --all && git checkout ${requiredBranch}" before deploy :)`
    }
  })
}

const promiseExec = cmd => (
  new Promise((resolve, reject) => (
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve({stdout, stderr})
      }
    })
  ))
)

module.exports = CheckGitBranchBeforeDeploy
