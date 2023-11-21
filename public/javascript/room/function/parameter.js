const { params, audioParams } = require("../config/mediasoup")

class Parameters {
	scrollTimer
	isHost = false
	localStream = null
	videoParams = { appData: { label: "video", isActive: true } }
	videoParams = { ...params, appData: { label: "video", isActive: true } }
	audioParams = { ...audioParams, appData: { label: "audio", isActive: true } }
	screensharingVideoParams = { appData: { label: "screensharing", isActive: true } }
	screensharingAudioParams = { appData: { label: "screensharingaudio", isActive: true } }
	consumingTransports = []
	consumerTransports = []
	totalUsers = 0
	allUsers = []
	devices = {
		audio: {
			iteration: 0,
			id: undefined,
		},
		video: {
			iteration: 0,
			id: undefined,
		},
	}
	screensharing = {
		isActive: false,
		videoProducerId: undefined,
		audioProducerId: undefined,
		transportId: undefined,
		stream: null,
		audioProducer: null,
		videoProducer: null,
	}
	isScreenSharing = {
		isScreenSharing: false,
		socketId: undefined,
	}
	record = {
		isRecording: false,
		stream: null,
		audioContext: null,
		audioDestination: null,
		recordedStream: null,
		recordedMedia: null,
	}
	micCondition = {
		isLocked: false,
		socketId: undefined,
	}
	pdfDocuments = {
		aktaDocument: {
			currentPage: 1,
			pageRendering: null,
			pageNumPending: null,
			scale: 1,
			canvas: null,
			ctx: null,
			position: 0,
			isDisplayed: false,
			location: "../../assets/pdf/AJB.pdf",
			numPages: undefined,
		},
	}
	event = "tata-tertib"
}

module.exports = { Parameters }
