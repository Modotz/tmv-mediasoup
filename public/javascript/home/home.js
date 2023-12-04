const joinForm = document.getElementById("join-form")
const url = window.location
const roomTable = document.getElementById("rooms-table")
const roomTableBody = document.getElementById("rooms-table-body")
const availableMeetings = document.getElementById("available-meetings")
const detailMeetings = document.getElementById("detail-meetings")
const transactionHistory = document.getElementById("transaction-history")
const availableOptionButton = document.getElementById("available-meetings-option")
const detailOptionButton = document.getElementById("detail-meetings-option")
const logoutOptionButton = document.getElementById("logout-option")
const transactionHistoryOptionButton = document.getElementById("transaction-history-option")

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

const createMeeting = document.getElementById("create-meeting")
createMeeting.addEventListener("click", () => {
	console.log("WHAT")
	const goTo = url + "register-meeting"
	window.location.href = window.location.origin + '/register-meeting'
})

const getPDFAJB = async (transactionId) => {
	try {
		const ajbFileResponse = await fetch(`${window.location.origin}/ajb-file/${transactionId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				access_token: sessionStorage.getItem("access_token"),
			},
		})
		if (ajbFileResponse.ok) {
			const ajbFileBuffer = await ajbFileResponse.arrayBuffer()
			const ajbFileBlob = new Blob([ajbFileBuffer], { type: "application/pdf" })
			return URL.createObjectURL(ajbFileBlob)
		}
	} catch (error) {
		console.log("- Error : ", error)
	}
}

const getRooms = async () => {
	try {
		const response = await fetch(`${window.location.origin}/api/rooms`, {
			method: "get",
			headers: {
				"Content-Type": "application/json",
				access_token: sessionStorage.getItem("access_token"),
			},
		})

		const rooms = await response.json()
		const roomTitle = document.getElementById("rooms-title")
		if (rooms.length == 0) {
			roomTitle.innerHTML = "You Dont Have Any Scheduled Meeting"
		} else {
			roomTable.removeAttribute("style")
			roomTitle.innerHTML = "Meeting Schedule"
			rooms.map(async (data, index) => {
				const responseParticipants = await fetch(`${window.location.origin}/api/participants/${data.roomId}`, {
					method: "get",
					headers: {
						"Content-Type": "application/json",
						access_token: sessionStorage.getItem("access_token"),
					},
				})
				if (responseParticipants.ok) {
					const participants = await responseParticipants.json()
					let list = ""
					participants.map((data) => {
						list += `<div class="participants-list"><span>${data.email}</span><button id="cp-${data._id}" class="btn btn-link" style="cursor: pointer;">copy</button></div>`
					})
					let rowTable = document.createElement("tr")
					rowTable.innerHTML = `<th>${index + 1}</th><td>${data.name}</td><td><details><summary>List</summary>${list}</details></td>`
					roomTableBody.appendChild(rowTable)
					participants.map((data) => {
						document.getElementById(`cp-${data._id}`).addEventListener("click", () => {
							navigator.clipboard.writeText(`${window.location.origin}/user/${data._id}`)
						})
					})

					let detailList = ""
					participants.map((data, index) => {
						detailList += `
						<tr>
						<th scope="row">${index + 1}</th>
						<td>${data.email}</td>
						<td>${data.isVerified ? "Yes" : "No"}</td>
						<td>None</td>
					</tr>`
					})

					const tableDetailMeetingMenu = document.createElement("tr")
					tableDetailMeetingMenu.innerHTML = `
					<td>${index + 1}</td>
					<td>
					<details>
					<summary>${data.name}</summary>
					<div class="detail-meeting">
						<p>${data.name}</p>
						<div class="document-ajb">
							<p>Template AJB</p>
							<embed id="template-file-ajb-${data.transactionId}" src="${await getPDFAJB(data.transactionId)}" type="application/pdf"
								frameBorder="0" scrolling="auto" height="300px" width="100%"></embed>
								<input type="file" id="ajb-file-input-${data.transactionId}" accept="application/pdf"/>
								<button type="button" id="ajb-file-input-edit-button-${data.transactionId}" class="btn btn-primary">Update</button>
						</div>
						<div class="document-ajb">
							<p>Participants Data</p>
							<table class="table participant-tables">
								<thead>
									<tr>
										<th scope="col">No</th>
										<th scope="col">Name</th>
										<th scope="col">Verified</th>
										<th scope="col">Data</th>
									</tr>
								</thead>
								<tbody>
								${detailList}
								</tbody>
							</table>
						</div>
						<div class="document-ajb">
							<p>Template Tata Tertib</p>
							<div id="summernote-${data.transactionId}" class="summernote"></div>
							<button id="summernote-submit-${data.transactionId}" class="btn btn-primary">Update Template</button>
						</div>
					</div>
					</detail>
					</td>
					`

					let tableDetail = document.getElementById("table-details")
					tableDetail.appendChild(tableDetailMeetingMenu)
					$(`#summernote-${data.transactionId}`).summernote({
						placeholder: "Your Tata Tertib Template",
						tabsize: 2,
						height: 300,
						callbacks: {
							onInit: function () {
								$(`#summernote-${data.transactionId}`).summernote("pasteHTML", `${data?.templateTataTertib ? data.templateTataTertib : "<p>Edit Your Template</p>"}`)
							},
						},
					})

					document.getElementById(`summernote-submit-${data.transactionId}`).addEventListener("click", async () => {
						let content = $(`#summernote-${data.transactionId}`).summernote("code")
						const response = await fetch(`${window.location.origin}/api/room/${data._id}`, {
							method: "put",
							headers: {
								"Content-Type": "application/json",
								access_token: sessionStorage.getItem("access_token"),
							},
							body: JSON.stringify({ content }),
						})
						if (response.ok) {
							const templateTataTertibResponse = await response.json()
							console.log(templateTataTertibResponse)
						}
					})

					document.getElementById(`ajb-file-input-edit-button-${data.transactionId}`).addEventListener("click", async () => {
						let templateFile = document.getElementById(`ajb-file-input-${data.transactionId}`)
						const file = templateFile.files[0]
						const formData = new FormData()
						formData.append("pdf", file)
						const response = await fetch(`${window.location.origin}/ajb-file/${data.transactionId}`, {
							method: "post",
							headers: {
								access_token: sessionStorage.getItem("access_token"),
							},
							body: formData,
						})

						if (response.ok) {
							document.getElementById(`template-file-ajb-${data.transactionId}`).src = await getPDFAJB(data.transactionId)
							templateFile.value = ""
						}
					})
				}
			})
		}
	} catch (error) {
		console.log("- Error Getting Rooms : ", error)
	}
}

availableOptionButton.addEventListener("click", () => {
	availableMeetings.removeAttribute("style")
	detailOptionButton.removeAttribute("style")
	transactionHistoryOptionButton.removeAttribute("style")
	transactionHistory.style.display = "none"
	detailMeetings.style.display = "none"
	availableOptionButton.style.backgroundColor = "#9EB8D9"
})

detailOptionButton.addEventListener("click", () => {
	detailMeetings.removeAttribute("style")
	availableOptionButton.removeAttribute("style")
	transactionHistoryOptionButton.removeAttribute("style")
	transactionHistory.style.display = "none"
	availableMeetings.style.display = "none"
	detailOptionButton.style.backgroundColor = "#9EB8D9"
})

transactionHistoryOptionButton.addEventListener("click", () => {
	transactionHistory.removeAttribute("style")
	availableOptionButton.removeAttribute("style")
	detailOptionButton.removeAttribute("style")
	availableMeetings.style.display = "none"
	detailMeetings.style.display = "none"
	transactionHistoryOptionButton.style.backgroundColor = "#9EB8D9"
})

logoutOptionButton.addEventListener("click", () => {
	sessionStorage.clear()
	window.location.href = window.location.origin + "/login"
})

getRooms()
