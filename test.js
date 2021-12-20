const fs = require('fs')
const got = require('got')
const nodeRedNodes = require('./node-red-nodes.js')
got('https://registry.npmjs.org/node-red-node-geofence/-/node-red-node-geofence-0.3.1.tgz').buffer()
.then( buff => {

    fs.writeFileSync("test/node-red-node-geofence-0.3.1.tgz", buff)

    var defs = nodeRedNodes.examinTar("./test/node-red-node-geofence-0.3.1.tgz", "test")

    console.log("tgz from download")
    console.log(JSON.stringify(defs, ' ',2 ))

    fs.rmSync("./test/node-red-node-geofence-0.3.1.tgz")
})
.then( () => {
    var defs = nodeRedNodes.examinModule("./temp/test-node")
    console.log("\nLocal directory")
    console.log(JSON.stringify(defs,' ',2))
})

