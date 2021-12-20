# node-red-module-parser

## Install

```shell
npm install node-red-module-parser
```

## Useage

```javascript
const nodeRedModule = require('node-red-module-parser')

let moduleInfo = nodeRedModule.examinModule('/path/to/module/dir')
let moduleInto = nodeRedModule.examinTar('/path/to/tar/file','/path/to/temp/dir/location')
```

Where the module dir is the directory that holds the `package.json` file for the node, or the tgz file is the output of `npm pack` or the packaged module downloaded from a npm repository.

`moduleInfo` is an augmented `package.json` with details of the node types, default values and icon information.s