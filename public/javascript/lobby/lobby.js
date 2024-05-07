const { default: Swal } = require("sweetalert2")

const baseurl = window.location.origin
const nikInputForm = document.getElementById("nik-id")
const submitButton = document.getElementById("submit-button")
const joinRoomForm = document.getElementById("join-room")
const videoContainer = document.getElementById("video-container")
let localStream = document.getElementById("local-video")
const canvasElement = document.getElementById("canvas-element")
const canvasElement2 = document.getElementById("canvas-element-2")
const captureButton = document.getElementById("capture-button-id")
const previewButton = document.getElementById("preview-button-id")
const url = window.location.pathname
const parts = url.split("/")
const roomName = parts[2]
let image_data_url
let image_data_url_server
const imageOutput = document.getElementById("image--output")
const imageOutput2 = document.getElementById("image--output--2")

const threshold = 0.6
let descriptors = { desc1: null, desc2: null }

const goToRoom = () => {
	try {
		localStorage.setItem("nik", nikInputForm.value)
		const newURL = window.location.origin + "/" + "room/" + roomName
		window.location.href = newURL
	} catch (error) {
		console.log("- Error Go To Room : ", error)
	}
}
nikInputForm.addEventListener("input", (e) => {
	if (!e.target.value) {
		submitButton.setAttribute("disabled", "true")
	} else {
		submitButton.removeAttribute("disabled")
	}
})

joinRoomForm.addEventListener("submit", (e) => {
	try {
		e.preventDefault()
		if (!image_data_url || !nikInputForm.value) {
			Swal.fire({
				icon: "error",
				title: "Data is not valid!",
				text: "Please make sure your id or photo is valid!",
				showConfirmButton: false,
				timer: 3000,
			})
			return
		}
		fetch(`${baseurl}/check/${nikInputForm.value}`)
			.then((response) => {
				return response.json()
			})
			.then((data) => {
				if (!data.isExist) {
					Swal.fire({
						icon: "error",
						title: "Something went wrong!",
						text: "You've not registered!",
					})
					return
				}
				image_data_url_server = `data:image/png;base64,${data.base64data}`
				comparePicture({ picture1: image_data_url, picture2: image_data_url_server, fullName: data.fullName, nik: data.nik })
			})
	} catch (error) {
		console.log("- Error Submiting")
	}
})

const getCameraReady = async () => {
	try {
		const config = {
			video: true,
		}
		const stream = await navigator.mediaDevices.getUserMedia(config)
		localStream.srcObject = stream
	} catch (error) {
		console.log("- Error Getting Camera : ", error)
	}
}

const capturePicture = async () => {
	try {
		canvasElement.width = localStream.videoWidth
		canvasElement.height = localStream.videoHeight
		canvasElement.getContext("2d").drawImage(localStream, 0, 0)
		image_data_url = canvasElement.toDataURL("image/png")

		imageOutput.src = image_data_url
		previewButton.removeAttribute("disabled")
	} catch (error) {
		console.error("Error capturing picture:", error)
	}
}

const comparePicture = async ({ picture1, picture2, fullName, nik }) => {
	try {
		const input1 = await faceapi.fetchImage(picture1)
		const input2 = await faceapi.fetchImage(picture2)
		descriptors.desc1 = await faceapi.computeFaceDescriptor(input1)
		descriptors.desc2 = await faceapi.computeFaceDescriptor(input2)
		const distance = faceapi.utils.round(faceapi.euclideanDistance(descriptors.desc1, descriptors.desc2))
		console.log(distance)
		if (distance <= 0.5) {
			localStorage.setItem("username", fullName)
			localStorage.setItem("nik", nik)
			Swal.fire({
				icon: "success",
				title: "Verified",
				text: "Please Wait A Moment!\nYou will be forwaded to the meeting!",
				showConfirmButton: false,
				timer: 3000,
			}).then((_) => {
				setTimeout(() => {
					goToRoom()
				}, 1000)
			})
		} else {
			Swal.fire({
				icon: "error",
				title: "Failed",
				text: "Made sure to position your picture to camera to get better resutl!",
				showConfirmButton: false,
				timer: 2500,
			})
		}
	} catch (error) {
		console.log("- Error Comparing Picture : ", error)
	}
}

captureButton.addEventListener("click", capturePicture)

Promise.all([
	faceapi.nets.ssdMobilenetv1.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceRecognitionNet.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceLandmark68Net.loadFromUri("../javascript/room/face-api/models"),
	// faceapi.loadFaceRecognitionModel("../javascript/room/face-api/models")
	// faceapi.loadSsdMobilenetv1Model("../javascript/room/face-api/models"),
	// faceapi.loadFaceLandmarkModel("../javascript/room/face-api/models"),
	// faceapi.loadFaceRecognitionModel("../javascript/room/face-api/models"),
]).then(getCameraReady)
