const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const roots = ['services', 'scripts', 'frontend/src']
const files = []

function collect(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) collect(fullPath)
    if (entry.isFile() && fullPath.endsWith('.js')) files.push(fullPath)
  }
}

roots.forEach(collect)

for (const file of files) {
  const result = childProcess.spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}

console.log(`JavaScript syntax check passed for ${files.length} files`)
