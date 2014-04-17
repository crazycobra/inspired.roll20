/*******************************************************************************
 * utilities.js - Provides low-level Roll20 API utility functions.
 * 
 * Dependencies: none
 *******************************************************************************
 *
 * This file supplies basic functionality needed across multiple scripts.
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


// This function return true if the playerid belongs to a player listed as a GM
// (as defined by the "inspired.gmlist" state variable) and false otherwise.
inspired.isGM = function(playerid) {
    var obj = getObj("player", playerid);
    if(!_.isUndefined(obj)) {
        return _.contains(state["inspired.gmlist"], obj.get("_d20userid"));
    }
    else {
        return false;
    }
}

// This function returns true if the object obj is controlled by the player
// with playerid. The reason a utility function is required is because Roll20
// does not automatically check the controlledby status of tokens linked to
// characters.
inspired.isControlledBy = function(obj, playerid) {
    if(obj.get("_type") == "graphic") {
        if(obj.get("represents").length > 0) {
            return getObj("character", obj.get("represents")).get("controlledby").contains(playerid);
        }
        else return obj.get("controlledby").contains(playerid);
    }
    else return false;
}

// This function returns the "controlledby" list of playerids (or an empty string
// if the object is not of type "graphic". The reason a utility function is 
// required is because Roll20 does not automatically check the controlledby 
// status of tokens linked to characters.
inspired.getControlledBy = function(obj) {
    if(obj.get("_type") == "graphic") {
        if(obj.get("represents").length > 0) {
            return getObj("character", obj.get("represents")).get("controlledby");
        }
        else return obj.get("controlledby");
    }
    else return "";
}

// This function parses a string and returns a new string with any dice rolls
// converted to inline roll commands (grouped in double-square-brackets).
// For example, the string "2d6+1d4+3 fire damage" would be converted to
// "[[2d6+1d4+3]] fire damage" and that new string would be returned.
inspired.rollify = function(str) {
    var re = /(\d+d\d+)((\s*[\+\-]\s*\d+d\d+)|(\s*[\+\-]\s*\d))*/g;
    var rstr = "";
    var curr = 0;
    while(match = re.exec(str)) {
        var preroll = str.substring(curr, match.index);
        var roll = str.substring(match.index, re.lastIndex);
        rstr += preroll;
        rstr += "[[";
        rstr += roll;
        rstr += "]]";
        curr = re.lastIndex;
    }
    rstr += str.substring(curr);
    return rstr;
}
