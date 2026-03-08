// Google Apps Script: Copy Google Form photo uploads to Cloudflare R2
//
// Setup:
// 1. Open the Google Form → Script Editor (Extensions → Apps Script)
// 2. Paste this script
// 3. Add Script Properties (Project Settings → Script Properties):
//    - R2_ACCOUNT_ID: Your Cloudflare account ID
//    - R2_ACCESS_KEY_ID: R2 API token access key
//    - R2_SECRET_ACCESS_KEY: R2 API token secret key
//    - R2_BUCKET_NAME: e.g. "assets"
//    - R2_PUBLIC_URL: e.g. "https://assets.hejjegala.in"
// 4. Add an installable trigger:
//    Triggers → Add Trigger → onFormSubmit → From form → On form submit

const PROPS = PropertiesService.getScriptProperties();
const ACCOUNT_ID = PROPS.getProperty('R2_ACCOUNT_ID');
const ACCESS_KEY = PROPS.getProperty('R2_ACCESS_KEY_ID');
const SECRET_KEY = PROPS.getProperty('R2_SECRET_ACCESS_KEY');
const BUCKET = PROPS.getProperty('R2_BUCKET_NAME');
const PUBLIC_URL = PROPS.getProperty('R2_PUBLIC_URL');

function onFormSubmit(e) {
	var responses = e.response.getItemResponses();
	var sheet = getLinkedSheet();
	var timestamp = e.response.getTimestamp();
	var submissionId = Utilities.formatDate(timestamp, 'UTC', "yyyyMMdd'T'HHmmss'Z'");

	responses.forEach(function (itemResponse) {
		if (itemResponse.getItem().getType() !== FormApp.ItemType.FILE_UPLOAD) return;

		var fileIds = itemResponse.getResponse();
		if (!fileIds || fileIds.length === 0) return;

		var publicUrls = fileIds.map(function (fileId, idx) {
			var file = DriveApp.getFileById(fileId);
			var ext = file.getName().replace(/.*\./, '');
			var key = 'activities/photos/' + submissionId + '/' + (idx + 1) + '.' + ext;
			uploadToR2(file, key);
			return PUBLIC_URL + '/' + key;
		});

		if (sheet) {
			updateSheetWithUrls(sheet, e.response, itemResponse.getItem(), publicUrls);
		}
	});
}

function uploadToR2(file, key) {
	var blob = file.getBlob();
	var bytes = blob.getBytes();
	var contentType = blob.getContentType();

	var host = ACCOUNT_ID + '.r2.cloudflarestorage.com';
	var url = 'https://' + host + '/' + BUCKET + '/' + key;

	var now = new Date();
	var dateStamp = Utilities.formatDate(now, 'UTC', 'yyyyMMdd');
	var amzDate = Utilities.formatDate(now, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
	var region = 'auto';
	var service = 's3';

	var payloadHash = hexSha256(bytes);

	var canonicalHeaders =
		'content-type:' +
		contentType +
		'\n' +
		'host:' +
		host +
		'\n' +
		'x-amz-content-sha256:' +
		payloadHash +
		'\n' +
		'x-amz-date:' +
		amzDate +
		'\n';
	var signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

	var canonicalRequest =
		'PUT\n' +
		'/' +
		BUCKET +
		'/' +
		key +
		'\n' +
		'\n' +
		canonicalHeaders +
		'\n' +
		signedHeaders +
		'\n' +
		payloadHash;

	var credentialScope = dateStamp + '/' + region + '/' + service + '/aws4_request';
	var stringToSign =
		'AWS4-HMAC-SHA256\n' +
		amzDate +
		'\n' +
		credentialScope +
		'\n' +
		hexSha256(Utilities.newBlob(canonicalRequest).getBytes());

	var signingKey = getSignatureKey(SECRET_KEY, dateStamp, region, service);
	var signature = hmacHex(signingKey, stringToSign);

	var authHeader =
		'AWS4-HMAC-SHA256 Credential=' +
		ACCESS_KEY +
		'/' +
		credentialScope +
		', SignedHeaders=' +
		signedHeaders +
		', Signature=' +
		signature;

	UrlFetchApp.fetch(url, {
		method: 'put',
		contentType: contentType,
		payload: bytes,
		headers: {
			Authorization: authHeader,
			'x-amz-date': amzDate,
			'x-amz-content-sha256': payloadHash
		},
		muteHttpExceptions: true
	});
}

function getLinkedSheet() {
	try {
		var form = FormApp.getActiveForm();
		var destId = form.getDestinationId();
		if (!destId) return null;
		return SpreadsheetApp.openById(destId);
	} catch (e) {
		return null;
	}
}

function updateSheetWithUrls(spreadsheet, response, photoItem, publicUrls) {
	var sheet = spreadsheet.getSheets()[0];
	var data = sheet.getDataRange().getValues();
	var headers = data[0];

	var photoColIdx = -1;
	var photoTitle = photoItem.getTitle().toLowerCase();
	for (var i = 0; i < headers.length; i++) {
		if (headers[i].toString().toLowerCase().includes(photoTitle.substring(0, 10))) {
			photoColIdx = i;
			break;
		}
	}
	if (photoColIdx === -1) return;

	// Find the row matching this response (last row with matching timestamp)
	var lastRow = sheet.getLastRow();
	if (lastRow < 2) return;

	sheet.getRange(lastRow, photoColIdx + 1).setValue(publicUrls.join(', '));
}

// --- AWS Signature V4 Helpers ---

function hmac(key, msg) {
	if (typeof key === 'string') {
		key = Utilities.newBlob(key).getBytes();
	}
	if (typeof msg === 'string') {
		msg = Utilities.newBlob(msg).getBytes();
	}
	return Utilities.computeHmacSha256Signature(msg, key);
}

function hmacHex(key, msg) {
	return bytesToHex(hmac(key, msg));
}

function hexSha256(data) {
	if (typeof data === 'string') {
		data = Utilities.newBlob(data).getBytes();
	}
	return bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data));
}

function getSignatureKey(secretKey, dateStamp, region, service) {
	var kDate = hmac('AWS4' + secretKey, dateStamp);
	var kRegion = hmac(kDate, region);
	var kService = hmac(kRegion, service);
	return hmac(kService, 'aws4_request');
}

function bytesToHex(bytes) {
	return bytes
		.map(function (b) {
			return ('0' + ((b + 256) % 256).toString(16)).slice(-2);
		})
		.join('');
}
