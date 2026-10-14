"""Verify selected Keno rules statically; never execute APK or DLL code."""
from pathlib import Path
import hashlib, json, struct, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
from elftools.elf.elffile import ELFFile

root = Path(sys.argv[1]).resolve()
binary = root / 'libil2cpp.so'
metadata = (root / 'global-metadata.dat').read_bytes()
binary_hash = hashlib.sha256(binary.read_bytes()).hexdigest()
metadata_hash = hashlib.sha256(metadata).hexdigest()
assert binary_hash == 'facc89b9e6dd241230e5e4d5cc32786a55a6330975556d663d0e16ef31e5e604', 'Different APK binary'
assert metadata_hash == '7bd1a0ddb9e1ac0b94bf23f43e5b821196a4eac25e968aaf01fec5b5e2409ac1', 'Different metadata'
methods = {}
with binary.open('rb') as file:
    segments = [s for s in ELFFile(file).iter_segments() if s['p_type'] == 'PT_LOAD']
    def read(virtual, size):
        segment = next(s for s in segments if s['p_vaddr'] <= virtual and virtual + size <= s['p_vaddr'] + s['p_filesz'])
        file.seek(segment['p_offset'] + virtual - segment['p_vaddr'])
        return file.read(size)
    decoder = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
    for name, offset, size in [
        ('calibration', 0x2adabe8, 8), ('selected', 0x2e1e998, 0x140),
        ('init', 0x2e1c948, 0x7ac), ('grid', 0x2e1d0f4, 0x48c),
        ('draw', 0x2e1ead8, 0x87c), ('exists', 0x2e1f354, 0x148),
        ('settle', 0x2e1dc64, 0x524), ('complete', 0x3569680, 0x2a0),
        ('constructor', 0x2aa1eb8, 0x2c), ('skipped', 0x2aa3024, 0x84),
        ('random', 0x2e0754c, 0x15c),
    ]:
        segment = next(s for s in segments if s['p_offset'] <= offset and offset + size <= s['p_offset'] + s['p_filesz'])
        virtual = segment['p_vaddr'] + offset - segment['p_offset']
        code = read(virtual, size)
        ins = list(decoder.disasm(code, virtual))
        assert sum(i.size for i in ins) == size, name
        methods[name] = {'fileOffset': hex(offset), 'virtualAddress': hex(virtual), 'sha256': hashlib.sha256(code).hexdigest(),
                         'instructions': [{'address': hex(i.address), 'op': i.mnemonic, 'args': i.op_str} for i in ins]}
    def span(name, start, expected):
        instructions = {int(i['address'], 16): (i['op'], i['args']) for i in methods[name]['instructions']}
        assert [instructions[start + 4*n] for n in range(len(expected))] == expected, (name, hex(start))
    span('calibration', 0x2adabe8 + 0x4000, [('ldr', 'd0, [x0, #0x30]'), ('ret', '')])
    span('selected', 0x2e22a60, [('cmp', 'w20, #2'), ('ldp', 'x20, x19, [sp, #0x50]'),
        ('ldp', 'x22, x21, [sp, #0x40]'), ('cset', 'w0, gt')])
    span('init', 0x2e20ab8, [('ldr', 'd1, [x8, #0x9d8]'), ('strb', 'wzr, [x19, #0x2a]'),
        ('str', 'x20, [x19, #0x40]'), ('fdiv', 's0, s8, s0'), ('str', 'd1, [x19, #0x38]')])
    assert struct.unpack('<ff', read(0xfb49d8, 8)) == (5.0, 4.0)
    span('draw', 0x2e22c40, [('mov', 'w0, #1'), ('mov', 'w1, #0x15'), ('mov', 'x2, xzr'),
        ('bl', '#0x2e0b54c'), ('mov', 'w22, w0'), ('mov', 'x0, x19'), ('mov', 'w1, w22'),
        ('bl', '#0x2e23354'), ('tbnz', 'w0, #0, #0x2e22c30')])
    span('draw', 0x2e22e10, [('add', 'w28, w28, #1'), ('cmp', 'w28, #6'), ('b.ne', '#0x2e22c30')])
    span('exists', 0x2e23408, [('ldr', 'w8, [x8, #0x24]'), ('cmp', 'w8, w19'), ('b.ne', '#0x2e233ec')])
    span('draw', 0x2e22e1c, [('ldr', 'w8, [x19, #0xa8]'), ('cmp', 'w8, #1'), ('b.lt', '#0x2e231dc'),
        ('ldr', 'x8, [x19, #0x60]'), ('cbz', 'x8, #0x2e23204'), ('ldr', 'x8, [x8, #0x30]'),
        ('cbz', 'x8, #0x2e23204'), ('ldr', 's0, [x8, #0x20]'), ('fcmp', 's0, #0.0'), ('b.le', '#0x2e231dc')])
    span('draw', 0x2e22e54, [('mov', 'w0, wzr'), ('mov', 'w1, #0x64'), ('mov', 'x2, xzr'), ('bl', '#0x2e0b54c')])
    span('draw', 0x2e22e74, [('scvtf', 's0, w0'), ('ldr', 's1, [x8, #0x20]'),
        ('fcmp', 's1, s0'), ('b.le', '#0x2e231dc')])
    span('draw', 0x2e23008, [('mov', 'w24, w0'), ('mov', 'x0, x19'), ('mov', 'w1, w24'),
        ('bl', '#0x2e23354'), ('tbnz', 'w0, #0, #0x2e22fe8'), ('ldr', 'x0, [x19, #0xa0]'),
        ('cbz', 'x0, #0x2e23208'), ('ldr', 'x2, [x29]'), ('mov', 'w1, w24'),
        ('bl', '#0x4939e4c'), ('tbnz', 'w0, #0, #0x2e22fe8')])
    span('settle', 0x2e21d28, [('ldr', 'w9, [x19, #0xa8]'), ('ldr', 'x8, [x19, #0x60]'),
        ('cmp', 'w9, #1'), ('b.lt', '#0x2e21d68'), ('cbz', 'x8, #0x2e220c8'),
        ('scvtf', 's0, w9'), ('ldr', 's1, [x8, #0x10]'), ('cmp', 'w9, #3'),
        ('fmul', 's0, s1, s0'), ('str', 's0, [x8, #0x14]'), ('b.ne', '#0x2e21d78')])
    span('settle', 0x2e21d5c, [('mov', 'w9, #2'), ('str', 'w9, [x8, #0x24]'), ('b', '#0x2e21d78')])
    span('settle', 0x2e21d6c, [('ldr', 's0, [x8, #0x10]'), ('fneg', 's0, s0'), ('str', 's0, [x8, #0x14]')])
    span('complete', 0x356d8b0, [('ldr', 's0, [x8, #0x10]'), ('ldr', 's1, [x9, #0x2f4]'),
        ('ldr', 'x0, [x9, #0xe8]'), ('fadd', 's0, s8, s0'), ('fadd', 's1, s1, s0'),
        ('str', 's1, [x9, #0x2f4]'), ('cbz', 'x0, #0x356d91c'), ('fcvt', 'd0, s0'),
        ('mov', 'x1, xzr'), ('bl', '#0x2a6eb5c')])

# Evaluate only the verified payout block, with initialized non-null native objects.
def settle(matches, bet):
    instructions = {int(i['address'], 16): i for i in methods['settle']['instructions']}
    registers = {'w9': matches, 's1': bet}
    pc, comparison, result, special = 0x2e21d30, 0, None, 0
    while pc != 0x2e21d78:
        i = instructions[pc]
        op, args = i['op'], i['args'].split(', ')
        if op == 'cmp': comparison = registers[args[0]] - int(args[1][1:], 0)
        elif op in ['b.lt', 'b.ne', 'b']:
            if op == 'b' or (comparison < 0 if op == 'b.lt' else comparison != 0):
                pc = int(args[0][1:], 16)
                continue
        elif op in ['scvtf', 'fneg']: registers[args[0]] = float(registers[args[1]]) * (-1 if op == 'fneg' else 1)
        elif op == 'fmul': registers[args[0]] = registers[args[1]] * registers[args[2]]
        elif op == 'mov': registers[args[0]] = int(args[1][1:], 0)
        elif op == 'str':
            if i['args'] == 's0, [x8, #0x14]': result = registers['s0']
            else:
                assert i['args'] == 'w9, [x8, #0x24]'
                special = registers['w9']
        elif op == 'ldr':
            if i['args'] in ['s0, [x8, #0x10]', 's1, [x8, #0x10]']: registers[args[0]] = bet
            else: assert i['args'] == 'x8, [x8, #0x30]'
        elif op == 'cbz': assert i['args'] == 'x8, #0x2e220c8'
        else: raise AssertionError(i)
        pc += 4
    return result, special

fixtures = []
for bet in [1, 1000, 1000000]:
    for matches, multiplier in enumerate([-1, 1, 2, 3]):
        winnings, special = settle(matches, bet)
        assert (winnings, special) == (bet * multiplier, 2 if matches == 3 else 0)
        fixtures.append({'bet': bet, 'matches': matches, 'lastWinnings': winnings, 'specialWinType': special})
print(json.dumps({'binarySha256': binary_hash, 'metadataSha256': metadata_hash,
    'scope': 'Verified Keno payout block, 5x4 grid, six unique draws, and HouseWinRate rewrite branch. Not a complete web port or native RNG equivalence.',
    'randomArguments': {'ball': [1, 21], 'house': [0, 100]},
    'remaining': ['Resolve virtual RNG endpoint/seed behavior', 'Trace all assignments to HouseWinRate and casino entry bet debit', 'Web engine/save/UI and hosted acceptance'],
    'settlementFixtures': fixtures, 'methods': methods}, indent=2))
