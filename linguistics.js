/*******************************************************************************
 * linguistics.js - Provides in-chat command for speaking in other languages.
 * 
 * Dependencies: none
 *******************************************************************************
 *
 * The general usage for this script is as follows:
 * 
 * !speak <language> <message>
 * 
 * The <language> must exist in the predefined set stored in 
 * state["inspired.languages"]. The speaker must be a character (so the player 
 * must choose a character to "speak as" for this use), and that character must 
 * have an Ability listed in the character information called "languages" that 
 * contains the name of the spoken language. For example, a character may have 
 * "elven, dwarven, sylvan" as the value for the "languages" Ability. All other 
 * characters that share the given language (via their own "languages" Ability) 
 * will see the message as intended. Those characters that do not share the 
 * language will see obfuscated text from other symbol sets. The GM will see the
 * actual message as intended, along with a list of those characters that also 
 * could understand the message.
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
if(!('!hashCode' in String.prototype)) {
    String.prototype.hashCode = function(){
        var hash = 0, i, char;
        if(this.length == 0) return hash;
        for (i = 0, l = this.length; i < l; i++) {
            char  = this.charCodeAt(i);
            hash  = ((hash<<5)-hash)+char;
            hash |= 0; // Convert to 32-bit integer
        }
        return hash;
    };
}


state["inspired.languages"] = ["aboleth", "abyssal", "aklo", "aquan", "auran",
                               "boggard", "celestial", "cyclops", "darkfolk",
                               "draconic", "drowsign", "druidic", "dwarven",
                               "dziriak", "elven", "giant", "gnoll", "gnome",
                               "goblin", "grippli", "halfling", "ignan", 
                               "infernal", "necril", "orc", "protean", "sphinx",
                               "sylvan", "tengu", "terran", "treant", 
                               "undercommon", "vegepygmy"];


on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!speak ")) {
        var parts = msg.content.replace("!speak ", "").split(" ");
        var language = _.first(parts);
        var message = _.rest(parts).join(" ");
        var languageIndex = _.indexOf(state["inspired.languages"], language);
        if(languageIndex >= 0) {
            var speakingCharacter = filterObjs(function(obj) {
                                                return (obj.get("type") == "character") &&
                                                       (obj.get("name") == msg.who) &&
                                                       (obj.get("controlledby") == "all" ||
                                                        obj.get("controlledby").contains(msg.playerid));
                                               });
            // If the character really exists and the player actually has 
            // control of the speaking character...
            // (I'm not sure that the alternative is even possible in Roll20,
            // but it doesn't cost much to check.)
            if(_.size(speakingCharacter) > 0) {
                speakingCharacter = speakingCharacter[0];
                var literateCharacters = [];
                var languageAbilities = findObjs({_type: "ability", name: "languages"});
                _.each(languageAbilities, function(obj) {
                    if(obj.get("action").contains(language)) literateCharacters.push(obj.get("_characterid"));
                });
                var illiterateCharacters = _.difference(_.map(findObjs({_type: "character"}), 
                                                              function(obj){return obj.get("_id");}),
                                                        literateCharacters);
                
                // If the character speaks the language in question...
                if(_.contains(literateCharacters, speakingCharacter.get("_id"))) {
                    // Translate the message into the given language. This is done
                    // by taking a range from the unicode set and carving it into
                    // equal slices, one for each of the available languages. 
                    // The benefit of this approach is that it (ideally) keeps
                    // symbols consistent within a language and allows different
                    // languages to exhibit different symbol sets.
                    // To translate a given message, we use the name of the 
                    // language as a "key" that we add to each character, which
                    // then maps back to one of the given symbols for that 
                    // language. However, in order to allow words to be broken
                    // up in different configurations that those typed in the
                    // original message, some characters are replaced with 
                    // spaces, depending on the character value and the language.
                    var MIN_ASCII = 4256;
                    var MAX_ASCII = 5750;
                    var key = language.hashCode() >>> 0; // Make the hash unsigned.
                    var numLanguages = _.size(state["inspired.languages"]);
                    var symbolSet = _.indexOf(state["inspired.languages"], language);
                    var symbolsPerLanguage = Math.floor((MAX_ASCII - MIN_ASCII + 1) / numLanguages);
                    var translation = "";
                    _.each(message, function(elt, index) {
                        var t = (elt.charCodeAt(0) + key) % symbolsPerLanguage;
                        if(t % (3 + (key % 12)) == 0) translation += " ";
                        else translation += String.fromCharCode(t + symbolsPerLanguage * symbolSet + MIN_ASCII);
                    });
                    // Take out multiple consecutive spaces and replace with single &nbsp;
                    translation = translation.replace(/ +/g, "&nbsp; ");
                
                    // Now, communicate the message to the literate and illiterate.
                    var literateCharacterNames = [];
                    _.each(literateCharacters, function(cid) {
                        var name = getObj("character", cid).get("name");
                        if(name.length > 0) {
                            var header = "<small>To " + name + " in <i>" + language + "</i></small><br/>";
                            sendChat(msg.who, "/w " + name + " " + header + message);
                            literateCharacterNames.push(name);
                        }
                    });
                    _.each(illiterateCharacters, function(cid) {
                        var name = getObj("character", cid).get("name");
                        if(name.length > 0) {
                            var header = "<small>To " + name + " in <i>" + language + "</i></small><br/>";
                            sendChat(msg.who, "/w " + name + " " + header + translation);
                        }
                    });
                    
                    // Also let the GM know what was said. (The GM is under the
                    // effects of a permanent tongues spell.) He should also 
                    // be alerted as to which of the characters understood the
                    // message (rather than being forced to remember or look up
                    // each character's languages).
                    var listeners = literateCharacterNames.join(", ");
                    if(listeners.length == 0) listeners = "no one";
                    sendChat(msg.who, "/w gm <small>in <i>" + language + "</i><br/>understood by " + 
                                      listeners + "</small><br/>" + message);
                }
                else {
                    sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You do not speak <i>" + language + "</i>.");
                }
            }
            else {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You are not speaking as a character, or you have no control over the character.");
            }
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <i>" + language + "</i> is not a valid language.");
        }
    }
});
