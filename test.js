const fs = require('fs')
const got = require('got')
const nodeRedNodes = require('./node-red-nodes.js')
got('https://registry.npmjs.org/node-red-node-geofence/-/node-red-node-geofence-0.3.1.tgz').buffer()
.then( buff => {

    fs.writeFileSync("temp/node-red-node-geofence-0.3.1.tgz", buff)

    var defs = nodeRedNodes.examinTar("./temp/node-red-node-geofence-0.3.1.tgz", "temp")

    console.log(JSON.stringify(defs, '  ',2 ))

    fs.rmSync("./temp/node-red-node-geofence-0.3.1.tgz")
})