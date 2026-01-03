const { Bonjour } = require('bonjour-service');

function startDiscovery(port) {
    const instance = new Bonjour();

    console.log('Starting mDNS advertisement...');

    // Broadcast service
    instance.publish({
        name: '0Xnet Media Server',
        type: 'http',
        port: port,
        txt: { app: '0xnet', version: '1.0.0' }
    });

    console.log(`Service advertised: _http._tcp.local on port ${port}`);

    // Cleanup on exit
    // process.on('SIGINT', () => {
    //     instance.unpublishAll(() => {
    //         console.log('mDNS services unpublished');
    //         process.exit(0);
    //     });
    // });
}

module.exports = { startDiscovery };
