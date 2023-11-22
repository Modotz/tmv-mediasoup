document.addEventListener("DOMContentLoaded", function () {
	let baseUrl = "https://192.168.18.68:3001"
	const registerForm = document.getElementById("register-form")

	registerForm.addEventListener("submit", async (event) => {
		try {
			event.preventDefault()
			const email = document.getElementById("register-email").value
			const password = document.getElementById("register-passwords").value
			if (!email) throw { name: "Bad Request", message: "Email Is Required" }
			if (!password) throw { name: "Bad Request", message: "Password Is Required" }
			// await registerUser({ email, password })

			const data = {
				email,
				password,
			}

			const response = await fetch(`${baseUrl}/api/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
			if (response.ok) {
				const responseData = await response.json()
				console.log(responseData)
				// Redirect To Login Page
				window.location.href = window.location.origin + "/login"
			} else {
				const errorFromServer = await response.json()
				throw errorFromServer
			}
		} catch (error) {
			console.log("- Error : ", error)
			if (error.name == "Bad Request" || error.name == "Registered") {
				let ae = document.getElementById("alert-error")
				ae.className = "show"
				ae.innerHTML = `${error.message}`
				// Show Warning
				setTimeout(() => {
					ae.className = ae.className.replace("show", "")
					ae.innerHTML = ``
				}, 3000)
			}
		}
	})
})
