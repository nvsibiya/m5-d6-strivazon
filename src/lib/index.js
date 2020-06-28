const path = require("path")

const { readDB, writeDB } = require("./utilities")

const productsFile = path.join(__dirname, "../data/products.json")
const reviewsFile = path.join(__dirname, "../data/reviews.json")

module.exports = {
  getProducts: async () => readDB(productsFile),
  getReviews: async () => readDB(reviewsFile),
  writeProducts: async (data) => writeDB(productsFile, data),
  writeReviews: async (data) => writeDB(reviewsFile, data),
}
