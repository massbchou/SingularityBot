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

//SQL connection stuff
var myssql = require('mysql');
var DBconnection = myssql.createConnection({
    host: process.env.SQLHOST,//logs into database 
    port: process.env.SQLPORT,
    user: process.env.SQLUSER,
    password: process.env.SQLPASS,
    database: "Bot_Database"
});
// Basic SQL Connect Function for operations.
DBconnection.connect(function(err) {
    if (err) throw err;
    console.log("Connection Success");
});
/*
DBconnection.query("SELECT * FROM quotes", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
});
*/


const spellLink = new RegExp('^s\{[a-z A-Z]*\}$');// finds commands of the form s{spell_name}
const alphaNeu = new RegExp('[A-Za-z0-9]');
const commandList = ["|help", "|intent"]; //list of commands

//Responds to messages
client.on("messageCreate", msg => {
  if (msg.author.bot) {return;}// should not respond to itself.
  
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
        default:
          msg.channel.send("That isn't a command. Don't ask for it to be implemented because the developer probably won't do it.");
      }
    }
  }
  else if (msg.content.startsWith(commandList[1])) {//|intent
    let content = msg.content.substring(commandList[1].length+1); //+1 to remove the space.
      openaiAPI(content, "chatSingular", "Determine whether or not the message is Positive, Negative or Neutral. Respond with 'I believe this message is [judgement].", 75).then((response) => msg.channel.send(response)); //sends the response to the channel
  }}

  
);



function randomInt(min,max) {//includes min and max
  return Math.floor(Math.random() * ((max+1)-min)) + min;
}

//Returns True a specified percent of the time
function percentChance(percent) {
  return randomInt(1,100) <= percent;
}


//Executes a callback on the string based on the level of desired treasure to be generated. 
function generateIndividualTreasure(level, callback) {
  let num = [];
    switch(level) {
      case 1:
        num = rollDice(6,5);
        callback("" + num[num.length-1] + " Copper Pieces");
        break;
      case 2:
        num = rollDice(6,4);
        callback("" + num[num.length-1] + " Silver Pieces");
        break;
      case 3:
        num = rollDice(6,2)
        callback("" + num[num.length-1] + " Gold Pieces");
        break;
      case 4:
        num = rollDice(6,3)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("A", 1, callback);
        break;
      case 5:
        num = rollDice(6,10)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("A", 1, callback);
        break;
      case 6:
        num = rollDice(6,26)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("B", 1, callback);
        break;
      case 7:
        num = rollDice(6,35)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("B", 1, callback);
        break;
      case 8:
        num = rollDice(12,20)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("C", 1, callback);
        break;
      case 9:
        num = rollDice(12,25)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("C", 1, callback);
        break;
      case 10:
        num = rollDice(12,33)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("J", 1, callback);
        break;
      case 11:
        num = rollDice(24,35)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("J", 1, callback);
        break;
      case 12:
        num = rollDice(24,38)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("D", 1, callback);
        break;
      case 13:
        num = rollDice(24,75)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("D", 1, callback);
        break;
      case 14:
        num = rollDice(48,50)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("K", 1, callback);
        break;
      case 15:
        num = rollDice(48,65)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("K", 1, callback);
        break;
      case 16:
        num = rollDice(96,40)
        percentChance(75) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("E", 1, callback);
        break;
      case 17:
        num = rollDice(192,56)
        percentChance(65) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("E", 1, callback);
        break;
      case 18:
        num = rollDice(192,63)
        percentChance(55) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("E", 1, callback);
        break;
      case 19:
        num = rollDice(192,94)
        percentChance(45) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("E", 1, callback);
        break;
      case 20:
        num = rollDice(400,50)
        percentChance(50) ? callback("" + num[num.length-1] + " Gold Pieces") : magicItemTables("L", 1, callback);
        break;
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
          percentChance(50) ? callback("" + Math.round(num) + " Gold Pieces") : magicItemTables("L", rolls, callback);
        }
    }

    //callback(level + " Copper");
}
//Returns an executes a callback on each of the results based on the table
function magicItemTables(table, rolls, callback) {
  let toRet = ["default"];
    for (let i = 0; i < rolls; ++i) {
      let roll = randomInt(1,100);
      switch(table) {
        case 1:
        case "A": 
          if (roll <= 40) {callback("Potion of Healing");}
          else if (roll <= 50) {pullRandomItem(["common", null, null, null, "potion"], callback);}
          else if (roll <= 60) {pullRandomSpell(["0", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 70) {pullRandomItem(["common", null, "potion", null, null], callback);}
          else if (roll <= 90) {pullRandomSpell(["1", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 94) {pullRandomSpell(["2", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 98) {callback("Potion of Greater Healing")}
          else if (roll <= 100) {pullRandomItem(["uncommon", null, null, null, "potion"], callback);}
          break;
        case 2:
        case "B":
          if (roll <= 15) {callback("Potion of Greater Healing");}
          else if (roll <= 50) {pullRandomItem(["uncommon", null, "potion", null, null], callback);}
          else if (roll <= 90) {pullRandomItem(["uncommon", null, null, null, "potion"], callback);}
          else if (roll <= 95) {pullRandomSpell(["2", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 100) {pullRandomSpell(["3", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          break;
        case 3:
        case "C":
          if (roll <= 15) {callback("Potion of Superior Healing");}
          else if (roll <= 58) {pullRandomItem(["rare", null, "potion", null, null], callback);}
          else if (roll <= 84) {pullRandomItem(["rare", null, null, null, "potion"], callback);}
          else if (roll <= 91) {pullRandomSpell(["4", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 96) {pullRandomSpell(["5", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 100) {pullRandomItem(["uncommon", null, null, null, "potion"], callback);}
          break;
        case 4:
        case "D":
          if (roll <= 20) {callback("Potion of Supreme Healing");}
          else if (roll <= 59) {pullRandomItem(["veryrare", null, "potion", null, null], callback);}
          else if (roll <= 60) {pullRandomItem(["rare", null, null, null, "potion"], callback);}
          else if (roll <= 70) {pullRandomSpell(["6", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 77) {pullRandomSpell(["7", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 82) {pullRandomSpell(["8", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 100) {pullRandomItem(["veryrare", null, null, null, "potion"], callback);}
          break;
        case 5:
        case "E":
          if (roll <= 15) {callback("Potion of Supreme Healing");}
          else if (roll <= 40) {pullRandomItem(["legendary", null, "potion", null, null], callback);}
          else if (roll <= 50) {pullRandomItem(["legendary", null, null, null, "potion"], callback);}
          else if (roll <= 80) {pullRandomSpell(["8", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 95) {pullRandomSpell(["9", null, null, null, null, null, null, null], (spell) => callback("Spell Scroll: " + spell));}
          else if (roll <= 100) {pullRandomItem(["veryrare", null, null, null, "potion"], callback);}
          break;
        case 6:
        case "F":
          pullRandomItem(["uncommon", null, null, null, "potion"], callback);;
          break;
        case 7:
        case "G":
          pullRandomItem(["rare", null, null, null, "potion"], callback);;
          break;
        case 8:
        case "H":
          pullRandomItem(["veryrare", null, null, null, "potion"], callback);;
          break;
        case 9:
        case "I":
          pullRandomItem(["legendary", null, null, null, "potion"], callback);;
          break;
        case 10:
        case "J":
          if (roll <= 25) {pullRandomItem(["common", null, null, null, "potion"], callback);}
          else if (roll <= 75) {pullRandomItem(["uncommon", null, null, null, "potion"], callback);}
          else if (roll <= 88) {pullRandomItem(["rare", null, null, null, "potion"], callback);;}
          else if (roll <= 100) {pullRandomItem(["veryrare", null, null, null, "potion"], callback);}
          break;
        case 11:
        case "K":
          if (roll <= 25) {pullRandomItem(["uncommon", null, null, null, "potion"], callback);}
          else if (roll <= 75) {pullRandomItem(["rare", null, null, null, "potion"], callback);}
          else if (roll <= 88) {pullRandomItem(["veryrare", null, null, null, "potion"], callback);}
          else if (roll <= 100) {pullRandomItem(["legendary", null, null, null, "potion"], callback);}
          break;
        case 12:
        case "L":
          if (roll <= 25) {pullRandomItem(["rare", null, null, null, "potion"], callback);}
          else if (roll <= 75) {pullRandomItem(["veryrare", null, null, null, "potion"], callback);}
          else if (roll <= 88) {pullRandomItem(["legendary", null, null, null, "potion"], callback);}
          else if (roll <= 100) {pullRandomItem(["artifact", null, null, null, "potion"], callback);}
          break;
        default:
          callback("Invalid Table Selection");
      }

    }
    return toRet;
}

//Connects to DB and pulls a random spell based on the params. Then executes the callback on the result string
function pullRandomSpell(params, callback) { 
  //params is an array the form [level: int, school: string, castingTime: string, range: String, duration: String, Components: String (VSM), Ritual (boolean), Concentration (boolean)]
  //a null value is skipped over. 
  let request = "SELECT spellName FROM Spells";
  
  if (params !== null) {
    request = request.concat(" WHERE")
    let numFields = 0;
    for (let i = 0; i < params.length; ++i) {
      let filter = params[i];
      if (filter !== null && alphaNeu.test(filter)) {
        if (numFields !== 0) {
          request = request.concat(" AND");
        }
        switch (i) {
          case 0:
            request = request.concat(" Level = " + filter);
            numFields++;
            break;
          case 1:
            request = request.concat(" School LIKE \"%" + filter + "%\"");
            numFields++;
            break;
          case 2:
            request = request.concat(" castingTime LIKE \"%" + filter + "%\"");
            numFields++;
            break;
          case 3:
            request = request.concat(" spellRange LIKE \"%" + filter + "%\"");
            numFields++;
            break;
          case 4:
            request = request.concat(" Duration LIKE \"%" + filter + "%\"");
            numFields++;
            break;
          case 5:
            let vsm = "";
            if (filter.length > 3) {continue;}
            else {
              for (let j = 0; j < filter.length; ++j) {
                vsm+= filter.charAt(j);
                if (j != filter.length-1) {vsm += ", "}
              }
            }
            request = request.concat(" Components LIKE \"%" + vsm.toUpperCase() + "%\"");
            numFields++;
            break;
          case 6:
            if (filter === "true") {
              request = request.concat(" castingTime LIKE \"% R\"");
              numFields++;
            }
            break;
          case 7:
            if (filter === "true") {
              request = request.concat(" Duration LIKE \"Concentration%\"");
              numFields++;
            }
            break;
          default:
            continue;
        }
      }
    }
    if (numFields === 0) {request = request.concat(" 1 = 1")}
  }
  //console.log(request);
  let q = []; //Result Array
    DBconnection.query(request, function (err, result, fields) {
        if (err) throw err;
        for (let i = 0; i < result.length; ++i) {//copies the array into q. Shouldn't be by reference.
            q.push({ ...result[i] });
        }
        if (q.length === 0) {return callback("No spell matched that criteria")}
        return callback(q[randomInt(0,q.length-1)].spellName);
    });
}
//Connects to DB and pulls a random item based on the params. Then executes the callback on the result string. May execute more times based on the number param
function pullRandomItem(params, callback) {
  //params are expected to be an array in the form: [rarity: string, number: int, type: string, attunement: string]
  let request = "SELECT itemName FROM Items";
  
  if (params !== null) {
    request = request.concat(" WHERE")
    let numFields = 0;
    for (let i = 0; i < params.length; ++i) {
      let filter = params[i];
      if (filter !== null && alphaNeu.test(filter)) {
        if (numFields !== 0 && i !== 1) {
          request = request.concat(" AND");
        }
        switch (i) {
          case 0:
            request = request.concat(" rarity = \"" + filter + "\"");
            numFields++;
            break;
          case 2:
            request = request.concat(" `type` LIKE \"%" + filter + "%\"");
            numFields++;
            break;
          case 3:
            if (filter === "true") {
              request = request.concat(" attunement LIKE \"%Attuned%\"");
              numFields++;
            }
            else if (filter === "false") {
              request = request.concat(" attunement NOT LIKE \"%Attuned%\"");
              numFields++;
            }
            break;
          case 4:
            request = request.concat(" `type` NOT LIKE \"%" + filter + "%\"");
            numFields++;
            break;
          default:
            continue;
        }
      }
    }
    if (numFields === 0) {request = request.concat(" 1 = 1")}
  }
  //console.log(request);
  let q = []; //Result Array
    DBconnection.query(request, function (err, result, fields) {
        if (err) throw err;
        for (let i = 0; i < result.length; ++i) {//copies the array into q. Shouldn't be by reference.
            q.push({ ...result[i] });
        }
        if (q.length === 0) {return callback("No item matched that criteria")}

        if (params != null && params[1] != null && params[1] !== NaN && params[1] > 0) {
          for (let j = 0; j < params[1]; ++j) {
            callback(q[randomInt(0,q.length-1)].itemName);
          }
        }
        else {//Executes once if invalid number criteria
          callback(q[randomInt(0,q.length-1)].itemName);
        }
        
    });
  //callback(params.toString())
}

//Produces a treasure hoard given a level and executes a callback on the response. Note that treasureHoard calls maTable
function treasureHoard(level, callback, items) { 
  //Items is whether or not to include items in the treasure hoard. Defaults to true
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

  callback(rewardsString);
  if (items) {
    table = "";
    rolls = 0;
    x = randomInt(1,100);
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
    magicItemTables(table, rolls, callback);
  }

}

//calls the openai api. Expects a String Prompt, a String type, and a callback function. Instruction is optional and is only used for the "edit" type.
async function openaiAPI(inputPrompt, type, instruction, maxTokens, callback) {
  if (maxTokens == null) {maxTokens = Infinity}
  switch (type) {
    case "chatSingular": //chatSingular is for when the user is only sending one message. History is not supported. Expects a String prompt and a callback function.
      let systemMessage = constructMessageObj("system", instruction);
      let userMessage = constructMessageObj("user", inputPrompt);
      let messages = [systemMessage, userMessage];
      let completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: maxTokens,
      });
      return completion.data.choices[0].message.content;
      
    case "edit":
    case "image":
    default:
      return "Unimplemented type";
    }
}

function constructMessageObj(role, content){
  return {"role": role, "content": content}
}
//keepUp();
client.login(token);


