#!/usr/bin/env python

"""
This file parses the spell database CSV file in order to produce the JSON
repository in "spells.js". It assumes that the file "spell_full.csv"
exists in the same directory. This file (or a newer version, which may cause errors
with this script) can be downloaded from
http://www.pathfindercommunity.net/home/databases/spells
"""

import csv
import json
import re


def is_candidate(row):
    return True
    '''
    keywords = ['radius', 'cone', 'line', 'all within', 'emanation', 'burst', 'diameter', 'no two of which']
    for k in keywords:
        if k in row['area'] or k in row['effect'] or k in row['targets']:
            return True
    return False
    '''

def get_name(row):
    return row['name'].strip().replace('\'', '').replace(',', '').replace('-', '').lower()

def get_school(row):
    return row['school'].strip().lower()
    
def get_subschool(row):
    return row['subschool'].strip().lower()
    
def get_descriptor(row):
    return row['descriptor'].strip().lower()
    
def get_level(row):
    all_levels = []
    levels = row['spell_level'].split(',')
    for level in levels:
        level = level.strip()
        cls, lvl = level.rsplit(None, 1)
        all_levels.append({'class': cls, 'level': int(lvl)})
    return all_levels
    
def get_castingtime(row):
    t = row['casting_time'].strip().lower()
    t = t.replace('days', 'day')
    t = t.replace('hours', 'hr').replace('hour', 'hr').replace('hr.', 'hr')
    t = t.replace('minutes', 'min').replace('minute', 'min').replace('min.', 'min')
    t = t.replace('full rounds', 'ful').replace('full round', 'ful')
    t = t.replace('rounds', 'rnd').replace('round', 'rnd')
    t = t.replace('standard action', 'std')
    t = t.replace('move action', 'mov')
    t = t.replace('swift action', 'swf')
    t = t.replace('immediate action', 'imm')
    t = t.replace('free action', 'fre')
    return t
    
def get_components(row):
    return [c.strip() for c in row['components'].strip().split(',')]
    
def get_range(row):
    ranges = ['long', 'medium', 'close', 'touch', 'personal']
    for r in ranges:
        if r in row['range']:
            return r
    return row['range']
    
def get_area(row):
    return row['area'].strip().lower()
    
def get_effect(row):
    return row['effect'].strip().lower()
   
def get_targets(row):
    return row['targets'].strip().lower()
    
def get_duration(row):
    d = row['duration'].strip().lower()
    d = d.replace('days', 'day')
    d = d.replace('hours', 'hr')
    d = d.replace('hour', 'hr')
    d = d.replace('hr.', 'hr')
    d = d.replace('minutes', 'min')
    d = d.replace('minute', 'min')
    d = d.replace('min.', 'min')
    d = d.replace('rounds', 'rnd')
    d = d.replace('round', 'rnd')
    d = d.replace('(d)', '')
    d = d.replace('(D)', '')
    d = d.strip()
    return d
    
def get_dismissible(row):
    return True if int(row['dismissible']) == 1 else False

def get_shapeable(row):
    return True if int(row['shapeable']) == 1 else False
    
def get_savingthrow(row):
    return row['saving_throw'].strip()
    
def get_spellresistance(row):
    return True if 'yes' in row['spell_resistence'].strip().lower() else False

def get_description(row):
    return row['description'].strip()
    
    
if __name__ == '__main__':
    with open('spell_full.csv') as spellfile:
        spellcsv = csv.DictReader(spellfile)
        spells = {}
        for row in spellcsv:
            if is_candidate(row):
                try:
                    name = get_name(row)
                    spell = {}
                    #spell['name'] = get_name(row)
                    spell['school'] = get_school(row)
                    spell['subschool'] = get_subschool(row)
                    spell['descriptor'] = get_descriptor(row)
                    spell['level'] = get_level(row)
                    spell['castingtime'] = get_castingtime(row)
                    spell['components'] = get_components(row)
                    spell['range'] = get_range(row)
                    spell['area'] = get_area(row)
                    spell['effect'] = get_effect(row)
                    spell['targets'] = get_targets(row)
                    spell['duration'] = get_duration(row)
                    spell['dismissible'] = get_dismissible(row)
                    spell['shapeable'] = get_shapeable(row)
                    spell['savingthrow'] = get_savingthrow(row)
                    spell['spellresistance'] = get_spellresistance(row)
                    spell['description'] = get_description(row)
                    spells[name] = spell
                except Exception, e:
                    pass
        with open('spells.js', 'w') as sfile:
            sfile.write('state["inspired.SPELL_LIST"] =\n')
            sfile.write(json.dumps(spells, indent=3, separators=[',', ': '], sort_keys=True))
            sfile.write(';')

         
        lite_spell_names = ['aura of doom', 'bless', 'cone of cold', 'confusion', 'cure light wounds', 
                            'enlarge person', 'fireball', 'lightning bolt', 'magic circle against evil', 'remove fear']
        lite_spells = {}
        for name in lite_spell_names:
            lite_spells[name] = spells[name]
        with open('spellslite.js', 'w') as sfile:
            sfile.write('state["inspired.SPELL_LIST"] =\n')
            sfile.write(json.dumps(lite_spells, indent=3, separators=[',', ': '], sort_keys=True))
            sfile.write(';')
        
        
