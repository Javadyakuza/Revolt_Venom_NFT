const fs = require("fs")

const existingData = fs.readFileSync("./metadata/agents_metadata/1.json", 'utf-8');
 console.log(typeof existingData, existingData)