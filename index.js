const express = require("express")
const mongoose = require("mongoose")
const formidable = require("express-formidable")
const cors = require("cors")
//création du serveur
const app = express()

const cloudinary = require("cloudinary").v2
//Permet de gérer les requettes POST
app.use(formidable())
//permet d'autoriser tous les sites a appeler votre API
app.use(cors())

// Permet l'accès aux variables d'environnement
require("dotenv").config()

//connexion à la bdd
// mongoose.connect("mongodb://localhost/vinted")
mongoose.connect(process.env.MONGODB_URI)

// Connexion à l'espace de stockage cloudinary
cloudinary.config({
	cloud_name: "manuelf-cloudinary",
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
})

//import des routes users et offers
const usersRoutes = require("./routes/user")
const offersRoutes = require("./routes/offer")
const paymentRoutes = require("./routes/payment")
app.use(usersRoutes)
app.use(offersRoutes)
app.use(paymentRoutes)

app.get("/", (req, res) => {
	res.json("Bienvenue sur l'API de Vinted")
})

app.use(function (err, req, res, next) {
	res.json({ error: err.message })
})

app.listen(process.env.PORT, () => {
	console.log("Server has started !")
})
