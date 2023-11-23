const { OAuth2Client } = require("google-auth-library")
const path = require("path")
const client = new OAuth2Client()
// const fs = require("fs")
const fs = require("fs").promises
const { PDFDocument, rgb } = require("pdf-lib")

class Controller {
	static room(req, res, next) {
		try {
			// res.render("home")
			res.render("room")
		} catch (error) {
			next.log(error)
		}
	}

	static home(req, res, next) {
		try {
			res.render("home")
		} catch (error) {
			next.log(error)
		}
	}

	static lobby(req, res, next) {
		try {
			res.render("lobby")
		} catch (error) {
			next.log(error)
		}
	}

	static login(req, res, next) {
		try {
			res.render("login")
		} catch (error) {
			next.log(error)
		}
	}

	static register(req, res, next) {
		try {
			res.render("register")
		} catch (error) {
			next.log(error)
		}
	}

	static registerMeeting(req, res, next) {
		try {
			res.render("register-meeting")
		} catch (error) {
			next(err)
		}
	}

	static async googleAuth(req, res) {
		try {
			const ticket = await client.verifyIdToken({
				idToken: req.body.credential,
				audience: "623403491943-290gkq7bnqtgeprtfaci3u76vtb39bjl.apps.googleusercontent.com", // Specify the CLIENT_ID of the app that accesses the backend
			})
			const payload = ticket.getPayload()
			res.status(200).json({ name: `${payload.given_name} ${payload.family_name}`, picture: payload.picture })
		} catch (error) {
			console.log(error)
		}
	}

	static async getDocuments(req, res) {
		try {
			// const { room } = req.body
			const originalPDFPath = path.join(__dirname, "..", "documents", "pdf", "22", "AJB.pdf")
			res.sendFile(originalPDFPath, (err) => {
				if (err) {
					console.error(err)
					res.status(500).send("Internal Server Error")
				}
			})
		} catch (error) {
			console.log(error)
		}
	}

	static async createDocuments(req, res) {
		try {
			const { isPPAT, username, room, role } = req.body
			const createDirectoryIfNotExists = async (directoryPath) => {
				try {
					await fs.access(directoryPath) // Check if the directory already exists
				} catch (error) {
					if (error.code === "ENOENT") {
						await fs.mkdir(directoryPath, { recursive: true })
						console.log(`Directory created: ${directoryPath}`)
					}
				}
			}
			const originialPDFPath = path.join(__dirname, "..", "documents", "pdf", room, "AJB.pdf")
			// Read the existing PDF file
			const pdfBytes = await fs.readFile(originialPDFPath)

			// Load the existing PDF document
			const pdfDoc = await PDFDocument.load(pdfBytes)

			const pages = pdfDoc.getPages()
			const lastPages = pages[5]
			const { width, height } = lastPages.getSize()

			// Adjust the image dimensions as needed
			// const { width, height } = signatureJpg.scale(1)
			// const textContent = await lastPages.getTextContent();
			// console.log(textContent)
			if (isPPAT) {
				const signaturePath = path.join(__dirname, "..", "documents", "signature", "QR-Code.jpg")
				const signatureBytes = await fs.readFile(signaturePath)
				const signatureJpg = await pdfDoc.embedJpg(signatureBytes)
				lastPages.drawImage(signatureJpg, {
					x: width / 2 + 90,
					y: height - 440,
					width: 50,
					height: 50,
				})
				lastPages.drawText(username, {
					x: width / 2 + 70,
					y: height - 470,
					size: 12,
				})
			} else if (role == "Saksi") {
				const signaturePath = path.join(__dirname, "..", "documents", "signature", "QR-Code.jpg")
				const signatureBytes = await fs.readFile(signaturePath)
				const signatureJpg = await pdfDoc.embedJpg(signatureBytes)
				lastPages.drawImage(signatureJpg, {
					x: 215,
					y: height - 300,
					width: 50,
					height: 50,
				})
				lastPages.drawText(username, {
					x: 210,
					y: height - 330,
					size: 12,
				})
			}

			const newPdf = "AJB.pdf"
			const filePathPDF = path.join(__dirname, "..", "documents", "pdf", room)
			await createDirectoryIfNotExists(filePathPDF)
			const newPdfFilePath = path.join(__dirname, "..", "documents", "pdf", room, newPdf)
			const modifiedPdf = await pdfDoc.save()
			await fs.writeFile(newPdfFilePath, modifiedPdf)
			await res.status(200).json({ message: `success-signing-${role}` })
		} catch (error) {
			console.log(error)
		}
	}
}
module.exports = Controller
