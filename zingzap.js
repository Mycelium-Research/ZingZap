require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, "public/")));

const Pulse = require('./obj/pulse.js');
const Volt = require('./obj/volt.js');

// Maximum number of transactions a conductor can submit before they are re-assigned
const MAX_VOLTS_CONDUCTOR = process.env.MAX_TX_CONDUCTOR || 16384;

// Initialise ZingZap state for operation
let zingzap = new Pulse();
zingzap.addConductor(process.env.HOST || 'G3tKJ/DWlLXVWEoR/dQYRwsS+1OvjR1AWKzESbyg5AE=');

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/public/view/index.html'));
});

app.get('/logon', (req, res) => {
	if (req.query.address) {
		if (req.query.address.length !== 44) {
			console.log(`Conductor ${req.query.address} has failed to register as address is not of correct format.`);
			res.end();
		} else {
			console.log(`Conductor ${req.query.address} has been registered or logged in.\r\n`);

			// Creates account and sends relevant information to user
			res.send({
				statusMsg: zingzap.addConductor(decodeURIComponent(req.query.address)),
				numVolts: zingzap.accountInfo(req.query.address)[0],
				amount: zingzap.accountInfo(req.query.address)[1]
			});
		}
	} else {
		// Sends necessary information to user to allow them to create their own account
		res.send({
			numConductors: zingzap.numConductors,
			maxVolts: MAX_VOLTS_CONDUCTOR
		});
	}
});

app.get('/transaction', (req, res) => {
	console.log(`Conductor ${req.query.address} has proposed a transaction to ${req.query.to} of amount $${req.query.amount} USD.\r\n`);
	(new Volt(zingzap, decodeURIComponent(req.query.to), parseFloat(decodeURIComponent(req.query.amount)), decodeURIComponent(req.query.hashing), decodeURIComponent(req.query.address))).addVolt(zingzap);
	res.send({ 
		statusMsg: "Transaction has been sent."
	});
});

app.get('/history', (req, res) => {
	res.send({ 
		zingzap: {
			timestamp: zingzap.timestamp,
			battery: zingzap.battery,
			station: zingzap.station,
			prevHash: zingzap.prevHash,
			hash: zingzap.hash
		}
	});
});

app.listen(process.env.PORT || 8080, () => {
	console.log(`Running on port ${process.env.PORT || 8080}.\r\n`)
});
