const { addSaksiSignButton } = require("../button")

const createMyVideo = async (parameter) => {
	try {
		let picture = `<div class="${parameter.initialVideo ? "video-on" : "video-off"}" id="user-picture-container-${parameter.socketId}"><img src="${
			parameter.picture
		}" class="image-turn-off" id="user-picture-${parameter.socketId}""/></div>`
		let videoContainer = document.getElementById("video-container")
		let userVideoContainer = document.createElement("div")
		userVideoContainer.id = "vc-" + parameter.socketId
		userVideoContainer.className = "user-video-container-1"
		const micIcons = `<div class="icons-mic"><img src="/assets/pictures/mic${
			parameter.initialAudio ? "On" : "Off"
		}.png" class="mic-image" id="user-mic-${parameter.socketId}"></div>`
		userVideoContainer.innerHTML = `${micIcons}<video id="v-${parameter.socketId}" muted autoplay class="user-video"></video>${picture}<div class="username">${parameter.username}</div>`
		videoContainer.appendChild(userVideoContainer)
		document.getElementById(`v-${parameter.socketId}`).srcObject = parameter.localStream
		createAudioVisualizer({ id: parameter.socketId, track: parameter.localStream.getAudioTracks()[0] })
	} catch (error) {
		console.log("- Error Creating Video : ", error)
	}
}

const createVideo = ({ id, picture, username, micTrigger, parameter, role = "Saksi", socket }) => {
	try {
		let isVideoExist = document.getElementById("vc-" + id)
		let addPicture = `<div class="video-on" id="user-picture-container-${id}"><img src="${picture}" class="image-turn-off" id="user-picture-${id}""/></div>`
		if (!isVideoExist) {
			let videoContainer = document.getElementById("video-container")
			let userVideoContainer = document.createElement("div")
			userVideoContainer.id = "vc-" + id
			userVideoContainer.className = "user-video-container-1"
			const micIcons = `<div class="icons-mic"><img src="/assets/pictures/mic${
				micTrigger ? "On" : "Off"
			}.png" class="mic-image" id="user-mic-${id}"/></div>`

			userVideoContainer.innerHTML = `${micIcons}<video id="v-${id}" class="user-video" poster="/assets/pictures/unknown.jpg" autoplay></video>${addPicture}<div class="username">${username}</div>`
			videoContainer.appendChild(userVideoContainer)
			if (parameter.isHost) {
				addSaksiSignButton({ id, role, username, socket, parameter, socket })
			}
		}
	} catch (error) {
		console.log("- Error Creating User Video : ", error)
	}
}

const createAudio = ({ id, track }) => {
	try {
		let checkAudio = document.getElementById(`ac-${id}`)
		if (!checkAudio) {
			let audioContainer = document.getElementById("audio-collection")
			const newElem = document.createElement("div")
			newElem.id = `ac-${id}`
			newElem.innerHTML = `<audio id="a-${id}" autoplay></audio>`
			// let audio = document.createElement("audio")
			// audio.id = `a-${id}`
			// audio.setAttribute("autoplay", true)
			// audio.srcObject = new MediaStream([track])
			// newElem.appendChild(audio)
			// newElem.srcObject = new MediaStream([track])
			audioContainer.appendChild(newElem)
			// console.log("- A", document.getElementById("a-" + id))
			document.getElementById("a-" + id).srcObject = new MediaStream([track])
		}
	} catch (error) {
		console.log("- Error Creating Audio : ", error)
	}
}

const insertVideo = ({ track, id }) => {
	try {
		if (document.getElementById("v-" + id)) document.getElementById("v-" + id).srcObject = new MediaStream([track])
	} catch (error) {
		console.log("- Error Inserting Video : ", error)
	}
}

const removeVideoAndAudio = ({ socketId }) => {
	try {
		const removeVideo = document.getElementById(`vc-${socketId}`)
		if (removeVideo) removeVideo.remove()
		const removeAudio = document.getElementById(`va-${socketId}`)
		if (removeAudio) removeAudio.remove()
	} catch (error) {
		console.log("- Error Removing Video / Audio : ", error)
	}
}

const changeLayout = ({ parameter }) => {
	try {
		// parameter
		const userVideoContainers = document.querySelectorAll("." + parameter.previousVideoLayout)
		userVideoContainers.forEach((container, index) => {
			container.classList.remove(parameter.previousVideoLayout)
			container.classList.add(parameter.videoLayout)
		})
	} catch (error) {
		console.log("- Error Changing Layout : ", error)
	}
}

const createAudioVisualizer = async ({ id, track }) => {
	try {
		const newElement = document.createElement("canvas")
		newElement.className = "audio-visualizer"
		newElement.id = "audio-visualizer-" + id
		const attachTo = document.getElementById(`vc-${id}`)
		if (attachTo) {
			attachTo.appendChild(newElement)

			const canvas = document.getElementById(`audio-visualizer-${id}`)
			const ctx = canvas.getContext("2d")

			// Access the microphone audio stream (replace with your stream source)
			const audioContext = new (window.AudioContext || window.webkitAudioContext)()
			const analyser = audioContext.createAnalyser()
			analyser.fftSize = 256
			const bufferLength = analyser.frequencyBinCount
			const dataArray = new Uint8Array(bufferLength)
			let newTheAudio = new MediaStream([track])

			const audioSource = audioContext.createMediaStreamSource(newTheAudio)
			audioSource.connect(analyser)

			// Function to draw the single audio bar
			function drawBar() {
				analyser.getByteFrequencyData(dataArray)

				const barHeight = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
				// if (document.getElementById(`a-${id}`)) {
				// 	if (barHeight < 10) {
				// 		document.getElementById(`a-${id}`).volume = 0
				// 	} else {
				// 		document.getElementById(`a-${id}`).volume = 1
				// 	}
				// }
				canvas.style.boxShadow = `inset 0 0 0 ${barHeight / 20}px green, 0 0 0 ${barHeight / 20}px green`

				requestAnimationFrame(drawBar)
			}

			// Start drawing the single bar
			drawBar()
		}
	} catch (error) {
		console.log("- Error Creating Audio Level : ", error)
	}
}

const changeUserMic = ({ parameter, isMicActive, id }) => {
	let user = parameter.allUsers.find((data) => data.socketId == id)
	user.audio.track.enabled = isMicActive
	user.audio.isActive = isMicActive
	let userMicIconUserList = document.getElementById("ulim-" + id)
	let iconMic = document.getElementById(`user-mic-${id}`)
	if (iconMic) {
		iconMic.src = `/assets/pictures/mic${isMicActive ? "On" : "Off"}.png`
	}
	if (userMicIconUserList) {
		userMicIconUserList.src = `/assets/pictures/mic${isMicActive ? "On" : "Off"}.png`
	}

	const userListMicIcon = document.getElementById(`user-list-mic-icon-${id}`)
	if (isMicActive){
		userListMicIcon.classList.replace("fa-microphone-slash", "fa-microphone")
	} else {
		userListMicIcon.classList.replace("fa-microphone", "fa-microphone-slash")
	}
}

module.exports = {
	createMyVideo,
	createAudio,
	createVideo,
	insertVideo,
	removeVideoAndAudio,
	changeLayout,
	createAudioVisualizer,
	changeUserMic,
}
