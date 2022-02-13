const express = require("express")
const router = express.Router()
const cloudinary = require("cloudinary").v2

//import du modèle Offer
const Offer = require("../models/Offer")

//Je viens configurer cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET,
})

//Import du modèle User
const User = require("../models/User")

const isAuthenticated = async (req, res, next) => {
	//sans le next, la requête va rester "bloquée" dans ma fonction isAuthenticated
	//   next();
	console.log(req.headers.authorization)
	if (req.headers.authorization) {
		//je continue la suite de mes vérifications
		const user = await User.findOne({
			token: req.headers.authorization.replace("Bearer ", ""),
		})

		//POSTMAN => Bearer QSDFGH1234
		//BDD => QSDFGH1234
		if (user) {
			// Mon token est valide et je peux continuer
			//J'envoie les infos sur mon user à la suite de ma route
			req.user = user
			next()
		} else {
			res.status(401).json({ error: "Unautorized 2" })
		}
	} else {
		res.status(401).json({ error: "Unauthorized 1" })
	}
}

router.post("/offer/publish", isAuthenticated, async (req, res) => {
	console.log(req.user)
	try {
		const newOffer = new Offer({
			product_name: req.fields.title,
			product_description: req.fields.description,
			product_price: req.fields.price,
			product_details: [
				{ MARQUE: req.fields.brand },
				{ TAILLE: req.fields.size },
				{ ETAT: req.fields.condition },
				{ COULEUR: req.fields.color },
				{ EMPLACEMENT: req.fields.city },
			],
		})

		//j'envoie mon image sur cloudinary
		const result = await cloudinary.uploader.upload(req.files.picture.path)
		// console.log(result);
		newOffer.product_image = result

		//Je rajoute mon utlisateur
		newOffer.owner = req.user

		await newOffer.save()
		res.json(newOffer)
	} catch (error) {
		res.status(400).json({ message: error.message })
	}
})

router.get("/offers", async (req, res) => {
	//Mon objet filtersObject viendra récupérer les différentds filtres
	const filtersObject = {}

	//Gestion du Title
	if (req.query.title) {
		filtersObject.product_name = new RegExp(req.query.title, "i")
	}

	if (req.query.priceMin) {
		filtersObject.product_price = {
			$gte: req.query.priceMin,
		}
	}

	//Si j'ai déjà une clé product_price dans mon objet objectFilters
	//il faut que j'ajoute dans cette clé

	if (req.query.priceMax) {
		if (filtersObject.product_price) {
			filtersObject.product_price.$lte = req.query.priceMax
		} else {
			filtersObject.product_price = {
				$lte: req.query.priceMax,
			}
		}
	}

	console.log(filtersObject)

	//Gestion du tri avec l'objet sortObject
	const sortObject = {}
	if (req.query.sort === "price-desc") {
		sortObject.product_price = "desc"
	} else if (req.query.sort === "price-asc") {
		sortObject.product_price = "asc"
	}

	//gestion de la pagination
	//On a pas défaut 5 annonces par pages
	//Si ma page est égale à 1 je devrais skip 0 annonces
	//Si ma page est égale à 2 je devrais skip 5 annonces
	//Si ma page est égale à 4 je devrais skip 15 annonces

	//(1-1) * 5 = skip 0 résultat => PAGE 1
	//(2-1) * 5 = SKIP 5 RÉSULTAT => page 2
	//(4-1) * 5 = skip 15 résultats => page 4

	let limit = 3
	if (req.query.limit) {
		limit = req.query.limit
	}

	let page = 1
	if (req.query.page) {
		page = req.query.page
	}
	const offers = await Offer.find(filtersObject)
		.sort(sortObject)
		.skip((page - 1) * limit)
		.limit(limit)
		.select("product_name product_price")

	const count = await Offer.countDocuments(filtersObject)

	res.json({ count: count, offers: offers })
})

router.get("/offer/:id", async (req, res) => {
	try {
		const offer = await Offer.findById(req.params.id).populate({
			path: "owner",
			select: "account.username account.phone",
		})
		res.json(offer)
	} catch (error) {
		res.status(400).json(error.message)
	}
})

module.exports = router
