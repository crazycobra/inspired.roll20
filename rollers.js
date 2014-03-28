/*******************************************************************************
 * rollers.js - Provides specialized dice rolling alternatives.
 * 
 * Dependencies: none
 *******************************************************************************
 * 
 * Commands for performing specialty dice rolling.
 * 
 * !blindroll roll
 *  Players may issue this command to have a roll of the dice generated in 
 *  secret to the GM only. This is useful when the player should not know
 *  the result of the roll (e.g., a Stealth check).
 * 
 *  Example:
 *  !blindroll 1d20+7 Stealth check
 *  This example would be rolled as a GM roll so that the results are only 
 *  visible to the GM.
 * 
 * !rigroll <num dice>d<num sides>:<modifier>:<actual rolls (comma-separated)>
 *  Occasionally, a GM may want to exert control over fate and have the dice
 *  fall a certain way (for cinematic reasons or to avoid a TPK). This command
 *  allows a GM to roll "in the open" and still get the desired outcome.
 *  This command cannot currently deal with complex roll types that are 
 *  available generally in Roll20. 
 *  Whenever this command is issued, the GM also receives a whisper informing 
 *  him of the rigged roll. This is favored over simply denying players the 
 *  ability to rig rolls because there may be times when the GM and a player
 *  conspire together for story purposes and require a particular outcome.
 * 
 *  Examples:
 *  !rigroll 1d20:+3:18
 *  !rigroll 5d4:+8:2,3,1,3,4
 *  The first example would produce a result of 21 (showing that an 18 was
 *  rolled). The second example would also produce a result of 21 (showing
 *  that a 2, 3, 1, 3, and 4 were rolled.
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

on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!blindroll ")) {
        var roll = msg.content.replace("!blindroll ", "").trim();
        if(roll.length > 0) {
            sendChat(msg.who, "Blind roll sent to GM <br/><small>(" + roll + ")</small>.");
            sendChat(msg.who, "/gmroll " + roll + " from " + msg.who);
        }
    }
});

on("chat:message", function(msg) {
    if(msg.type != "api") return;
    if(msg.content.contains("!rigroll ")) {
        var parts = msg.content.replace("!rigroll ", "").split(":");
        var roll = parts[0];
        var temp = roll.split("d");
        var numdice = temp[0];
        var faces = temp[1];
        var modifier = parts[1];
        var values = parts[2].split(",");
        var formulaStyle = "font-size:inherit;display:inline;padding:4px;background:white;border-radius:3px;";
        var totalStyle = formulaStyle;
        totalStyle += "border:1px solid #d1d1d1;cursor:move;font-size:1.4em;font-weight:bold;color:black;line-height:2.0em;";

        formulaStyle += "border:1px solid #d1d1d1;font-size:1.1em;line-height:2.0em;word-wrap:break-word;";
        var clearStyle = "clear:both";
        var formattedFormulaStyle = "display:block;float:left;padding:0 4px 0 4px;margin:5px 0 5px 0";
        var dicegroupingStyle = "display:inline";
        var uisortableStyle = "cursor:move";
        var rolledStyle = "cursor:move;font-weight:bold;color:black;font-size:1.4em";
        var uidraggableStyle = "cursor:move";
        
        var html = "<div style=\"" + formulaStyle + "\"> rolling " + numdice + "d" + faces + modifier + " </div>";
        html += "<div style=\"" + clearStyle + "\"></div>";
        html += "<div style=\"" + formulaStyle + ";" + formattedFormulaStyle + "\">";
        html += "   <div style=\"" + dicegroupingStyle + ";" + uisortableStyle + "\" data-groupindex=\"0\">";
        var total = 0;
        html += "      (";
        for(var i = 0; i < numdice; i++) {
            var value = values[i];
            var color="black";
            if (value == "1") {
                color="#730505";
            }
            else if (value == faces) {
                color="#247305";
            }
            var didrollStyle = "text-shadow:-1px -1px 1px #fff,1px -1px 1px #fff,-1px 1px 1px #fff,1px 1px 1px #fff;z-index:2;position:relative;color:"+color+";height:30px;min-height:29px;margin-top:-3px;top:0;text-align:center;font size=16px;font-family:sans-serif;";
            var dicerollStyle = "display:inline-block;font-size:1.2em;font-family:san-sarif" + faces;
            var diconStyle = "display:inline-block;min-width:30px;text-align:center;position:relative";
            var backingStyle = "position:absolute;top:-2px;left:0;width:100%;text-align:center;font-size:30px;color:#8fb1d9;text-shadow:0 0 3px #8fb1d9;opacity:.75;pointer-events:none;z-index:1";
            html += "       <div data-origindex=\"0\" style=\"" + dicerollStyle + "\" class=\"diceroll d" + faces + "\">";
            html += "          <div style=\"" + diconStyle + "\">";
            html += "             <div class=\"backing\"></div>"
            html += "             <div style=\"" + didrollStyle + "\">"
            total += eval(value);
            if ((value=="1")||(value==faces)){
                html+= "<strong>"
            }
            html += value;
            if ((value=="1")||(value==faces)){
                html+= "</strong>"
            }
            html += "</div>";
            html += "             <div style=\"" + backingStyle + "\"></div>";
            html += "          </div>";
            html += "       </div>";
            if(i == numdice - 1) html += ")";
            else html += "+";
        }
        html += "   </div>";
        total = eval(total + modifier);
        html += modifier;
        html += "</div>";
        html += "<div style=\"" + clearStyle + "\"></div><strong> = </strong><div style=\"" + totalStyle + ";" + uidraggableStyle + "\"><strong><font size=\"6\"> " + total + "</strong> </div>";
        
        sendChat(msg.who, "/direct " + html);
        sendChat("Roll20", "/w gm " + roll + " was rigged to have values " + values.join() + ".");
    }
});
