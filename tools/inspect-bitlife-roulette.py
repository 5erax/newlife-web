"""Read selected ARM64 methods; never load or execute the APK/DLL."""
from pathlib import Path
import hashlib,json,re,struct,sys
import dnfile
from capstone import Cs,CS_ARCH_ARM64,CS_MODE_ARM
from elftools.elf.elffile import ELFFile

root=Path(sys.argv[1]).resolve()
assembly=dnfile.dnPE(str(root/'cpp2il-addresses/Assembly-CSharp.dll'),clr_lazy_load=True)
strings=assembly.net.metadata.streams[b'#Strings']
blobs=assembly.net.metadata.streams[b'#Blob']
types=assembly.net.mdtables.TypeDef.rows
methods=assembly.net.mdtables.MethodDef.rows
targets={}
for i,t in enumerate(types):
 name=str(strings.get(t.struct.TypeName_StringIndex))
 if name in ['RouletteUtils','MiniGameRoulette','SimStock']:
  end=types[i+1].struct.MethodList_Index if i+1<len(types) else len(methods)+1
  for index in range(t.struct.MethodList_Index,end):
   method=str(strings.get(methods[index-1].struct.Name_StringIndex))
   if method in ['ColorForNumber','GetRandomNumber','MultiplierForBetType','CalculateEarnings','OnSpinDone','get_CurrentStockPrice']:
    targets[index]=(name,method)
binary=root/'libil2cpp.so'
with binary.open('rb') as file:
 elf=ELFFile(file);segments=list(elf.iter_segments());decoder=Cs(CS_ARCH_ARM64,CS_MODE_ARM)
 evidence=[]
 for attr in assembly.net.mdtables.CustomAttribute.rows:
  parent=attr.struct.Parent_CodedIndex
  if parent&31 or parent>>5 not in targets:continue
  raw=blobs.get(attr.struct.Value_BlobIndex).value
  if b'RVA' not in raw:continue
  values=re.findall(rb'0x[0-9a-fA-F]+',raw)
  assert len(values)==3
  offset,size=int(values[1],16),int(values[2],16)
  segment=next(s for s in segments if s['p_type']=='PT_LOAD' and s['p_offset']<=offset<s['p_offset']+s['p_filesz'])
  assert 0<size<1000000 and offset+size<=segment['p_offset']+segment['p_filesz']
  virtual=segment['p_vaddr']+offset-segment['p_offset']
  file.seek(offset);code=file.read(size)
  instructions=[{'address':hex(i.address),'op':i.mnemonic,'args':i.op_str} for i in decoder.disasm(code,virtual)]
  kind,method=targets[parent>>5]
  evidence.append({'type':kind,'method':method,'fileOffset':hex(offset),'virtualAddress':hex(virtual),'length':size,'sha256':hashlib.sha256(code).hexdigest(),'instructions':instructions})
 price=next(e for e in evidence if e['method']=='get_CurrentStockPrice')
 assert [(i['op'],i['args']) for i in price['instructions']]==[('ldr','d0, [x0, #0x30]'),('ret','')], 'Wrong raw/virtual mapping; do not infer rules'
 file.seek(0xfc3ec8);multipliers=struct.unpack('<iii',file.read(12))
 assert multipliers==(13,1,13)
 assert len(evidence)==6, 'Missing method evidence'
 draw=next(e for e in evidence if e['method']=='GetRandomNumber')['instructions']
 assert [(i['op'],i['args']) for i in draw[:3]]==[('mov','w0, wzr'),('mov','w1, #0xd'),('mov','x2, xzr')]
 settled=next(e for e in evidence if e['method']=='OnSpinDone')['instructions']
 assert any(i['op']=='fneg' for i in settled) and any(i['op']=='fadd' for i in settled)
report={'binarySha256':hashlib.sha256(binary.read_bytes()).hexdigest(),'metadataSha256':hashlib.sha256((root/'global-metadata.dat').read_bytes()).hexdigest(),'mapping':'Use injected Offset as raw file offset; translate through ELF PT_LOAD for instruction addresses. Calibrated against SimStock price getter offset0x30/ret.','roulette':{'numbers':list(range(13)),'colors':'odd red, even black, zero none','netMultipliers':{'number':13,'color':1,'zero':13},'lossMultiplier':-1,'multiplierTableVirtual':'0xfc3ec8'},'methods':evidence}
print(json.dumps(report,indent=2))
