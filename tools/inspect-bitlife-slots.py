"""Read the provided APK's slot rules statically; never execute its code."""
from pathlib import Path
import hashlib, json, re, struct, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
from elftools.elf.elffile import ELFFile
root = Path(sys.argv[1]).resolve()
binary = root/'libil2cpp.so'
metadata = (root/'global-metadata.dat').read_bytes()
assert hashlib.sha256(binary.read_bytes()).hexdigest() == 'facc89b9e6dd241230e5e4d5cc32786a55a6330975556d663d0e16ef31e5e604'
assert hashlib.sha256(metadata).hexdigest() == '7bd1a0ddb9e1ac0b94bf23f43e5b821196a4eac25e968aaf01fec5b5e2409ac1'
header = struct.unpack_from('<9I', metadata)
assert header[1] == 39 and header[3] == header[4]*4
methods = {}
with binary.open('rb') as file:
    elf = ELFFile(file)
    segments = [s for s in elf.iter_segments() if s['p_type'] == 'PT_LOAD']
    reloc = {o: a for o, info, a in struct.iter_unpack('<QQq', elf.get_section_by_name('.rela.dyn').data()) if info & 0xffffffff == 1027}
    def read(virtual, size):
        segment = next(s for s in segments if s['p_vaddr'] <= virtual and virtual+size <= s['p_vaddr']+s['p_filesz'])
        file.seek(segment['p_offset']+virtual-segment['p_vaddr'])
        return file.read(size)
    def load(virtual):
        if virtual in reloc:
            return reloc[virtual]
        try:
            token = struct.unpack('<Q', read(virtual, 8))[0]
        except StopIteration:
            return None
        if token >> 29 == 5:
            index = (token & 0x1ffffffe) >> 1
            assert index+1 < header[4]
            start, end = struct.unpack_from('<II', metadata, header[2]+index*4)
            assert 0 <= start <= end <= header[6]
            return metadata[header[5]+start:header[5]+end].decode('utf8')
        return token
    decoder = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
    for name, offset, size in [('calibration',0x2adabe8,8),('weights',0x2e56890,0x284),('chooseGroup',0x2e54b5c,0x270),('combinations',0x2e54e98,0x818),('pairA',0x2e56b84,0x64),('pairB',0x2e56be8,0x64),('pairC',0x2e56c4c,0x64),('generatePairs',0x2e55848,0x1ec),('result',0x2e546f0,0x218),('settle',0x2e53180,0x2b8)]:
        segment = next(s for s in segments if s['p_offset'] <= offset < s['p_offset']+s['p_filesz'])
        virtual = segment['p_vaddr']+offset-segment['p_offset']
        code = read(virtual, size)
        ins = list(decoder.disasm(code, virtual))
        assert sum(i.size for i in ins) == size
        methods[name] = {'offset':hex(offset),'virtual':hex(virtual),'sha256':hashlib.sha256(code).hexdigest(),'instructions':[{'op':i.mnemonic,'args':i.op_str,'address':hex(i.address)} for i in ins]}
    assert [(i['op'],i['args']) for i in methods['calibration']['instructions']] == [('ldr','d0, [x0, #0x30]'),('ret','')]
    registers, table = {}, []
    for i in methods['combinations']['instructions']:
        op, args = i['op'], i['args']
        parts = args.split(', ')
        if op == 'adrp' or (op == 'mov' and parts[1].startswith('#')):
            registers[parts[0]] = int(parts[1].removeprefix('#'),0)
        elif op == 'movk':
            assert parts[2] == 'lsl #32'
            registers[parts[0]] = (registers[parts[0]] & 0xffffffff) | (int(parts[1][1:],0) << 32)
        elif op == 'ldr':
            match = re.fullmatch(r'(x\d+), \[(x\d+)(?:, #(0x[0-9a-f]+))?\]',args)
            if match:
                base = registers.get(match[2])
                registers[match[1]] = load(base+int(match[3] or '0',0)) if isinstance(base,int) else None
        if (op,args) in [('str','x8, [x20, #0x18]'),('stp','x21, x8, [x20, #0x10]')]:
            packed = registers['x8']
            table.append({'symbols':registers['x22' if op == 'str' else 'x21'],'multiplier':struct.unpack('<f',struct.pack('<I',packed & 0xffffffff))[0],'group':packed >> 32})
    expected = [('AAA',20,1),('BBB',18,1),('CCC',15,1),('DDD',12,2),('EEE',10,2),('FFF',8,2),('ABC',6,4),('FED',3,4)]
    assert [(r['symbols'],r['multiplier'],r['group']) for r in table] == expected
    pairs = {}
    for symbol in 'ABC':
        instructions = methods['pair'+symbol]['instructions']
        packed = next(int(i['args'].split('#')[-1],0) for i in instructions if i['op']=='mov' and i['args'].startswith('x8, #'))
        assert any(i['op']=='movk' and i['args']=='x8, #3, lsl #32' for i in instructions)
        pairs[symbol] = struct.unpack('<f',struct.pack('<I',packed))[0]
    assert pairs == {'A':5,'B':4,'C':3}
    weights = [struct.unpack('<f',read(v,4))[0] for v in [0xfaf198,0xfa8830,0xfa7f30,0xfad044]]
    assert weights == [struct.unpack('<f',struct.pack('<f',v))[0] for v in [.04,.06,.6,.3]]
    chance = struct.unpack('<d',read(0xfbc448,8))[0]
    assert chance == struct.unpack('<f',struct.pack('<f',.15))[0]
    assert any(i['op']=='b.mi' for i in methods['result']['instructions'])
    assert all(any(i['op']=='fsub' and i['args']==args for i in methods['settle']['instructions']) for args in ['s0, s0, s1','s1, s2, s1'])
print(json.dumps({'binarySha256':hashlib.sha256(binary.read_bytes()).hexdigest(),'metadataSha256':hashlib.sha256(metadata).hexdigest(),'table':table,'pairMultipliers':pairs,'weights':weights,'winChance':chance,'netRule':'stake * multiplier minus stake; float/safe-money and RNG differ on web','methods':methods},indent=2))
