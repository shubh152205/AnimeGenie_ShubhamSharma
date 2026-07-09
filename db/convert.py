import os
import json
import pandas as pd
from collections import Counter

# Define area mappings to make logs readable
AREA_NAMES = {
    1: 'Deck',
    2: 'Hand',
    3: 'Discard',
    4: 'Active',
    5: 'Bench',
    6: 'Revealed',
    7: 'Stadium',
    8: 'Active Energy',
    9: 'Active Tool',
    10: 'Pre-evolution',
    12: 'Search Zone'
}

def scan_card_map(obj, card_map):
    """Recursively scan JSON object to map card IDs to card names."""
    if isinstance(obj, dict):
        if 'id' in obj and 'name' in obj and obj['name']:
            card_map[str(obj['id'])] = obj['name']
        for v in obj.values():
            scan_card_map(v, card_map)
    elif isinstance(obj, list):
        for item in obj:
            scan_card_map(item, card_map)

def compact_card_list(card_ids, card_map):
    """Compact a long list of card IDs (like a deck list) into a counted string."""
    names = [card_map.get(str(cid), f"Card #{cid}") for cid in card_ids]
    counts = Counter(names)
    parts = []
    for name, count in sorted(counts.items()):
        parts.append(f"{count}x {name}")
    return ", ".join(parts)

def translate_action(action, select_dict, card_map):
    """Translate action choice indices into human-readable descriptions using selection context."""
    if not action:
        return ""
    if not select_dict or 'option' not in select_dict:
        return str(action)
    
    opts = select_dict['option']
    translated_parts = []
    for idx in action:
        if idx < len(opts):
            opt = opts[idx]
            opt_type = opt.get('type')
            if opt_type == 'Card':
                area = opt.get('area')
                area_name = AREA_NAMES.get(area, f"Area {area}")
                card_idx = opt.get('index')
                translated_parts.append(f"Choose Card index {card_idx} from {area_name}")
            elif opt_type == 'Play':
                card_idx = opt.get('index')
                translated_parts.append(f"Play card index {card_idx}")
            elif opt_type == 'Attach':
                card_idx = opt.get('index')
                target_idx = opt.get('inPlayIndex')
                target_area = AREA_NAMES.get(opt.get('inPlayArea'), f"Area {opt.get('inPlayArea')}")
                translated_parts.append(f"Attach card index {card_idx} to target {target_idx} in {target_area}")
            elif opt_type == 'Attack':
                attack_id = opt.get('attackId')
                translated_parts.append(f"Attack using Attack ID {attack_id}")
            elif opt_type == 'End':
                translated_parts.append("End Turn")
            elif opt_type == 'Retreat':
                translated_parts.append("Retreat")
            elif opt_type == 'Yes':
                translated_parts.append("Yes")
            elif opt_type == 'No':
                translated_parts.append("No")
            else:
                translated_parts.append(f"{opt_type} ({str(opt)})")
        else:
            translated_parts.append(f"Option #{idx}")
            
    return "; ".join(translated_parts)

def format_log(log, card_map):
    """Format a log entry dictionary into a readable text message."""
    t = log.get('type')
    p = log.get('playerIndex')
    
    def get_card_name(cid):
        if cid is None:
            return "Unknown Card"
        return card_map.get(str(cid), f"Card #{cid}")

    if t == 'Draw':
        return f"Player {p} drew {get_card_name(log.get('cardId'))} (serial {log.get('serial')})"
    elif t == 'HasBasicPokemon':
        return f"Player {p} has basic Pokemon: {log.get('hasBasicPokemon')}"
    elif t == 'MoveCard':
        from_area = AREA_NAMES.get(log.get('fromArea'), f"Area {log.get('fromArea')}")
        to_area = AREA_NAMES.get(log.get('toArea'), f"Area {log.get('toArea')}")
        return f"Player {p}: {get_card_name(log.get('cardId'))} (serial {log.get('serial')}) moved from {from_area} to {to_area}"
    elif t == 'Shuffle':
        return f"Player {p} shuffled deck"
    elif t == 'TurnStart':
        return f"Player {p}'s turn started"
    elif t == 'TurnEnd':
        return f"Player {p}'s turn ended"
    elif t == 'Play':
        return f"Player {p} played {get_card_name(log.get('cardId'))} (serial {log.get('serial')})"
    elif t == 'Attach':
        return f"Player {p} attached {get_card_name(log.get('cardId'))} (serial {log.get('serial')}) to {get_card_name(log.get('cardIdTarget'))} (serial {log.get('serialTarget')})"
    elif t == 'Evolve':
        return f"Player {p} evolved {get_card_name(log.get('cardIdTarget'))} (serial {log.get('serialTarget')}) into {get_card_name(log.get('cardId'))} (serial {log.get('serial')})"
    elif t == 'Attack':
        return f"Player {p} attacked with {get_card_name(log.get('cardId'))} (serial {log.get('serial')}) using Attack #{log.get('attackId')}"
    elif t == 'HpChange':
        val = log.get('value', 0)
        action_word = "healed" if val > 0 else "damaged"
        return f"Player {p}'s {get_card_name(log.get('cardId'))} (serial {log.get('serial')}) was {action_word} by {abs(val)} HP (putDamageCounter: {log.get('putDamageCounter')})"
    elif t == 'Switch':
        return f"Player {p} switched active {get_card_name(log.get('cardIdActive'))} (serial {log.get('serialActive')}) with benched {get_card_name(log.get('cardIdBench'))} (serial {log.get('serialBench')})"
    elif t == 'Result':
        return f"Game Over: Player {p} result is {log.get('result')} ({log.get('reason')})"
    elif t == 'Coin':
        outcome = "Heads" if log.get('head') else "Tails"
        return f"Player {p} flipped coin: {outcome}"
    else:
        return f"Player {p} event {t}: {log}"

def format_attached_energies(card_dict, card_map):
    """Format energies attached to a card."""
    if not card_dict or 'energies' not in card_dict or not card_dict['energies']:
        return ""
    names = [card_map.get(str(eid), f"Energy #{eid}") for eid in card_dict['energies']]
    counts = Counter(names)
    parts = []
    for name, count in sorted(counts.items()):
        parts.append(f"{name}: {count}")
    return ", ".join(parts)

def format_bench_names(bench_list, card_map):
    """Format list of benched pokemon card names."""
    if not bench_list:
        return ""
    names = []
    for card in bench_list:
        if isinstance(card, dict):
            names.append(card_map.get(str(card.get('id')), f"Card #{card.get('id')}"))
        else:
            names.append("Unknown")
    return ", ".join(names)

def extract_step_row(step_num, vis_data, card_map):
    """Extract board state and action details for a single step."""
    if step_num == 0:
        return {
            'step_number': 0,
            'turn_number': 0,
            'turn_p0': 0,
            'turn_p1': 0,
            'active_player': 'None',
            'p0_action': '',
            'p1_action': '',
            'logs': 'Game Initialized',
            'p0_hand_count': 0,
            'p0_deck_count': 60,
            'p0_discard_count': 0,
            'p0_active_name': 'None',
            'p0_active_hp': '',
            'p0_active_max_hp': '',
            'p0_active_energies': '',
            'p0_bench_count': 0,
            'p0_bench_names': '',
            'p0_asleep': 0,
            'p0_burned': 0,
            'p0_confused': 0,
            'p0_paralyzed': 0,
            'p0_poisoned': 0,
            'p1_hand_count': 0,
            'p1_deck_count': 60,
            'p1_discard_count': 0,
            'p1_active_name': 'None',
            'p1_active_hp': '',
            'p1_active_max_hp': '',
            'p1_active_energies': '',
            'p1_bench_count': 0,
            'p1_bench_names': '',
            'p1_asleep': 0,
            'p1_burned': 0,
            'p1_confused': 0,
            'p1_paralyzed': 0,
            'p1_poisoned': 0,
        }

    vis = vis_data[step_num - 1]
    current = vis.get('current')
    
    # Actions
    action_p0 = vis.get('action', [[], []])[0] if vis.get('action') else []
    action_p1 = vis.get('action', [[], []])[1] if vis.get('action') else []
    
    if step_num == 1:
        p0_act_str = compact_card_list(action_p0, card_map) if action_p0 else ""
        p1_act_str = compact_card_list(action_p1, card_map) if action_p1 else ""
    else:
        p0_act_str = translate_action(action_p0, vis.get('select'), card_map)
        p1_act_str = translate_action(action_p1, vis.get('select'), card_map)
        
    # Active player
    if action_p0 and action_p1:
        active_player = "Both"
    elif action_p0:
        active_player = "Player 0"
    elif action_p1:
        active_player = "Player 1"
    else:
        active_player = "None"
        
    # Logs
    log_list = vis.get('logs', [])
    formatted_logs = [format_log(log, card_map) for log in log_list]
    logs_str = "\n".join(formatted_logs)
    
    row = {
        'step_number': step_num,
        'p0_action': p0_act_str,
        'p1_action': p1_act_str,
        'active_player': active_player,
        'logs': logs_str
    }
    
    # Board state
    if current and 'players' in current and len(current['players']) >= 2:
        # Player 0
        p0 = current['players'][0]
        row['turn_p0'] = p0.get('turn', 0)
        row['p0_hand_count'] = p0.get('handCount') if p0.get('handCount') is not None else (len(p0['hand']) if p0.get('hand') else 0)
        row['p0_deck_count'] = p0.get('deckCount', 60)
        row['p0_discard_count'] = len(p0['discard']) if p0.get('discard') else 0
        
        p0_act = p0.get('active', [])
        if p0_act and len(p0_act) > 0 and isinstance(p0_act[0], dict):
            act_card = p0_act[0]
            row['p0_active_name'] = card_map.get(str(act_card.get('id')), f"Card #{act_card.get('id')}")
            row['p0_active_hp'] = act_card.get('hp', '')
            row['p0_active_max_hp'] = act_card.get('maxHp', '')
            row['p0_active_energies'] = format_attached_energies(act_card, card_map)
        else:
            row['p0_active_name'] = 'None'
            row['p0_active_hp'] = ''
            row['p0_active_max_hp'] = ''
            row['p0_active_energies'] = ''
            
        row['p0_bench_count'] = len(p0['bench']) if p0.get('bench') else 0
        row['p0_bench_names'] = format_bench_names(p0.get('bench', []), card_map)
        row['p0_asleep'] = 1 if p0.get('asleep') else 0
        row['p0_burned'] = 1 if p0.get('burned') else 0
        row['p0_confused'] = 1 if p0.get('confused') else 0
        row['p0_paralyzed'] = 1 if p0.get('paralyzed') else 0
        row['p0_poisoned'] = 1 if p0.get('poisoned') else 0
        
        # Player 1
        p1 = current['players'][1]
        row['turn_p1'] = p1.get('turn', 0)
        row['p1_hand_count'] = p1.get('handCount') if p1.get('handCount') is not None else (len(p1['hand']) if p1.get('hand') else 0)
        row['p1_deck_count'] = p1.get('deckCount', 60)
        row['p1_discard_count'] = len(p1['discard']) if p1.get('discard') else 0
        
        p1_act = p1.get('active', [])
        if p1_act and len(p1_act) > 0 and isinstance(p1_act[0], dict):
            act_card = p1_act[0]
            row['p1_active_name'] = card_map.get(str(act_card.get('id')), f"Card #{act_card.get('id')}")
            row['p1_active_hp'] = act_card.get('hp', '')
            row['p1_active_max_hp'] = act_card.get('maxHp', '')
            row['p1_active_energies'] = format_attached_energies(act_card, card_map)
        else:
            row['p1_active_name'] = 'None'
            row['p1_active_hp'] = ''
            row['p1_active_max_hp'] = ''
            row['p1_active_energies'] = ''
            
        row['p1_bench_count'] = len(p1['bench']) if p1.get('bench') else 0
        row['p1_bench_names'] = format_bench_names(p1.get('bench', []), card_map)
        row['p1_asleep'] = 1 if p1.get('asleep') else 0
        row['p1_burned'] = 1 if p1.get('burned') else 0
        row['p1_confused'] = 1 if p1.get('confused') else 0
        row['p1_paralyzed'] = 1 if p1.get('paralyzed') else 0
        row['p1_poisoned'] = 1 if p1.get('poisoned') else 0
        
        row['turn_number'] = max(row['turn_p0'], row['turn_p1'])
    else:
        row['turn_number'] = 0
        row['turn_p0'] = 0
        row['turn_p1'] = 0
        row['p0_hand_count'] = 0
        row['p0_deck_count'] = 60
        row['p0_discard_count'] = 0
        row['p0_active_name'] = 'None'
        row['p0_active_hp'] = ''
        row['p0_active_max_hp'] = ''
        row['p0_active_energies'] = ''
        row['p0_bench_count'] = 0
        row['p0_bench_names'] = ''
        row['p0_asleep'] = 0
        row['p0_burned'] = 0
        row['p0_confused'] = 0
        row['p0_paralyzed'] = 0
        row['p0_poisoned'] = 0
        row['p1_hand_count'] = 0
        row['p1_deck_count'] = 60
        row['p1_discard_count'] = 0
        row['p1_active_name'] = 'None'
        row['p1_active_hp'] = ''
        row['p1_active_max_hp'] = ''
        row['p1_active_energies'] = ''
        row['p1_bench_count'] = 0
        row['p1_bench_names'] = ''
        row['p1_asleep'] = 0
        row['p1_burned'] = 0
        row['p1_confused'] = 0
        row['p1_paralyzed'] = 0
        row['p1_poisoned'] = 0
        
    return row

def main():
    base_dir = '/run/media/askshubh/New Volume/Downloads/Brave/archive/Infosys internship/'
    files = sorted([f for f in os.listdir(base_dir) if f.endswith('.json')])
    
    if not files:
        print("No JSON files found in this folder!")
        return

    episodes_summary = []
    
    for file in files:
        print(f"Parsing replay logs from {file}...")
        filepath = os.path.join(base_dir, file)
        
        with open(filepath, 'r') as f:
            d = json.load(f)
            
        episode_id = d.get('id', file.split('.')[0])
        info = d.get('info', {})
        info_episode_id = info.get('EpisodeId', file.split('.')[0])
        game_name = d.get('name', 'PokeCard')
        
        # Get player names
        agents = info.get('Agents', [])
        p0_name = agents[0].get('Name', 'Player 0') if len(agents) > 0 else 'Player 0'
        p1_name = agents[1].get('Name', 'Player 1') if len(agents) > 1 else 'Player 1'
        
        # Determine winner
        rewards = d.get('rewards', [0, 0])
        rewards_p0 = rewards[0] if len(rewards) > 0 else 0
        rewards_p1 = rewards[1] if len(rewards) > 1 else 0
        
        if rewards_p0 > rewards_p1:
            winner = p0_name
            winner_idx = 0
        elif rewards_p1 > rewards_p0:
            winner = p1_name
            winner_idx = 1
        else:
            winner = 'Tie'
            winner_idx = -1
            
        total_steps = len(d['steps'])
        seed = d.get('configuration', {}).get('seed', '')
        
        # Save episode summary metadata
        ep_meta = {
            'filename': file,
            'episode_id': episode_id,
            'info_episode_id': info_episode_id,
            'game_name': game_name,
            'player_0_name': p0_name,
            'player_1_name': p1_name,
            'winner': winner,
            'winner_index': winner_idx,
            'total_steps': total_steps,
            'rewards_p0': rewards_p0,
            'rewards_p1': rewards_p1,
            'seed': seed
        }
        episodes_summary.append(ep_meta)
        
        # Build card map
        card_map = {}
        scan_card_map(d, card_map)
        
        # Get visualize history list
        has_vis = 'visualize' in d['steps'][0][0]
        if not has_vis:
            print(f"Warning: Replay file {file} does not contain 'visualize' dataset! Skipping.")
            continue
            
        vis_data = d['steps'][0][0]['visualize']
        
        # Parse all steps
        rows = []
        for step_num in range(total_steps):
            row = extract_step_row(step_num, vis_data, card_map)
            # Add game metadata to each step row
            row.update({
                'filename': file,
                'episode_id': episode_id,
                'info_episode_id': info_episode_id,
                'game_name': game_name,
                'player_0_name': p0_name,
                'player_1_name': p1_name,
                'winner': winner,
                'winner_index': winner_idx,
                'total_steps': total_steps,
                'rewards_p0': rewards_p0,
                'rewards_p1': rewards_p1,
                'seed': seed
            })
            rows.append(row)
            
        # Reorder columns to put metadata first
        df = pd.DataFrame(rows)
        meta_cols = [
            'filename', 'episode_id', 'info_episode_id', 'game_name', 'player_0_name', 'player_1_name',
            'winner', 'winner_index', 'total_steps', 'rewards_p0', 'rewards_p1', 'seed'
        ]
        other_cols = [col for col in df.columns if col not in meta_cols]
        df = df[meta_cols + other_cols]
        
        csv_name = os.path.join(base_dir, file.replace('.json', '.csv'))
        df.to_csv(csv_name, index=False)
        print(f"Successfully converted and saved: {csv_name} ({len(df)} rows)")

    # Save consolidated summary
    summary_df = pd.DataFrame(episodes_summary)
    summary_csv = os.path.join(base_dir, 'episodes_summary.csv')
    summary_df.to_csv(summary_csv, index=False)
    print(f"Successfully saved global episodes summary: {summary_csv}")
    print("All conversions complete!")

if __name__ == "__main__":
    main()