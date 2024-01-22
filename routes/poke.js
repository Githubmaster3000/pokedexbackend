var express = require("express");
var router = express.Router(); // Create an instance of the express router so you can use router.get below
const fs = require("fs"); // Import the fs module

let db = fs.readFileSync("db.json", "utf-8");
db = JSON.parse(db); // Parse the JSON string into an object
let { data } = db;

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flying",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

router.get("/pokemons", function (req, res, next) {
  console.log("Requested")
  const { page, limit, search, type } = req.query; // req.query is an object and the property value come from the url input in the browser
  let response = data
  if(search){
    response = response.filter((pokemon) => pokemon.name.includes(search));
  }
  if(type){
    response = response.filter((pokemon) => pokemon.types.includes(type));
  }

  if (page && limit) {
    response = response.slice((page - 1) * limit, page * limit);
  }
  res.json({ data: response });
  console.log(db);
});

router.get("/query", function (req, res, next) {
  const { type, name, id } = req.query;
  let filteredData = data;
  if (id) {
    filteredData = data.filter((item) => item.id == id);
  }
  if (type) {
    console.log(type);
    filteredData = filteredData.filter((item) => item.types.includes(type));
  }
  if (name) {
    filteredData = filteredData.filter((item) => item.name === name);
  }
  console.log(filteredData);
  res.json({ data: filteredData });
});

router.get("/pokemons/:id", (req, res) => {
  const { id } = req.params;
  let prevId = ((parseInt(id) - 1) % data.length || data.length);
  let nextId = ((parseInt(id) + 1) % data.length || 1);
  const previousPokemon = data.find((pokemon) => pokemon.id == parseInt(prevId));
  const pokemon = data.find((pokemon) => pokemon.id == parseInt(id));
  const nextPokemon = data.find((pokemon) => pokemon.id == parseInt(nextId));
  if (!pokemon || !previousPokemon || !nextPokemon) {
    return res.status(404).json({ error: "Pokemon not found" });
  }
  res.json({ previousPokemon, pokemon, nextPokemon });
})

router.post("/pokemons/addPokemon", function (req, res, next) {
  const { name, id, types, url } = req.body;

  // Error handling
  if (!name || !id || !types || !url) {
    return res.status(400).json({ error: "Missing required data." });
  }

  if (types.length > 2) {
    return res
      .status(400)
      .json({ error: "Pokémon can only have one or two types." });
  }

  if (!types.every((type) => pokemonTypes.includes(type))) {
    return res.status(400).json({ error: "Pokémon's type is invalid." });
  }

  if (data.some((pokemon) => pokemon.id === id || pokemon.name === name)) {
    return res.status(400).json({ error: "The Pokémon already exists." });
  }

  // Add the new Pokémon to the data array
  const newPokemon = { name, id, types, url };
  data.push(newPokemon);

  // Save the updated data to the database
  fs.writeFileSync("db.json", JSON.stringify({ data }));

  res
    .status(201)
    .json({ message: "Pokémon created successfully.", data: newPokemon });
});

router.put("/pokemons/:id", function (req, res, next) {
  const idToUpdate = parseInt(req.params.id);
  const { name, types, url } = req.body;
  
  // Find the Pokémon in the data array by ID
  const pokemonToUpdate = data.find((pokemon) => pokemon.id === idToUpdate);

  // If the Pokémon is not found, return an error
  if (!pokemonToUpdate) {
    return res.status(404).json({ error: "Pokemon not found" });
  }

  // Update the Pokémon data
  if (name) {
    pokemonToUpdate.name = name;
  }
  if (types) {
    // Validate the types
    if (
      types.length > 2 ||
      !types.every((type) => pokemonTypes.includes(type))
    ) {
      return res.status(400).json({ error: "Invalid types" });
    }
    pokemonToUpdate.types = types;
  }
  if (url) {
    pokemonToUpdate.url = url;
  }

  // Save the updated data to the database
  fs.writeFileSync("db.json", JSON.stringify({ data }));

  res.json({ message: "Pokemon updated successfully", data: pokemonToUpdate });
});


router.delete("/pokemons/:id", function (req, res, next) {
  const idToDelete = parseInt(req.params.id);

  // Find the index of the Pokémon in the data array by ID
  const indexToDelete = data.findIndex(pokemon => pokemon.id === idToDelete);

  // If the Pokémon is not found, return an error
  if (indexToDelete === -1) {
    return res.status(404).json({ error: "Pokemon not found" });
  }

  // Remove the Pokémon from the data array
  const deletedPokemon = data.splice(indexToDelete, 1)[0];

  // Save the updated data to the database
  fs.writeFileSync("db.json", JSON.stringify({ data }));

  res.json({ message: "Pokemon deleted successfully", data: deletedPokemon });
});

module.exports = router;
