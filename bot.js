require('dotenv').config();

const token = process.env.TOKEN;

const { SelectMenuOptionBuilder } = require('@discordjs/builders');
const { Client, Intents } = require('discord.js');
const { waitForDebugger } = require('inspector');
const client = new Client({ intents: [Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_MESSAGES] });
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
//const keepUp = require("./server");


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// //SQL connection stuff
// var myssql = require('mysql');
// var DBconnection = myssql.createConnection({
//     host: process.env.SQLHOST,//logs into database 
//     port: process.env.SQLPORT,
//     user: process.env.SQLUSER,
//     password: process.env.SQLPASS,
//     database: "Bot_Database"
// });
// // Basic SQL Connect Function for operations.
// DBconnection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connection Success");
// });


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://bchou999:SMkduEKcjp5HsmML@botdatabase.ugtkihw.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const mongoclient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function setupMongo() {
  try {
    await mongoclient.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
}
setupMongo();

DBconnection = mongoclient.db("BotDatabase");



const spellLink = new RegExp('^s\{[a-z A-Z]*\}$');// finds commands of the form s{spell_name}
const alphaNeu = new RegExp('[A-Za-z0-9]');
const commandList = ["|help", "|intent", "|award", "|npcName", "|gpt4", "|randomSpell", "|buy", "|sellItem"]; //list of commands
const playerClasses = ["Artificer", "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin","Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];

//Responds to messages
client.on("messageCreate", msg => {
  if (msg.author.bot) {return;}// should not respond to itself.
  parent = msg.channel.parent;
  if (msg.content.startsWith(commandList[0])){//|help
    if (msg.content === commandList[0]) {
      let m = "List of all commands (Case sensitive):\n";
      for (let i = 0; i < commandList.length; ++i) {
        m = m.concat(commandList[i] + "\n");
      }
      msg.channel.send(m);
      msg.channel.send("For more specific details do |help <command>");
    }
    else {
      let params = msg.content.substring(commandList[0].length+1).split(" ");
      switch (params[0]){
        case "|help":
          msg.channel.send("Either lists all commands or describes command usage if given a parameter. Usage: |help <command>");
          break;
        case "|intent":
          msg.channel.send("Determines whether or not the message is Positive, Negative or Neutral. Responds with 'I believe this message is [judgement]'. Usage: |intent <message>");
          break;
        case "|award":
          msg.channel.send("Awards a random reward of the given type and level. Usage: |award <type> <level> <luckMod> <repeats>");
          msg.channel.send("Valid Types: 'Enemy', 'Hoard', 'MagicItem<rarity>'")
          break;
        case "|npcName":
          msg.channel.send("Generates a randomNPC with Race, Class level and Name");
          break;
        case "|randomSpell":
          msg.channel.send("Generates a random spell of the given level. Usage: |randomSpell <level>");
          break;
        case "|buy":
          msg.channel.send("Buying a magic item. Usage: |buy <charismaCheck>");
          break;
        default:
          msg.channel.send("That isn't a command. Don't ask for it to be implemented because the developer probably won't do it.");
      }
    }
  }
  else if (msg.content.startsWith(commandList[1])) {//|intent
    let content = msg.content.substring(commandList[1].length+1); //+1 to remove the space.
      openaiAPI(content, "chatSingular", "Determine whether or not the message is Positive, Negative or Neutral. Respond with 'I believe this message is [judgement].", 75).then((response) => msg.channel.send(response)); //sends the response to the channel
  }
  else if (msg.content.startsWith(commandList[2])) {//|award
    let content = msg.content.substring(commandList[2].length+1); //+1 to remove the space.
    let params = content.split(" "); //splits the message into an array of words
    //Params appear in order: [0] = type, [1] = level, [2] = luckMod (default: 0), [3] = repeats (default: 1)
    //Level and Type are required, LuckMod and Repeats are optional.
    if (params.length < 2) {
      msg.channel.send("Invalid parameters. Usage: |award <type> <level> <luckMod> <repeats>");
    }
    else {
      let type = params[0].toLowerCase();
      let level = params[1];
      let luckMod = 0;
      let repeats = 1;
      if (params.length > 2) {
        luckMod = params[2];
      }
      if (params.length > 3) {
        repeats = params[3];
      }
      sendAsyncMessage("award", msg.content, msg.channel, [type, level, luckMod, repeats]);
    }
  }
  else if (msg.content.startsWith(commandList[3])) {//|npcName
    let content = msg.content.substring(commandList[3].length+1); //+1 to remove the space.
    //if no parameters are given
    if (content.length < 1) {
      sendAsyncMessage("npcName", msg.content, msg.channel, null);
    }
    else if (content.startsWith("CUSTOM")) {//User is using fill in the blank mode
      //Expects a set of params after CUSTOM: [Gender, Race, Class, Level].
      //Setting a param is a message including param=value
      let params = content.substring(7).split(" "); //+7 to remove the CUSTOM and the space.
      //params is now a list of strings of the form param=value
      toPass = [null, null, null, null]; //order matters here
      //params

      //if any element includes 'param='
      for (let i = 0; i < params.length; ++i) {
        if (params[i].toLowerCase().startsWith("gender=")) {
          toPass[0] = params[i].substring(7);
        }
        else if (params[i].toLowerCase().startsWith("race=")) {
          toPass[1] = params[i].substring(5);
        }
        else if (params[i].toLowerCase().startsWith("class=")) {
          toPass[2] = params[i].substring(6);
        }
        else if (params[i].toLowerCase().startsWith("level=")) {
          toPass[3] = params[i].substring(6);
        }
      }

      sendAsyncMessage("npcName", msg.content, msg.channel, toPass); 

    }
    else {
      sendAsyncMessage("npcName", msg.content, msg.channel, content);
    } 

  }
  else if (msg.content.startsWith(commandList[4])) {//|gpt4
    let content = msg.content.substring(commandList[4].length+1); //+1 to remove the space.
    //Repeat the user's prompt and ask for confirmation
    msg.channel.send("You said: " + content + "\nIs this correct? (y/n)");
    //Wait for a response
    const filter = (m) => !m.author.bot && m.author.id === msg.author.id;
    const collector = msg.channel.createMessageCollector(filter, { time: 15000 });
    collector.on('collect', (m) => {
      if (m.author.id === msg.author.id){
        if (m.content.toLowerCase() === 'y') {
          // User confirmed, do something
          msg.channel.send("Generating response for: " + content + "\nPlease wait...");
          sendAsyncMessage("gpt4", msg.content, msg.channel, [content, "gpt4Singular", "Give a response to the prompt. Limit response to < 1000 characters and don't give any unrelated details", 250]);
          collector.stop();
        }
        else if (m.content.toLowerCase() === 'n') {
          // User denied, do something else
          msg.channel.send("Cancelling request.")
          collector.stop();
        }
        else {
          msg.channel.send("Invalid response: " + m.content + "\n by: " + m.author.username + "\nCancelling request.");
          collector.stop();
        }
      }
    });
    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        // User didn't respond in time, do something else
        msg.channel.send("Request timed out.");
      }
    });
  }
  else if (msg.content.startsWith(commandList[5])) {//|randomSpell
    let content = msg.content.substring(commandList[5].length+1); //+1 to remove the space.
    //if no parameters are given
    if (content.length < 1) {
      sendAsyncMessage("spell", msg.content, msg.channel, null);
    }
    else {
      //we oly accept one parameter, the level
      let level = content[0];
      sendAsyncMessage("spell", msg.content, msg.channel, [level]);
    }
  }
  else if (msg.content.startsWith(commandList[6])) {//|buy
    let content = msg.content.substring(commandList[6].length+1); //+1 to remove the space.
    //if no parameters are given
    if (content.length < 1) {
      msg.channel.send("Invalid parameters. Usage: |buy <type> <relevant info>");
    }
    else {
      let params = content.split(" "); //splits the message into an array of words
      let type = params[0].toLowerCase();
      let infoArr = params.slice(1);
      sendAsyncMessage("buy", msg.content, msg.channel, [type, infoArr]);
    }
  }
  else if (msg.content.startsWith(commandList[7])) {//|sellItem
    let content = msg.content.substring(commandList[7].length+1); //+1 to remove the space.
    //if no parameters are given
    if (content.length < 1) {
      msg.channel.send("Invalid parameters. Usage: |sellItem <rarity> <charismaCheck>");
    }
    else {
      let params = content.split(" "); //splits the message into an array of words 
      let rarity = params[0].toLowerCase();
      let charismaCheck = params[1];
      sendAsyncMessage("sellItem", msg.content, msg.channel, [rarity, charismaCheck]);
    }
  }
  else if (msg.content === 'test') {
    //test stuff
    //Currently Testing: getRandomLevel
    // msg.channel.send("No function up for testing at this time.");
    //sendAsyncMessage("hoard", msg.content, msg.channel, [6, true, 0]);
    //msg.channel.send(getRandomLevel(0.2).toString());
    //sendAsyncMessage("item", msg.content, msg.channel, ["Common",4, "-"]);
    //sendAsyncMessage("spell", msg.content, msg.channel, null);
  }

  //RP stuff
  if (parent && parent.name === 'Secret Game') {
    const channelName = msg.channel.name;
  
    // Call an async function to handle the rest of the stuff
    readFromOtherChannel(msg.guild, channelName,'Answers')
      .then(result => {
        // Send the result to the original message channel
        msg.channel.send(result);
      })
      .catch(error => {
        // Send an error message to the original message channel
        msg.channel.send(`Error: ${error}`);
      });
  }

  //echo 
  if (msg.content.startsWith("echo")) {
    sendMessageIn("test", msg.content.substring(5));
  }

  //Anonimyzing message test
  //if message is in channel... 
  if (msg.channel.name === "zoreth") {
    sendMessageIn("test", "Zoreth: " + msg.content);
  }

});

async function readFromOtherChannel(guild, channelName, targetCategory) {
  // Input validation
  if (!guild) {
    return "Guild object is required.";
  }
  if (typeof channelName !== 'string' || channelName.trim() === '') {
    return "Channel name must be a non-empty string.";
  }
  if (typeof targetCategory !== 'string' || targetCategory.trim() === '') {
    return "Target category must be a non-empty string.";
  }

  // Find the target category and the corresponding channel
  const category = await guild.channels.cache.find(channel => 
    channel.type === 'GUILD_CATEGORY' && channel.name === targetCategory
  );
  
  const channel = category?.children?.find(channel => channel.name === channelName);

  // If the target category or the corresponding channel couldn't be found, return an error message
  if (!category) {
    return `Couldn't find the '${targetCategory}' category.`;
  }
  if (!channel) {
    return `Couldn't find a channel named '${channelName}' in the '${targetCategory}' category.`;
  }

  // Find the most recent message in the corresponding channel
  const messages = await channel.messages.fetch({ limit: 1 });
  const recentMessage = messages.first();

  // If there are no messages in the channel, return an error message
  if (!recentMessage) {
    return `There are no messages in the '${channelName}' channel of the '${targetCategory}' category.`;
  }

  // Return the content of the most recent message in the corresponding channel
  return recentMessage.content;
}

// Define a function that takes a channel name and a string as parameters
function sendMessageIn(channelName, string) {
  // Check if the parameters are valid
  if (typeof channelName !== "string" || typeof string !== "string") {
    // Return an error message and log it
    let errorMessage = "Invalid parameters";
    console.error(errorMessage);
    return errorMessage;
  }
  // Find the channel by its name
  let channel = client.channels.cache.find(ch => ch.name === channelName);
  // If the channel exists, send the string there
  if (channel) {
    channel.send(string);
  }
  // Otherwise, return an error message and log it
  else {
    let errorMessage = "Channel not found";
    console.error(errorMessage);
    return errorMessage;
  }
}

//Handles whenever I need to send a message that involves a promise.
//Takes in a type, a user message, a channel, and any other parameters.
async function sendAsyncMessage(type, userMessage, channel, params) {
  switch(type) {
    case "spell": //pullRandomSpell expecting [level]
      let spell = await pullRandomSpell(params);
      channel.send(spell);
      break;
    case "item": //pullRandomItem expecting [rarity, type, attunement]
      let item = await pullRandomItem(params);
      channel.send(item);
      break;
    case "magicItemTable": //magicItemTables
      let table = await magicItemTables(params);
      channel.send(table);
      break;
    case "individualTreasure": //generateIndividualTreasure
      let treasure = await generateIndividualTreasure(params);
      channel.send(treasure);
      break;
    case "hoard": //treasureHoard
      let hoard = await treasureHoard(params);
      channel.send(hoard);
      break;
    case "award": //command: |award
      let awardResult = await award(params[0], params[1], params[2], params[3]);
      channel.send(awardResult);
      break;
    case "npcName": //command: |npcName
      //if params is a string (valid description)
      if (typeof params === 'string') {
        let npcName = await npcNameGen(params);
        channel.send(npcName);
      }
      //if params is an array (fill in the blank(s))
      else if (params === null) {
        let npcName = await npcNameGen([null, null ,null, null]);
        channel.send(npcName);
      }
      else { //array only
        let npcName = await npcNameGen(params);
        channel.send(npcName);
      }
      break;
    case "gpt4":
      let msg = await openaiAPI(params[0], params[1], params[2], params[3]);
      channel.send(msg);
      break;
    case "buy":
      let purchaseOptions = await buy(params[0], params[1]);
      channel.send(purchaseOptions);
      break;
    case "sellItem":
      let offer = await sellItem(params[0], params[1]);
      channel.send(offer);
    default:
      break;
  }
}

//Rolls a specified number of dice with a specified number of sides.
function rollDice(die, rolls) {
  if (die < 1) {return [0];} 
  let toReturn = [];
  let total = 0;
  for (let i = 0; i < rolls; ++i) {
    let result = randomInt(1, die);
    total += result;
    toReturn.push(result);
  }
  toReturn.push(total);
  return toReturn;
}

function randomInt(min,max) {//includes min and max
  return Math.floor(Math.random() * ((max+1)-min)) + min;
}

//Returns True a specified percent of the time
function percentChance(percent) {
  return randomInt(1,100) <= percent;
}

//Returns a string of the Individual Treasure based on the desired level.
//params are the level and the luck modifier. [0] = level, [1] = luckMod
async function generateIndividualTreasure(params) {
  let level = params[0];
  let luckMod = params[1];
  let num = [];
    switch(level) {
      case 1:
        num = rollDice(6,5);
        return "" + num[num.length-1] + " Copper Pieces";
      case 2:
        num = rollDice(6,4);
        return "" + num[num.length-1] + " Silver Pieces";
      case 3:
        num = rollDice(6,2)
        return "" + num[num.length-1] + " Gold Pieces";
      case 4:
        num = rollDice(6,3)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["A", 1, luckMod]);
      case 5:
        num = rollDice(6,10)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["A", 1, luckMod]);
      case 6:
        num = rollDice(6,26)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["B", 1, luckMod]);
      case 7:
        num = rollDice(6,35)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["B", 1, luckMod]);
      case 8:
        num = rollDice(12,20)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["C", 1, luckMod]);
      case 9:
        num = rollDice(12,25)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["C", 1, luckMod]);
      case 10:
        num = rollDice(12,33)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["J", 1, luckMod]);
      case 11:
        num = rollDice(24,35)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["J", 1, luckMod]);
      case 12:
        num = rollDice(24,38)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["D", 1, luckMod]);
      case 13:
        num = rollDice(24,75)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["D", 1, luckMod]);
      case 14:
        num = rollDice(48,50)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["K", 1, luckMod]);
      case 15:
        num = rollDice(48,65)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["K", 1, luckMod]);
      case 16:
        num = rollDice(96,40)
        return percentChance(75) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["E", 1, luckMod]);
      case 17:
        num = rollDice(192,56)
        return percentChance(65) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["E", 1, luckMod]);
      case 18:
        num = rollDice(192,63)
        return percentChance(55) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["E", 1, luckMod]);
      case 19:
        num = rollDice(192,94)
        return percentChance(45) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["E", 1, luckMod]);
      case 20:
        num = rollDice(400,50)
        return percentChance(50) ? "" + num[num.length-1] + " Gold Pieces" : magicItemTables(["L", 1, luckMod]);
      default:
        if (level <= 0) {callback("Invalid Level Provided");}
        else {
          num = rollDice(400,50);
          num = num[num.length-1];
          for (let z = 0; z < level - 20; ++z) {
            num *= ((randomInt(1,50)/100)+1);
          }
          let rolls = Math.round(num / 12000) + 1;
          if (rolls > 5) {rolls = 7;}
          return percentChance(50) ? "" + Math.round(num) + " Gold Pieces" : magicItemTables(["L", rolls, luckMod]);
        }
    }

    //callback(level + " Copper");
}
//Returns an executes a returns results based on the table
//params is [table, rolls (default: 1), luckmod(default: 0), Optional: returnRarity (default: false)]
async function magicItemTables(params) {
  
  if (params.length < 2) {return "Invalid Parameters: " + params + " . must be [table, rolls, luckmod]";}
  let table = params[0];
  let rolls = params[1];
  let luckMod = params[2];
  let returnRarity = params[3];
  let rarity = null;
  //Validate and set defaults
  if (typeof table !== "string" && typeof table !== "number") {return "Invalid Table";}
  if (typeof rolls !== "number") {rolls = 1;}
  if (typeof luckMod !== "number") {luckMod = 0;}
  if (typeof returnRarity !== "boolean") {returnRarity = false;}

  //Convert table to number.
  if (typeof table === "string") {
    switch(table) {
      case "A": table = 1; break;
      case "B": table = 2; break;
      case "C": table = 3; break;
      case "D": table = 4; break;
      case "E": table = 5; break;
      case "F": table = 6; break;
      case "G": table = 7; break;
      case "H": table = 8; break;
      case "I": table = 9; break;
      case "J": table = 10; break;
      case "K": table = 11; break;
      case "L": table = 12; break;
    }
  }
  let originalTable = table;
  let luck = luckMod * 15;

  let toRet = "";
    for (let i = 0; i < rolls; ++i) {
      let roll = randomInt(1,100);
      let table = originalTable; //Reset table to original
      roll += luck;
      
      //If roll exceeds 100, set to 100 and increment table by 1 for each 100 maxing out at 9. If 9 send to table 12.
      if (roll > 100) {
        //table < 9
        if (table < 9) {
          table += Math.floor(roll / 100);
          if (table > 9) {table = 9;}
        }
        //table = 9
        else if (table === 9) {
          table = 12;
        }
        //table > 9
        else {
          table += 1;
          if (table > 12) {table = 12;} 
        }
        roll = randomInt(1,100); //Re-randomize roll
      }
      switch(table) {
        case 1:
        case "A": 
          if (roll <= 40) {toRet += ("Potion of Healing"); rarity = "Common";}
          else if (roll <= 50) {toRet += await pullRandomItem(["Common", null, null, null, "Potion"]); rarity = "Common";}
          else if (roll <= 60) {toRet += "Spell Scroll: " + await pullRandomSpell(["0", null, null, null, null, null, null, null]); rarity = "Common";}
          else if (roll <= 70) {toRet += await pullRandomItem(["Common", null, "Potion", null, null]); rarity = "Common";}
          else if (roll <= 90) {toRet += "Spell Scroll: " + await pullRandomSpell(["1", null, null, null, null, null, null, null]); rarity = "Common";}
          else if (roll <= 94) {toRet += "Spell Scroll: " + await pullRandomSpell(["2", null, null, null, null, null, null, null]); rarity = "Uncommon";}
          else if (roll <= 98) {toRet += "Potion of Greater Healing"; rarity = "Uncommon";}
          else if (roll <= 100) {toRet += await pullRandomItem(["Uncommon", null, null, null, "Potion"]); rarity = "Uncommon";}
          break;
        case 2:
        case "B":
          if (roll <= 15) {toRet += "Potion of Greater Healing"; rarity = "Uncommon";}
          else if (roll <= 50) {toRet += await pullRandomItem(["Uncommon", null, "Potion", null, null]); rarity = "Uncommon";}
          else if (roll <= 90) {toRet += await pullRandomItem(["Uncommon", null, null, null, "Potion"]); rarity = "Uncommon";}
          else if (roll <= 95) {toRet += "Spell Scroll: " + await pullRandomSpell(["2", null, null, null, null, null, null, null]); rarity = "Uncommon";}
          else if (roll <= 100) {toRet += "Spell Scroll: " + await pullRandomSpell(["3", null, null, null, null, null, null, null]); rarity = "Uncommon";}
          break;
        case 3:
        case "C":
          if (roll <= 15) {toRet += "Potion of Superior Healing"; rarity = "Rare";}
          else if (roll <= 58) {toRet += await pullRandomItem(["Rare", null, "Potion", null, null]); rarity = "Rare";}
          else if (roll <= 84) {toRet += await pullRandomItem(["Rare", null, null, null, "Potion"]); rarity = "Rare";}
          else if (roll <= 91) {toRet += "Spell Scroll: " + await pullRandomSpell(["4", null, null, null, null, null, null, null]); rarity = "Rare";}
          else if (roll <= 96) {toRet += "Spell Scroll: " + await pullRandomSpell(["5", null, null, null, null, null, null, null]); rarity = "Rare";}
          else if (roll <= 100) {toRet += await pullRandomItem(["Uncommon", null, null, null, "Potion"]); rarity = "Uncommon";}
          break;
        case 4:
        case "D":
          if (roll <= 20) {toRet += "Potion of Supreme Healing"; rarity = "Very Rare";}
          else if (roll <= 59) {toRet += await pullRandomItem(["VeryRare", null, "Potion", null, null]); rarity = "Very Rare";}
          else if (roll <= 60) {toRet += await pullRandomItem(["Rare", null, null, null, "Potion"]); rarity = "Rare";}
          else if (roll <= 70) {toRet += "Spell Scroll: " + await pullRandomSpell(["6", null, null, null, null, null, null, null]); rarity = "Very Rare";}
          else if (roll <= 77) {toRet += "Spell Scroll: " + await pullRandomSpell(["7", null, null, null, null, null, null, null]); rarity = "Very Rare";}
          else if (roll <= 82) {toRet += "Spell Scroll: " + await pullRandomSpell(["8", null, null, null, null, null, null, null]); rarity = "Very Rare";}
          else if (roll <= 100) {toRet += await pullRandomItem(["VeryRare", null, null, null, "Potion"]); rarity = "Very Rare";}
          break;
        case 5:
        case "E":
          if (roll <= 15) {toRet += "Potion of Supreme Healing"; rarity = "Very Rare";}
          else if (roll <= 40) {toRet += await pullRandomItem(["Legendary", null, "Potion", null, null]); rarity = "Legendary";}
          else if (roll <= 50) {toRet += await pullRandomItem(["Legendary", null, null, null, "Potion"]); rarity = "Legendary";}
          else if (roll <= 80) {toRet += "Spell Scroll: " + await pullRandomSpell(["8", null, null, null, null, null, null, null]); rarity = "Very Rare";}
          else if (roll <= 95) {toRet += "Spell Scroll: " + await pullRandomSpell(["9", null, null, null, null, null, null, null]); rarity = "Legendary";}
          else if (roll <= 100) {toRet += await pullRandomItem(["VeryRare", null, null, null, "Potion"]); rarity = "Very Rare";}
          break;
        case 6:
        case "F":
          toRet += await pullRandomItem(["Uncommon", null, null, null, "Potion"]);
          rarity = "Uncommon";
          break;
        case 7:
        case "G":
          toRet += await pullRandomItem(["Rare", null, null, null, "Potion"]);
          rarity = "Rare";
          break;
        case 8:
        case "H":
          toRet += await pullRandomItem(["VeryRare", null, null, null, "Potion"]);
          rarity = "Very Rare";
          break;
        case 9:
        case "I":
          toRet += await pullRandomItem(["Legendary", null, null, null, "Potion"]);
          rarity = "Legendary";
          break;
        case 10:
        case "J":
          if (roll <= 25) {toRet += await pullRandomItem(["Common", null, null, null, "Potion"]); rarity = "Common";}
          else if (roll <= 75) {toRet += await pullRandomItem(["Uncommon", null, null, null, "Potion"]); rarity = "Uncommon";}
          else if (roll <= 88) {toRet += await pullRandomItem(["Rare", null, null, null, "Potion"]); rarity = "Rare";}
          else if (roll <= 100) {toRet += await pullRandomItem(["VeryRare", null, null, null, "Potion"]); rarity = "Very Rare";}
          break;
        case 11:
        case "K":
          if (roll <= 25) {toRet += await pullRandomItem(["Uncommon", null, null, null, "Potion"]); rarity = "Uncommon";}
          else if (roll <= 75) {toRet += await pullRandomItem(["Rare", null, null, null, "Potion"]); rarity = "Rare";}
          else if (roll <= 88) {toRet += await pullRandomItem(["VeryRare", null, null, null, "Potion"]); rarity = "Very Rare";}
          else if (roll <= 100) {toRet += await pullRandomItem(["Legendary", null, null, null, "Potion"]); rarity = "Legendary";}
          break;
        case 12:
        case "L":
          if (roll <= 25) {toRet += await pullRandomItem(["Rare", null, null, null, "Potion"]); rarity = "Rare";}
          else if (roll <= 75) {toRet += await pullRandomItem(["VeryRare", null, null, null, "Potion"]); rarity = "Very Rare";}
          else if (roll <= 88) {toRet += await pullRandomItem(["Legendary", null, null, null, "Potion"]); rarity = "Legendary";}
          else if (roll <= 100) {toRet += await pullRandomItem(["Artifact", null, null, null, "Potion"]); rarity = "Artifact";}
          break;
        default:
          return "Invalid Table Selection: " + table;
      }
      if (returnRarity) {
        //remove new line if it exists
        if (toRet.charAt(toRet.length-1) === "\n") {toRet = toRet.substring(0, toRet.length-1);}
        toRet += " (" + rarity + ") \n";
        //add new line back
      }
      //if there's no new line, add one
      else if (toRet.charAt(toRet.length-1) !== "\n") {toRet += "\n";}
    }
    //Returns in the form of "Item (Rarity)" or "Item" if returnRarity is false
    return toRet;
}

//Connects to DB and pulls a random spell based on the params. Returns the result string
//params is an array the form [level: int, school: string, castingTime: string, range: String, duration: String, Components: String (VSM), Ritual (boolean), Concentration (boolean)]
//a null value is skipped over. 
async function pullRandomSpell(params) { 
  // Convert the params data types to the correct ones if they exist. If this fails, return an error message
  if (params !== null) {
    for (let i = 0; i < params.length; ++i) {
      let value = params[i];
      if (value !== null) {
        switch (i) {
          case 0:
            params[i] = parseInt(value);
            if (isNaN(params[i])) {return "Invalid Level: " + value;}
            break;
          case 6:
          case 7:
            params[i] = value.toLowerCase();
            if (params[i] !== "true" && params[i] !== "false") {return "Invalid Boolean: " + value;}
            params[i] = (params[i] === "true");
            break;
          default:
            break;
        }
      }
    }
  }
  // Create a filter object based on the params array
  let filter = {};
  if (params !== null) {
    for (let i = 0; i < params.length; ++i) {
      let value = params[i];
      if (value !== null && alphaNeu.test(value)) {
        switch (i) {
          case 0:
            filter.Level = value; // Use dot notation to access the fields
            break;
          case 1:
            filter.School = { $regex: value, $options: "i" }; // Use $regex operator for pattern matching
            break;
          case 2:
            filter.castingTime = { $regex: value, $options: "i" };
            break;
          case 3:
            filter.spellRange = { $regex: value, $options: "i" };
            break;
          case 4:
            filter.Duration = { $regex: value, $options: "i" };
            break;
          case 5:
            let vsm = "";
            if (value.length > 3) {continue;}
            else {
              for (let j = 0; j < value.length; ++j) {
                vsm+= value.charAt(j);
                if (j != value.length-1) {vsm += ", "}
              }
            }
            filter.Components = { $regex: vsm.toUpperCase(), $options: "i" };
            break;
          case 6:
            if (value === "true") {
              filter.castingTime = { $regex: " R", $options: "i" };
            }
            break;
          case 7:
            if (value === "true") {
              filter.Duration = { $regex: "Concentration", $options: "i" };
            }
            break;
          default:
            continue;
        }
      }
    }
  }
  return new Promise(async (resolve, reject) => {
    // Connect to the Spells collection and find the documents that match the filter
    findResult = DBconnection.collection("Spells").find(filter);  
    // Convert the cursor to an array
    findResult = await findResult.toArray();  
    // Check if the array is empty
    if (findResult.length === 0) {
      resolve("No spells found");
      return;
    }
    // Get a random spell from the array and return its name
    resolve(findResult[randomInt(0, findResult.length - 1)].spellName);
      
  });
}

//Connects to DB and pulls a random item based on the params. Then returns the result string. May execute more times based on the number param
//params are expected to be an array in the form: [rarity: string, number: int, type: string, attunement: string, notCategory: string]
async function pullRandomItem(params) {
  // Convert the params data types to the correct ones. If this fails, return an error message
  try {
    if (params !== null) {
      params[1] = parseInt(params[1]);
    }
  } catch (err) {
    return "Invalid Parameters: " + err;
  }

  //set number to 1 if it is null or anything other than a number
  if (params[1] === null || isNaN(params[1]) || params[1] == 0) {params[1] = 1;}

  
  // Create a filter object based on the params array
  let filter = {};
  if (params !== null) {
    for (let i = 0; i < params.length; ++i) {
      let value = params[i];
      if (value !== null && alphaNeu.test(value)) {
        switch (i) {
          case 0:
            filter.rarity = value; // Use dot notation to access the fields
            break;
          case 2:
            filter.type = { $regex: value, $options: "i" }; // Use $regex operator for pattern matching
            break;
          case 3:
            if (value === "true") {
              filter.attunement = { $regex: "Attuned", $options: "i" };
            }
            else if (value === "false") {
              filter.attunement = { $not: { $regex: "Attuned", $options: "i" } }; // Use $not operator for negation
            }
            break;
          case 4:
            filter.type = { $not: { $regex: value, $options: "i" } };
            break;
          default:
            continue;
        }
      }
    }
  }

  return new Promise(async (resolve, reject) => {
    // Connect to the Items collection and find the documents that match the filter
    findResult = DBconnection.collection("Items").find(filter);  

    // Convert the cursor to an array
    findResult = await findResult.toArray()

    // Check if the array is empty
    if (findResult.length === 0) {
      resolve("No items found");
      return;
    }

    // Get a random item from the array X times, where X is the number parameter
    let result = "";
    for (let i = 0; i < params[1]; ++i) {
      result += findResult[randomInt(0, findResult.length - 1)].itemName + "\n";
    }
    resolve(result);
      
  });
}


//Connects to DB and pulls a random race based on the params. Then returns the result string. May execute more times based on the number param
//params are expected to be an array in the form: [number: int, type: int] where type is 1 for common, 2 for exotic, 3 for monstrous, and 4 for any. Default is common
async function pullRandomRace(params) {

  // Create a filter object based on the params array
  let filter = {};
  let type = params[1];
  if (type !== null) {
    switch (type) {
      case 1:
        filter.type = "Common"; // Use dot notation to access the fields
        break;
      case 2:
        filter.type = "Exotic";
        break;
      case 3:
        filter.type = "Monstrous";
        break;
      case 4:
        // No filter needed for any type
        break;
      default:
        filter.type = "Common";
    }
  }

  return new Promise(async (resolve, reject) => {
    // Connect to the Races collection and find the documents that match the filter
    findResult = DBconnection.collection("Races").find(filter);  

    // Convert the cursor to an array
    findResult = await findResult.toArray()

    // Check if the array is empty
    if (findResult.length === 0) {
      resolve("No Race Fit Criteria");
      return;
    }

    // Check if the params array number is valid
    let number = params[0];
    if (number != null && number !== NaN && number > 0) {
      returnstring = "";
      for (let j = 0; j < number; ++j) {
        returnstring += findResult[randomInt(0,findResult.length-1)].name + "\n";
      }
      //remove the last newline character
      returnstring = returnstring.slice(0, -1);
      resolve(returnstring);
    }
    else {//Executes once if invalid number criteria
      resolve(findResult[randomInt(0,findResult.length-1)].name)
    }
      
  });
}


//Produces a treasure hoard given a level and returns the response. Note that treasureHoard calls maTable
//params are expected to be an array in the form: [level: int, items: boolean, luckMod: int]
async function treasureHoard(params) { 
  //Items is whether or not to include items in the treasure hoard. Defaults to true
  let level = params[0];
  let items = params[1];
  let luckMod = params[2];
  if (items === undefined) {items = true;}
  let rewardsString = "";
  let copper = 0;
  let silver = 0;
  let gold = 0;
  let platinum = 0;
  let sellablesNum = 0;
  let sellableType = percentChance(50); //true == gems false == art
  let sellableVals = [];
  let sellable = "";
  (sellableType) ? sellableVals = [10, 50, 100, 500, 1000, 5000] : sellableVals = [25, 250, 750, 2500, 7500];
  (sellableType) ? sellable = "Gems" : sellable = "Art Objects";
  switch(level) {
    case 1:
    case 2:
    case 3:
    case 4:
      copper = Math.round(rollDice(6,6)[6] * 100 * ((randomInt(-25,25)/100)+1));
      silver = Math.round(rollDice(6,3)[3] * 100 * ((randomInt(-25,25)/100)+1));
      gold = Math.round(rollDice(6,2)[2] * 10 * ((randomInt(-25,25)/100)+1));
      sellablesNum = rollDice(6,2)[2];
      rewardsString = copper + " Copper\n" + silver + " Silver\n" + gold + " Gold\n" + sellablesNum + " " + sellable + " worth " + sellableVals[(sellableType) ? randomInt(0,1) : 0] + "gp"; 
      break;
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
      copper = Math.round(rollDice(6,2)[2] * 100 * ((randomInt(-25,25)/100)+1));
      silver = Math.round(rollDice(6,2)[2] * 1000 * ((randomInt(-25,25)/100)+1));
      gold = Math.round(rollDice(6,6)[6] * 100 * ((randomInt(-25,25)/100)+1));
      platinum = Math.round(rollDice(6,3)[3] * 10 * ((randomInt(-25,25)/100)+1));
      sellablesNum = rollDice(6,3)[3];
      rewardsString = copper + " Copper\n" + silver + " Silver\n" + gold + " Gold\n" + platinum + " Platinum\n" + sellablesNum + " " + sellable + " worth " + sellableVals[(sellableType) ? randomInt(1,2) : randomInt(0,1)] + "gp";
      break;
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
    case 16:
      gold = Math.round(rollDice(6,4)[4] * 1000 * ((randomInt(-25,25)/100)+1));
      platinum = Math.round(rollDice(6,5)[5] * 100 * ((randomInt(-25,25)/100)+1));
      sellablesNum = rollDice(6,3)[3];
      rewardsString = gold + " Gold\n" + platinum + " Platinum\n" + sellablesNum + " " + sellable + " worth " + sellableVals[(sellableType) ? randomInt(3,4) : randomInt(1,2)] + "gp";
    default:
      if (level < 1) {rewardsString = "Unimplemented Level"}
      else if (level > 16) {
        gold = Math.round(rollDice(6,12)[12] * 1000 * ((randomInt(-25,25)/100)+1));
        platinum = Math.round(rollDice(6,8)[8] * 100 * ((randomInt(-25,25)/100)+1));
        sellablesNum = rollDice(6,6)[6];
        rewardsString = gold + " Gold\n" + platinum + " Platinum\n" + sellablesNum + " " + sellable + " worth " + sellableVals[(sellableType) ? randomInt(4,5) : randomInt(3,4)] + "gp";
      }
  }
  if (items) {
    table = "";
    rolls = 0;
    x = randomInt(1,100);
    // Apply Luck modfier 
    if (luckMod === undefined) {luckMod = 0;}
    x += luckMod * 15; // 15 is the boost per luck point
    if (x < 1) {x = 1;}
    // For every 100 x is greater than 100, add 1 to the level tier
    while (x > 100) {
      x -= 100;
      level += 6;
    }

    if (level < 5) {
      if (x < 24) {table = "A"; rolls = randomInt(1,6);}
      else if (x < 47) {table = "B"; rolls = randomInt(1,4);}
      else if (x < 70) {table = "C"; rolls = randomInt(1,4);}
      else if (x < 86) {table = "F"; rolls = randomInt(1,4);}
      else {table = "G"; rolls = 1;}
    }
    else if (level < 11) {
      if (x < 16) {table = "J"; rolls = randomInt(1,6);}
      else if (x < 30) {table = "A"; rolls = randomInt(1,6);}
      else if (x < 44) {table = "B"; rolls = randomInt(1,4);}
      else if (x < 58) {table = "C"; rolls = randomInt(1,4);}
      else if (x < 72) {table = "D"; rolls = randomInt(1,4);}
      else if (x < 86) {table = "F"; rolls = randomInt(1,4);}
      else if (x < 94) {table = "G"; rolls = randomInt(1,4);}
      else {table = "H"; rolls = 1;}
    }
    else if (level < 17) {
      if (x < 16) {table = "K"; rolls = randomInt(1,6);}
      else if (x < 28) {table = "B"; rolls = randomInt(1,8);}
      else if (x < 40) {table = "C"; rolls = randomInt(1,6);}
      else if (x < 52) {table = "D"; rolls = randomInt(1,4);}
      else if (x < 64) {table = "E"; rolls = 1;}
      else if (x < 76) {table = "K"; rolls = randomInt(1,8);}
      else if (x < 88) {table = "H"; rolls = randomInt(1,4);}
      else {table = "I"; rolls = 1;}
    }
    else {
      if (x < 3) {table = "L"; rolls = randomInt(1,4);}
      else if (x < 15) {table = "C"; rolls = randomInt(1,8);}
      else if (x < 46) {table = "D"; rolls = randomInt(1,6);}
      else if (x < 68) {table = "E"; rolls = randomInt(1,6);}
      else if (x < 72) {table = "G"; rolls = randomInt(1,4);}
      else if (x < 80) {table = "H"; rolls = randomInt(1,4);}
      else {table = "I"; rolls = randomInt(1,4);}
    }
    rewardsString += "\n" + await magicItemTables([table, rolls, luckMod]);

    return rewardsString;
  }

}

//calls the openai api. Expects a String Prompt, a String type, Instruction is optional and only used for chatSingular. maxTokens is optional and defaults to Infinity.
//temperature is optional and defaults to 1. It can be from 0 to 2. 0 is very conservative and 2 is very creative.
async function openaiAPI(inputPrompt, type, instruction, maxTokens, temperature) {
  if (maxTokens == null) {maxTokens = Infinity}
  if (temperature == null || temperature < 0 || temperature > 2) {temperature = 1}
  let systemMessage = null;
  let userMessage = null;
  let messages = null;
  switch (type) {
    case "chatSingular": //chatSingular is for when the user is only sending one message. History is not supported. 
      systemMessage = constructMessageObj("system", instruction);
      userMessage = constructMessageObj("user", inputPrompt);
      messages = [systemMessage, userMessage];
      console.log("Sending: " + messages[1].content + " to OpenAI.")
      try {
        let completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messages,
          max_tokens: maxTokens,
          temperature: temperature
        });
        return completion.data.choices[0].message.content;
      } catch (err) {
        //get status code to include in error message
        let statusCode = err.response.status;
        return "Something went wrong. Please try again. Error code: " + statusCode;
      }
    case "gpt4Singular": //GPT4 is for the more advanced model that costs about 10x as much. History is not supported.
      if (maxTokens == Infinity) {maxTokens = 64}
        systemMessage = constructMessageObj("system", instruction);
        userMessage = constructMessageObj("user", inputPrompt);
        messages = [systemMessage, userMessage];
        console.log("Sending: " + messages[1].content + " to OpenAI.")
        try {
          let completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: messages,
            max_tokens: maxTokens,
            temperature: temperature
          });
          return completion.data.choices[0].message.content;
        } catch (err) {
          //get status code to include in error message
          let statusCode = err.response.status;
          return "Something went wrong. Please try again. Error code: " + statusCode;
        }
    case "image":
    default:
      return "Unimplemented type";
    }
}

function constructMessageObj(role, content){
  return {"role": role, "content": content}
}

//handles encounter rewards. Expects a String type, a Int luck, and a Int level and a number of repeats. Returns a String of rewards.
async function award(type, level, luckMod, repeat) {
  //Force everything into the direct datatype to avoid errors. Return an error if the conversion fails.
  try {
    type = String(type);
    level = Number(level);
    luckMod = Number(luckMod);
    repeat = Number(repeat);
  } catch (err) {
    return "Error: " + err;
  }

  let rewards = "";
  while (repeat > 0) {
    switch (type) {
      case "enemy":
        rewards += await new Promise((resolve, reject) => {
          enemyRewards(level, luckMod, resolve);
        });
        break;
      case "hoard":
        rewards += await treasureHoard([level, true, luckMod])
        break;
      case "magicitemany":
        rewards += await pullRandomItem([null, 1, null, null, null]); //rarity, number, type, attunement, notCategory
        break;
      case "magicitempotion":
        rewards += await pullRandomItem([null, 1, "Potion", null, null]);
        //rewards += await pullRandomItem(["Common", 1, "Potion", null, null]); 
        //rewards += await pullRandomItem(["Uncommon", 1, "Potion", null, null]);
        //rewards += await pullRandomItem(["Rare", 1, "Potion", null, null]);
        //rewards += await pullRandomItem(["VeryRare", 1, "Potion", null, null]);
        //rewards += await pullRandomItem(["Legendary", 1, "Potion", null, null]);
        //rewards += await pullRandomItem(["Artifact", 1, "Potion", null, null]); 
        break;
      case "magicitemnotpotion":
        rewards += await pullRandomItem([null, 1, null, null, "Potion"]); 
        break;
      case "magicitemcommon":
        rewards += await pullRandomItem(["Common", 1, null, null, null]); 
        break;
      case "magicitemuncommon":
        rewards += await pullRandomItem(["Uncommon", 1, null, null, null]);
        break;
      case "magicitemrare":
        rewards += await pullRandomItem(["Rare", 1, null, null, null]);
        break;
      case "magicitemveryrare":
        rewards += await pullRandomItem(["VeryRare", 1, null, null, null]);
        break;
      case "magicitemlegendary":
        rewards += await pullRandomItem(["Legendary", 1, null, null, null]);
        break;
      case "magicitemartifact":
        rewards += await pullRandomItem(["Artifact", 1, null, null, null]);
        break;
      default:
        rewards += "Unimplemented type:" + type;
    }
    //remove any trailing newlines
    if (rewards.endsWith("\n")) {rewards = rewards.substring(0, rewards.length - 1)}
    rewards += "\n";
    repeat--;
  }
  return rewards;
}

//expects either an array [Gender, Race, Class, Level] or string description. Returns a string name.
async function npcNameGen(description){
  let name = "";
  let systemPrompt = "You are DnDNameGen, a special AI trained to generate names for dnd5e characters and NPCs based on their descriptions. Your Response should ONLY include the first and last names and nothing else'";
  //check if the description exists
  if (description == null || description == "") {
    return "Please provide a description of the character or NPC you want a name for."
  }
  //case of not a string
  if (typeof description != "string") {
    //Construct the prompt, filling in null values.
    desc = "A "; // A Level X Gender Race Class
    if (description[3] == null) {desc += "Level " + getRandomLevel(0.2) + " "} //if level is null, generate a random level
    else {desc += "Level " + description[3] + " "}
    if (description[0] == null) {desc += (randomInt(1,2) > 1) ? "Male " : "Female "} //if gender is null, do a 50-50 chance
    else {desc += description[0] + " "}
    if (description[1] == null) {desc += await pullRandomRace([1,1]) + " "} //if race is null, generate a random one
    else {desc += description[1] + " "}
    if (description[2] == null) {desc += playerClasses[randomInt(0, playerClasses.length - 1)]} //if class is null, generate a random one
    else {desc += description[2]}

    name = await openaiAPI(desc, "chatSingular", systemPrompt, 75, 2);

  }
  //case of string
  else {
    name = await openaiAPI(description, "chatSingular", systemPrompt, 75, 2)
  }
  //prefix formatted description to the name so it formatted "Description: {desc} Name: {name}"
  name = "Description: " + desc + "\nName: " + name;

  return name;
}

//Expects a string type and an array params. Returns a string of the result.
async function buy(type, params) {
  type = type.toLowerCase();
  let toRet = "";
  switch (type) {
    case "magicitem":
      //Params are expected to be the result of the Persuasion Check.
      complications = ["The item is cursed", "The item doesn't quite do what was claimed", "The item is stolen and the original owner will reclaim it at all costs", "The seller is actually a devil, looking to make a bargain", "A third party is looking to buy the item, increasing the price.", "The item will permanently bond to its user, growing with them.", "The item is sentient", "The item is unexpectedly high quality"];
      check = params[0];
      if (check <= 5) {
        toRet += await magicItemTables(["A", randomInt(1,6), 0, true]);
      }
      else if (check <= 10) {
        toRet += await magicItemTables(["B", randomInt(1,6), 0, true]);
      }
      else if (check <= 15) {
        toRet += await magicItemTables(["F", randomInt(1,6), 0, true]);
      }
      else if (check <= 20) {
        toRet += await magicItemTables(["C", randomInt(1,6), 0, true]);
      }
      else if (check <= 25) {
        toRet += await magicItemTables(["J", randomInt(1,6), 0, true]);
      }
      else if (check <= 30) {
        toRet += await magicItemTables(["G", randomInt(1,6), 0, true]);
      }
      else if (check <= 35) {
        toRet += await magicItemTables(["D", randomInt(1,6), 0, true]);
      }
      else if (check <= 40) {
        toRet += await magicItemTables(["K", randomInt(1,6), 0, true]);
      }
      else if (check <= 45) {
        toRet += await magicItemTables(["H", randomInt(1,6), 0, true]);
      }
      else if (check <= 50) {
        toRet += await magicItemTables(["E", randomInt(1,6), 0, true]);
      }
      else if (check <= 55) {
        toRet += await magicItemTables(["I", randomInt(1,6), 0, true]);
      }
      else if (check <= 60) {
        toRet += await magicItemTables(["L", randomInt(1,6), 0, true]);
      }
      else if (check <= 99) { //25-75 artifact or legendary
        for (let i = 0; i < randomInt(1,4); ++i) {
          let r = randomInt(1,4)
          if (r == 1) {
            toRet += await pullRandomItem(["Artifact", 1, null, null, null]);
          }
          else {
            toRet += await pullRandomItem(["Legendary", 1, null, null, null]);
          }
          //remove newline if it exists
          if (toRet.charAt(toRet.length-1) === "\n") {toRet = toRet.substring(0, toRet.length-1);}
          //add its rarity using a ternary operator
          toRet += " (" + ((r == 1) ? "Artifact" : "Legendary") + ")\n";
        }
      }
      else { //100 artifact
        toRet += await pullRandomItem(["Artifact", 1, null, null, null]);
        //remove newline if it exists
        if (toRet.charAt(toRet.length-1) === "\n") {toRet = toRet.substring(0, toRet.length-1);}
        //add its rarity
        toRet += " (" + "Artifact" + ")\n";
      }
      //remove last newline
      if (toRet.charAt(toRet.length-1) === "\n") {toRet = toRet.substring(0, toRet.length-1);}
      //Number each item
      toRet = toRet.split("\n");
      for (let i = 0; i < toRet.length; ++i) {
        toRet[i] = (i+1) + ". " + toRet[i];
        //Item is currently of the form: "Item Name (Rarity)", However, other parenthesis may exist in the name.

        //Extract the rarity
        let rarity = toRet[i].substring(toRet[i].lastIndexOf("(")+1, toRet[i].lastIndexOf(")"));
        //Append the price of the item to the end by calling itemPrice
        toRet[i] += " | (" + itemPrice(rarity) + "gp) |";

        //Add a complication to the end of it. 10% for 0. 10% for 7. 5% for the rest, 50% for none
        r = randomInt(1,33);
        if (r <= 2) {toRet[i] += " Complication: " + complications[0];}
        else if (r <= 3) {toRet[i] += " Complication: " + complications[1];}
        else if (r <= 4) {toRet[i] += " Complication: " + complications[2];}
        else if (r <= 5) {toRet[i] += " Complication: " + complications[3];}
        else if (r <= 6) {toRet[i] += " Complication: " + complications[4];}
        else if (r <= 7) {toRet[i] += " Complication: " + complications[5];}
        else if (r <= 8) {toRet[i] += " Complication: " + complications[6];}
        else if (r <= 10) {toRet[i] += " Complication: " + complications[7];}
        else {toRet[i] += " Complication: None";}
      }
      toRet = toRet.join("\n");
      break;
    case "spellscroll":
      //Params are expected to be the result of the Persuasion Check.
      let maxLevel;
      check = params[0];
      if (check <= 10) { maxLevel = 0;}
      else if (check <= 15) { maxLevel = 1;}
      else if (check <= 20) { maxLevel = 2;}
      else if (check <= 25) { maxLevel = 3;}
      else if (check <= 30) { maxLevel = 4;}
      else if (check <= 35) { maxLevel = 5;}
      else if (check <= 40) { maxLevel = 6;}
      else if (check <= 45) { maxLevel = 7;}
      else if (check <= 50) { maxLevel = 8;}
      else if (check <= 75) { maxLevel = 9;}
      else if (check <= 100) { maxLevel = 10;}
      else if (check <= 125) { maxLevel = 11;}
      else { maxLevel = 12;}
      numSold = randomInt(1,8);
      for (let i = 0; i < numSold; ++i) {
        let level = randomInt(0, maxLevel);
        if (level < 10) {
          toRet += "Level " + level + " Spell Scroll: " + await pullRandomSpell([level, null, null, null, null, null, null, null]);
          toRet += ", Price: (" + spellPrice(level) + "gp)";
        }
        else {
          toRet += "Level " + level + " Spell Scroll: " + level + "th level. (Currently unimplemented)";
          toRet += ", Price: (" + spellPrice(level) + "gp)";
        }
        //Additional Effects
        let uses = 1;
        let readable = false;
        let duration = 1; //multiplier
        let castingTime = 1; //divisor (or steps)
        let randomLevel = level;
        let effectiveness = 1;
        let castAt = level;
        let numEffects = 1;
        while (numEffects > 0) {
          let r = randomInt(1,20);
          if (r <= 10) {uses += randomInt(1,4);}
          else if (r <= 14 && !readable) {readable = true; numEffects += 1;}
          else if (r <= 14) {numEffects += 1;}
          else if (r <= 15) {duration *=2;}
          else if (r <= 16) {castingTime *=2;}
          else if (r <= 17 && randomLevel < 9) {randomLevel += randomInt(1,8); if (randomLevel > 9) {randomLevel = 9;}}
          else if (r <= 17) {numEffects += 2;}
          else if (r <= 18) {effectiveness += 1;}
          else if (r <= 19) {castAt += rollDice(4,2)[2];}
          else {numEffects += 3;}
          numEffects -= 1;
        }
        toRet += " Additional Effects: ";
        if (randomLevel > level) {toRet += ", The spell is actually a random level " + randomLevel + " spell when cast.";}
        if (readable) {toRet += ", The spell is so easily understood that it doesn't require a check to use.";}
        if (uses > 1) {toRet += ", Uses: " + uses;}
        if (duration > 1) {toRet += ", The spell lasts " + duration + " times as long.";}
        if (castingTime > 1) {toRet += ", The spell takes " + castingTime + " times less time to cast";}
        if (effectiveness > 0) {toRet += ", The spell is " + effectiveness + " times more effective.";}
        if (castAt > level) {toRet += ", The spell is cast at " + castAt + "th level.";}
        toRet += "\n";
        

      }
      break;
    default:
      return "Unimplemented type: " + type;
  }
  return toRet;
}

//Sell an item. Expect string rarity, int check
async function sellItem(rarity, check) {
  let price = 0;
  //attempt to convert params to correct types. Return "Invalid Parameters" if it fails.
  if (typeof rarity !== "string") {return "Invalid Parameters";}
  //try to convert check to int
  check = parseInt(check);
  if (isNaN(check)) {return "Invalid Parameters";}
  

  rarity = rarity.toLowerCase();

  switch (rarity) {
    case "common":
      price = (randomInt(1,8)+2) * 10;
      rarity = "Common";
      break;
    case "uncommon":
      price = rollDice(4,2)[2] * 100;
      rarity = "Uncommon";
      break;
    case "rare":
      price = (rollDice(6,2)[2]+1) * 1000;
      rarity = "Rare";
      break;
    case "veryrare":
      price = (randomInt(1,4)+1) * 10000;
      rarity = "VeryRare";
      break;
    case "legendary":
      price = rollDice(4,2)[2] * 25000;
      rarity = "Legendary";
      break;
    case "artifact":
      price = randomInt(1,4) * 100000;
      rarity = "Artifact";
      break;
    default:
      return "Unimplemented rarity: " + rarity;
  }
  if (check <= 5) {price = price*0.25;}
  else if (check <= 10) {price = price*0.5;}
  else if (check <= 20) {}
  else if (check <= 25) {price = price*1.5;}
  else if (check <= 30) {price = price*2;}

  //Vary result by up to 10% in either direction. Repeat 3 times.
  for (let i = 0; i < 3; ++i) {
    price = Math.round(price * ((randomInt(-10,10)/100)+1));
  }
  //Complications
  let complications = "";
  r = randomInt(1,100);
  if (r <= 2) {complications += "The buyer is from a crime ring and won't take no for an answer.";}
  else if (r <= 4) {complications += "The buyer refuses to reveal any information about themselves and never meets in person.";}
  else if (r <= 6) {complications += "The buyer is a representative of a large organization.";}
  else if (r <= 8) {complications += "The buyer is clearly a member of a nefarious cult.";}
  else if (r <= 13) {complications += "The buyer also offers a " + rarity + " '" + await pullRandomItem([rarity, null, null, null, "Potion"]) + "' as an alternative.";}
  else if (r <= 18) {
    let lowerRarity;
    switch (rarity) {
      case "Common":
      case "Uncommon":
        lowerRarity = "Common";
        break;
      case "Rare":
        lowerRarity = "Uncommon";
        break;
      case "VeryRare":
        lowerRarity = "Rare";
        break;
      case "Legendary":
        lowerRarity = "VeryRare";
        break;
      case "Artifact":
        lowerRarity = "Legendary";
        break;
      default:
        return "Unimplemented rarity: " + rarity;
    }
    complications += "The buyer also offers a " + rarity + " '" + await pullRandomItem([lowerRarity, null, null, null, "Potion"]) + "' as part of the price.";
  }
  else if (r <= 25) {
    let higherRarity;
    switch (rarity) {
      case "Common":
        higherRarity = "Uncommon";
        break;
      case "Uncommon":
        higherRarity = "Rare";
        break;
      case "Rare":
        higherRarity = "VeryRare";
        break;
      case "VeryRare":
        higherRarity = "Legendary";
        break;
      case "Legendary":
      case "Artifact":
        higherRarity = "Artifact";
        break;
      default:
        return "Unimplemented rarity: " + rarity;
    }
    complications += "The offers a " + rarity + " '" + await pullRandomItem([higherRarity, null, null, null, "Potion"]) + "' instead of the price but also requests the character's silence.";
  }
  else {complications += "No Complication";}
  complications = complications.replace(/\n/g, '');

  return "Offer: " + price + "gp \nComplication: " + complications;

}

//Returns a random integer(level) between 1 and 20, weighted by the percent chance of each level. 
//Expects a double percent, which is the step down. Ex. 0.1 means level 2 is 10% less likely than level 1, level 3 is 10% less likely than level 2, etc.
//Expects an int maxLevel, which is the maximum level to generate. Defaults to 20.
function getRandomLevel(percent, maxLevel) {
  // Generate a random number between 0 and 1
  if (maxLevel == null) {maxLevel = 20}
  let random = Math.random();
  // Define an array of probabilities for each number from 1 to maxLevel
  let probabilities = [];
  //fill the array with null values
  for (let i = 0; i < maxLevel; i++) {
    probabilities.push(null);
  }
  if (percent == null) {percent = 0.1}
  // copy the array
  tempProbs = probabilities.slice();
  inital = 1; 
  //loop through the array
  for (let i = 0; i < maxLevel; i++) {
    tempProbs[i] = inital * Math.pow((1-percent), i);
  }
  //get the sum of the array
  let sum = tempProbs.reduce((a, b) => a + b, 0);
  level1Prob = 1 / sum;

  //multiply each value by the level 1 probability
  for (let i = 0; i < maxLevel; i++) {
    probabilities[i] = tempProbs[i] * level1Prob;
  }

  // Define a variable to store the cumulative probability
  let cumulative = 0;
  // Loop through the probabilities array
  for (let i = 0; i < probabilities.length; i++) {
    // Add the current probability to the cumulative probability
    cumulative += probabilities[i];
    // If the random number is less than or equal to the cumulative probability
    if (random <= cumulative) {
      // Return the corresponding number from 1 to 20
      return i + 1;
    }
  }
  // If the for loop exits without returning, return 20
  return 20;
}

//Returns a price in GP for the item based on rarity.
//Expects a string or int rarity. Returns an int price. Valid rarities are Common, Uncommon, Rare, Very Rare, Legendary, Artifact
function itemPrice(rarity) {
  //if rarity is an int 1-6, convert it to a string
  if (typeof rarity === "number") {
    switch (rarity) {
      case 1:
        rarity = "Common";
        break;
      case 2:
        rarity = "Uncommon";
        break;
      case 3:
        rarity = "Rare";
        break;
      case 4:
        rarity = "VeryRare";
        break;
      case 5:
        rarity = "Legendary";
        break;
      case 6:
        rarity = "Artifact";
        break;
      default:
        rarity = "Common";
    }
  }
  let price = 0;
  switch (rarity) {
    case "Common":
      price = (rollDice(6, 2)[2]+2) * 10;
      break;
    case "Uncommon":
      price = (rollDice(4, 2)[2]+1) * 100;
      break;
    case "Rare":
      price = (rollDice(10, 1)[1]+2) * 1000;
      break;
    case "Very Rare":
      price = (rollDice(6, 1)[1]) * 10000;
      break;
    case "Legendary":
      price =  (rollDice(4, 2)[2]) * 25000;
      break;
    case "Artifact":
      price = (rollDice(6, 1)[1]) * 100000;
      break;
    default:
      return 0;
  }

  //Vary result by up to 10% in either direction. Repeat 3 times.
  for (let i = 0; i < 3; ++i) {
    price = Math.round(price * ((randomInt(-10,10)/100)+1));
  }
  

  return price;
}

//Returns a price in GP for the spell based on level.
//Expects an int level. Returns an int price.
function spellPrice(level) {
  //validate level
  if (typeof level != "number" || level < 0) {return 0;}
  let price = 0;
  switch (level) {
    case 0:
      price = randomInt(50, 100);
      break;
    case 1:
      price = randomInt(100, 500);
      break;
    case 2:
      price = randomInt(500, 1250);
      break;
    case 3:
      price = randomInt(1250, 2500);
      break;
    case 4:
      price = randomInt(2500, 5000);
      break;
    case 5:
      price = randomInt(5000, 15000);
      break;
    case 6:
      price = randomInt(15000, 25000);
      break;
    case 7:
      price = randomInt(25000, 50000);
      break;
    case 8:
      price = randomInt(50000, 250000);
      break;
    case 9:
      price = randomInt(250000, 1000000);
      break;
    default:// The price is between 1 million and 10 million, multiplied by 10 for every level above 9.
      price = randomInt(1000000, 1000000 * (10 * (level - 9)));
  }
  return price;
  
}



//keepUp();
client.login(token);


