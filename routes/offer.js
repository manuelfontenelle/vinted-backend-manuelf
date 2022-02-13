// Import du package 'express'
const express = require("express")
// Appel à la fonction Router(), issue du package 'express'
const router = express.Router()
// Import du package cloudinary
const cloudinary = require("cloudinary").v2

//import du modèle User et Offer
const User = require("../models/User")
const Offer = require("../models/Offer")

// Import du middleware isAuthenticated
const isAuthenticated = require("../middleware/isAuthenticated")

router.post("/offer/publish", isAuthenticated, async (req, res) => {
	console.log(req.user)
	try {
		const { title, description, price, brand, size, condition, color, city } =
			req.fields

		console.log(req.fields)
		if (title && price && req.files.picture.path) {
			const newOffer = new Offer({
				product_name: req.fields.title,
				product_description: description,
				product_price: price,
				product_details: [
					{ MARQUE: brand },
					{ TAILLE: size },
					{ ETAT: condition },
					{ COULEUR: color },
					{ EMPLACEMENT: city },
				],
				owner: req.user,
			})

			// Envoi de l'image à cloudinary
			const result = await cloudinary.uploader.unsigned_upload(
				req.files.picture.path,
				"ml_default",
				{
					folder: `api/vinted/offers/${newOffer._id}`,
					// public_id: "preview",
					// public_id: `preview + ${newOffer._id}`,
					public_id: `${newOffer._id}`,
					cloud_name: "manuelf-cloudinary",
				}
			)
			// console.log(result);
			newOffer.product_image = result

			//Je rajoute mon utlisateur
			newOffer.owner = req.user

			await newOffer.save()

			res.json(newOffer)
		} else {
			res.status(400).json({
				message: "title, price and picture are required",
			})
		}
	} catch (error) {
		res.status(400).json({ message: error.message })
	}
})

router.get("/offers", async (req, res) => {
	try {
		let filtersObject = {}

		//Gestion du Title
		if (req.query.title) {
			filtersObject.product_name = new RegExp(req.query.title, "i")
		}

		if (req.query.priceMin) {
			filtersObject.product_price = {
				$gte: req.query.priceMin,
			}
		}

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

		let limit = Number(req.query.limit)
		// let limit = 3;

		let page
		if (Number(req.query.page) < 1) {
			page = 1
		} else {
			page = Number(req.query.page)
		}
		// let page = 1;

		const offers = await Offer.find(filtersObject)
			.populate({
				path: "owner",
				select: "account",
			})
			.sort(sortObject)
			// .skip((page - 1) * limit)
			.limit(limit)
		// .select("product_name product_price")

		// cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
		const count = await Offer.countDocuments(filtersObject)

		res.json({
			count: count,
			offers: offers,
		})
	} catch (error) {
		//Mon objet filtersObject viendra récupérer les différentds filtres
		console.log(error.message)
		res.status(400).json({ message: error.message })
	}
})

router.get("/offer/:id", async (req, res) => {
	try {
		const offer = await Offer.findById(req.params.id).populate({
			path: "owner",
			select: "account.username account.phone",
		})
		res.json(offer)
	} catch (error) {
		console.log(error.message)
		res.status(400).json({ message: error.message })
	}
})

module.exports = router
