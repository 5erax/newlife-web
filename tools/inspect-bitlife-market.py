"""Verify selected ARM64 market branches without running APK/DLL code."""
from pathlib import Path
import collections, hashlib, json, re, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
from elftools.elf.elffile import ELFFile

root = Path(sys.argv[1]).resolve()
text_root = root / 'cpp2il-native-text/DiffableCs'
binary = root / 'libil2cpp.so'
binary_hash = hashlib.sha256(binary.read_bytes()).hexdigest()
assert binary_hash == 'facc89b9e6dd241230e5e4d5cc32786a55a6330975556d663d0e16ef31e5e604', 'Different APK binary; reverify offsets'
metadata_hash = hashlib.sha256((root/'global-metadata.dat').read_bytes()).hexdigest()
assert metadata_hash == '7bd1a0ddb9e1ac0b94bf23f43e5b821196a4eac25e968aaf01fec5b5e2409ac1', 'Different metadata; reverify declarations'
index = collections.defaultdict(list)
pattern = re.compile(r'\[Address\(RVA = "(0x[\dA-F]+)", Offset = "(0x[\dA-F]+)", Length = "(0x[\dA-F]+)"\)\]\s*(?:\[[^\n]+\]\s*)*([^\n{]+)')
assert text_root.is_dir(), 'Export attributeinjector with Cpp2IL output-as diffable-cs first'
for path in text_root.rglob('*.cs'):
    for m in pattern.finditer(path.read_text(encoding='utf8')):
        item = {'file': path.relative_to(text_root).as_posix(), 'declaration': m[4].strip(), 'length': int(m[3], 16)}
        if item not in index[int(m[2], 16)]:
            index[int(m[2], 16)].append(item)

with binary.open('rb') as file:
    segments = [s for s in ELFFile(file).iter_segments() if s['p_type'] == 'PT_LOAD']
    decoder = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
    def raw_address(virtual):
        segment = next(s for s in segments if s['p_vaddr'] <= virtual < s['p_vaddr'] + s['p_filesz'])
        return segment['p_offset'] + virtual - segment['p_vaddr']
    def method(offset):
        descriptions = index[offset]
        assert descriptions and len({d['length'] for d in descriptions}) == 1
        size = descriptions[0]['length']
        segment = next(s for s in segments if s['p_offset'] <= offset < s['p_offset'] + s['p_filesz'])
        assert 0 < size < 1000000 and offset + size <= segment['p_offset'] + segment['p_filesz']
        virtual = segment['p_vaddr'] + offset - segment['p_offset']
        file.seek(offset)
        code = file.read(size)
        instructions = [{'address': hex(i.address), 'op': i.mnemonic, 'args': i.op_str} for i in decoder.disasm(code, virtual)]
        assert sum(i.size for i in decoder.disasm(code, virtual)) == size
        calls = []
        for i in instructions:
            if i['op'] == 'bl':
                target = int(i['args'].removeprefix('#'), 16)
                calls.append({'address': hex(target), 'candidates': index.get(raw_address(target), [])})
        return {'fileOffset': hex(offset), 'virtualAddress': hex(virtual), 'sha256': hashlib.sha256(code).hexdigest(), 'declarations': descriptions, 'instructions': instructions, 'calls': calls}
    calibration = method(0x2adabe8)
    assert [(i['op'], i['args']) for i in calibration['instructions']] == [('ldr', 'd0, [x0, #0x30]'), ('ret', '')]
    selector = method(0x2adac68)
    constructor = method(0x2ad08f8)
    assert any(i['op'] == 'ldr' and i['args'] == 'w1, [x0, #0x2c]' for i in constructor['instructions'])
    assert any(i['op'] == 'b' and i['args'] == '#' + selector['virtualAddress'] for i in constructor['instructions'])
    assert '<WinnerScore>k__BackingField; //Field offset: 0x2C' in (text_root/'Assembly-CSharp/DataFinancialUniversalStock.cs').read_text(encoding='utf8')
    instructions = selector['instructions']
    addresses = {int(i['address'], 16): n for n, i in enumerate(instructions)}
    start = next(n for n, i in enumerate(instructions) if i['op'] == 'cmp' and i['args'] == 'w20, #2')
    def select_pattern(score, draw):
        registers, comparison, pc = {'w20': score, 'w0': draw}, 0, start
        for _ in range(100):
            i = instructions[pc]
            op, args = i['op'], i['args'].split(', ')
            if op == 'cmp':
                comparison = registers[args[0]] - int(args[1].removeprefix('#'), 0)
            elif op == 'mov':
                registers[args[0]] = int(args[1].removeprefix('#'), 0)
            elif op == 'str':
                assert i['args'] == 'w8, [x19, #0x58]'
                return registers['w8']
            elif op.startswith('b'):
                take = op == 'b' or {'b.le': comparison <= 0, 'b.lt': comparison < 0, 'b.ge': comparison >= 0, 'b.eq': comparison == 0, 'b.ne': comparison != 0}.get(op, False)
                assert op in ['b', 'b.le', 'b.lt', 'b.ge', 'b.eq', 'b.ne']
                if take:
                    pc = addresses[int(args[0].removeprefix('#'), 16)]
                    continue
            else:
                raise AssertionError('Unexpected selector instruction: ' + str(i))
            pc += 1
        raise AssertionError('Selector did not terminate')
    # Independent boundary table transcribed from the native branch targets.
    boundaries = {1: (13, 19), 2: (9, 17), 3: (6, 16), 4: (5, 13), 5: (5, 11)}
    fixtures = []
    for score, (middle, high) in boundaries.items():
        for draw in range(1, 21):
            expected = 2 if draw < middle else 3 if draw < high else 1
            actual = select_pattern(score, draw)
            assert actual == expected
            fixtures.append({'winnerScore': score, 'draw': draw, 'pattern': actual})
    offsets = [0x2ac8ea4, 0x2ac99b8, 0x2ac9ff8, 0x2ac9d94, 0x2ad0f00, 0x2ad48a8, 0x2ad4070, 0x2adb590]
    summaries = []
    for offset in offsets:
        m = method(offset)
        summaries.append({k: v for k, v in m.items() if k != 'instructions'})
    evidence = [calibration, selector, constructor, method(0x2e0754c), method(0x4f352fc), method(0x4f35618)]
report = {'binarySha256': binary_hash, 'metadataSha256': metadata_hash, 'mapping': 'Injected Offset is raw; map each call through ELF PT_LOAD. Calibrated SimStock price getter.', 'scope': 'Verified stock pattern branch table only; complete price/lifecycle equations and virtual RNG dispatch remain unverified.', 'stockPatternFixtures': fixtures, 'patternCountsPer20Draws': {score: dict(collections.Counter(f['pattern'] for f in fixtures if f['winnerScore'] == score)) for score in range(1, 6)}, 'methods': evidence, 'lifecycleCallSummaries': summaries}
print(json.dumps(report, indent=2))
