async function getLabeledFaceDescriptions({ picture, name }) {
	const descriptions = []
	for (let i = 1; i <= 10; i++) {
		const img = await faceapi.fetchImage(picture, name)
		const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
		if (detections) {
			descriptions.push(detections.descriptor)
		}
	}
	return new faceapi.LabeledFaceDescriptors(name, descriptions)
}

const startFR = ({ picture, name, id }) => {
	try {
        const video = document.getElementById(`v-${id}`)
		video.addEventListener("play", async () => {
			const labeledFaceDescriptors = await getLabeledFaceDescriptions({ picture, name })
			let faceContainer = document.getElementById(`face-recognition-${id}`)
			// const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors)
			const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.45)
			const canvas = faceapi.createCanvasFromMedia(video)
            console.log(canvas)
			faceContainer.append(canvas)
			const displaySize = { width: video.videoWidth, height: video.videoHeight }
			faceapi.matchDimensions(canvas, displaySize)
			setInterval(async () => {
				const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
				const resizedDetections = faceapi.resizeResults(detections, displaySize)
				canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
				const results = resizedDetections.map((d) => {
					return faceMatcher.findBestMatch(d.descriptor)
				})
				results.forEach((result, i) => {
					const box = resizedDetections[i].detection.box
					const drawBox = new faceapi.draw.DrawBox(box, {
						label: result,
					})
					drawBox.draw(canvas)
				})
			}, 100)
		})
	} catch (error) {
		console.log("- Error Starting Face Recognition : ", error)
	}
}

module.exports = { startFR }
