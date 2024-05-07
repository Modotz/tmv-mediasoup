const { default: Swal } = require("sweetalert2")

const baseurl = window.location.origin
const registerButton = document.getElementById("register-form")
const cameraContainer = document.getElementById("camera-container-id")
const localVideo = document.getElementById("local-video")
const captureButton = document.getElementById("capture-button-id")
// const canvasElement = document.getElementById("canvas-element")
const previewButton = document.getElementById("preview-button-id")
const confirmPicture = document.getElementById("confirm-button-id")
const imageOutput = document.getElementById("image--output")
const fullNameForm = document.getElementById("fullname-id")
const nikForm = document.getElementById("nik-id")
let picture
let pictureBlob
let image_data_url

Promise.all([
	faceapi.nets.ssdMobilenetv1.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceRecognitionNet.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceLandmark68Net.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.tinyFaceDetector.loadFromUri("../javascript/room/face-api/models"),
]).then((_) => {
	console.log(faceapi)
})
const startFR = async () => {
	try {
		const video = document.getElementById("local-video")
		const canvas = faceapi.createCanvasFromMedia(video)
		canvas.style.height = "100%"
		document.getElementById("face-recognition-id").appendChild(canvas)
		const displaySize = { width: video.videoWidth, height: video.videoHeight }
		faceapi.matchDimensions(canvas, displaySize)
		setInterval(async () => {
			const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
			const resizedDetections = faceapi.resizeResults(detections, displaySize)
			canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
			faceapi.draw.drawDetections(canvas, resizedDetections)
		}, 100)
	} catch (error) {
		console.log("- Error Starting Face Recognition : ", error)
	}
}

localVideo?.addEventListener("play", startFR)
registerButton.addEventListener("submit", (e) => {
	e.preventDefault()
	try {
		if (!fullNameForm.value || !nikForm.value) {
			Swal.fire({
				icon: "error",
				title: "Data is not valid!",
				text: "Please make sure your id is valid!",
				showConfirmButton: false,
				timer: 3000,
			})
			return
		}
		cameraContainer.style.top = "0"
		getCameraReady()
	} catch (error) {
		console.log("- Error Registering Data : ", error)
	}
})

const getCameraReady = async () => {
	try {
		const config = {
			video: true,
		}
		const stream = await navigator.mediaDevices.getUserMedia(config)
		localVideo.srcObject = stream
	} catch (error) {
		console.log("- Error Getting Camera : ", error)
	}
}

const capturePicture = async () => {
	try {
		canvasElement.width = localVideo.videoWidth
		canvasElement.height = localVideo.videoHeight
		canvasElement.getContext("2d").drawImage(localVideo, 0, 0)
		image_data_url = canvasElement.toDataURL("image/png")
		imageOutput.src = image_data_url
		previewButton.removeAttribute("disabled")
		confirmPicture.removeAttribute("disabled")
	} catch (error) {
		console.error("Error capturing picture:", error)
	}
}

captureButton.addEventListener("click", capturePicture)

confirmPicture.addEventListener("click", async () => {
	try {
		const formData = {
			username: fullNameForm.value,
			nik: nikForm.value,
			base64data: image_data_url,
		}

		const response = await fetch(`${baseurl}/user/${nikForm.value}`, {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(formData),
		})
		const data = await response.json()
		if (data.status) {
			Swal.fire({
				icon: "success",
				title: "Successfully Register",
				showConfirmButton: false,
				timer: 3000,
			}).then((_) => {
				setTimeout(() => {
					const newURL = window.location.origin
					window.location.href = newURL
				}, 1000)
			})
		}
	} catch (error) {
		console.log("- Error Send Picture : ", error)
	}
})
