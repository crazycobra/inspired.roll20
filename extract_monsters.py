#!/usr/bin/env python

"""
This file parses the bestiary database CSV file in order to produce the JSON
repository in "bestiary.js". It assumes that the file "monster_bestiary_partial.csv"
exists in the same directory. This file (or a newer version, which may cause errors
with this script) can be downloaded from
http://www.pathfindercommunity.net/home/databases/full-bestiary
"""

import csv
import json
import re
from bs4 import BeautifulSoup

def is_valid_monster(row):
    src = row['Source'].lower()
    if '1' not in row['IsTemplate'] and 'tome of horrors' not in src and 'toh' not in src and '1' not in row['Mythic']:
        return True
    else:
        return False
    
def get_cr(s):
    c = s.strip().lower()
    if 'jan' in c:
        c = '1/' + c[0]
    return c

def get_class(s):
    classes = []
    s = s.strip().lower()
    if len(s) > 0:
        parts = s.split('/')
        for p in parts:
            c = p.split()
            if 'apg' in c[0]:
                c[0] = c[0].replace('apg', '')
            classes.append({'class': c[0], 'level': c[1]})
    return classes
    
def get_alignment(s):
    all_alignments = ['lg', 'ln', 'le', 'cg', 'cn', 'ce', 'ng', 'n', 'ne']
    alignment = []
    a = s.strip().lower()
    if 'any alignment' in a:
        alignment = all_alignments
    elif 'or' in a:
        x = a.split('or')
        for y in x:
            y = y.strip()
            if y in all_alignments:
                alignment.append(y)
    elif a in all_alignments:
        alignment.append(a)
    
    return alignment
    
def get_subtype(s):
    subtype = []
    s = s.strip().lower()
    if len(s) > 0:
        s = s.replace('(', '').replace(')', '')
        parts = s.split(',')
        for p in parts:
            subtype.append(p.strip())
    return subtype

def get_ac(s):
    ac = {}
    parts = s.split(',')
    for p in parts:
        p = p.strip().lower()
        if 'touch' in p:
            ac['touch'] = int(p.replace('touch', '').strip())
        elif 'flat-footed' in p:
            ac['flat-footed'] = int(p.replace('flat-footed', '').strip())
        else:
            ac['normal'] = int(p.strip())
    return ac
    
def get_saves(s):
    def get_save_circumstance(s):
        c = {}
        parts = s.split('vs.')
        bparts = parts[0].split()
        c['bonus'] = int(bparts[0].strip().replace('+', ''))
        if len(parts) > 1:
            c['type'] = ' '.join(bparts[1:]) if len(bparts) > 1 else ''
            c['circumstance'] = parts[1].strip()
        else:
            c['type'] = ''
            c['circumstance'] = ' '.join(bparts[1:])
        return c

    save_name_map = {'fort': 'fortitude', 'ref': 'reflex', 'will': 'will'}
    split_by_external_commas = re.compile(r'(?:[^,(]|\([^)]*\))+')
    s = s.strip().lower()
    parts = s.split(';')
    global_circumstantial = ''
    if len(parts) > 1:
        global_circumstantial = parts[1]

    saves = {}
    matches = split_by_external_commas.findall(parts[0])
    for match in matches:
        match = match.strip()
        parts = match.split('(')
        save_name = save_name_map[parts[0].split()[0]]
        save_bonus = int(parts[0].split()[1].replace('+', ''))
        saves[save_name] = {}
        saves[save_name]['bonus'] = save_bonus
        saves[save_name]['circumstantial'] = []
        if len(parts) > 1:
            circumstance = parts[1].strip().replace(')', '')
            cparts = circumstance.split(',')
            for cpart in cparts:
                saves[save_name]['circumstantial'].append(get_save_circumstance(cpart))
    if len(global_circumstantial) > 0:
        gparts = global_circumstantial.split(',')
        for gpart in gparts:
            c = get_save_circumstance(gpart)
            for save_name in saves:
                saves[save_name]['circumstantial'].append(c)
            
    return saves

def get_skills(s):
    def get_skill_circumstance(s):
        types = ['competence', 'racial', 'morale', 'insight', 'circumstance']
        c = {}
        parts = s.strip().lower().split()
        c['bonus'] = int(parts[0].strip().replace('+', '').replace('*', ''))
        c['type'] = ''
        if len(parts) > 1 and parts[1] in types:
            c['type'] = parts[1].strip().lower()
        circumstance = ' '.join(parts[2:]) if len(parts) > 2 else ''
        if len(c['type']) == 0 and len(parts) > 1:
            circumstance = parts[1] + ' ' + circumstance
        c['circumstance'] = circumstance
        return c
    
    skills = {}
    split_by_external_commas = re.compile(r'(?:[^,(]|\([^)]*\))+')
    s = s.strip().lower()
    matches = split_by_external_commas.findall(s)
    for match in matches:
        skill = {}
        match = match.strip()
        parts = match.split('(+')
        if len(parts) == 1:
            parts = match.split('(-')
        skill['bonus'] = int(parts[0].split()[-1].replace('+', ''))
        skill_name = ' '.join(parts[0].split()[:-1]).strip().lower()
        skill['circumstantial'] = []
        if len(parts) > 1:
            circumstance = parts[1].strip().replace(')', '')
            cparts = circumstance.split(',')
            for cpart in cparts:
                skill['circumstantial'].append(get_skill_circumstance(cpart))
        skills[skill_name] = skill
    return skills
    
def get_ability_scores(s):
    scores = {'str': 0, 'dex': 0, 'con': 0, 'int': 0, 'wis': 0, 'cha': 0}
    ability_scores = s.split(',')
    for s in ability_scores:
        type, val = s.split()
        type = type.lower()
        if '-' in val:
            val = float('nan')
        else:
            val = int(val)
        scores[type] = val
    return scores
    
def get_attacks(s):
    def get_attack(s):
        s = s.strip().lower()
        attack = {'weapon': '', 'bonus': [], 'damage': '',
                  'critmin': 20, 'critmult': 2, 'special': '', 'amount': 1}
        starts_with_number = re.compile(r'^\d+')
        matches = starts_with_number.findall(s)
        if len(matches) > 0:
            attack['amount'] = int(matches[0])
            s = starts_with_number.sub('', s).strip()
        parts = s.split('(')
        attack_string = parts[0].strip()
        damage_string = ' '.join(parts[1:]).replace(')', '').strip()
        attack_bonus = re.compile(r'(?P<bonus>(?<!^)(\+|\-)\d+)')
        matches = attack_bonus.findall(attack_string)
        for match in matches:
            attack['bonus'].append(int(match[0].replace('+', '')))
        if len(matches) == 0:
            attack['weapon'] = attack_string.strip()
        else:
            matches = attack_bonus.search(attack_string)
            attack['weapon'] = s[:matches.start()].strip()
        if ' plus ' in damage_string:
            parts = damage_string.split('plus')
            attack['special'] = ' '.join(parts[1:]).strip()
            damage_string = parts[0].strip()
        if '/' in damage_string:
            parts = damage_string.split('/')
            if 'x' in parts[1]:
                p = parts[1].split('x')
                attack['critmult'] = int(p[1])
            if '-' in parts[1]:
                p = parts[1].split('-')
                attack['critmin'] = int(p[0])
            damage_string = parts[0].strip()
        attack['damage'] = damage_string
        return attack
        
    
    s = s.replace(' or ', ',')
    s = s.replace(' and ', ',')
    s = s.replace(',,', ',')
    s = s.strip()    
    attacks = []
    if len(s) > 0:
        split_by_external_commas = re.compile(r'(?:[^,(]|\([^)]*\))+')
        s = s.strip().lower()
        matches = split_by_external_commas.findall(s)
        for match in matches:
            match = match.strip().lower()
            attacks.append(get_attack(match))
    return attacks    

def get_from_html(s):
    def find_bold_things(s):
        things = []
        parts = s.split('<b>')
        for part in parts:
            subparts = part.split('</b>')
            if len(subparts) > 1:
                things.append({'name': subparts[0].strip().lower(), 'value': subparts[1].strip()})
        return things
    
    def remove_tags(s, tags=None):
        if tags is None:
            tags = ['h5', 'hr', 'div', 'i', 'p', 'h4', 'html', 'body']
        soup = BeautifulSoup(s)
        for tag in tags: 
            for match in soup.findAll(tag):
                match.replaceWithChildren()
        return str(soup)
        
    def pull_list(s):
        split_by_external_commas_semicolons = re.compile(r'(?:[^,;(]|\([^)]*\))+')
        l = []
        for v in split_by_external_commas_semicolons.findall(s):
            a = ' '.join(remove_tags(v).strip().split()).lower()
            if len(a) > 0:
                l.append(a)
        return l

    def pull_slas(s):
        split_by_external_commas_semicolons = re.compile(r'(?:[^,;(]|\([^)]*\))+')
        slas = {'casterlevel': 0, 'concentration': 0, 'abilities': []}
        all_lines = s.split('</br>')
        for line in all_lines:
            if line.startswith('(CL'):
                con = None
                if ';' in line:
                    parts = line.split(';')
                    line, con = parts[0], parts[1]
                elif ',' in line:
                    parts = line.split(',')
                    line, con = parts[0], parts[1]
                if con is not None:
                    slas['concentration'] = int(con.replace('concentration', '').replace('+', '').replace(')', '').split(',')[0].strip())
                line = line.replace('(CL', '').replace(')', '').replace('st', '').replace('nd', '').replace('rd', '').replace('th', '').replace(':', '')
                slas['casterlevel'] = int(line)
            else:
                itsplit = line.split('<i>')
                freq = remove_tags(itsplit[0]).strip().lower()
                line = '<i>'.join(itsplit[1:])
                for ability in split_by_external_commas_semicolons.findall(line):
                    a = {'name': '', 'frequency': freq, 'dc': float('nan')}
                    ability = remove_tags(ability).strip().lower()
                    if '(dc' in ability:
                        name, dc = ability.split('(dc')
                        a['name'] = name.strip().lower()
                        a['dc'] = int(dc.split(';')[0].split(',')[0].replace(')', ' ').split()[0])
                    else:
                        a['name'] = ability.strip().lower()
                    slas['abilities'].append(a)
        return slas
        
    def pull_spellsknown(s):
        split_by_external_commas_semicolons = re.compile(r'(?:[^,;(]|\([^)]*\))+')
        sks = {'casterlevel': 0, 'concentration': 0, 'perday': [], 'spells': []}
        all_lines = s.split('</br>')
        for line in all_lines:
            if '(CL' in line:
                con = None
                if ';' in line:
                    parts = line.split(';')
                    line, con = parts[0], parts[1]
                elif ',' in line:
                    parts = line.split(',')
                    line, con = parts[0], parts[1]
                if con is not None:
                    sks['concentration'] = int(con.replace('concentration', '').replace('+', '').replace(')', '').split(',')[0].strip())
                line = line.replace('(CL', '').replace(')', '').replace('st', '').replace('nd', '').replace('rd', '').replace('th', '').replace(':', '')
                sks['casterlevel'] = int(line)
            else:
                itsplit = line.split('<i>')
                line = '<i>'.join(itsplit[1:])
                parts = remove_tags(itsplit[0]).strip().lower().split('(')
                level = int(parts[0].strip().replace('st', '').replace('nd', '').replace('rd', '').replace('th', ''))
                try:
                    pd = int(parts[1].split('/')[0].strip())
                except (ValueError, IndexError):
                    pd = float('nan')
                perday = {'level': level, 'number': pd}
                sks['perday'].append(perday)
                for sp in split_by_external_commas_semicolons.findall(line):
                    spell = {'name': '', 'level': level, 'dc': float('nan')}
                    sp = remove_tags(sp).strip().lower()
                    if '(dc' in sp:
                        name, dc = sp.split('(dc')
                        spell['name'] = name.strip().lower()
                        spell['dc'] = int(dc.replace(')', ' ').split()[0])
                    else:
                        spell['name'] = sp.strip().lower()
                    sks['spells'].append(spell)
        return sks
            
    others = {'initiative': 0,
              'senses': [],
              'resistances': [],
              'auras': [],
              'regeneration': {'amount': 0, 'overcome': ''},
              'fasthealing': {'amount': 0, 'special': ''},
              'dr': [],
              'defensiveabilities': [],
              'immunities': [],
              'sr': {'value': 0, 'versus': ''},
              'weaknesses': [],
              'speed': [],
              'specialattacks': [],
              'sla': [],
              'spellsknown': [],
              'cmb': {'bonus': 0, 'special': ''},
              'cmd': {'bonus': 0, 'special': ''},
              'specialabilities': [],
              'description': ''}
    bolds = find_bold_things(s)
    in_special_abilities = False
    for i, bold in enumerate(bolds):
        if bold['name'] == 'init':
            others['initiative'] = int(bold['value'].replace(';', '').replace('+', '').split()[0])
        elif bold['name'] == 'senses':
            others['senses'] = pull_list(bold['value'])
        elif bold['name'] == 'resist':
            others['resistances'] = pull_list(bold['value'])
        elif bold['name'] == 'aura':
            others['auras'] = pull_list(bold['value'])
        elif bold['name'] == 'hp':
            if 'regeneration' in bold['value']:
                reg = bold['value'].split('regeneration')[1]
                parts = reg.split('(')
                overcome = ''
                if len(parts) > 1:
                    reg = parts[0]
                    overcome = parts[1]
                try:
                    others['regeneration']['amount'] = int(remove_tags(reg).strip())
                except ValueError:
                    others['regeneration']['amount'] = float('nan')
                others['regeneration']['overcome'] = remove_tags(overcome.replace(')', '')).strip()
            if 'fast healing' in bold['value']:
                fh = remove_tags(bold['value'].split('fast healing')[1]).strip()
                parts = fh.split('(')
                if len(parts) > 1:
                    fh = parts[0].strip()
                    others['fasthealing']['special'] = parts[1].replace(')', '').strip()
                others['fasthealing']['amount'] = int(fh.split('or')[0]) # We only need to get rid of the 'or' for the Mother's Maw.
        elif bold['name'] == 'dr':
            others['dr'] = pull_list(bold['value'])
        elif bold['name'] == 'defensive abilities':
            others['defensiveabilities'] = pull_list(bold['value'])
        elif bold['name'] == 'immune':
            others['immunities'] = pull_list(bold['value'])
        elif bold['name'] == 'sr':
            if 'vs.' in bold['value']:
                bold['value'], circumstance = bold['value'].split('vs.')
                others['sr']['versus'] = circumstance
            others['sr']['value'] = int(remove_tags(bold['value'].split()[0].replace(';', '')))
        elif bold['name'] == 'weaknesses':
            others['weaknesses'] = pull_list(bold['value'])
        elif bold['name'] == 'spd':
            others['speed'] = pull_list(bold['value'])
        elif bold['name'] == 'special attacks':
            others['specialattacks'] = pull_list(bold['value'])
        elif bold['name'] == 'spell-like abilities':
            others['sla'] = pull_slas(bold['value'])
        elif bold['name'] == 'spells known':
            others['spellsknown'] = pull_spellsknown(bold['value'])
        elif bold['name'] == 'cmb':
            parts = bold['value'].split('(')
            if len(parts) > 1:
                others['cmb']['special'] = remove_tags(parts[1]).replace(')', '').strip()
            try:
                others['cmb']['bonus'] = int(remove_tags(parts[0]).replace(';', '').replace('+', ''))
            except ValueError:
                others['cmb']['bonus'] = float('nan')
        elif bold['name'] == 'cmd':
            parts = bold['value'].split('(')
            if len(parts) > 1:
                others['cmd']['special'] = remove_tags(parts[1]).replace(')', '').strip()
            try:
                others['cmd']['bonus'] = int(remove_tags(parts[0]))
            except ValueError:
                others['cmd']['bonus'] = float('nan')
        elif bold['name'] == 'special abilities':
            in_special_abilities = True
            
        if i == len(bolds) - 1:
            parts = bold['value'].split('<div>')
            bold['value'] = parts[0]
            if len(parts) > 1:
                others['description'] = ' '.join(remove_tags(parts[1]).strip().split())
            
        if in_special_abilities and bold['name'] != 'special abilities':
            sa = {'name': remove_tags(bold['name']).strip(),
                  'description': remove_tags(bold['value']).strip()}
            others['specialabilities'].append(sa)
    return others

    
if __name__ == '__main__':
    with open('monster_bestiary_partial.csv') as mfile:
        groupings = [3, 6, 9, 12, 15, 30]
        groups = [{} for _ in range(len(groupings))]
        mcsv = csv.DictReader(mfile)
        monsters = {}
        for row in mcsv:
            if is_valid_monster(row):
                name = row['Name'].strip().lower()
                print(name)
                monster = {}
                monster['cr'] = get_cr(row['CR'])
                monster['xp'] = row['XP'].strip().lower()
                monster['race'] = row['Race'].strip().lower()
                monster['class'] = get_class(row['Class'])
                monster['alignment'] = get_alignment(row['Alignment'])
                monster['size'] = row['Size'].strip().lower()
                monster['type'] = row['Type'].strip().lower()
                monster['subtype'] = get_subtype(row['SubType'])
                monster['ac'] = get_ac(row['AC'])
                monster['hp'] = int(row['HP'].strip())
                monster['hd'] = row['HD'].replace('(', '').replace(')', '').strip().lower()
                monster['saves'] = get_saves(row['Saves'])
                monster['melee'] = get_attacks(row['Melee'])
                monster['ranged'] = get_attacks(row['Ranged'])
                monster['space'] = row['Space'].strip().lower()
                monster['reach'] = row['Reach'].strip().lower()
                monster['abilityscores'] = get_ability_scores(row['AbilityScores'])
                monster['feats'] = [f.strip().lower() for f in row['Feats'].split(',')]
                monster['skills'] = get_skills(row['Skills'])
                monster['languages'] = [l.strip().lower() for l in row['Languages'].split(';')[0].split(',') if len(l.strip()) > 0]
                monster['sq'] = row['SQ'].strip().lower()
                monster['treasure'] = row['Treasure'].strip().lower()
                
                monster['speed'] = row['Speed'].strip().lower()
                monster['environment'] = row['Environment'].strip().lower()
                monster['organization'] = row['Organization'].strip().lower()
                
                html = row['FullText']
                html = html.replace('&mdash;', '')
                html = html.replace('\n', '')
                others = get_from_html(html)
                monster.update(others)
                
                monsters[name] = monster
                
                for i, g in enumerate(groupings):
                    cr = eval(monsters[name]['cr']+'.0')
                    if cr <= g:
                        groups[i][name] = monsters[name]
                        break
                print(name)
        print('--------------------------------------------')
        for group in groups:
            print(len(group))
        
        print('+++++++++++++++++++++++++++++++++++++++++++++')
        print(len(monsters))
        for gn, g in zip(groupings, groups):
            with open('bestiary{:02d}.js'.format(gn), 'w') as bfile:
                bfile.write('state["inspired.BESTIARY"] =\n')
                bfile.write(json.dumps(g, indent=3, separators=[',', ': '], sort_keys=True))
                bfile.write(';')
        
        with open('bestiary.js', 'w') as bfile:
            bfile.write('state["inspired.BESTIARY"] =\n')
            bfile.write(json.dumps(monsters, indent=3, separators=[',', ': '], sort_keys=True))
            bfile.write(';')
        
    ''' 
        lite_monster_names = ['barghest', 'dire bear', 'night hag']
        lite_monsters = {}
        for name in lite_monster_names:
            lite_monsters[name] = monsters[name]
        with open('bestiarylite.js', 'w') as bfile:
            mfile.write('state["inspired.BESTIARY"] =\n')
            mfile.write(json.dumps(lite_monsters, indent=3, separators=[',', ': '], sort_keys=True))
            mfile.write(';')
    '''
        
