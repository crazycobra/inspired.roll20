/*******************************************************************************
 * status.js - Provides functionality for automatically updating status markers.
 * 
 * Dependencies: utilities.js
 *******************************************************************************
 *
 * This script automatically modifies the status markers (purple, red, and 
 * skull-and-crossbones) whenever the bar1 ratio drops to or below 50% (purple),
 * 20% (red), and 0% (skull-and-crossbones). These status marker changes only 
 * apply to the tokens that are controlled by a GM (so as not to automatically
 * modify a player token). The benefit of such a system is that it allows 
 * players to be aware of the broad status of an enemy without seeing the fine
 * granularity that a status bar would provide.
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

on("change:token:bar1_value", function(obj) {
    // Only use this for creatures the GM controls.
    var gmControlled = inspired.isControlledByGM(obj);
    if(gmControlled) {
        var status_rules = [{barId: 1, barRatio: 0.5, status: "purplemarker"},
                            {barId: 1, barRatio: 0.2, status: "redmarker"},
                            {barId: 1, barRatio: 0, status: "skull"}];
        var activeMarker = null;
        _.each(status_rules, function(opts) {
            var maxValue = parseInt(obj.get("bar" + opts.barId + "_max"));
            var curValue = parseInt(obj.get("bar" + opts.barId + "_value"));
            if(!_.isNaN(maxValue) && !_.isNaN(curValue)) {
                var markerName = "status_" + opts.status;
                obj.set(markerName, false);
                if(curValue <= (maxValue * opts.barRatio)) {
                    activeMarker = markerName;
                }
            }
        });
        if(activeMarker != null) {
            obj.set(activeMarker, true);
        }
    }
});
