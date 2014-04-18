/*******************************************************************************
 * spellcraft.js - Provides tools for casting and interacting with spells.
 * 
 * Dependencies: spells.js, utilities.js
 *******************************************************************************
 *
 * The general usage for this script is as follows:
 * 
 * !spellhelp
 *  This command displays the possible options available with this script.
 * 
 * !spellsearch <search string>
 *  This command returns the spells available (as defined in spells.js) 
 *  with names that contain the search string.
 * 
 * !spellinfo <spell name>
 *  This command whispers the full spell information for the given spell.
 * 
 * !spellshow <spell name>
 *  This command broadcasts the full spell information for the given spell.
 * 
 * !spellorb
 *  This command requires the player to speak as a character with a linked
 *  token. It creates a new token called a "spellorb" that is associated with
 *  the character. The spellorb is used to position spells that are cast with
 *  the !spellcast command. If the !spellorb command is issued by a character
 *  that has already been assigned a spellorb, the existing spellorb generates
 *  a ping so that the player can locate it on the screen.
 *
 * !spellcast <spell name> [,optional arguments]
 *  This command requires the player to speak as a character with a linked
 *  token, and it also requires that character to have a spellorb. When it
 *  is executed, the spell's effects are rendered in Roll20. (This functionality
 *  is still being developed.)
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
if(!('toProperCase' in String.prototype)) {
    String.prototype.toProperCase = function() {
      return this.toLowerCase().replace(/^(.)|\s(.)/g, 
          function($1) { return $1.toUpperCase(); });
    }
}

var inspired = inspired || {};

// This URL will need to be modified to a graphic in the GM's library.
// It need only be a transparent image because the spellorb's aura will be 
// the part that is seen by the player.
inspired.SPELLORB = {"url": "https://s3.amazonaws.com/files.d20.io/images/1974569/ZHo2IwgEaM2P1JC1nf0Sbg/thumb.png?1380660503"};


/*-----------------------------------------------------------------------------*
 *                            UTILITY FUNCTIONS
 *-----------------------------------------------------------------------------*/
// These functions are needed for doing low-level drawing calculations.

inspired.getAngle = function(x1, y1, x2, y2) {
    // If (x1, y1) is the center, then the angle formed by
    // the line to (x2, y2) is as follows:
    //
    //      45   0   315
    //      90   C   270
    //     135  180  225
    //
    // This means that if (x1, y1) were the center of a clock face and (x2, y2)
    // were sitting at the 12, then this function would return 0. If (x2, y2)
    // were sitting at the 9, this function would return 90.
    // The return value is the angle in degrees.
    return Math.atan2(x2 - x1, y2 - y1) * 180 / Math.PI + 180;
}

inspired.conePath = function(size, isCorner) {
    // This function returns the defined path for a cone-shaped effect of the
    // specified size.
    // size: a number specifying the size of the cone
    // isCorner: a boolean value where true corresponds to a cone 
    //           from a corner (default false)
    function p(x, y) { 
        return ",[\"L\"," + distanceToPixels(x) + "," + distanceToPixels(y) + "]";
    }
    isCorner = _.isUndefined(isCorner)? false: isCorner;
    var invalidSize = false;
    var path = "[[\"M\",0,0]";
    if(isCorner) {
        if(size == 10) path += p(0, 10) + p(10, 10) + p(10, 0);
        else if(size == 15) path += p(0, 15) + p(10, 15) + p(10, 10) + p(15, 10) + p(15, 0);
        else if(size == 20) path += p(0, 20) + p(10, 20) + p(10, 15) + p(15, 15) + p(15, 10) + p(20, 10) + p(20, 0);
        else if(size == 30) path += p(0, 30) + p(10, 30) + p(10, 25) + p(20, 25) + p(20, 20) + p(25, 20) + p(25, 10) + p(30, 10) + p(30, 0);
        else if(size == 40) path += p(0, 40) + p(10, 40) + p(10, 35) + p(20, 35) + p(20, 30) + p(30, 30) + 
                                    p(30, 20) + p(35, 20) + p(35, 10) + p(40, 10) + p(40, 0);
        else if(size == 50) path += p(0, 50) + p(10, 50) + p(10, 45) + p(20, 45) + p(20, 40) + p(30, 40) + p(30, 35) + p(35, 35) +
                                    p(35, 30) + p(40, 30) + p(40, 20) + p(45, 20) + p(45, 10) + p(50, 10) + p(50, 0);
        else if(size == 60) path += p(0, 60) + p(10, 60) + p(10, 55) + p(20, 55) + p(20, 50) + p(30, 50) + p(30, 45) + p(40, 45) + p(40, 40) +
                                    p(45, 40) + p(45, 30) + p(50, 30) + p(50, 20) + p(55, 20) + p(55, 10) + p(60, 10) + p(60, 0);
        else if(size == 70) path += p(0, 70) + p(10, 70) + p(10, 65) + p(20, 65) + p(20, 60) + p(30, 60) + p(30, 55) + p(40, 55) + p(40, 50) + p(50, 50) +
                                    p(50, 40) + p(55, 40) + p(55, 30) + p(60, 30) + p(60, 20) + p(65, 20) + p(65, 10) + p(70, 10) + p(70, 0);
        else if(size == 80) path += p(0, 80) + p(10, 80) + p(10, 75) + p(20, 75) + p(20, 70) + p(30, 70) + p(30, 65) + p(40, 65) + p(40, 60) + p(50, 60) + p(50, 55) + p(55, 55) +
                                    p(55, 50) + p(60, 50) + p(60, 40) + p(65, 40) + p(65, 30) + p(70, 30) + p(70, 20) + p(75, 20) + p(75, 10) + p(80, 10) + p(80, 0);
        else invalidSize = true;
    }
    else {
        if(size == 10) path += p(0, 5) + p(10, 5) + p(10, -5) + p(0, -5);
        else if(size == 15) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 5) + p(15, 5) + 
                                    p(15, -5) + p(10, -5) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else if(size == 20) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 15) + p(15, 15) + p(15, 5) + p(20, 5) + 
                                    p(20, -5) + p(15, -5) + p(15, -15) + p(10, -15) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else if(size == 30) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 15) + p(15, 15) + p(15, 20) + p(20, 20) + 
                                    p(20, 15) + p(25, 15) + p(25, 5) + p(30, 5) + 
                                    p(30, -5) + p(25, -5) + p(25, -15) + p(20, -15) + 
                                    p(20, -20) + p(15, -20) + p(15, -15) + p(10, -15) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else if(size == 40) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 15) + p(15, 15) + p(15, 20) + p(20, 20) + p(20, 25) +
                                    p(30, 25) + p(30, 15) + p(35, 15) + p(35, 5) + p(40, 5) + 
                                    p(40, -5) + p(35, -5) + p(35, -15) + p(30, -15) + p(30, -25) + 
                                    p(20, -25) + p(20, -20) + p(15, -20) + p(15, -15) + p(10, -15) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else if(size == 50) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 15) + p(15, 15) + p(15, 20) + p(20, 20) + p(20, 25) + p(25, 25) + p(25, 30) + p(30, 30) + p(30, 35) + p(35, 35) +
                                    p(35, 25) + p(40, 25) + p(40, 15) + p(45, 15) + p(45, 5) + p(50, 5) + 
                                    p(50, -5) + p(45, -5) + p(45, -15) + p(40, -15) + p(40, -25) + p(35, -25) + 
                                    p(35, -35) + p(30, -35) + p(30, -30) + p(25, -30) + p(25, -25) + p(20, -25) + p(20, -20) + p(15, -20) + p(15, -15) + p(10, -15) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else if(size == 60) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 15) + p(15, 15) + p(15, 20) + p(20, 20) + p(20, 25) + p(25, 25) + p(25, 30) + p(30, 30) + p(30, 35) + p(35, 35) +
                                    p(35, 40) + p(40, 40) + p(40, 35) + p(45, 35) + p(45, 25) + p(50, 25) + p(50, 15) + p(55, 15) + p(55, 5) + p(60, 5) +
                                    p(60, -5) + p(55, -5) + p(55, -15) + p(50, -15) + p(50, -25) + p(45, -25) + p(45, -35) + p(40, -35) + p(40, -40) + p(35, -40) +
                                    p(35, -35) + p(30, -35) + p(30, -30) + p(25, -30) + p(25, -25) + p(20, -25) + p(20, -20) + p(15, -20) + p(15, -15) + p(10, -15) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else if(size == 70) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 15) + p(15, 15) + p(15, 20) + p(20, 20) + p(20, 25) + p(25, 25) + p(25, 30) + p(30, 30) + p(30, 35) + p(35, 35) +
                                    p(35, 40) + p(40, 40) + p(40, 45) + p(50, 45) + p(50, 35) + p(55, 35) + p(55, 25) + p(60, 25) + p(60, 15) + p(65, 15) + p(65, 5) + p(70, 5) + p(70, -5) + p(65, -5) + p(65, -15) +
                                    p(60, -15) + p(60, -25) + p(55, -25) + p(55, -35) + p(50, -35) + p(50, -45) + p(40, -45) + p(40, -40) + p(35, -40) + p(35, -35) + p(30, -35) + p(30, -30) + p(25, -30) + p(25, -25) +                                     
                                    p(20, -25) + p(20, -20) + p(15, -20) + p(15, -15) + p(10, -15) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else if(size == 80) path += p(0, 5) + p(5, 5) + p(5, 10) + p(10, 10) + p(10, 15) + p(15, 15) + p(15, 20) + p(20, 20) + p(20, 25) + p(25, 25) + p(25, 30) + 
                                    p(30, 30) + p(30, 35) + p(35, 35) +  p(35, 40) + p(40, 40) + p(40, 45) + 
                                    p(45, 45) + p(45, 50) + p(50, 50) + p(50, 55) + p(55, 55) + p(55, 45) + p(60, 45) + p(60, 35) + p(65, 35) + p(65, 25) + p(70, 25) +
                                    p(70, 15) + p(75, 15) + p(75, 5) + p(80, 5) + p(80, -5) + p(75, -5) + p(75, -15) + p(70, -15) + p(70, -25) + p(65, -25) + p(65, -35) +
                                    p(60, -35) + p(60, -45) + p(55, -45) + p(55, -55) + p(50, -55) + p(50, -50) + p(45, -50) + p(45, -45) +
                                    p(40, -45) + p(40, -40) + p(35, -40) + p(35, -35) + p(30, -35) + p(30, -30) + p(25, -30) + p(25, -25) +                                     
                                    p(20, -25) + p(20, -20) + p(15, -20) + p(15, -15) + p(10, -15) + p(10, -10) + p(5, -10) + p(5, -5) + p(0, -5);
        else invalidSize = true;
    }
    path += p(0, 0);
    path += "]";
    if(invalidSize) path = "";
    return path;
}

inspired.circlePath = function(size, isCenter) {
    // This function returns the defined path for a circular effect
    // of the specified size.
    // size: a number corresponding to the size of the effect (typically the radius)
    // isIntersection: a boolean value where true corresponds to a radius 
    //                 centered on a square (default false)

    function m(x, y) {
        return "[[\"M\"," + distanceToPixels(x) + "," + distanceToPixels(y) + "]";
    }
    function p(x, y) { 
        return ",[\"L\"," + distanceToPixels(x) + "," + distanceToPixels(y) + "]";
    }
    isCenter = _.isUndefined(isCenter)? false : isCenter;
    var invalidSize = false;
    var path = "";
    if(isCenter) {
        if(size == 5) path += m(0, 5) + p(0, 10) + p(5, 10) + p(5, 15) + p(10, 15) + p(10, 10) + p(15, 10) + p(15, 5) + p(10, 5) + p(10, 0) + p(5, 0) + p(5, 5) + p(0, 5);
        else if(size == 10) path += m(0, 10) + p(0, 15) + p(5, 15) + p(5, 20) + p(10, 20) + p(10, 25) + p(15, 25) + p(15, 20) + p(20, 20) + p(20, 15) + p(25, 15) + p(25, 10) + 
                                    p(20, 10) + p(20, 5) + p(15, 5) + p(15, 0) + p(10, 0) + p(10, 5) + p(5, 5) + p(5, 10) + p(0, 10);
        else if(size == 20) path += m(0, 20) + p(0, 25) + p(5, 25) + p(5, 40) + p(20, 40) + p(20, 45) + p(25, 45) + p(25, 40) + p(40, 40) + p(40, 25) + p(45, 25) + p(45, 20) + 
                                    p(40, 20) + p(40, 5) + p(25, 5) + p(25, 0) + p(20, 0) + p(20, 5) + p(5, 5) + p(5, 20) + p(0, 20);
        else if(size == 30) path += m(0, 30) + p(0, 35) + p(5, 35) + p(5, 50) + p(10, 50) + p(10, 55) + p(15, 55) + p(15, 60) + p(30, 60) + p(30, 65) + p(35, 65) + p(35, 60) + 
                                    p(50, 60) + p(50, 55) + p(55, 55) + p(55, 50) + p(60, 50) + p(60, 35) + p(65, 35) + p(65, 30) + p(60, 30) + p(60, 15) + p(55, 15) + p(55, 10) + 
                                    p(50, 10) + p(50, 5) + p(35, 5) + p(35, 0) + p(30, 0) + p(30, 5) + p(15, 5) + p(15, 10) + p(10, 10) + p(10, 15) + p(5, 15) + p(5, 30) + p(0, 30);
        else if(size == 40) path += "";
        else if(size == 50) path += "";
        else if(size == 60) path += "";
        else if(size == 80) path += "";
        else invalidSize = true;
    }
    else {
        if(size == 5) path += m(0, 0) + p(0, 10) + p(10, 10) + p(10, 0) + p(0, 0);
        else if(size == 10) path += m(0, 5) + p(0, 15) + p(5, 15) + p(5, 20) + p(15, 20) + p(15, 15) + p(20, 15) + p(20, 5) + p(15, 5) + p(15, 0) + p(5, 0) + p(5, 5) + p(0, 5);
        else if(size == 15) path += m(0, 5) + p(0, 25) + p(5, 25) + p(5, 30) + p(25, 30) + p(25, 25) + p(30, 25) + p(30, 5) + p(25, 5) + p(25, 0) + p(5, 0) + p(5, 5) + p(0, 5);
        else if(size == 20) path += m(0, 10) + p(0, 30) + p(5, 30) + p(5, 35) + p(10, 35) + p(10, 40) + p(30, 40) + p(30, 35) + p(35, 35) + 
                                    p(35, 30) + p(40, 30) + p(40, 10) + p(35, 10) + p(35, 5) + p(30, 5) + p(30, 0) + p(10, 0) + p(10, 5) + p(5, 5) + p(5, 10) + p(0, 10);
        else if(size == 30) path += m(0, 20) + p(0, 40) + p(5, 40) + p(5, 50) + p(10, 50) + p(10, 55) + p(20, 55) + p(20, 60) + p(40, 60) + p(40, 55) + p(50, 55) + p(50, 50) +
                                    p(55, 50) + p(55, 40) + p(60, 40) + p(60, 20) + p(55, 20) + p(55, 10) + p(50, 10) + p(50, 5) + p(40, 5) + p(40, 0) + p(20, 0) + p(20, 5) +
                                    p(10, 5) + p(10, 10) + p(5, 10) + p(5, 20) + p(0, 20);
        else if(size == 40) path += m(0, 25) + p(0, 55) + p(5, 55) + p(5, 65) + p(10, 65) + p(10, 70) + p(15, 70) + p(15, 75) + p(25, 75) + p(25, 80) + p(55, 80) + p(55, 75) +
                                    p(65, 75) + p(65, 70) + p(70, 70) + p(70, 65) + p(75, 65) + p(75, 55) + p(80, 55) + p(80, 25) + p(75, 25) + p(75, 15) + p(70, 15) + p(70, 10) +
                                    p(65, 10) + p(65, 5) + p(55, 5) + p(55, 0) + p(25, 0) + p(25, 5) + p(15, 5) + p(15, 10) + p(10, 10) + p(10, 15) + p(5, 15) + p(5, 25) + p(0, 25);
        else if(size == 50) path += "";
        else if(size == 60) path += "";
        else if(size == 80) path += "";
        else if(size == 90) path += "";
        else if(size == 120) path += "";
        else if(size == 25) path += "";
        else invalidSize = true;
    }
    path += "]";
    if(invalidSize) path = "";
    return path;
}

inspired.distanceBetween = function(x1, y1, x2, y2) {
    // Returns the distance (in feet, rounded to whole grid squares)
    // between (x1, y1) and (x2, y2) where those coordinates are in
    // pixels.
    var dx = Math.abs(distanceToUnits(pixelsToDistance(x2 - x1)));
    var dy = Math.abs(distanceToUnits(pixelsToDistance(y2 - y1)));
    var distance = Math.floor(1.5 * Math.min(dx, dy) + (Math.max(dx, dy) - Math.min(dx, dy))) * inspired.DISTANCE_PER_UNIT;
    return distance;
}

inspired.findAllTokensWithin = function(x, y, radius) {
    // This function takes a point (x, y) and an optional radius,
    // and it returns an array of dictionaries (with keys "token"
    // and "distance") containing all the tokens on the current
    // page that are within radius of (x, y), sorted by distance
    // to (x, y). If radius is not specified, then all tokens
    // on the current page are included.
    // Note: This function only considers objects of type "graphic"
    //       that reside on the "objects" layer.
    var tokens = [];
    var allTokens = findObjs({_pageid: Campaign().get("playerpageid"), _type: "graphic", layer: "objects"});
    _.each(allTokens, function(obj) {
        tokens.push({"token": obj, "distance": inspired.distanceBetween(x, y, obj.get("left"), obj.get("top"))});
    });
    tokens.sort(function(a, b) { return a["distance"] - b["distance"]; });
    if(_.isUndefined(radius)) {
        // Find all tokens within radius of (x, y) and return them in order of 
        // sorted distance to (x, y).
        var rTokens = [];
        _.find(tokens, function(elt) {
            if(elt["distance"] <= radius) { 
                rTokens.push(elt);
                return false;
            }
            else return true;
        });
        return rTokens;
    }
    else {
        // Otherwise, we find all tokens and return them in order of sorted 
        // distance to (x, y).
        return tokens;
    }
}



/*-----------------------------------------------------------------------------*
 *                               SPELL CLASS
 *-----------------------------------------------------------------------------*/
// The Spell class needs to keep up with the modifications that spells make to
// things in the game. I probably need to make a class for a SpellEffect or 
// something like that. And then the spell keeps up with a list of its effects 
// that were made when it was cast. 
// 
// SpellEffect
//     - id: id of the affected object
//     - type: "creation", "modification", "deletion"
//     - attribute: affected attribute of the object (for "modification" types);
//                  defaults to "" for other types
//     - oldvalue: the previous value for the modification (default "")
//     - newvalue: the new value for the modification (default "")
//
// Much of this is still in development.    

inspired.Spell = function(spellName) {
    this.name = spellName;
    spellinfo = state["inspired.SPELL_LIST"][this.name];
    this.area = spellinfo["area"];
    this.castingtime = spellinfo["castingtime"];
    this.components = spellinfo["components"];
    this.description = spellinfo["description"];
    this.descriptor = spellinfo["descriptor"];
    this.dismissible = spellinfo["dismissible"];
    this.duration = spellinfo["duration"];
    this.effect = spellinfo["effect"];
    this.level = spellinfo["level"];
    this.range = spellinfo["range"];
    this.savingthrow = spellinfo["savingthrow"];
    this.school = spellinfo["school"];
    this.shapeable = spellinfo["shapeable"];
    this.spellresistance = spellinfo["spellresistance"];
    this.subschool = spellinfo["subschool"];
    this.targets = spellinfo["targets"];
    
    // These state variables track the person casting as well as
    // any changes generated by the spell.
    this.casterid = null;
    this.objectids = [];
}

inspired.Spell.prototype.toString = function() {
    var d = "";
    if(this.dismissible) d = " (D)";
    var s = "<b>" + this.name.toProperCase() + "</b><br/>";
    s += "<b>School</b> " + this.school;
    if(this.subschool.length > 0) s += " (" + this.subschool + ")";
    if(this.descriptor.length > 0) s += " [" + this.descriptor + "]";
    s += "<br/>";
    var levels = [];
    _.each(this.level, function(elt, index) {
        levels.push(elt["class"] + " " + elt["level"]);
    });
    s += "<b>Level</b> " + levels.join() + "<br/>";
    s += "<b>Casting Time</b> " + this.castingtime + "<br/>";
    s += "<b>Components</b> " + this.components + "<br/>";
    s += "<b>Range</b> " + this.range + "<br/>";
    if(this.area.length > 0) s += "<b>Area</b> " + this.area + "<br/>";
    if(this.effect.length > 0) s += "<b>Effect</b> " + this.effect + "<br/>";
    if(this.targets.length > 0) s += "<b>Targets</b> " + this.targets + "<br/>";
    s += "<b>Duration</b> " + this.duration + d + "<br/>";
    s += "<b>Saving Throw</b> " + this.savingthrow + "; <b>SR</b> ";
    if(this.spellresistance) s += "yes";
    else s += "no";
    s += "<br/>";
    s += "<hr/>";
    s += this.description;
    return s;
}

inspired.Spell.prototype.isAreaEffect = function(args) {
    // This method returns false if the spell is not
    // an area effect spell. Otherwise, it returns
    // a dictionary containing the following:
    //
    // type: radius (radial effect centered on intersection)
    //       burst (radial effect centered on center of square)
    //       emanation (radial effect centered on caster that does not move)
    //       aura (radial effect centered on caster that moves with him)
    //       pairwise (radial effect where each pair of targets can be no more 
    //                 than a fixed distance apart) 
    //       cone (cone effect)
    //       line (line effect)
    // size: number representing the size of the effect
    // 
    var result = {"type": "", "size": 0};
    
    // Here, we would like to programmatically determine these things from the
    // spell information. For now, we'll hard-code a few of them for testing
    // purposes. In the very worst case scenario, we could simply hard-code
    // all of the spells this way.
    if(this.name == "fireball") {
        result["type"] = "radius";
        result["size"] = 20;
    }
    else if(this.name == "magic circle against evil") {
        result["type"] = "burst";
        result["size"] = 10;
    }
    else if(this.name == "bless") {
        result["type"] = "emanation";
        result["size"] = 20;
    }
    else if(this.name == "aura of doom") {
        result["type"] = "aura";
        result["size"] = 20;
    }
    else if(this.name == "remove fear") {
        result["type"] = "pairwise";
        result["size"] = 30;
    }
    else if(this.name == "cone of cold") {
        result["type"] = "cone";
        result["size"] = 40;
    }
    else if(this.name == "lightning bolt") {
        result["type"] = "line";
        result["size"] = 40;
    }
    else {
        result = false;
    }
    return result;
    
    // This is a first attempt at automatically determining the effect info.
    /*
    if(this.area.contains("radius")) {
        // We know that it must be radius, burst, emanation, or aura.
        if(this.area.contains("centered on you")) {
            
            result["type"] = "";
        }
    }
    else if(this.effect.contains("radius")) {
        // We know that it must be 
    }
    else if(this.targets.contains("radius")) {
        // We know that it must be 
    
    }
    else if(this.targets.contains("no two of which")) {
        // We know that it must be pairwise.
    }
    else if(this.area.contains("cone")) {
        // We know that it must be cone.
    }
    else if(this.effect.contains("cone")) {
        // We know that it must be cone.    
    }
    else if(this.area.contains("line")) {
        // We know that it must be line.
    }
    else if(this.effect.contains("line")) {
        // We know that it must be line.
    }
    else {
        return false;
    }
    */
}

inspired.Spell.prototype.isDamaging = function(args) {
    return false;
}

inspired.Spell.prototype.isBuff = function(args) {
    return false;
}

inspired.Spell.prototype.isDebuff = function(args) {
    return false;
}

inspired.Spell.prototype.isConjuring = function(args) {
    return false;
}

inspired.Spell.prototype.cast = function(spellorb, spellargs) {
    var self = this;
    self.casterid = spellorb.get("name").replace("spellorb", "").trim();
    var characterToken = filterObjs(function(obj) {
                            if((obj.get("_type") == "graphic") && 
                               (obj.get("_pageid") == Campaign().get("playerpageid")) && 
                               obj.get("represents").contains(self.casterid)) {
                                return true;
                            }
                            else return false;
                          })[0];
    var castableSpell = false;
    var areaEffect = this.isAreaEffect(spellargs);
    var damaging = this.isDamaging(spellargs);
    var buff = this.isBuff(spellargs);
    var debuff = this.isDebuff(spellargs);
    var conjuring = this.isConjuring(spellargs);

    if(areaEffect !== false) {
        var properties = {"_pageid": Campaign().get("playerpageid"),
                          "controlledby": getObj("character", this.casterid).get("controlledby"),
                          "layer": "objects",
                          "width": 0,
                          "height": 0,
                          "top": 0,
                          "left": 0,
                          "rotation": 0,
                          "path": ""};
        var type = areaEffect["type"];
        var size = areaEffect["size"];
        if(type == "radius") {
            properties["width"] = distanceToPixels(size) * 2;
            properties["height"] = properties["width"];
            properties["top"] = spellorb.get("top") - spellorb.get("height")/2;
            properties["left"] = spellorb.get("left") + spellorb.get("width")/2;
            properties["path"] = inspired.circlePath(size, false);
            if(properties["path"].length > 0) {
                var o = createObj("path", properties);
                this.objectids.push(o.get("_id"));
                castableSpell = true;
            }
        }
        else if(type == "burst") {
            properties["width"] = distanceToPixels(size) * 2 + distanceToPixels(5);
            properties["height"] = properties["width"];
            properties["top"] = spellorb.get("top");
            properties["left"] = spellorb.get("left");
            properties["path"] = inspired.circlePath(size, true);
            if(properties["path"].length > 0) {
                var o = createObj("path", properties);
                this.objectids.push(o.get("_id"));
                castableSpell = true;
            }
        }
        else if(type == "emanation") {
            properties["width"] = distanceToPixels(size) * 2 + distanceToPixels(5);
            properties["height"] = properties["width"];
            properties["top"] = characterToken.get("top");
            properties["left"] = characterToken.get("left");
            properties["path"] = inspired.circlePath(size, true);
            if(properties["path"].length > 0) {
                var o = createObj("path", properties);
                this.objectids.push(o.get("_id"));
                castableSpell = true;
            }
        }
        else if(type == "cone") {
            var heights = {"15":20, "20":30, "30":40, "40":50, "50":70, "60":80, "70":90, "80":110};
            var px = characterToken.get("left");
            var py = characterToken.get("top");
            var pw = characterToken.get("width");
            var ph = characterToken.get("height");
            var angle = inspired.getAngle(px, py, spellorb.get("left"), spellorb.get("top"));
            if(angle >= 337.5 || angle <= 22.5) { // north
                properties["path"] = inspired.conePath(size, false);
                properties["rotation"] = 270;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(heights[size]);
                properties["left"] = px - distanceToPixels(2.5);
                properties["top"] = py - ph/2 - properties["width"]/2;   // Must use width here because of the rotation.
            }
            else if(angle > 22.5 && angle < 67.5) { // northwest
                properties["path"] = inspired.conePath(size, true);
                properties["rotation"] = 180;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(size);
                properties["left"] = px - pw/2 - properties["width"]/2;
                properties["top"] = py - ph/2 - properties["height"]/2;
            }
            else if(angle >= 67.5 && angle <= 112.5) { // west
                properties["path"] = inspired.conePath(size, false);
                properties["rotation"] = 180;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(heights[size]);
                properties["left"] = px - pw/2 - properties["width"]/2;
                properties["top"] = py + distanceToPixels(2.5);
            }
            else if(angle > 112.5 && angle < 157.5) { // southwest
                properties["path"] = inspired.conePath(size, true);
                properties["rotation"] = 90;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(size);
                properties["left"] = px - pw/2 - properties["width"]/2;
                properties["top"] = py + ph/2 + properties["height"]/2;
            }
            else if(angle >= 157.5 && angle <= 202.5) { // south
                properties["path"] = inspired.conePath(size, false);
                properties["rotation"] = 90;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(heights[size]);
                properties["left"] = px - distanceToPixels(2.5);
                properties["top"] = py + ph/2 + properties["width"]/2;   // Must use width here because of the rotation.
            }
            else if(angle > 202.5 && angle < 247.5) { // southeast
                properties["path"] = inspired.conePath(size, true);
                properties["rotation"] = 0;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(size);
                properties["left"] = px + pw/2 + properties["width"]/2;
                properties["top"] = py + ph/2 + properties["height"]/2;
            }
            else if(angle >= 247.5 && angle <= 292.5) { // east
                properties["path"] = inspired.conePath(size, false);
                properties["rotation"] = 0;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(heights[size]);
                properties["left"] = px + pw/2 + properties["width"]/2;
                properties["top"] = py + distanceToPixels(2.5);
            }
            else if(angle > 292.5 && angle < 337.5) { // northeast
                properties["path"] = inspired.conePath(size, true);
                properties["rotation"] = 270;
                properties["width"] = distanceToPixels(size);
                properties["height"] = distanceToPixels(size);
                properties["left"] = px + pw/2 + properties["width"]/2;
                properties["top"] = py - ph/2 - properties["height"]/2;
            }
            if(properties["path"].length > 0) {
                var o = createObj("path", properties);
                this.objectids.push(o.get("_id"));
                castableSpell = true;
            }
        }
        else if(type == "line") {
            var x1 = characterToken.get("left");
            var y1 = characterToken.get("top");
            var x2 = spellorb.get("left");
            var y2 = spellorb.get("top");
            var dx = x2 - x1;
            var dy = y2 - y1;
            var vlen = Math.sqrt(dx*dx + dy*dy);
            var nx = dx / vlen * distanceToPixels(size) + x1;
            var ny = dy / vlen * distanceToPixels(size) + y1;
            properties["path"] = "[[\"M\"," + x1 + "," + y1 + "],[\"L\"," + nx + "," + ny + "]]";
            properties["width"] = Math.abs(x1 - nx);
            properties["height"] = Math.abs(y1 - ny);
            properties["left"] = (x1 + nx)/2;
            properties["top"] = (y1 + ny)/2;
            var o = createObj("path", properties);
            this.objectids.push(o.get("_id"));
            castableSpell = true;
        }
        else if(type == "pairwise") {
            if(spellorb.get("aura2_radius") === "") {
                spellorb.set("aura2_radius", size / 2);
                spellorb.set("showplayers_aura2", true);
                var t = inspired.findAllTokensWithin(spellorb.get("left"), spellorb.get("top"), size / 2);
                _.each(t, function(elt, index) {
                    log(elt["token"].get("name") + "   --> " + elt["distance"]);
                });
                castableSpell = true;
            }
        }
        else if(type == "aura") {
            if(characterToken.get("aura1_radius") === "") {
                characterToken.set("aura1_radius", size);
                characterToken.set("showplayers_aura1", true);
                castableSpell = true;
            }
            else if(characterToken.get("aura2_radius") === "") {
                characterToken.set("aura2_radius", size);
                characterToken.set("showplayers_aura2", true);
                castableSpell = true;
            }
        }
    }
    if(damaging !== false) {
        castableSpell = true;
    }
    if(buff !== false) {
        castableSpell = true;
    }
    if(debuff !== false) {
        castableSpell = true;
    }
    if(conjuring !== false) {
        castableSpell = true;
    }

    return castableSpell;
}







inspired.getSpellorb = function(characterId) {
    var spellorbs = findObjs({_type: "graphic", _pageid: Campaign().get("playerpageid"), name: "spellorb" + characterId});
    if(!_.isUndefined(spellorbs)) return spellorbs[0];
    else return spellorbs;
}

inspired.registerSpellorb = function(characterId) {
    var character = getObj("character", characterId);
    if(_.isUndefined(inspired.getSpellorb(characterId))) {  
        // If the character doesn't have a spellorb, give him one.
        var characterToken = filterObjs(function(obj) {
                                if(obj.get("_type") == "graphic" && 
                                   obj.get("_pageid") == Campaign().get("playerpageid") && 
                                   obj.get("represents").contains(characterId)) return true;
                                else return false;
                              })[0];
        if(!_.isUndefined(characterToken)) {
            // Create the spellorb for the character.
            var spellorb = createObj("graphic", {
                                      _pageid: Campaign().get("playerpageid"),
                                      name: "spellorb" + characterId,
                                      controlledby: inspired.getControlledBy(characterToken),
                                      imgsrc: inspired.SPELLORB["url"],
                                      aura1_radius: -1,
                                      aura1_color: "#"+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6),
                                      showplayers_aura1: false,
                                      layer: "objects", 
                                      width: distanceToPixels(5),
                                      height: distanceToPixels(5),
                                      top: characterToken.get("top"),
                                      left: characterToken.get("left"),
                                      statusmarkers: "overdrive"
                                    });
            toFront(spellorb);
            return "Spellorb assigned to " + character.get("name") + ".";
        }
        else {
            return "No token assigned to " + character.get("name") + ".";
        }
    }
    else {
        return "Spellorb already assigned to " + character.get("name") + ".";
    }
}


on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!spellhelp")) {
        var help = "<b>Spellcraft Help</b><br/>There are five main functions available through the spellcraft module. ";
        help += "These functions allow the user to search for and display information about spells, as well as cast ";
        help += "spells with the use of a created spellorb to help target spell effects.";
        help += "<dl>";
        help += "<dt>!spellsearch</dt><dd>takes a search key string and returns all spell names that contain that search key<br/><code>!spellsearch light wounds</code></dd>";
        help += "<dt>!spellinfo</dt><dd>takes a spell name and whispers its information to you<br/><code>!spellinfo cure light wounds</code></dd>";
        help += "<dt>!spellshow</dt><dd>takes a spell name and displays its information to everyone<br/><code>!spellshow cure light wounds</code></dd>";
        help += "<dt>!spellorb</dt><dd>takes no arguments and supplies caster with a spellorb (or helps locate an existing spellorb) that is used for positioning spells<br/><code>!spellorb</code></dd>";
        help += "<dt>!spellcast</dt><dd>takes a spell name (and possible additional arguments) and attempts to apply its effects to the Roll20 system (requires caster to have a spellorb)<br/><code>!spellcast fireball</code></dd>";
        help += "</dl>";
        sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <br/>" + help);
    }
    else if(msg.content.contains("!spellsearch ")) {
        var searchstring = msg.content.replace("!spellsearch ", "").trim().toLowerCase();
        if(searchstring.length > 0) {
            var available = [];
            _.each(state["inspired.SPELL_LIST"], function(obj, key) {
                if(key.contains(searchstring)) {
                    available.push(key);
                }
            });
            if(_.size(available) > 0) {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " Spells matching <i>" + searchstring + "</i>: <ul><li>" + available.join("</li><li>") + "</li></ul>");
            }
            else {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " No spells matched <i>" + searchstring + "</i>.");
            }
        }
    }
    else if(msg.content.contains("!spellinfo ")) {
        var spellname = msg.content.replace("!spellinfo ", "").trim().toLowerCase();
        if(spellname.length > 0) {
            if(spellname in state["inspired.SPELL_LIST"]) {
                var spell = new inspired.Spell(spellname);
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <br/>" + spell.toString());
            }
            else {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <br/><i>" + spellname + 
                         "</i> is not a valid spell. Use <code>!spellsearch [search string]</code> " +
                         "to see the matching spells. Spells with modifiers such as <i>lesser</i>, " + 
                         "<i>greater</i>, or </i>mass</i> place those modifiers at the end (for instance, " + 
                         "<i>confusion lesser</i> or <i>cure serious wounds mass</i>).");
            }
        }
    }
    else if(msg.content.contains("!spellshow ")) {
        var spellname = msg.content.replace("!spellshow ", "").trim().toLowerCase();
        if(spellname.length > 0) {
            if(spellname in state["inspired.SPELL_LIST"]) {
                var spell = new inspired.Spell(spellname);
                sendChat(msg.who, "<br/>" + spell.toString());
            }
            else {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <br/><i>" + spellname + 
                         "</i> is not a valid spell. Use <code>!spellsearch [search string]</code> " +
                         "to see the matching spells. Spells with modifiers such as <i>lesser</i>, " +
                         "<i>greater</i>, or </i>mass</i> place those modifiers at the end (for instance, " +
                         "<i>confusion lesser</i> or <i>cure serious wounds mass</i>).");
            }
        }
    }
    else if(msg.content.contains("!spellorb")) {
        var character = filterObjs(function(obj) {
                            if((obj.get("_type") == "character") && (obj.get("name") == msg.who) &&
                               obj.get("controlledby").contains(msg.playerid)) return true;
                            else return false;
                          })[0];
        if(!_.isUndefined(character)) {
            var returnMessage = inspired.registerSpellorb(character.get("_id"));
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " " + returnMessage);
            var spellorb = inspired.getSpellorb(character.get("_id"));
            if(spellorb !== null) {
                sendPing(spellorb.get("left"), spellorb.get("top"), spellorb.get("_pageid"));
            }
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You must cast spells as a character, not as a player.");
        }
    }
    else if(msg.content.contains("!spellcast ")) {
        var args = msg.content.replace("!spellcast ", "").trim().toLowerCase().split(",");
        var spellname = args.shift();
        if(spellname in state["inspired.SPELL_LIST"]) {
            var character = filterObjs(function(obj) {
                                if((obj.get("_type") == "character") && (obj.get("name") == msg.who) &&
                                   obj.get("controlledby").contains(msg.playerid)) return true;
                                else return false;
                              })[0];
            if(!_.isUndefined(character)) {
                var spellorb = inspired.getSpellorb(character.get("_id"));
                if(!spellorb) {
                    sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You do not have a spellorb. Use <code>!spellorb</code> to assign one to yourself.");
                }
                else {
                    var spell = new inspired.Spell(spellname);
                    var wasCast = spell.cast(spellorb, args);
                    if(wasCast) {
                        sendChat(msg.who, "/em " + "casts " + spell.name);
                        //sendChat(msg.who, "<br/>" + spell.toString());
                    }
                    else {
                        sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <i>" + spell.name + "</i> could not be cast.");
                    }
                }
            }
            else {
                sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " You must cast spells as a character, not as a player.");
            }
        }
        else {
            sendChat("Roll20", "/w " + msg.who.split(" ")[0] + " <br/><i>" + spellname + 
                     "</i> is not a valid spell. Use <code>!spellsearch [search string]</code> " +
                     "to see the matching spells. Spells with modifiers such as <i>lesser</i>, " +
                     "<i>greater</i>, or </i>mass</i> place those modifiers at the end (for instance, " +
                     "<i>confusion lesser</i> or <i>cure serious wounds mass</i>).");
        }
    }
});
