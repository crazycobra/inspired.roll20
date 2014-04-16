/*******************************************************************************
 * beastcraft.js - Provides tools for creating monsters.
 * 
 * Dependencies: bestiary.js, utilities.js
 *******************************************************************************
 *
 * The general usage for this script is as follows:
 * 
 * !beastcraft <monster name>
 *  This command allows a GM to create creature characters and attach them to
 *  the pre-selected tokens. 
 * 
 *******************************************************************************
 * Copyright (C) 2014  Aaron Garrett (aaron.lee.garrett@gmail.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

if(!('contains' in String.prototype)) {
    String.prototype.contains = function(str, startIndex) {
        return ''.indexOf.call(this, str, startIndex) !== -1;
    };
}

var inspired = inspired || {};

inspired.loadMonsterAttributes = function(monster, charid) {
    var attributes = {"initiative": monster["initiative"],
                      "ac": monster["ac"]["normal"],
                      "touch": monster["ac"]["touch"],
                      "flat-footed": monster["ac"]["flat-footed"],
                      "hp": monster["hp"],
                      "fortitude": monster["saves"]["fortitude"]["bonus"],
                      "reflex": monster["saves"]["reflex"]["bonus"],
                      "will": monster["saves"]["will"]["bonus"]};
    var hpid = "";
    _.each(attributes, function(obj, key) {
        var attrib = createObj("attribute", {
            name: key,
            current: obj,
            max: obj,
            characterid: charid
        });
        if(key == "hp") hpid = attrib.get("_id");
    });
    return hpid;
}

inspired.loadMonsterAbilities = function(monster, charid) {
    circumstantialString = function(circumstantial, descriptor) {
        if(_.size(circumstantial) > 0) {
            var a = [];
            _.each(circumstantial, function(elt, index) {
                var s = "+" + elt["bonus"] + " ";
                if(_.size(elt["type"]) > 0) {
                    s += elt["type"] + " ";
                }
                s += "bonus " + descriptor + " " + elt["circumstance"];
                a.push(s);
            });
            return "(" + a.join() + ")";
        }
        else return "";
    }
    specialString = function(specialText) {
        return specialText;
    }
    attackString = function(monsterName, attack) {
        var tableStart = "<table><thead><th>Atk</th><th>Dmg</th><th>Special</th></thead><tbody>";
        var tableEnd = "</tbody></table>";
        var fullAttack = "<br/><b><big>" + monsterName + " attacks...</big></b><br/>";
        var primaryAttack = "";
        _.each(attack, function(elt, index) {
            var header = "<small>" + elt["weapon"] + " ";
            if(elt["critmin"] < 20) header += elt["critmin"] + "-20";
            header += "/x" + elt["critmult"] + "</small>";
            fullAttack += header + tableStart;
            for(var i = 0; i < elt["amount"]; i++) {
                _.each(elt["bonus"], function(b, j) {
                    fullAttack += "<tr><td>[[1d20+" + b + "]]</td><td>[[" + elt["damage"] + "]]</td><td>" + specialString(elt["special"]) + "</td></tr>";
                    if(index == 0 && j == 0) {
                        primaryAttack = fullAttack + tableEnd;
                    }
                });
            }
            fullAttack += tableEnd + "<br/>";
        });
        return [primaryAttack, fullAttack];
    }
    
    var emstr = "/emas @{selected|token_name}";
    var monsterName = "@{selected|token_name}";
    
    // Load initiative...
    createObj("ability", {
        name: "initiative",
        description: "",
        action: emstr + " [[1d20 + @{initiative} &{tracker}]] for initiative",
        istokenaction: true,
        characterid: charid
    });
    
    // Load saves...
    _.each(monster["saves"], function(obj, key) {
        var c = circumstantialString(obj["circumstantial"], "vs.");
        if(_.size(c) > 0) c = " " + c;
        createObj("ability", {
            name: key,
            description: "",
            action: emstr + " " + key + " [[1d20 + @{" + key + "}]]" + c,
            istokenaction: true,
            characterid: charid
        });        
    });
    
    // Load skills...
    _.each(monster["skills"], function(obj, key) {
        var c = circumstantialString(obj["circumstantial"], "on");
        if(_.size(c) > 0) c = " " + c;
        createObj("ability", {
            name: key,
            description: "",
            action: emstr + " " + key + " [[1d20 + " + obj["bonus"] + "]]" + c,
            istokenaction: true,
            characterid: charid
        });
    });
    
    var tableStart = "<table><thead><th>Atk</th><th>Dmg</th><th>Special</th></thead><tbody>";
    var tableEnd = "</tbody></table>";
    
    // Load melee attacks...
    if(_.size(monster["melee"]) > 0) {
        var melee = attackString(monsterName, monster["melee"]);
        createObj("ability", {
            name: "primary melee",
            description: "",
            action: melee[0],
            istokenaction: true,
            characterid: charid
        });
        createObj("ability", {
            name: "full melee",
            description: "",
            action: melee[1],
            istokenaction: true,
            characterid: charid
        });
    }
    
    // Load ranged attacks...
    if(_.size(monster["ranged"]) > 0) {
        var ranged = attackString(monsterName, monster["ranged"]);
        createObj("ability", {
            name: "primary ranged",
            description: "",
            action: ranged[0],
            istokenaction: true,
            characterid: charid
        });
        createObj("ability", {
            name: "full ranged",
            description: "",
            action: ranged[1],
            istokenaction: true,
            characterid: charid
        });
    }
    
    // Load languages...
    createObj("ability", {
        name: "languages",
        description: "",
        action: monster["languages"].join(),
        istokenaction: false,
        characterid: charid
    });
}

inspired.createMonster = function(token, monsterName, monster) {
    // Create the character.
    var character = createObj("character", {
        avatar: token.get("imgsrc"),
        name: monsterName,
        bio: monster["description"],
        archived: false
    });
    var cid = character.get("_id");
    token.set("represents", cid);
    token.set("name", monsterName);
    token.set("showname", false);
    token.set("showplayers_name", false);
    var hpid = inspired.loadMonsterAttributes(monster, cid);
    token.set("bar1_link", hpid);
    inspired.loadMonsterAbilities(monster, cid);
}

on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!beastcraft ") && inspired.isGM(msg.playerid)) {
        var monsterName = msg.content.replace("!beastcraft ", "").trim().toLowerCase();
        if(monsterName in state["inspired.BESTIARY"]) {
            var monster = state["inspired.BESTIARY"][monsterName];
            var numCreated = 0;
            _.each(msg.selected, function(elt, index) {
                var token = getObj("graphic", elt["_id"]);
                if(token.get("subtype") == "token") {
                    inspired.createMonster(token, monsterName, monster);
                    numCreated++;
                }
            });
            
            if(numCreated == 0) {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You must select at least one token to turn into a creature.");
            }
            else {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You created " + numCreated + " <i>" + monsterName + "</i>(s).");
            }
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <i>" + monsterName + "</i> is not a valid creature.");        
        }
    }
});

