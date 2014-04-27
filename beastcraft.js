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
    mod = function(ability) { return Math.floor((ability - 10)/2); }
    var attributes = {"initiative": [monster["initiative"]],
                      "ac": [monster["ac"]["normal"]],
                      "touch": [monster["ac"]["touch"]],
                      "flat-footed": [monster["ac"]["flat-footed"]],
                      "hp": [monster["hp"], monster["hp"]],
                      "fortitude": [monster["saves"]["fortitude"]["bonus"]],
                      "reflex": [monster["saves"]["reflex"]["bonus"]],
                      "will": [monster["saves"]["will"]["bonus"]], 
                      "strength": [mod(monster["abilityscores"]["str"]), monster["abilityscores"]["str"]],
                      "dexterity": [mod(monster["abilityscores"]["dex"]), monster["abilityscores"]["dex"]],
                      "constitution": [mod(monster["abilityscores"]["con"]), monster["abilityscores"]["con"]],
                      "intelligence": [mod(monster["abilityscores"]["int"]), monster["abilityscores"]["int"]],
                      "wisdom": [mod(monster["abilityscores"]["wis"]), monster["abilityscores"]["wis"]],
                      "charisma": [mod(monster["abilityscores"]["cha"]), monster["abilityscores"]["cha"]],
                      "cmb": [monster["cmb"]["bonus"], monster["cmb"]["special"]],
                      "cmd": [monster["cmd"]["bonus"], monster["cmd"]["special"]],
                      "sr": [monster["sr"]["value"], monster["sr"]["versus"]],
                      "fasthealing": [monster["fasthealing"]["amount"], monster["fasthealing"]["special"]]
    };
    _.each(attributes, function(obj, key) {
        var c = obj[0];
        var m = "";
        if(_.size(obj) > 1) m = obj[1];
        if(!_.isNaN(c) && !_.isNaN(m)) {
            var attrib = createObj("attribute", {
                name: key,
                current: c,
                max: m,
                characterid: charid
            });
        }
    });
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
        return inspired.rollify(specialText);
    }
    attackString = function(monsterName, attack) {
        var tableStart = "<table><thead><th><small>Atk</small></th><th><small>Dmg</small></th><th><small>Special</small></th></thead><tbody>";
        var tableEnd = "</tbody></table>";
        var description = "/emas " + monsterName + " attacks @{target|character_name} (AC @{target|AC})...\n\n";
        var fullAttack = description;
        var primaryAttack = "";
        var allAttacks = [];
        _.each(attack, function(elt, index) {
            var header = "<small>" + elt["weapon"] + " ";
            if(elt["critmin"] < 20) header += elt["critmin"] + "-20";
            header += "/x" + elt["critmult"] + "</small>";
            fullAttack += header + tableStart;
            var count = 1;
            for(var i = 0; i < elt["amount"]; i++) {
                _.each(elt["bonus"], function(b, j) {
                    var tableRow = "<tr><td>[[1d20+" + b + "]]</td><td>[[" + elt["damage"] + "]]</td><td>" + specialString(elt["special"]) + "</td></tr>"; 
                    var attack = description + header + tableStart + tableRow + tableEnd;
                    fullAttack += tableRow;
                    allAttacks.push({"name": elt["weapon"] + " " + count, "attack": attack});
                    count += 1;
                });
            }
            fullAttack += tableEnd + "<br/>";
        });
        return [allAttacks, fullAttack];
    }
    
    var emstr = "/emas " + monster["name"];
    
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
    var combatSkills = ["acrobatics", "bluff", "escape artist", "fly", "intimidate", "perception"]; 
    _.each(monster["skills"], function(obj, key) {
        var ta = false;
        if(_.contains(combatSkills, key)) ta = true;
        var c = circumstantialString(obj["circumstantial"], "on");
        if(_.size(c) > 0) c = " " + c;
        createObj("ability", {
            name: key,
            description: "",
            action: emstr + " " + key + " [[1d20 + " + obj["bonus"] + "]]" + c,
            istokenaction: ta,
            characterid: charid
        });
    });
    
    // Load melee attacks...
    var specialAttacks = "";
    if(_.size(monster["specialattacks"]) > 0) specialAttacks = "\n/w gm <small>special attacks<ul><li>" + monster["specialattacks"].join("</li><li>") + "</li></ul></small>";
    if(_.size(monster["melee"]) > 0) {
        var attack = attackString(monster["name"], monster["melee"]);
        createObj("ability", {
            name: "full melee",
            description: "",
            action: attack[1] + specialAttacks,
            istokenaction: true,
            characterid: charid
        });
        _.each(attack[0], function(obj, index) {
            var pstr = "";
            if(index == 0) pstr = " [primary]";
            createObj("ability", {
                name: "melee (" + obj["name"] + ")" + pstr,
                description: "",
                action: obj["attack"] + specialAttacks,
                istokenaction: true,
                characterid: charid
            });
        });
    }
    
    // Load ranged attacks...
    if(_.size(monster["ranged"]) > 0) {
        var attack = attackString(monster["name"], monster["ranged"]);
        createObj("ability", {
            name: "full ranged",
            description: "",
            action: attack[1] + specialAttacks,
            istokenaction: true,
            characterid: charid
        });
        _.each(attack[0], function(obj, index) {
            var pstr = "";
            if(index == 0) pstr = " [primary]";
            createObj("ability", {
                name: "ranged (" + obj["name"] + ")" + pstr,
                description: "",
                action: obj["attack"] + specialAttacks,
                istokenaction: true,
                characterid: charid
            });
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
    
    // Load defensive abilities (to be whispered on hit point change)...
    var da = "";
    if(_.size(monster["defensiveabilities"]) > 0) {
        da += "<b>Defensive Abilities</b><ul><li>" + monster["defensiveabilities"].join("</li><li>") + "</li></ul>";
    }
    if(_.size(monster["dr"]) > 0) {
        da += "<b>Damage Reduction</b><ul><li>" + monster["dr"].join("</li><li>") + "</li></ul>";
    }
    if(monster["sr"]["value"] > 0) {
        da += "<b>SR</b> " + monster["sr"]["value"];
        if(monster["sr"]["versus"].length > 0) { da += " (vs. " + monster["sr"]["versus"] + ")"; }
        da += "<br/>";
    }
    if(monster["fasthealing"]["amount"] > 0) {
        da += "<b>Fast Healing</b>: " + monster["fasthealing"]["amount"];
        if(monster["fasthealing"]["special"].length > 0) {
            da += " (" + monster["fasthealing"]["special"] + ")";
        }
        da += "<br/>";
    }
    if(monster["regeneration"]["amount"] > 0) {
        da += "<b>Regeneration</b>: " + monster["regeneration"]["amount"];
        if(monster["regeneration"]["overcome"].length > 0) {
            da += " (overcome by " + monster["regeneration"]["overcome"] + ")";
        }
        da += "<br/>";
    }
    if(_.size(monster["Immunities"]) > 0) {
        da += "<b>Immunities</b><ul><li>" + monster["immunities"].join("</li><li>") + "</li></ul>";
    }
    if(_.size(monster["Resistances"]) > 0) {
        da += "<b>Resistances</b><ul><li>" + monster["resistances"].join("</li><li>") + "</li></ul>";
    }
    if(_.size(monster["weaknesses"]) > 0) {
        da += "<b>Weaknesses</b><ul><li>" + monster["weaknesses"].join("</li><li>") + "</li></ul>";
    }
    if(da.length > 0) {
        da = "<small>Defense information for " + monster["name"] + "<br/>" + da + "</small>";
        createObj("ability", {
            name: "defenseinfo",
            description: "",
            action: "/w gm " + da,
            istokenaction: false,
            characterid: charid
        });
    }
    
    // Load per-turn abilities (to be whispered on the creature's turn)...
    var pta = "";
    if(monster["fasthealing"]["amount"] > 0) {
        pta += "<b>Fast Healing</b>: " + monster["fasthealing"]["amount"];
        if(monster["fasthealing"]["special"].length > 0) {
            pta += " (" + monster["fasthealing"]["special"] + ")";
        }
        pta += "<br/>";
    }
    if(monster["regeneration"]["amount"] > 0) {
        pta += "<b>Regeneration</b>: " + monster["regeneration"]["amount"];
        if(monster["regeneration"]["overcome"].length > 0) {
            pta += " (overcome by " + monster["regeneration"]["overcome"] + ")";
        }
        pta += "<br/>";
    }
    if(pta.length > 0) {
        pta = "<small>Per-turn information for " + monster["name"] + "<br/>" + pta + "</small>";
        createObj("ability", {
            name: "perturninfo",
            description: "",
            action: "/w gm " + pta,
            istokenaction: false,
            characterid: charid
        });
    }
}

inspired.createMonster = function(token, monster) {
    // Create the character.
    var character = createObj("character", {
        avatar: token.get("imgsrc"),
        name: monster["name"],
        bio: monster["description"],
        archived: false
    });
    var cid = character.get("_id");
    token.set("represents", cid);
    token.set("name", monster["name"]);
    token.set("showname", false);
    token.set("showplayers_name", false);
    inspired.loadMonsterAttributes(monster, cid);
    var hp = findObjs({
        _type: "attribute", 
        name: "hp",
        characterid: cid
    })[0];
    token.set("bar1_link", hp.get("_id"));
    var ac = findObjs({
        _type: "attribute", 
        name: "ac",
        characterid: cid
    })[0];
    token.set("bar2_link", ac.get("_id"));
    inspired.loadMonsterAbilities(monster, cid);
    var sizes = {"fine": 0.5, "diminutive": 1, "tiny": 2.5, "small": 5, 
                 "medium": 5, "large": 10, "huge": 15, "gargantuan": 20,
                 "colossal": 30};
    var size = distanceToPixels(sizes[monster["size"]]);
    token.set("width", size);
    token.set("height", size);
}


inspired.displayMonster = function(monsterName) {
    ordinate = function(number) {
        if(number == 1) return number + "st";
        else if(number == 2) return number + "nd";
        else if(number == 3) return number + "rd";
        else return number + "th";
    }
    bonify = function(number) {
        if(number >= 0) return "+" + number;
        else return number.toString();
    }
    savify = function(save) {
        var s = bonify(save["bonus"]);
        if(_.size(save["circumstantial"]) > 0) {
            var a = [];
            _.each(save["circumstantial"], function(obj) {
                var n = bonify(obj["bonus"]);
                var t = obj["type"] + " ";
                var c = obj["circumstance"];
                if(obj["type"].length > 0) { n += " " + obj["type"]; }
                if(obj["circumstance"].length > 0) { n += " vs. " + obj["circumstance"]; }
                a.push(n);
            });
            s += " (" + a.join(", ") + ")";
        }
        return s;
    }
    attackify = function(attacks) {
        var a = [];
        _.each(attacks, function(obj) {
            var s = "";
            if(obj["amount"] > 1) { s += obj["amount"] + " "; }
            s += obj["weapon"] + " ";
            var bonus = [];
            _.each(obj["bonus"], function(b) {
                bonus.push(bonify(b));
            });
            s += bonus.join("/");
            s += " (" + obj["damage"];
            if(obj["critmin"] < 20 || obj["critmult"] > 2) { s += "/"; }
            if(obj["critmin"] < 20) { s += obj["critmin"] + "-20 "; }
            if(obj["critmult"] > 2) { s += "x" + obj["critmult"] + " "; }
            if(obj["special"].length > 0) { s = s.trim(); s += " plus " + obj["special"]; }
            s = s.trim();
            s += ")";
            a.push(s);
        });
        return a.join(", ");
    }
    slaify = function(sla) {
        var s = "<b>Spell-Like Abilities</b> (CL " + sla["casterlevel"] + ")<br/>";
        sla["abilities"].sort(function(a, b) {
            if(a["frequency"] == b["frequency"]) return a["name"].localeCompare(b["name"]);
            else if(a["frequency"] == "constant") return 1;
            else if(b["frequency"] == "constant") return -1;
            else if(a["frequency"] == "at will") return 1;
            else if(b["frequency"] == "at will") return -1;
            else {
                var af = parseInt(a["frequency"].split("/")[0]);
                var bf = parseInt(a["frequency"].split("/")[0]);
                return af > bf;
            }
        });
        var a = [];
        var currFreq = "";
        _.each(sla["abilities"], function(obj) {
            if(currFreq.length == 0) {
                currFreq = obj["frequency"];
                a.push([currFreq]);
            }
            else if(currFreq != obj["frequency"]) {
                currFreq = obj["frequency"];
                a.push([currFreq]);
            }
            var n = obj["name"];
            if(!_.isNaN(obj["dc"])) { n += " (DC " + obj["dc"] + ")"; }
            a[a.length-1].push(n);
        });
        _.each(a, function(obj) {
            s += obj[0] + "--" + obj.slice(1).join(", ") + "<br/>";
        });
        return s;
    }
    skify = function(spellsknown) {
        var s = "<b>Spells Known</b> (CL " + spellsknown["casterlevel"] + ")<br/>";
        var sk = [];
        spellsknown["perday"].sort(function(a, b) {
            return a["level"] < b["level"];
        });
        spellsknown["spells"].sort(function(a, b) {
            if(a["level"] == b["level"]) return a["name"].localeCompare(b["name"]);
            else return a["level"] < b["level"];
        });
        _.each(spellsknown["perday"], function(a) {
            s += ordinate(a["level"]) + " (";
            if(_.isNaN(a["number"])) { s += "at will"; }
            else { s += a["number"] + "/day"; }
            s += ")--";
            var spells = [];
            _.each(spellsknown["spells"], function(b) {
                if(b["level"] == a["level"]) {
                    var n = b["name"];
                    if(!_.isNaN(b["dc"])) { n += " (DC " + b["dc"] + ")"; }
                    spells.push(n);
                }
            });
            s += spells.join(", ") + "<br/>";
        });
        return s;
    }
    abilify = function(abilities) {
        var s = [];
        var a = ["str", "dex", "con", "int", "wis", "cha"];
        _.each(a, function(name) {
            var x = "<b>" + name.toProperCase() + "</b> ";
            if(_.isNaN(abilities[name])) { x += "--"; }
            else { x += abilities[name]; }
            s.push(x);
        });
        return s.join(", ");
    }
    featify = function(feats) {
        var properfeats = [];
        _.each(feats, function(f) {
            properfeats.push(f.toProperCase());
        });
        return properfeats.join(", ");
    }
    skillify = function(skills) {
        var sorted = [];
        _.each(skills, function(value, key) {
            sorted.push(key);
        });
        sorted.sort();
        var s = [];
        _.each(sorted, function(value) {
            var n = value.toProperCase() + " " + bonify(skills[value]["bonus"]);
            if(skills[value]["circumstantial"].length > 0) { n += " (" + skills[value]["circumstantial"] + ")"; }
            s.push(n);
        });
        return s.join(", ");
    }
    saify = function(sa) {
        var s = [];
        _.each(sa, function(obj) {
            var n = "<b>" + obj["name"].toProperCase() + "</b> " + obj["description"];
            s.push(n);
        });
        return s.join("<br/>");
    }

    if(monsterName in state["inspired.BESTIARY"]) {
        var monster = state["inspired.BESTIARY"][monsterName];
        s = "";
        s += "<b>" + monsterName.toProperCase() + " (CR " + monster["cr"] + ")</b><br/>";
        s += "<b>XP " + monster["xp"] + "</b><br/>";
        s += monster["alignment"].join(", ").toUpperCase() + " " + monster["size"].toProperCase() + 
             " " + monster["type"];
        if(_.size(monster["subtype"]) > 0) { s += " (" + monster["subtype"].join(", ") + ")"; }
        s += "<br/>";
        s += "<b>Init</b> " + bonify(monster["initiative"]) + "; <b>Senses</b> " + monster["senses"].join(", ") + "<br/>";
        if(_.size(monster["auras"]) > 0) { s += "<b>Aura</b> " + monster["auras"].join(", ") + "<br/>"; }
        s += "<br/><b>DEFENSE</b><br/>";
        s += "<b>AC</b> " + monster["ac"]["normal"] + ", touch " + monster["ac"]["touch"] + ", flat-footed " + monster["ac"]["flat-footed"] + "<br/>";
        s += "<b>hp</b> " + monster["hp"] + " (" + monster["hd"] + ")<br/>";
        s += "<b>Fort</b> " + savify(monster["saves"]["fortitude"]) + 
             ", <b>Ref</b> " + savify(monster["saves"]["reflex"]) + 
             ", <b>Will</b> " + savify(monster["saves"]["will"]) + "<br/>";
        var otherDefense = []
        if(_.size(monster["dr"]) > 0) { otherDefense.push("<b>DR</b> " + monster["dr"].join(", ")); }
        if(_.size(monster["immunities"]) > 0) { otherDefense.push("<b>Immune</b> " + monster["immunities"].join(", ")); }
        if(_.size(monster["resistances"]) > 0) { otherDefense.push("<b>Resist</b> " + monster["resistances"].join(", ")); }
        if(monster["sr"]["value"] > 0) { 
            var sr = "<b>SR</b> " + monster["sr"]["value"];
            if(monster["sr"]["versus"].length > 0) { sr += " (vs. " + monster["sr"]["versus"] + ")"; }
            otherDefense.push(sr);
        }
        s += otherDefense.join("; ");
        s += "<br/>";
        if(_.size(monster["weaknesses"]) > 0) { s += "<b>Weaknesses</b> " + monster["weaknesses"].join(", ") + "<br/>"; }
        s += "<br/><b>OFFENSE</b><br/>";
        s += "<b>Speed</b> " + monster["speed"].join(", ") + "<br/>";
        if(_.size(monster["melee"]) > 0) { s += "<b>Melee</b> " + attackify(monster["melee"]) + "<br/>"; }
        if(_.size(monster["ranged"]) > 0) { s += "<b>Ranged</b> " + attackify(monster["ranged"]) + "<br/>"; }
        s += "<b>Space</b> " + monster["space"] + "; <b>Reach</b> " + monster["reach"] + "<br/>";
        if(_.size(monster["specialattacks"]) > 0) { s += "<b>Special Attacks</b> " + monster["specialattacks"].join(", ").replace("dc ", "DC ") + "<br/>"; }
        if(_.size(monster["sla"]) > 0) { s += slaify(monster["sla"]); }
        if(_.size(monster["spellsknown"]) > 0) { s += skify(monster["spellsknown"]); } 
        s += "<br/><b>STATISTICS</b><br/>";
        s += abilify(monster["abilityscores"]) + "<br/>";
        s += "<b>Base Atk</b> " + bonify(monster["bab"]) + "; <b>CMB</b> ";
        s += bonify(monster["cmb"]["bonus"]);
        if(monster["cmb"]["special"].length > 0) { s += " (" + monster["cmb"]["special"] + ")"; }
        s += "; <b>CMD</b> " + monster["cmd"]["bonus"];
        if(monster["cmd"]["special"].length > 0) { s += " (" + monster["cmd"]["special"] + ")"; }
        s += "<br/>";
        if(_.size(monster["feats"]) > 0) { s += "<b>Feats</b> " + featify(monster["feats"]) + "<br/>"; }
        if(_.size(monster["skills"]) > 0) { s += "<b>Skills</b> " + skillify(monster["skills"]) + "<br/>"; }
        if(_.size(monster["languages"]) > 0) { s += "<b>Languages</b> " + monster["languages"].join(", ") + "<br/>"; }
        if(_.size(monster["specialabilities"]) > 0) {
            s += "<br/><b>SPECIAL ABILITIES</b><br/>";
            s += saify(monster["specialabilities"]);
        }
        return s;
    }
    else {
        return false;        
    }
}



on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!beastcraft ") && inspired.isGM(msg.playerid)) {
        var monsterName = msg.content.replace("!beastcraft ", "").trim().toLowerCase();
        if(monsterName in state["inspired.BESTIARY"]) {
            var monster = state["inspired.BESTIARY"][monsterName];
            monster["name"] = monsterName;
            var numCreated = 0;
            _.each(msg.selected, function(elt, index) {
                var token = getObj("graphic", elt["_id"]);
                if(token.get("subtype") == "token") {
                    inspired.createMonster(token, monster);
                    numCreated++;
                }
            });
            
            if(numCreated == 0) {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You must select at least one token to turn into a creature.");
            }
            else {
                var notes = "";
                if(_.size(monster["auras"]) > 0) {
                    notes += " This creature has the following auras: " + monster["auras"].join(",");
                }
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You created " + numCreated + " <i>" + monsterName + "</i>(s)." + notes);
            }
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <i>" + monsterName + "</i> is not a valid creature.");        
        }
    }
    else if(msg.content.contains("!beastinfo ") && inspired.isGM(msg.playerid)) {
        var monsterName = msg.content.replace("!beastinfo ", "").trim().toLowerCase();
        var info = inspired.displayMonster(monsterName);
        if(info === false) {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <i>" + monsterName + "</i> is not a valid creature.");        
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <br/>" + info);
        }
    }
});


on("change:token:bar1_value", function(obj) {
    // Only use this for creatures the GM controls.
    var gmControlled = inspired.isControlledByGM(obj);
    if(gmControlled) {
        // Display the defenseinfo ability if it exists...
        if(obj.get("represents").length > 0) {
            var c = getObj("character", obj.get("represents"));
            var da = findObjs({_type: "ability", _characterid: c.get("_id"), name: "defenseinfo"});
            if(_.size(da) > 0) {
                sendChat("Roll20", da[0].get("action"));
            }
        }
    }
});


on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!eot")) {
        // If we're not using the turn tracker, then our options are limited,
        // so just ignore this option.
        if(!_.isFunction(inspired.inCombat)) return;
        // Only respond to these events if we're in combat.
        if(!inspired.inCombat()) return;
        var turnorder;
        if(Campaign().get("turnorder") == "") turnorder = [];
        else turnorder = JSON.parse(Campaign().get("turnorder"));
        if(_.size(turnorder) > 0) {
            var topid = turnorder[0]["id"];
            // Is the top element controlled by the GM?
            var token = getObj("graphic", topid);
            if(inspired.isControlledByGM(token)) {
                if(token.get("represents").length > 0) {
                    var c = getObj("character", token.get("represents"));
                    var pta = findObjs({_type: "ability", _characterid: c.get("_id"), name: "perturninfo"});
                    if(_.size(pta) > 0) {
                        sendChat("Roll20", pta[0].get("action"));
                    }
                }
            }
        }
    }
});
   

on("change:campaign:turnorder", function(obj) {
    // If we're not using the turn tracker, then our options are limited,
    // so just ignore this option.
    if(!_.isFunction(inspired.inCombat)) return;
    // Only respond to these events if we're in combat.
    if(!inspired.inCombat()) return;
    if(obj.get("turnorder") == "") turnorder = [];
    else turnorder = JSON.parse(obj.get("turnorder"));
    if(_.size(turnorder) > 0) {
        var topid = turnorder[0]["id"];
        // Is the top element controlled by the GM?
        var token = getObj("graphic", topid);
        if(inspired.isControlledByGM(token)) {
            if(token.get("represents").length > 0) {
                var c = getObj("character", obj.get("represents"));
                var pta = findObjs({_type: "ability", _characterid: c.get("_id"), name: "perturninfo"});
                if(_.size(pta) > 0) {
                    sendChat("Roll20", pta[0].get("action"));
                }
            }
        }
    }
});
