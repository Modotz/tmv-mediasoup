// let publicIp = '127.0.0.1'
// let publicIp = "192.168.206.123"
// let publicIp = '192.168.205.229'
// let publicIp = "203.194.113.166" // VPS Mr. Indra IP
// let publicIp = "203.175.10.29" // My VPS
// let publicIp = "192.168.18.68" // Laptop Jaringan 5G
// let publicIp = '192.168.3.135' // IP Kost
// let publicIp = "192.168.3.208"
// let publicIp = "192.168.205.229" // RDS.co.id
let publicIp = "147.139.136.209" // Wire Guard
let privateIp = "0.0.0.0"

const webRtcTransport_options = {
	listenIps: [
		{
			ip: "0.0.0.0",
			announcedIp: publicIp,
		},
	],
	enableUdp: true,
	enableTcp: true,
	preferUdp: true,
}

const mediaCodecs = [
	{
		kind: "audio",
		mimeType: "audio/opus",
		clockRate: 48000,
		channels: 2,
	},
	{
		kind: "video",
		mimeType: "video/VP8",
		clockRate: 90000,
		parameters: {
			"x-google-start-bitrate": 1000,
		},
	},
	{
		kind: "video",
		mimeType: "video/VP9",
		clockRate: 90000,
		parameters: {
			"profile-id": 2,
			"x-google-start-bitrate": 1000,
		},
	},
	{
		kind: "video",
		mimeType: "video/h264",
		clockRate: 90000,
		parameters: {
			"packetization-mode": 1,
			"profile-level-id": "4d0032",
			"level-asymmetry-allowed": 1,
			"x-google-start-bitrate": 1000,
		},
	},
	{
		kind: "video",
		mimeType: "video/h264",
		clockRate: 90000,
		parameters: {
			"packetization-mode": 1,
			"profile-level-id": "42e01f",
			"level-asymmetry-allowed": 1,
			"x-google-start-bitrate": 1000,
		},
	},
]

const listenInfo = {
	listenInfos: [
		{
			protocol: "udp",
			ip: privateIp,
			announcedIp: publicIp,
			port: 1030
		},
		{
			protocol: "tcp",
			ip: privateIp,
			announcedIp: publicIp,
			port: 1030
		},
	],
}

class Mediasoup {
	constructor() {
		this.worker
		this.rooms = {}
		this.peers = {}
		this.transports = []
		this.producers = []
		this.consumers = []
		this.roomsSocketCollection = {}
		this.allWorkers = {
			worker1: null,
			worker2: null,
			worker3: null,
			worker4: null,
		}
	}
}

module.exports = { webRtcTransport_options, Mediasoup, mediaCodecs, listenInfo }
