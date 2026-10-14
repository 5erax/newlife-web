"""Verify the provided APK's Craps table and settlement statically."""
from pathlib import Path
import hashlib, json, struct, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
from elftools.elf.elffile import ELFFile
root = Path(sys.argv[1]).resolve()
binary = root / 'libil2cpp.so'
assert hashlib.sha256(binary.read_bytes()).hexdigest() == 'facc89b9e6dd241230e5e4d5cc32786a55a6330975556d663d0e16ef31e5e604'
assert hashlib.sha256((root/'global-metadata.dat').read_bytes()).hexdigest() == '7bd1a0ddb9e1ac0b94bf23f43e5b821196a4eac25e968aaf01fec5b5e2409ac1'
methods = {}
with binary.open('rb') as file:
    segments = [s for s in ELFFile(file).iter_segments() if s['p_type'] == 'PT_LOAD']
    def read(virtual, size):
        segment = next(s for s in segments if s['p_vaddr'] <= virtual and virtual+size <= s['p_vaddr']+s['p_filesz'])
        file.seek(segment['p_offset']+virtual-segment['p_vaddr'])
        return file.read(size)
    for name, offset, size in [('calibration',0x2adabe8,8),('classify',0x2dc4470,0x4c),('settle',0x2dc55b0,0x194),('flow',0x2dc4cbc,0x3c8),('faces',0x2dc3fe4,0x48c),('button',0x2dc54a8,0x108)]:
        segment = next(s for s in segments if s['p_offset']<=offset and offset+size<=s['p_offset']+s['p_filesz'])
        virtual = segment['p_vaddr']+offset-segment['p_offset']
        code = read(virtual,size)
        ins = list(Cs(CS_ARCH_ARM64,CS_MODE_ARM).disasm(code,virtual))
        assert sum(i.size for i in ins)==size
        methods[name] = {'offset':hex(offset),'sha256':hashlib.sha256(code).hexdigest(),'instructions':[{'address':hex(i.address),'op':i.mnemonic,'args':i.op_str} for i in ins]}
    def span(name,start,expected):
        ins={int(i['address'],16):(i['op'],i['args']) for i in methods[name]['instructions']}
        assert [ins[start+4*n] for n in range(len(expected))]==expected,(name,hex(start))
    span('calibration',0x2adabe8+0x4000,[('ldr','d0, [x0, #0x30]'),('ret','')])
    span('classify',0x2dc8498,[('sub','w8, w8, #2'),('cmp','w8, #0xa'),('b.hi','#0x2dc84b4'),('adrp','x9, #0xfc3000'),('add','x9, x9, #0xcb0'),('ldr','w0, [x9, w8, uxtw #2]'),('ret','')])
    table=struct.unpack('<11i',read(0xfc3cb0,44))
    assert table==(1,1,2,2,2,0,2,2,2,0,1)
    span('settle',0x2dc9610,[('cmp','w8, #0xb'),('ccmp','w8, #7, #4, ne'),('b.ne','#0x2dc9650')])
    span('settle',0x2dc962c,[('ldr','s0, [x8, #0x10]'),('ldrb','w9, [x19, #0xa0]'),('str','s0, [x8, #0x14]')])
    span('settle',0x2dc9660,[('ldr','s0, [x8, #0x10]'),('fneg','s0, s0'),('str','s0, [x8, #0x14]')])
    span('faces',0x2dc80e0,[('mov','w0, #1'),('mov','w1, #7'),('mov','x2, xzr'),('mov','w23, #1'),('bl','#0x2e0b54c'),('mov','w21, w0'),('mov','w0, #1'),('mov','w1, #7'),('mov','x2, xzr'),('bl','#0x2e0b54c')])
    span('flow',0x2dc8f58,[('mov','w8, #1'),('strb','w8, [x19, #0xa0]')])
fixtures=[]
for a in range(1,7):
    for b in range(1,7):
        result=table[a+b-2]
        assert result==(0 if a+b in [7,11] else 1 if a+b in [2,3,12] else 2)
        fixtures.append({'dice':[a,b],'result':['win','lose','reroll'][result],'netMultiplier':1 if result==0 else -1 if result==1 else None})
print(json.dumps({'scope':'36 verified Craps outcomes and signed payouts; web automatically rerolls intermediates with seeded RNG and HouseWinRate0 policy, not native UI/RNG/casino ownership parity.', 'tableVirtual':'0xfc3cb0','table':table,'fixtures':fixtures,'methods':methods},indent=2))
