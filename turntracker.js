/*******************************************************************************
 * turntracker.js - Manages turn order and round count during combat.
 * 
 * Dependencies: utilities.js
 *******************************************************************************
 *
 * The general usage for this script is as follows:
 * 
 * !begincombat
 *  GMs can issue this command to begin tracking the rounds of the combat.
 *  Once this command is issued, illegal modifications to the queue order
 *  are prevented (until !endcombat is issued).
 * 
 * !endcombat
 *  GMs can issue this command to end the tracking of rounds. Doing so resets
 *  all of the variables associated with the rounds back to their initial
 *  states.
 * 
 * !eot
 *  Any user can issue this end-of-turn command to end the current turn, as 
 *  long as the current turn is held by a token that user controls. 
 *  (Player A cannot declare end-of-turn on Player B's token's turn.)
 *  Issuing this command advances the queue by one position. No other 
 *  notification/feedback is provided. This command only works during active 
 *  combat.
 * 
 * !round
 *  Any user can issue this command to display (via self-whisper) the current
 *  round information (round number, top of the order, and number of turns
 *  taken be each character the issuing user controls.
 * 
 * It is important to note that this turn-tracking system does NOT require any
 * additional tokens to be added to the queue in order to mark the top/bottom
 * of a round.
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

// The inspired.gmlist variable contains the list of all player 
// _d20userid values that serve as GMs in the campaign. This variable 
// must be updated for your particular campaign.
state["inspired.gmlist"] = ["104278"];

// This variable holds everything we need in order to track the participants
// through the rounds.
// * round: an integer representing the current round of combat
// * top: the id of token currently holding the top of the order
//        The top token essentially determines when the round is over.
//        Once it reaches its next turn, a new round begins.
// * turns: a dictionary of ids mapped to arrays of integers
//          Each element in this dictionary corresponds to the id of
//          a token engaged in combat. The array to which it is mapped
//          is just a list of each of the round numbers where this token
//          participated. For instance, an element of this dictionary
//          could be the following:
//              "-g4wsar2Wt": [3, 4, 5]
//          This would tell us that the token corresponding to that id
//          entered combat and participated starting in round 3 and
//          continued participating in rounds 4 and 5.
state["inspired.turntracker"] = {"round": 0, "top": "", "turns": {}};


// This is a utility function to let us know when we're in combat.
// If the round is positive, then combat is active.
inspired.inCombat = function() {
    return state["inspired.turntracker"]["round"] > 0;
}


on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!begincombat") && !inspired.inCombat() && 
       _.contains(state["inspired.gmlist"], getObj("player", msg.playerid).get("_d20userid"))) {
        // If we receive a "!begincombat" command, if we're not already involved
        // in combat, and if the sender of the command is a GM, then we should
        // initialize the tracker information.
        var turnorder;
        if(Campaign().get("turnorder") == "") turnorder = [];
        else turnorder = JSON.parse(Campaign().get("turnorder"));
        if(_.size(turnorder) > 0) {
            state["inspired.turntracker"]["round"] = 1;
            state["inspired.turntracker"]["top"] = "";
            state["inspired.turntracker"]["turns"] = {}
            _.each(turnorder, function(elt, index) {
                state["inspired.turntracker"]["turns"][elt["id"]] = [];
            });
            state["inspired.turntracker"]["top"] = turnorder[0]["id"];
            sendChat(msg.who, "/desc The combat begins...");
            sendChat(msg.who, "/desc Begin Round 1...");
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " There are no tokens in the turn order.");
        }

        // Show the turn order box (if it isn't already visible).
        if(Campaign().get("initiativepage") === false) {
            Campaign().set("initiativepage", Campaign().get("playerpageid"));
        }
    }
    else if(msg.content.contains("!endcombat") && inspired.inCombat() &&
            _.contains(state["inspired.gmlist"], getObj("player", msg.playerid).get("_d20userid"))) {
        sendChat(msg.who, "/desc The combat is over.");
        state["inspired.turntracker"]["round"] = 0;
        state["inspired.turntracker"]["top"] = "";
        state["inspired.turntracker"]["turns"] = {}

        // Clear and hide the turn order box.
        Campaign().set("turnorder", "");
        Campaign().set("initiativepage", false);
    }
    else if(msg.content.contains("!eot")) {
        var turnorder;
        if(Campaign().get("turnorder") == "") turnorder = [];
        else turnorder = JSON.parse(Campaign().get("turnorder"));
        if(_.size(turnorder) > 0 && inspired.inCombat()) {
            var topToken = getObj("graphic", turnorder[0]["id"]);
            if(_.contains(state["inspired.gmlist"], getObj("player", msg.playerid).get("_d20userid")) || 
               inspired.isControlledBy(topToken, msg.playerid)) {
                var front = turnorder.shift();
                state["inspired.turntracker"]["turns"][front["id"]].push(state["inspired.turntracker"]["round"]);
                turnorder.push(front);
                Campaign().set("turnorder", JSON.stringify(turnorder));
                var newFront = turnorder[0]["id"];
                if(newFront == state["inspired.turntracker"]["top"]) {
                    state["inspired.turntracker"]["round"] += 1;
                    sendChat(msg.who, "/desc Begin Round " + state["inspired.turntracker"]["round"] + "...");
                }
            }
            else {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You cannot end a turn that is not yours.");
            }
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " There is no active combat.");
        }
    }
    else if(msg.content.contains("!round")) {
        if(inspired.inCombat()) {
            var topName = state["inspired.turntracker"]["top"];
            var topTok = getObj("graphic", topName);
            if(topTok.get("name").length > 0) topName = topTok.get("name");
            var s = "<br/><table><tbody><tr><td><strong>Round</strong></td><td style='padding-left: 5px'>" + state["inspired.turntracker"]["round"] + "</td></tr>";
            s += "<tr><td><strong>Top of Order</strong></td><td style='padding-left: 5px'>" + topName + "</td></tr></tbody></table><br/>";
            s += "<table><thead><th>Combatant</th><th>Turns Taken</th></thead><tbody>";
            _.each(state["inspired.turntracker"]["turns"], function(obj, id) {
                var tok = getObj("graphic", id);
                if(_.contains(state["inspired.gmlist"], getObj("player", msg.playerid).get("_d20userid")) || 
                   inspired.isControlledBy(tok, msg.playerid)) {
                    var name = "";
                    if(tok.get("name").length > 0) name = tok.get("name");
                    else name = tok.get("_id");
                    var rounds = _.size(state["inspired.turntracker"]["turns"][id]);
                    s += "<tr><td>" + name + "</td><td>" + rounds + "</td></tr>";
                }
            });
            s += "</tbody></table>";
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " " + s);
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " There is no active combat.");
        }
    }
});


on("change:campaign:turnorder", function(obj, prev) {
    // Only respond to these events if we're in combat.
    if(!inspired.inCombat()) return;
    var newTurnorder, oldTurnorder;
    if(obj.get("turnorder") == "") newTurnorder = [];
    else newTurnorder = JSON.parse(obj.get("turnorder"));
    if(prev["turnorder"] == "") oldTurnorder = [];
    else oldTurnorder = JSON.parse(prev["turnorder"]);
    
    // OK, so this gets a little hairy. The idea is that we want to know what
    // happened to generate this change event. Either a new token was added,
    // a token was deleted, or the order was changed around. If we create a
    // map of where tokens were previously and where they are now, it will
    // help us to determine which of those situations we're in.
    // 
    // For each element in the previous turnorder and the current turnorder,
    // we add each element into our map, making note of the position it held
    // in the previous and current orders (defaulting to -1 for both). After
    // the map is finished, any id with an oldPos < 0 would mean it was just
    // added. Any id with a newPos < 0 would mean it was just deleted. And 
    // any where oldPos != newPos would mean a modification to the order.
    var turnmap = {};
    _.each(oldTurnorder, function(elt, index) {
        var id = elt["id"];
        if(!(id in turnmap)) {
            turnmap[id] = {"oldPos": -1, "newPos": -1, "id": id};
            if((id in state["inspired.turntracker"]["turns"]) && _.size(state["inspired.turntracker"]["turns"][id]) > 0) {
                turnmap[id]["lastround"] = _.max(state["inspired.turntracker"]["turns"][id]);
            }
            else {
                turnmap[id]["lastround"] = 0;
            }
        }
        turnmap[id]["oldPos"] = parseInt(index);
    });
    
    _.each(newTurnorder, function(elt, index) {
        var id = elt["id"];
        if(!(id in turnmap)) {
            turnmap[id] = {"oldPos": -1, "newPos": -1, "id": id};
            if((id in state["inspired.turntracker"]["turns"]) && _.size(state["inspired.turntracker"]["turns"][id]) > 0) {
                turnmap[id]["lastround"] = _.max(state["inspired.turntracker"]["turns"][id]);
            }
            else {
                turnmap[id]["lastround"] = 0;
            }
        }
        turnmap[id]["newPos"] = parseInt(index);
    });
    
    var insert = _.filter(turnmap, function(elt){ return elt["oldPos"] < 0; });
    var remove = _.filter(turnmap, function(elt){ return elt["newPos"] < 0; });
    var modify = _.filter(turnmap, function(elt){ return elt["newPos"] != elt["oldPos"]; });
    if(_.size(insert) > 0) {
        // We need to add the inserted element into our global turntracker
        // turns list. If it is already there (because it was there previously
        // and was then deleted and reinserted), then we will reset its round
        // list to the empty list.
        state["inspired.turntracker"]["turns"][insert[0]["id"]] = [];
    }
    else if(_.size(remove) > 0) {
        if(remove[0]["id"] == state["inspired.turntracker"]["top"]) {
            // If the old top value was somewhere in the front of the list,
            // then we need to make the new top value be the element just
            // after the old top.
            // If the old top value was actually at the bottom of the order 
            // when it was deleted, then we need to make the current element
            // at the top of the order the new top value.
            var newTop = _.find(turnmap, function(elt){ return elt["oldPos"] == remove[0]["oldPos"] + 1; });
            if(_.isUndefined(newTop)) newTop = _.find(turnmap, function(elt){ return elt["oldPos"] == 0; });
            state["inspired.turntracker"]["top"] = newTop["id"];
        }
    }
    else if(_.size(modify) > 0) {
        // It's possible for the user to modify the initiative value for a
        // token, which would trigger this event but would not actually 
        // fall into any of the cases that we care about here. That's why
        // this is not simply an "else" block.
        //
        // If we modify the order, the only rule we need to follow is that
        // we should not be allowed to make any change such that those 
        // participants that have already moved this round (which should be 
        // a block) get infiltrated by those who have yet to move. Essentially,
        // we just need to ensure that the block of "already gones" stays 
        // together. As long as they do, the order is still valid. 
        // 
        // However, it may be required to modify the top element, depending
        // on whether the block has been rearranged. Here, the "already
        // gone" at the earliest location in the turn order effectively 
        // becomes the top.
        var startOfAlreadyGones = -1;
        var validOrdering = true;
        _.each(newTurnorder, function(elt, index) {
            if(startOfAlreadyGones >= 0) {
                if(turnmap[elt["id"]]["lastround"] != state["inspired.turntracker"]["round"]) {
                    validOrdering = false;
                }
            }
            else if(turnmap[elt["id"]]["lastround"] == state["inspired.turntracker"]["round"]) {
                startOfAlreadyGones = parseInt(index);
            }
        });
        if(validOrdering) {
            if(startOfAlreadyGones >= 0) {
                state["inspired.turntracker"]["top"] = newTurnorder[startOfAlreadyGones]["id"];
            }
            else {
                state["inspired.turntracker"]["top"] = newTurnorder[0]["id"];                
            }
        }
        else {
            sendChat("Roll20", "/w gm That is an illegal modification to the turn order.");
            Campaign().set("turnorder", JSON.stringify(oldTurnorder));
        }
    }
});
