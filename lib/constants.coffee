path = require 'path'

packagePath = path.dirname(__dirname)

module.exports = {
  linter_paths: {
    pylama: path.join packagePath, 'bin', 'pylama.py'
  }

  regex:
    '(?<file_>.+):' +
    '(?<line>\\d+):' +
    '(?<col>\\d+):' +
    '\\s+' +
    '(((?<type>[ECDFINRW])(?<file>\\d+)(:\\s+|\\s+))|(.*?))' +
    '(?<message>.+)'
}
