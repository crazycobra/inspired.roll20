/*******************************************************************************
 * ambience.js - Provides tools for environmental effects.
 * 
 * Dependencies: utilities.js
 *******************************************************************************
 *
 * The general usage for this script is as follows:
 * 
 * !flicker
 *  A GM can use this command to set all tokens named "inspired.light" on the
 *  current player page that have positive light radii to begine to flicker.
 *  What this means is that each light's radius (and dim-radius) is set to
 *  a random value within 5% of the original value (ensuring that the light's
 *  dim-radius is never greater than its radius).
 * 
 * !unflicker
 *  A GM can use this command to "turn off" the flicker effect that was 
 *  started with the !flicker command.
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



var inspired = inspired || {};

inspired.flicker = [];

on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!flicker") && inspired.isGM(msg.playerid)) {
        if(_.size(inspired.flicker) == 0) {
            var lights = filterObjs(function(obj) {
                                if(obj.get("_type") == "graphic" && 
                                   obj.get("name").contains("inspired.light") &&
                                   obj.get("_pageid") == Campaign().get("playerpageid") &&
                                   obj.get("light_radius").length > 0) return true;
                                else return false;
                            });
            if(_.size(lights) > 0) {
                _.each(lights, function(obj) {
                    if(obj.get("bar1_value").length == 0) obj.set("bar1_value", obj.get("light_radius"));
                    if(obj.get("bar2_value").length == 0) obj.set("bar2_value", obj.get("light_dimradius"));
                    var i = setInterval(function() {
                        if(!_.isUndefined(obj)) {
                            var r = parseInt(obj.get("bar1_value")) * (1.0 + (0.1 * Math.random() - 0.05));
                            obj.set("light_radius",  r);
                            if(obj.get("bar2_value").length > 0) {
                                var d = parseInt(obj.get("bar2_value")) * (1.0 + (0.1 * Math.random() - 0.05));
                                d = Math.min(d, r);
                                obj.set("light_dimradius", d);
                            }
                        }
                    }, 300);
                    inspired.flicker.push(i);
                });
            }
        }
    }
    else if(msg.content.contains("!unflicker") && inspired.isGM(msg.playerid)) {
        _.each(inspired.flicker, function(obj) {
            clearInterval(obj);
        });
        inspired.flicker = [];
        var lights = filterObjs(function(obj) {
                            if(obj.get("_type") == "graphic" && obj.get("name").contains("inspired.light")) return true;
                            else return false;
                        });
        if(_.size(lights) > 0) {
            _.each(lights, function(obj) {
                if(obj.get("bar1_value").length > 0) obj.set("light_radius", obj.get("bar1_value"));
                if(obj.get("bar2_value").length > 0) obj.set("light_dimradius", obj.get("bar2_value"));
            });
        }
    }
});