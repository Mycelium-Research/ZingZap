let address = '';
let password = '';
let usd = 0;
let numVolts = 0;

const windowAlert = (msg, error = false) => {
	if (error) {
		document.getElementById("alertHeader").style.backgroundColor = '#f12929';
	}
	document.getElementById("alertMsg").textContent = msg;
	document.getElementById("modal").style.display = 'block';
}

window.onclick = event => {
	if (event.target == document.getElementById("modal") || event.target == document.getElementById("infoModal") || event.target == document.getElementById("historyModal")) {
		document.getElementById("modal").style.display = "none";
		document.getElementById("infoModal").style.display = "none";
		document.getElementById("historyModal").style.display = "none";
	}
}

document.getElementById("closeModal").addEventListener("click", () => {
	document.getElementById("modal").style.display = "none";
});

document.getElementById("closeInfoModal").addEventListener("click", () => {
	document.getElementById("infoModal").style.display = "none";
});

document.getElementById("closeHistoryModal").addEventListener("click", () => {
	document.getElementById("historyModal").style.display = "none";
});

// TODO: add 'info' button for copying address and password, and 'history' button for checking the history of the last 16 blocks.

document.getElementById("infoBtn").addEventListener("click", () => {
	getNumVolts();
	document.getElementById("infoModal").style.display = 'block';
	document.getElementById("amountText").textContent = `Balance: $${usd} USD`;
});

document.getElementById("copyAddress").addEventListener("click", () => {
	navigator.clipboard.writeText(address);
	document.getElementById("copyAddress").textContent = 'Copied';
	setTimeout(() => {
		document.getElementById("copyAddress").textContent = 'Copy';
	}, 1500);
});

document.getElementById("copyPassword").addEventListener("click", () => {
	navigator.clipboard.writeText(password);
	document.getElementById("copyPassword").textContent = 'Copied';
	setTimeout(() => {
		document.getElementById("copyPassword").textContent = 'Copy';
	}, 1500);
});

document.getElementById("historyBtn").addEventListener("click", () => {
	fetch(`${window.location.href}zingzap`)
		.then(result => result.json())
		.then(result => {
			let table = document.createElement("table");
			table.style.border = '2px solid black';
			table.style.borderCollapse = 'collapse';
			for (let i = 0; i < 4 + result.zingzap.battery.length; i++) {
				table.appendChild(document.createElement("tr"));
				table.getElementsByTagName("tr")[i].style.border = '2px solid black';
			}
			table.getElementsByTagName("tr")[0].textContent = `Timestamp: ${result.zingzap.timestamp}`;
			table.getElementsByTagName("tr")[1].textContent = `Prev Hash: ${result.zingzap.prevHash}`;
			table.getElementsByTagName("tr")[2].textContent = `Hash: ${result.zingzap.hash}`;
			table.getElementsByTagName("tr")[3].textContent = `Battery: `;
			for (let i = 0; i < result.zingzap.battery.length; i++) {
				for (let j = 0; j < 5; j++) {
					table.getElementsByTagName("tr")[4 + i].appendChild(document.createElement("td"));
				}
				table.getElementsByTagName("tr")[4 + i].getElementsByTagName("td")[0].textContent = `Index: ${result.zingzap.battery[i].index}`;
				table.getElementsByTagName("tr")[4 + i].getElementsByTagName("td")[1].textContent = `From: ${result.zingzap.battery[i].from}`;
				table.getElementsByTagName("tr")[4 + i].getElementsByTagName("td")[2].textContent = `Hash: ${result.zingzap.battery[i].hash}`;
				table.getElementsByTagName("tr")[4 + i].getElementsByTagName("td")[3].textContent = `Amount: ${result.zingzap.battery[i].amount}`;
				table.getElementsByTagName("tr")[4 + i].getElementsByTagName("td")[4].textContent = `Executed: ${result.zingzap.battery[i].executed}`;
			}
			document.getElementById("historyModal").style.display = 'block';
			document.getElementById("history").appendChild(table);
		})
});

// TODO: add a way to onboard from USDC to ZingZap.

const getNumVolts = () => {
	fetch(`${window.location.href}conductor?address=${encodeURIComponent(address)}`)
		.then(result => result.json())
		.then(result => {
			numVolts = result.numVolts;
			usd = result.amount;
			if (!result.statusMsg) {
				return;
			}
			windowAlert("You can now logon using the 'Logon' button. Once logged in, click the '!' button in the top-right-hand corner to copy your address and password.");
		})
		.catch(error => windowAlert(error, true))
}

const genAddress = async (maxVolts, status) => {
	address = document.getElementById("logonInput").value;
	for (let i = 0; i < maxVolts; i++) {
		address = new Uint8Array(await window.crypto.subtle.digest('SHA-256', (new TextEncoder).encode(`${address}`)));
		output = '';
		for (let j = 0; j < address.byteLength; j++) output += String.fromCharCode(address[j]);
		address = window.btoa(output);
		if (i === maxVolts - 1 && status) {
			getNumVolts();
		}
	}
}

const logon = () => {
	event.preventDefault();
	if (document.getElementById("logonInput").value.length !== 44) {
		fetch(`${window.location.href}logon`)
			.then(res => res.json())
			.then(async res => {
				let rand = window.crypto.getRandomValues(new Uint32Array(1))[0];
				let hashing = new Uint8Array(await window.crypto.subtle.digest('SHA-256', (new TextEncoder).encode(`${rand}${res.numConductors}`)));
				let output = '';
				for (let i = 0; i < hashing.byteLength; i++) output += String.fromCharCode(hashing[i]);
				document.getElementById("logonInput").value = window.btoa(output);
				genAddress(res.maxVolts, true);
			})
			.catch(err => windowAlert(err, true))
	} else {
		getNumVolts();
		fetch(`${window.location.href}logon`)
			.then(res => res.json())
			.then(res => {
				genAddress(res.maxVolts, false);
				document.getElementById("logonForm").style.display = 'none';
				document.getElementById("payForm").style.display = 'block';
				document.getElementById("logonInput").value = '';
				document.getElementById("historyBtn").style.display = 'none';
				document.getElementById("infoBtn").style.display = 'block';
			})
			.catch(err => windowAlert(err, true))
	}
	password = document.getElementById("logonInput").value;
}

document.getElementById("logonForm").addEventListener("submit", () => {
	logon();
});

document.getElementById("payBtn").addEventListener("click", () => {
	document.getElementById("payBtn").disabled = true;
	numVolts++;
	fetch(`${window.location.href}logon`)
		.then(res => res.json())
		.then(async res => {
			if (numVolts === res.maxVolts - 1) {
				let tempAddress = address;
				let tempHashing = password;
				for (let i = 0; i < (res.maxVolts - numVolts); i++) {
					tempHashing = new Uint8Array(await window.crypto.subtle.digest('SHA-256', (new TextEncoder).encode(`${tempHashing}`)));
					let output = '';
					for (let j = 0; j < tempHashing.byteLength; j++) output += String.fromCharCode(tempHashing[j]);
					tempHashing = window.btoa(output);
				}
				logon();
				document.getElementById("logonInput").value = '';
				fetch(`${window.location.href}volt?to=${encodeURIComponent(address)}&amount=${encodeURIComponent(amount)}&hashing=${encodeURIComponent(tempHashing)}&address=${encodeURIComponent(tempAddress)}`)
					.then(result => result.json())
					.then(result => windowAlert(result.statusMsg))
					.catch(error => windowAlert(error, true))
				document.getElementById("payBtn").disabled = false;
				return;
			}
			let hashing = password;
			for (let i = 0; i < (res.maxVolts - numVolts); i++) {
				hashing = new Uint8Array(await window.crypto.subtle.digest('SHA-256', (new TextEncoder).encode(`${hashing}`)));
				let output = '';
				for (let j = 0; j < hashing.byteLength; j++) output += String.fromCharCode(hashing[j]);
				hashing = window.btoa(output);
			}
			document.getElementById("payBtn").disabled = false;
			let to = document.getElementById("toInput").value;
			let amount = document.getElementById("amountInput").value;
			usd -= amount;
			fetch(`${window.location.href}volt?to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}&hashing=${encodeURIComponent(hashing)}&address=${encodeURIComponent(address)}`)
				.then(result => result.json())
				.then(result => windowAlert(result.statusMsg))
				.catch(error => windowAlert(error, true))
		})
		.catch(err => {
			windowAlert(err, true);
			document.getElementById("payBtn").disabled = false;
		})
});
