const { createHash } = require('crypto');

// Maximum number of milliseconds or transactions between new blocks
const MAX_TIME = 10000;
const MAX_TRANSACTIONS = 100;

// Count of possible hashmap indicies
const NUM_ASCII = 128;

module.exports = class Pulse {	
	constructor() {
		this.history = [];
		this.timestamp = (new Date()).getTime();
		this.battery = [];
		this.station = [];
		for (let i = 0; i < NUM_ASCII; i++) this.station[i] = [];
		this.prevHash = '';
		this.hash = createHash('sha256').update(`${this.timestamp}${this.battery}${this.station}${this.prevHash}`).digest('base64');
		this.numConductors = 0;
	}
	
	newPulse = () => {
		this.timestamp = (new Date()).getTime();
		this.battery = [];
		this.prevHash = this.hash;
		this.hash = createHash('sha256').update(`${this.timestamp}${this.battery}${this.station}${this.prevHash}`).digest('base64');
	}
	
	addVolt = volt => {
		if (volt.amount < 1 || volt.to.length !== 44 || volt.from.length !== 44) {
			return;
		}
		this.battery.push(volt);
		if (this.battery.length === MAX_TRANSACTIONS || (new Date).getTime() > (this.timestamp + MAX_TIME)) {
			let successCount = 0;
			for (let i = 0; i < this.battery.length; i++) {
				for (let j = 0; j < this.station[this.battery[i].from.charCodeAt(0)].length; j++) {
					if (this.station[this.battery[i].from.charCodeAt(0)][j].address === this.battery[i].from) {
						let hash = this.battery[i].hash;
						for (let k = this.battery[i].index; k > 0; k--) {
							hash = createHash('sha256').update(hash).digest('base64');
						}
						if (this.station[this.battery[i].from.charCodeAt(0)][j].usd >= this.battery[i].amount && hash === this.battery[i].from) {
							for (let k = 0; k < this.station[this.battery[i].to.charCodeAt(0)].length; k++) {
								if (this.station[this.battery[i].to.charCodeAt(0)][k].address === this.battery[i].to) {
									this.station[this.battery[i].from.charCodeAt(0)][j].usd -= this.battery[i].amount;
									this.station[this.battery[i].to.charCodeAt(0)][k].usd += this.battery[i].amount;
									this.battery[i].executed = true;
									successCount++;
									console.log(`Conductor ${this.battery[i].from} has made a volt to ${this.battery[i].to} of amount $${this.battery[i].amount} USD.\r\n`);
									break;
								}
							}
						}
						break;
					}
				}
			}
			this.hash = createHash('sha256').update(`${this.timestamp}${this.battery}${this.station}${this.prevHash}`).digest('base64');
			console.log(`Pulse ${this.hash} has been produced, with ${successCount} out of ${this.battery.length} volts successfully executing.\r\n`);
			this.history.push({
				timestamp: this.timestamp,
				battery: this.battery,
				prevHash: this.prevHash,
				hash: this.hash
			});
			if (this.history.length > 15) {
				this.history.shift();
			}
			this.newPulse();
		}
		this.hash = createHash('sha256').update(`${this.timestamp}${this.battery}${this.station}${this.prevHash}`).digest('base64');
	}
	
	accountInfo = address => {
		for (let j = 0; j < this.station[address.charCodeAt(0)].length; j++) {
			if (this.station[address.charCodeAt(0)][j].address === address) {
				return [this.station[address.charCodeAt(0)][j].numVolts, this.station[address.charCodeAt(0)][j].usd];
			}
		}
	}
	
	addConductor = address => {
		if (address.length !== 44) {
			return `Conductor has failed to register as address is not of correct format.\r\n\r\nAddress: ${address}`;
		}
		for (let i = 0; i < this.station[address.charCodeAt(0)].length; i++) {
			if (this.station[address.charCodeAt(0)][i].address === address) {
				return false;
			}
		}
		this.station[address.charCodeAt(0)].push({ 
			address: address, 
			usd: 300, 
			numVolts: 0 
		});
		this.numConductors++;
		return `Conductor has now been registered.\r\n\r\nAddress: ${address}`;
	}
}
