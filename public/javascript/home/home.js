const joinForm = document.getElementById("join-form")
const url = window.location
const roomTable = document.getElementById("rooms-table")
const roomTableBody = document.getElementById("rooms-table-body")
const availableMeetings = document.getElementById("available-meetings")
const detailMeetings = document.getElementById("detail-meetings")
const availableOptionButton = document.getElementById("available-meetings-option")
const detailOptionButton = document.getElementById("detail-meetings-option")

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
	const goTo = url + "register-meeting"
	window.location.href = goTo
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
		console.log(error)
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
					console.log(participants)
					let list = ""
					participants.map((data) => {
						list += `<div class="participants-list"><span>${data.email}</span><button id="cp-${data._id}" class="btn btn-link" style="cursor: pointer;">copy</button></div>`
					})
					let rowTable = document.createElement("tr")
					rowTable.innerHTML = `<th>${index + 1}</th><td>${
						data.name
					}</td><td><details><summary>List</summary>${list}</details></td>`
					roomTableBody.appendChild(rowTable)
					participants.map((data) => {
						document.getElementById(`cp-${data._id}`).addEventListener("click", () => {
							navigator.clipboard.writeText(`${window.location.origin}/user/${data._id}`)
						})
					})

					const detailMeetingsMenu = document.createElement("details")
					let detailList = ""
					participants.map((data, index) => {
						detailList += `
						<tr>
						<th scope="row">${index + 1}</th>
						<td>${data.email}</td>
						<td>${data.isConfirmed ? "Yes" : "No"}</td>
						<td>None</td>
					</tr>`
					})

					detailMeetingsMenu.innerHTML = `<summary>${data.name}</summary>
					<div class="detail-meeting">
						<p>${data.name}</p>
						<div class="document-ajb">
							<p>Template AJB</p>
							<embed id="template-file-ajb-${data.transactionId}" src="${await getPDFAJB(data.transactionId)}" type="application/pdf"
								frameBorder="0" scrolling="auto" height="100%" width="100%"></embed>
							<form id="edit-ajb-file-${data.transactionId}" enctype="multipart/form-data">
								<input type="file" id="ajb-file-input-${data.transactionId}" accept="application/pdf"/>
								<button type="submit" class="btn btn-primary">Edit</button>
							</form>
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
					</div>`
					detailMeetings.appendChild(detailMeetingsMenu)

					document.getElementById(`edit-ajb-file-${data.transactionId}`).addEventListener("submit", async (e) => {
						e.preventDefault()
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
	detailMeetings.style.display = "none"
})

detailOptionButton.addEventListener("click", () => {
	detailMeetings.removeAttribute("style")
	availableMeetings.style.display = "none"
})

getRooms()
