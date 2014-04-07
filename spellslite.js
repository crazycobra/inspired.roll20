state["inspired.SPELL_LIST"] =
{
   "aura of doom": {
      "area": "20-ft.-radius emanation centered on you",
      "castingtime": "1 std",
      "components": [
         "V",
         "S",
         "M/DF (powdered bone)"
      ],
      "description": "You emanate an almost palpable aura of horror. All non-allies within this spell's area, or that later enter the area, must make a Will save to avoid becoming shaken. A successful save suppresses the effect. Creatures that leave the area and come back must save again to avoid being affected by the effect.",
      "descriptor": "emotion, fear, mind-affecting",
      "dismissible": false,
      "duration": "10 min/level",
      "effect": "",
      "level": [
         {
            "class": "cleric/oracle",
            "level": 4
         }
      ],
      "range": "personal",
      "savingthrow": "Will negates",
      "school": "necromancy",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "",
      "targets": ""
   },
   "bless": {
      "area": "the caster and all allies within a 50-ft. burst, centered on the caster",
      "castingtime": "1 std",
      "components": [
         "V",
         "S",
         "DF"
      ],
      "description": "Bless fills your allies with courage. Each ally gains a +1 morale bonus on attack rolls and on saving throws against fear effects. Bless counters and dispels bane.",
      "descriptor": "mind-affecting",
      "dismissible": false,
      "duration": "1 min/level",
      "effect": "",
      "level": [
         {
            "class": "cleric/oracle",
            "level": 1
         },
         {
            "class": "paladin",
            "level": 1
         },
         {
            "class": "inquisitor",
            "level": 1
         }
      ],
      "range": "50 ft.",
      "savingthrow": "none",
      "school": "enchantment",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "compulsion",
      "targets": ""
   },
   "cone of cold": {
      "area": "cone-shaped burst",
      "castingtime": "1 std",
      "components": [
         "V",
         "S",
         "M (a small crystal or glass cone)"
      ],
      "description": "Cone of cold creates an area of extreme cold, originating at your hand and extending outward in a cone. It drains heat, dealing 1d6 points of cold damage per caster level (maximum 15d6).",
      "descriptor": "cold",
      "dismissible": false,
      "duration": "instantaneous",
      "effect": "",
      "level": [
         {
            "class": "sorcerer/wizard",
            "level": 5
         },
         {
            "class": "witch",
            "level": 6
         },
         {
            "class": "magus",
            "level": 5
         }
      ],
      "range": "60 ft.",
      "savingthrow": "Reflex half",
      "school": "evocation",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "",
      "targets": ""
   },
   "confusion": {
      "area": "",
      "castingtime": "1 std",
      "components": [
         "V",
         "S",
         "M/DF (three nutshells)"
      ],
      "description": "This spell causes confusion in the targets, making them unable to determine their actions. Roll on the following table at the start of each subject's turn each round to see what it does in that round. d% Behavior 01-25 Act normally 26-50 Do nothing but babble incoherently 51-75 Deal 1d8 points of damage + Str modifier to self with item in hand 76-100 Attack nearest creature (for this purpose, a familiar counts as part of the subject's self) A confused character who can't carry out the indicated action does nothing but babble incoherently. Attackers are not at any special advantage when attacking a confused character. Any confused character who is attacked automatically attacks its attackers on its next turn, as long as it is still confused when its turn comes. Note that a confused character will not make attacks of opportunity against any creature that it is not already devoted to attacking (either because of its most recent action or because it has just been attacked).",
      "descriptor": "mind-affecting",
      "dismissible": false,
      "duration": "1 rnd/level",
      "effect": "",
      "level": [
         {
            "class": "bard",
            "level": 3
         },
         {
            "class": "sorcerer/wizard",
            "level": 4
         },
         {
            "class": "witch",
            "level": 4
         }
      ],
      "range": "medium",
      "savingthrow": "Will negates",
      "school": "enchantment",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "compulsion",
      "targets": "all creatures in a 15-ft.-radius burst"
   },
   "cure light wounds": {
      "area": "",
      "castingtime": "1 std",
      "components": [
         "V",
         "S"
      ],
      "description": "When laying your hand upon a living creature, you channel positive energy that cures 1d8 points of damage + 1 point per caster level (maximum +5). Since undead are powered by negative energy, this spell deals damage to them instead of curing their wounds. An undead creature can apply spell resistance, and can attempt a Will save to take half damage.",
      "descriptor": "",
      "dismissible": false,
      "duration": "instantaneous",
      "effect": "",
      "level": [
         {
            "class": "bard",
            "level": 1
         },
         {
            "class": "cleric/oracle",
            "level": 1
         },
         {
            "class": "druid",
            "level": 1
         },
         {
            "class": "paladin",
            "level": 1
         },
         {
            "class": "ranger",
            "level": 2
         },
         {
            "class": "witch",
            "level": 1
         },
         {
            "class": "inquisitor",
            "level": 1
         },
         {
            "class": "alchemist",
            "level": 1
         }
      ],
      "range": "touch",
      "savingthrow": "Will half (harmless); see text",
      "school": "conjuration",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "healing",
      "targets": "creature touched"
   },
   "enlarge person": {
      "area": "",
      "castingtime": "1 rnd",
      "components": [
         "V",
         "S",
         "M (powdered iron)"
      ],
      "description": "This spell causes instant growth of a humanoid creature, doubling its height and multiplying its weight by 8. This increase changes the creature's size category to the next larger one. The target gains a +2 size bonus to Strength, a -2 size penalty to Dexterity (to a minimum of 1), and a -1 penalty on attack rolls and AC due to its increased size. A humanoid creature whose size increases to Large has a space of 10 feet and a natural reach of 10 feet. This spell does not change the target's speed. If insufficient room is available for the desired growth, the creature attains the maximum possible size and may make a Strength check (using its increased Strength) to burst any enclosures in the process. If it fails, it is constrained without harm by the materials enclosing it-the spell cannot be used to crush a creature by increasing its size. All equipment worn or carried by a creature is similarly enlarged by the spell. Melee weapons affected by this spell deal more damage (see page 145). Other magical properties are not affected by this spell. Any enlarged item that leaves an enlarged creature's possession (including a projectile or thrown weapon) instantly returns to its normal size. This means that thrown and projectile weapons deal their normal damage. Magical properties of enlarged items are not increased by this spell. Multiple magical effects that increase size do not stack. Enlarge person counters and dispels reduce person. Enlarge person can be made permanent with a permanency spell.",
      "descriptor": "",
      "dismissible": true,
      "duration": "1 min/level",
      "effect": "",
      "level": [
         {
            "class": "sorcerer/wizard",
            "level": 1
         },
         {
            "class": "alchemist",
            "level": 1
         },
         {
            "class": "summoner",
            "level": 1
         },
         {
            "class": "witch",
            "level": 1
         },
         {
            "class": "magus",
            "level": 1
         }
      ],
      "range": "close",
      "savingthrow": "Fortitude negates",
      "school": "transmutation",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "",
      "targets": "one humanoid creature"
   },
   "fireball": {
      "area": "20-ft.-radius spread",
      "castingtime": "1 std",
      "components": [
         "V",
         "S",
         "M (a ball of bat guano and sulfur)"
      ],
      "description": "A fireball spell generates a searing explosion of flame that detonates with a low roar and deals 1d6 points of fire damage per caster level (maximum 10d6) to every creature within the area. Unattended objects also take this damage. The explosion creates almost no pressure. You point your finger and determine the range (distance and height) at which the fireball is to burst. A glowing, pea-sized bead streaks from the pointing digit and, unless it impacts upon a material body or solid barrier prior to attaining the prescribed range, blossoms into the fireball at that point. An early impact results in an early detonation. If you attempt to send the bead through a narrow passage, such as through an arrow slit, you must \"hit\" the opening with a ranged touch attack, or else the bead strikes the barrier and detonates prematurely. The fireball sets fire to combustibles and damages objects in the area. It can melt metals with low melting points, such as lead, gold, copper, silver, and bronze. If the damage caused to an interposing barrier shatters or breaks through it, the fireball may continue beyond the barrier if the area permits; otherwise it stops at the barrier just as any other spell effect does.",
      "descriptor": "fire",
      "dismissible": false,
      "duration": "instantaneous",
      "effect": "",
      "level": [
         {
            "class": "sorcerer/wizard",
            "level": 3
         },
         {
            "class": "magus",
            "level": 3
         }
      ],
      "range": "long",
      "savingthrow": "Reflex half",
      "school": "evocation",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "",
      "targets": ""
   },
   "lightning bolt": {
      "area": "120-ft. line",
      "castingtime": "1 std",
      "components": [
         "V",
         "S",
         "M (fur and a glass rod)"
      ],
      "description": "You release a powerful stroke of electrical energy that deals 1d6 points of electricity damage per caster level (maximum 10d6) to each creature within its area. The bolt begins at your fingertips. The lightning bolt sets fire to combustibles and damages objects in its path. It can melt metals with a low melting point, such as lead, gold, copper, silver, or bronze. If the damage caused to an interposing barrier shatters or breaks through it, the bolt may continue beyond the barrier if the spell's range permits; otherwise, it stops at the barrier just as any other spell effect does.",
      "descriptor": "electricity",
      "dismissible": false,
      "duration": "instantaneous",
      "effect": "",
      "level": [
         {
            "class": "sorcerer/wizard",
            "level": 3
         },
         {
            "class": "witch",
            "level": 3
         },
         {
            "class": "magus",
            "level": 3
         }
      ],
      "range": "120 ft.",
      "savingthrow": "Reflex half",
      "school": "evocation",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "",
      "targets": ""
   },
   "magic circle against evil": {
      "area": "10-ft.-radius emanation from touched creature",
      "castingtime": "1 std",
      "components": [
         "V",
         "S",
         "M/DF (a 3-ft.-diameter circle of powdered silver)"
      ],
      "description": "All creatures within the area gain the effects of a protection from evil spell, and evil summoned creatures cannot enter the area either. Creatures in the area, or who later enter the area, receive only one attempt to suppress effects that are controlling them. If successful, such effects are suppressed as long as they remain in the area. Creatures that leave the area and come back are not protected. You must overcome a creature's spell resistance in order to keep it at bay (as in the third function of protection from evil), but the deflection and resistance bonuses and the protection from mental control apply regardless of enemies' spell resistance. This spell has an alternative version that you may choose when casting it. A magic circle against evil can be focused inward rather than outward. When focused inward, the spell binds a nongood called creature (such as those called by the lesser planar binding, planar binding, and greater planar binding spells) for a maximum of 24 hours per caster level, provided that you cast the spell that calls the creature within 1 round of casting the magic circle. The creature cannot cross the circle's boundaries. If a creature too large to fit into the spell's area is the subject of the spell, the spell acts as a normal protection from evil spell for that creature only. A magic circle leaves much to be desired as a trap. If the circle of powdered silver laid down in the process of spellcasting is broken, the effect immediately ends. The trapped creature can do nothing that disturbs the circle, directly or indirectly, but other creatures can. If the called creature has spell resistance, it can test the trap once a day. If you fail to overcome its spell resistance, the creature breaks free, destroying the circle. A creature capable of any form of dimensional travel (astral projection, blink, dimension door, etherealness, gate, plane shift, shadow walk, teleport, and similar abilities) can simply leave the circle through such means. You can prevent the creature's extradimensional escape by casting a dimensional anchor spell on it, but you must cast the spell before the creature acts. If you are successful, the anchor effect lasts as long as the magic circle does. The creature cannot reach across the magic circle, but its ranged attacks (ranged weapons, spells, magical abilities, and the like) can. The creature can attack any target it can reach with its ranged attacks except for the circle itself. You can add a special diagram (a two-dimensional bounded figure with no gaps along its circumference, augmented with various magical sigils) to make the magic circle more secure. Drawing the diagram by hand takes 10 minutes and requires a DC 20 Spellcraft check. You do not know the result of this check. If the check fails, the diagram is ineffective. You can take 10 when drawing the diagram if you are under no particular time pressure to complete the task. This task also takes 10 full minutes. If time is no factor at all, and you devote 3 hours and 20 minutes to the task, you can take 20. A successful diagram allows you to cast a dimensional anchor spell on the magic circle during the round before casting any summoning spell. The anchor holds any called creatures in the magic circle for 24 hours per caster level. A creature cannot use its spell resistance against a magic circle prepared with a diagram, and none of its abilities or attacks can cross the diagram. If the creature tries a Charisma check to break free of the trap (see the lesser planar binding spell), the DC increases by 5. The creature is immediately released if anything disturbs the diagram-even a straw laid across it. The creature itself cannot disturb the diagram either directly or indirectly, as noted above. This spell is not cumulative with protection from evil and vice versa.",
      "descriptor": "good",
      "dismissible": false,
      "duration": "10 min/level",
      "effect": "",
      "level": [
         {
            "class": "cleric/oracle",
            "level": 3
         },
         {
            "class": "paladin",
            "level": 3
         },
         {
            "class": "sorcerer/wizard",
            "level": 3
         },
         {
            "class": "summoner",
            "level": 3
         },
         {
            "class": "inquisitor",
            "level": 3
         },
         {
            "class": "summoner",
            "level": 3
         },
         {
            "class": "inquisitor",
            "level": 3
         }
      ],
      "range": "touch",
      "savingthrow": "Will negates (harmless)",
      "school": "abjuration",
      "shapeable": false,
      "spellresistance": false,
      "subschool": "",
      "targets": ""
   },
   "remove fear": {
      "area": "",
      "castingtime": "1 std",
      "components": [
         "V",
         "S"
      ],
      "description": "You instill courage in the subject, granting it a +4 morale bonus against fear effects for 10 minutes. If the subject is under the influence of a fear effect when receiving the spell, that effect is suppressed for the duration of the spell. Remove fear counters and dispels cause fear.",
      "descriptor": "",
      "dismissible": false,
      "duration": "10 min; see text",
      "effect": "",
      "level": [
         {
            "class": "bard",
            "level": 1
         },
         {
            "class": "cleric/oracle",
            "level": 1
         },
         {
            "class": "inquisitor",
            "level": 1
         }
      ],
      "range": "close",
      "savingthrow": "Will negates (harmless)",
      "school": "abjuration",
      "shapeable": false,
      "spellresistance": true,
      "subschool": "",
      "targets": "one creature plus one additional creature per four levels, no two of which can be more than 30 ft. apart"
   }
};