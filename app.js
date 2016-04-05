// JavaScript code for the BLE Scan example app.

// Application object.
var app = {};
var deviceDelay = 0;

// Device list.
app.devices = {};

// UI methods.
app.ui = {};

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = 1000;

app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady); },
		false);
};

app.onDeviceReady = function()
{
	var timeNow = Date.now();
	$('#scan-status').html('Scanning...  ' + timeNow);
	app.startScan(app.ui.deviceFound);
	//app.ui.displayStatus('Scanning...  ' + timeNow);
	
	dbl = new PouchDB("breacon", {auto_compaction: true});
	dbr = new PouchDB("https://jardelmv.cloudant.com/breacon");
	dbl.sync(dbr).on('complete', function () {
		
	}).on('error', function (err) {
	  
	}).on('active', function (info) {
			
	});
	app.ui.onStartScanButton();
};

// Start the scan. Call the callback function when a device is found.
// Format:
//   callbackFun(deviceInfo, errorCode)
//   deviceInfo: address, rssi, name
//   errorCode: String
app.startScan = function(callbackFun)
{
	app.stopScan();

	evothings.ble.startScan(
		function(device)
		{
			if (device.rssi <= 0)
			{
				callbackFun(device, null);
			}
		},
		function(errorCode)
		{
			// Report error.
			callbackFun(null, errorCode);
		}
	);
};

// Stop scanning for devices.
app.stopScan = function()
{
	evothings.ble.stopScan();
};

// Called when Start Scan button is selected.
app.ui.onStartScanButton = function()
{
	var timeNow = Date.now();
	app.ui.displayStatus('Scanning...  ' + timeNow);
	app.startScan(app.ui.deviceFound);
	app.ui.displayDeviceList();
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 1000);
	//app.ui.updateTimer = setTimeout(app.ui.onStartScanButton, 2000);
};

// Called when Stop Scan button is selected.
app.ui.onStopScanButton = function()
{
	app.stopScan();
	app.devices = {};
	app.ui.displayStatus('Scan Paused');
	app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
};

// Called when a device is found.
app.ui.deviceFound = function(device, errorCode)
{
	if (device)
	{
		device.timeStamp = Date.now();
		app.devices[device.address] = device;
		var logId = parseInt(device.timeStamp / 60000)*60 + device.name;
		dbl.get(logId).catch(function (err) {
  			if (err.status === 404) {
				var doc = {
					'_id': logId,
					'mac': device.address,
					'rssi': device.rssi
				}
				dbr.put(doc);
  			}
		});
		
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Bluetooth desabilitado!');
	}
};

// Display the device list.
app.ui.displayDeviceList = function()
{
	// Clear device list.
	$('#found-devices').empty();

	var timeNow = Date.now();

	$.each(app.devices, function(key, device)
	{
		
		if (device.timeStamp + 10000 > timeNow)
		//if (true)
		{
			
			// Map the RSSI value to a width in percent for the indicator.
			var rssiWidth = 100; // Used when RSSI is zero or greater.
			if (device.rssi < -100) { rssiWidth = 0; }
			else if (device.rssi < 0) { rssiWidth = 100 + device.rssi; }

			// Create tag for device data.
			var element = $(
				'<li class="table-view-cell">' +
				'<strong>' + device.name + '</strong><br />' +
					(evothings.os.isIOS() ? '' : device.address + '<br />') +
					device.timeStamp + '<br />' +
					device.rssi + '<br />' +
				 	'<div style="background:rgb(225,0,0);height:20px;width:' +
				 		rssiWidth + '%;"></div>' +
				'</li>'
			);

			$('#found-devices').append(element);
		}
	});
};

// Display a status message
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};

app.initialize();
