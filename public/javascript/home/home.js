const joinForm = document.getElementById("join-form")
const url = window.location

// const checkToken = async () => {
// 	try {
// 		const api = "https://192.168.18.68:3001/api/user"
// 		const response = await fetch(api, {
// 			method: "get",
// 			headers: {
// 				"Content-Type": "application/json",
// 				access_token: sessionStorage.getItem("access_token"),
// 			},
// 		})

// 		if (!response.ok) {
// 			window.location.href = window.location.origin + "/login"
// 		}
// 	} catch (error) {
// 		console.log("Invalid Token : ", error)
// 	}
// }

// checkToken()

joinForm.addEventListener("submit", (e) => {
	e.preventDefault()
	const roomId = document.getElementById("room-id").value
	const goTo = url + "lobby/" + roomId
	window.location.href = goTo
})

function generateRandomId(length, separator = "-", separatorInterval = 4) {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	let randomId = ""

	for (let i = 0; i < length; i++) {
		if (i > 0 && i % separatorInterval === 0) {
			randomId += separator
		}

		const randomIndex = Math.floor(Math.random() * characters.length)
		randomId += characters.charAt(randomIndex)
	}

	return randomId
}

const newMeetingButton = document.getElementById("new-meeting")
newMeetingButton.addEventListener("click", (e) => {
	const id = generateRandomId(12)
	localStorage.setItem("room-id", id)
	const goTo = url + "lobby/" + id
	window.location.href = goTo
})

const roomId = document.getElementById("room-id")
roomId.addEventListener("input", (e) => {
	const buttonSubmit = document.getElementById("button-submit-room-id")
	if (!e.target.value) {
		buttonSubmit.setAttribute("disabled", "true")
	} else {
		buttonSubmit.removeAttribute("disabled", "false")
	}
	localStorage.setItem("room-id", e.target.value)
})

// const rightBar = document.getElementById('right-bar-id')
// const totalCarousel = rightBar.children.length
const carousels = document.querySelectorAll(".carousel")
let currentIndex = 0

function showCarousel(index) {
	carousels[currentIndex].classList.remove("active")
	carousels[currentIndex].classList.add("hide")
	currentIndex = index
	carousels[currentIndex].classList.add("hide")
	carousels[currentIndex].classList.add("active")
}

function nextSlide() {
	const nextIndex = (currentIndex + 1) % carousels.length
	showCarousel(nextIndex)
}

function startCarousel() {
	setInterval(nextSlide, 5000) // Change slide every 5 seconds (adjust the interval as needed)
}

startCarousel()
