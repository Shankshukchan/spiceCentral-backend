const mongoose = require("mongoose");
const connect = require("./db");
const MenuItem = require("./models/MenuItem");

(async function seed() {
  try {
    await connect();
    await MenuItem.deleteMany({});

    const items = [
      {
        id: "1",
        name: "Butter Chicken",
        description:
          "Tender chicken in a rich, creamy tomato sauce with aromatic spices",
        price: 14.99,
        category: "main course",
        image: "",
        isVegetarian: false,
        spiceLevel: 2,
      },
      {
        id: "2",
        name: "Chicken Biryani",
        description:
          "Fragrant basmati rice layered with spiced chicken and saffron",
        price: 16.99,
        category: "main course",
        image: "",
        isVegetarian: false,
        spiceLevel: 2,
      },
    ];

    await MenuItem.insertMany(items);
    console.log("Seeded menu items");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
