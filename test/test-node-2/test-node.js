module.exports = function(RED) {
    function test(n) {
        RED.nodes.createNode(this,n);
    }

    RED.nodes.registerType("test-node-2", test,{
        credentials: {
            password: {type: "password"}
        }
    })
}