const mediasoupClient = require("mediasoup-client")
const { createVideo, createAudio, insertVideo, changeLayout, createAudioVisualizer } = require("../ui/video")
const { turnOffOnCamera } = require("../ui/button")
const { muteAllParticipants, goToLobby, createUserList, newUserCheckOnRaiseHand } = require(".")
const { encodingVP8, encodingsVP9 } = require("../config/mediasoup")

const getEncoding = ({ parameter }) => {
	try {
		const firstVideoCodec = parameter.device.rtpCapabilities.codecs.find((c) => c.kind === "video")
		let mimeType = firstVideoCodec.mimeType.toLowerCase()
		if (mimeType.includes("vp9")) {
			parameter.videoParams.encodings = encodingsVP9
		} else {
			parameter.videoParams.encodings = encodingVP8
		}
		return firstVideoCodec
	} catch (error) {
		console.log("- Error Get Encoding : ", error)
	}
}

const createDevice = async ({ parameter, socket }) => {
	try {
		parameter.device = new mediasoupClient.Device()
		await parameter.device.load({
			routerRtpCapabilities: parameter.rtpCapabilities,
		})
		getEncoding({ parameter })
		await createSendTransport({ socket, parameter })
	} catch (error) {
		console.log("- Error Creating Device : ", error)
	}
}

const createSendTransport = async ({ socket, parameter }) => {
	try {
		socket.emit("create-webrtc-transport", { consumer: false, roomName: parameter.roomName }, ({ params }) => {
			parameter.producerTransport = parameter.device.createSendTransport(params)
			parameter.producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					await socket.emit("transport-connect", {
						dtlsParameters,
					})

					callback()
				} catch (error) {
					errback("- Error Connecting Transport : ", error)
				}
			})

			parameter.producerTransport.on("produce", async (parameters, callback, errback) => {
				try {
					await socket.emit(
						"transport-produce",
						{
							kind: parameters.kind,
							rtpParameters: parameters.rtpParameters,
							appData: parameters.appData,
							roomName: parameter.roomName,
						},
						async ({ id, producersExist, kind }) => {
							await callback({ id })
							if (producersExist && kind == "audio") await getProducers({ parameter, socket })
						}
					)
				} catch (error) {
					errback(error)
				}
			})

			parameter.producerTransport.on("connectionstatechange", async (e) => {
				try {
					console.log("- State Change Producer : ", e)
					if (e == "failed") window.location.reload()
				} catch (error) {
					console.log("- Error Connecting State Change Producer : ", error)
				}
			})
			connectSendTransport(parameter)
		})
	} catch (error) {
		console.log("- Error Creating Send Transport : ", error)
	}
}

const connectSendTransport = async (parameter) => {
	try {
		// Producing Audio And Video Transport
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)

		parameter.audioProducer = await parameter.producerTransport.produce(parameter.audioParams)
		if (parameter.initialVideo) {
			parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
			await parameter.videoProducer.setMaxSpatialLayer(1)
			myData.video.producerId = parameter.videoProducer.id
			myData.video.transportId = parameter.producerTransport.id
			parameter.videoProducer.on("trackended", () => {
				console.log("video track ended")
			})

			parameter.videoProducer.on("transportclose", () => {
				console.log("video transport ended")
			})
		}

		myData.audio.producerId = parameter.audioProducer.id
		myData.audio.transportId = parameter.producerTransport.id

		parameter.audioProducer.on("trackended", () => {
			console.log("audio track ended")
		})

		parameter.audioProducer.on("transportclose", () => {
			console.log("audio transport ended")
		})
	} catch (error) {
		console.log("- Error Connecting Transport Producer : ", error)
	}
}

// Get Producers
const getProducers = ({ socket, parameter }) => {
	try {
		socket.emit("get-producers", { roomName: parameter.roomName }, (producerList) => {
			// Informing Consumer Transport
			producerList.forEach((id) => {
				signalNewConsumerTransport({ remoteProducerId: id, socket, parameter })
			})
		})
	} catch (error) {
		console.log("- Error Get Producer : ", error)
	}
}

const signalNewConsumerTransport = async ({ remoteProducerId, socket, parameter }) => {
	try {
		if (parameter.consumingTransports.includes(remoteProducerId)) return
		parameter.consumingTransports.push(remoteProducerId)
		await socket.emit("create-webrtc-transport", { consumer: true, roomName: parameter.roomName }, ({ params }) => {
			parameter.consumerTransport = parameter.device.createRecvTransport(params)

			parameter.consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					await socket.emit("transport-recv-connect", { dtlsParameters, serverConsumerTransportId: params.id })
					callback()
				} catch (error) {
					errback(error)
				}
			})
			parameter.consumerTransport.on("connectionstatechange", async (e) => {
				console.log("- Receiver Transport State : ", e)
			})
			connectRecvTransport({
				parameter,
				consumerTransport: parameter.consumerTransport,
				socket,
				remoteProducerId,
				serverConsumerTransportId: params.id,
			})
		})
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error Signaling New Consumer Transport : ${error}`,
			message: `Something wrong when signaling Consumer Transport!`,
			title: "Error!",
		})
	}
}

const connectRecvTransport = async ({ parameter, consumerTransport, socket, remoteProducerId, serverConsumerTransportId }) => {
	try {
		await socket.emit(
			"consume",
			{
				rtpCapabilities: parameter.device.rtpCapabilities,
				remoteProducerId,
				serverConsumerTransportId,
				roomName: parameter.roomName,
			},
			async ({ params }) => {
				try {
					if (parameter.micCondition.isLocked && parameter.micCondition.socketId == socket.id) {
						muteAllParticipants({ parameter, socket })
					}
					let streamId
					if (params?.appData?.label == "audio" && parameter.isHost) {
						let pdfDocument
						for (const key in parameter.pdfDocuments) {
							if (parameter.pdfDocuments[key].isDisplayed) {
								pdfDocument = key
							}
						}
						socket.emit("change-event", { socketId: params.producerSocketOwner, event: parameter.event })
						if (parameter.event == "transaksi") {
							setTimeout(() => {
								socket.emit("change-page", {
									socketId: params.producerSocketOwner,
									currentPage: parameter.pdfDocuments[pdfDocument].currentPage,
									pdfDocument,
								})
							}, 500)
						}
					}
					if (params?.appData?.label == "audio" || params?.appData?.label == "video") streamId = `${params.producerSocketOwner}-mic-webcam`
					else streamId = `${params.producerSocketOwner}-screen-sharing`

					const consumer = await consumerTransport.consume({
						id: params.id,
						producerId: params.producerId,
						kind: params.kind,
						rtpParameters: params.rtpParameters,
						streamId,
					})

					let isUserExist = parameter.allUsers.find((data) => data.socketId == params.producerSocketOwner)
					const { track } = consumer

					if (!params?.appData?.isActive) {
						track.enabled = false
					}

					if (isUserExist) {
						isUserExist[params.appData.label] = {
							track,
							isActive: params?.appData?.isActive,
							consumserId: consumer.id,
							producerId: remoteProducerId,
							transportId: consumerTransport.id,
						}
					} else {
						parameter.totalUsers++
						let data = {
							username: params.username,
							socketId: params.producerSocketOwner,
							picture: params.appData.picture,
						}
						data[params.appData.label] = {
							track,
							isActive: params.appData.isActive,
							consumserId: consumer.id,
							producerId: remoteProducerId,
							transportId: consumerTransport.id,
						}
						parameter.allUsers = [...parameter.allUsers, data]
						createVideo({
							parameter,
							id: params.producerSocketOwner,
							videoClassName: parameter.videoLayout,
							picture: params.appData.picture,
							username: params.username,
							micTrigger: params.appData.isMicActive,
							socket,
						})
						turnOffOnCamera({ id: params.producerSocketOwner, status: false })
						createUserList({ id: params.producerSocketOwner, username: params.username, micStatus: params.appData.isMicActive, parameter, socket })
						newUserCheckOnRaiseHand({ id: params.producerSocketOwner, username: parameter.username, socket })
					}
					if (params.kind == "audio" && params.appData.label == "audio") {
						createAudio({ id: params.producerSocketOwner, track })
						createAudioVisualizer({ id: params.producerSocketOwner, track })
					}
					if (params.kind == "video" && params.appData.label == "video") {
						insertVideo({ id: params.producerSocketOwner, track, pictures: "/assets/pictures/unknown.jpg" })
						turnOffOnCamera({ id: params.producerSocketOwner, status: true })
					}
					if (params.kind == "audio" && params.appData.label == "screensharingaudio") {
						createAudio({ id: params.producerSocketOwner + "screensharingaudio", track })
					}

					if (parameter.record.isRecording && params.kind == "audio") {
						const audioSource = parameter.record.audioContext.createMediaStreamSource(new MediaStream([track]))
						audioSource.connect(parameter.record.audioDestination)
					}

					parameter.consumerTransports = [
						...parameter.consumerTransports,
						{
							consumer,
							consumerTransport,
							serverConsumerTransportId: params.id,
							producerId: remoteProducerId,
						},
					]

					socket.emit("consumer-resume", { serverConsumerId: params.serverConsumerId })
				} catch (error) {
					errorHandling({
						type: "minor",
						error: `- Error Consuming : ${error}`,
						message: `Something wrong when consuming producer!`,
						title: "Error!",
					})
				}
			}
		)
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error When Connecting Receive Transport : ${error}`,
			message: `Something wrong when muting all participants!`,
			title: "Error!",
		})
	}
}

module.exports = { createDevice, createSendTransport, signalNewConsumerTransport }
