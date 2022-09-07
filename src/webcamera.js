var bodyParser = require('body-parser')

module.exports = function(RED) {

    function CameraNode (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var requestSize = '50mb';

        RED.httpAdmin.post('/node-red-teknoir-webcamera/:id', bodyParser.raw({ type: '*/*', limit: requestSize }), function(req,res) {
            var node = RED.nodes.getNode(req.params.id)
            var msg = {payload: req.body};
            if (req.query.topic) {
                msg['topic'] = req.query.topic
            }

            msg['node-red-teknoir-webcamera'] = true;

            if (node != null) {
                try {
                    node.receive(msg)
                    node.status({})
                    res.sendStatus(200)
                } catch(err) {
                    node.status({fill:'red', shape:'dot', text:'upload failed'});
                    res.sendStatus(500)
                    node.error(RED._("upload-camera.failed", { error: err.toString() }))
                }
            } else {
                res.status(404).send("no node found")
            }
        });

        function triggerSnapshotOnClient(topic) {
            let d = {
                id: node.id,
                topic: topic
            };

            try {
                RED.comms.publish("webcam-snapshot", d);
            } catch (e) {
                node.error("Error sending data", d);
            }
        }

        this.on('input', function (msg) {
            if (!msg['node-red-teknoir-webcamera']) {
                triggerSnapshotOnClient(msg.topic || config.topic);
            } else if(msg.payload !== '') {
                node.send(msg)
            }
        });
    }
    
    RED.nodes.registerType('webcamera', CameraNode)
};
