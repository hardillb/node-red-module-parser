const fs = require('fs')
const tar = require('tar')
const walk = require('acorn-walk')
const path = require('path')
const acorn = require('acorn')

function getNodeDefinitions(htmlFile) {
    // var regExp = /<script\s+?type=['"]text\/javascript['"]\s*?>([\S\s]*?)<\/script>/ig;
    var regExp = /<script\s?(?:type=['"]text\/javascript['"])?\s?>([\S\s]*?)<\/script>/ig;

    var content = fs.readFileSync(htmlFile,'utf8');
    var parts = []
    var match

    var defs = {}
    var count = 0
    var errors = []

    while ((match = regExp.exec(content)) != null) {
        let block = match[1]
        parts.push(block)
    }

    parts.forEach(p => {
        try {
            var a = acorn.parse(p,{ecmaVersion: 'latest'})
            walk.simple(a, {
                CallExpression(node) {
                    if (node.callee.property && node.callee.property.name == "registerType"){
                        var nodeTypeNode = node.arguments[0];
                        var nodeDefNode = node.arguments[1];
                        if (nodeTypeNode.type == 'Literal') {
                            let defType = nodeTypeNode.value
                            if (nodeDefNode.type === 'ObjectExpression') {
                                defs[defType] = {}
                                count++
                                nodeDefNode.properties.forEach(function(nodeDef) {
                                    if (nodeDef.key.name === 'defaults') {
                                        if (!nodeDef.value.properties) {
                                            errors.push({ code:"defaults-not-inline" });
                                        } else {
                                            defs[defType].defaults = {};
                                            nodeDef.value.properties.forEach(function(n) {
                                                defs[defType].defaults[n.key.name] = {};
                                                if (n.value.properties) {
                                                    n.value.properties.forEach(v => {
                                                        if (v.key.name === "value") {
                                                            if (v.value.type === "Literal"){
                                                                defs[defType].defaults[n.key.name].value = v.value.value
                                                            } else if (v.value.type === "ArrayExpression") {
                                                                defs[defType].defaults[n.key.name].value = v.value.elements
                                                            } else if (v.value.type === "ObjectExpression") {
                                                                //TODO How deep do we walk?
                                                            }
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    } else if (nodeDef.key.name === 'credentials') {
                                        if (!nodeDef.value.properties) {
                                            errors.push({ code:"credentials-not-inline" });
                                        } else {
                                            defs[defType].credentials = nodeDef.value.properties.map(function(n) { return n.key.name; });
                                        }
                                    } else if (nodeDef.key.name === 'icon') {
                                        if (nodeDef.value.type === 'Literal') {
                                            defs[defType].icon = nodeDef.value.value;
                                        } else {
                                            errors.push({ code:"icon-not-inline" });
                                        }
                                    } else if (nodeDef.key.name === 'color') {
                                        if (nodeDef.value.type === 'Literal') {
                                            defs[defType].color = nodeDef.value.value;
                                        } else {
                                            errors.push({ code:"color-not-inline" });
                                        }
                                    } else if (nodeDef.key.name === 'inputs') {
                                        if (nodeDef.value.type === 'Literal') {
                                            defs[defType].inputs = nodeDef.value.value;
                                        } else {
                                            errors.push({ code:"inputs-not-inline" });
                                        }
                                    } else if (nodeDef.key.name === 'outputs') {
                                        if (nodeDef.value.type === 'Literal') {
                                            defs[defType].outputs = nodeDef.value.value;
                                        } else {
                                            errors.push({ code:"outputs-not-inline" });
                                        }
                                    } else if (nodeDef.key.name === 'category') {
                                        if (nodeDef.value.type === 'Literal') {
                                            defs[defType].category = nodeDef.value.value;
                                        } else {
                                            errors.push({ code:"category-not-inline" });
                                        }
                                    }
                                });
                            } else {
                                errors.push({
                                    code: "non-objectexpression",
                                    message:util.inspect(nodeDefNode)
                                })
                            }
                        } else {
                            errors.push({
                                code:"non-literal",
                                message:util.inspect(nodeTypeNode)
                            })
                        }
                    }
                }
            })
        } catch (ex) {
            console.log(p)
            errors.push({
                code:"parse",
                message: "at:"+err.pos+" "+p.substr(Math.max(0,err.pos-10),20)
            });
            throw ex;
        }
    })

    if (count === 0) {
        if (errors.length > 0) {
            throw new Error("Syntax errors parsing <script>:\n   "+errors.map(function(err) { return err.message; }).join("\n   "));
        }
        throw new Error("No type definitions found");
    }

    if (errors.length > 0) {
        defs.__errors__ = errors;
    }

    return defs
}

function examinModule(modulePath) {
    var definitions = {}
    var package = fs.readFileSync(path.join(modulePath, "package.json"))
    try {
        package =JSON.parse(package)
    } catch (err) {
        return null
    }

    package.types = []

    if (package && package["node-red"]) {
        var nodes = package["node-red"].nodes
        package["node-red"].nodes = {}
        if (nodes) {
            Object.keys(nodes).forEach(n => {
                const node = nodes[n]
                const html = node.replace(/\.js$/, ".html")
                var defs = getNodeDefinitions(path.join(modulePath, html))
                package.types = package.types.concat(Object.keys(defs))
    
                package["node-red"].nodes[n] = {
                    file: nodes[n],
                    types: defs
                }
            })
        }
    }

    return package
}

function examinTar(tarPath, directory) {
    let dirName = path.basename(tarPath, ".tgz")
    let nodeDirectory = path.join(directory, dirName)
    fs.mkdirSync(nodeDirectory,{recursive: true})

    tar.x({
        file: tarPath,
        cwd: nodeDirectory,
        sync: true
    })

    var defs = examinModule(path.join(nodeDirectory, "package"))
    fs.rmSync(nodeDirectory, {recursive: true})

    return defs
}

module.exports = {
    examinTar: examinTar,
    examinModule: examinModule,
    //getNodeDefinitions: getNodeDefinitions
}
