from pathlib import Path
import json,re,math,collections
import sys
if len(sys.argv)!=2:raise SystemExit('Usage: python tools/import-bitlife-content.py ANALYSIS_DIRECTORY')
p=Path(sys.argv[1]).resolve()
repo=Path(__file__).resolve().parents[1]
tables=json.loads((p/'normalized-tables.json').read_text(encoding='utf8'))
tr=dict(json.loads(x) for x in (p/'translations.jsonl').read_text(encoding='utf8').splitlines())
missing=set()
anomalies=[]

def impact(table,record,field,raw):
 if not re.fullmatch(r'[+-]?\d+',raw.strip()):
  # shortcut: malformed source impacts stay neutral and are recorded; replace only with verified native evidence.
  anomalies.append({'table':table,'record':record,'field':field,'raw':raw,'webValue':0,'status':'unverified_native_neutral_web_override'})
  return 0
 return int(raw)
overrides={'Turkey Sexer':'Nhân viên phân loại giới tính gà tây','Junior Sexer, Mid-Level Sexer, Chief Sexer':'Nhân viên mới, Nhân viên chính, Trưởng bộ phận','The family fallouts':'Những bất hòa trong gia đình','The cunning comb over':'Kiểu chải tóc khéo che chỗ hói','Go to the gym more':'Tập thể dục thường xuyên hơn','Read more books':'Đọc nhiều sách hơn','Commit more crimes':'Phạm tội nhiều hơn','Resolutions are silly':'Đặt mục tiêu đầu năm thật ngớ ngẩn','The fluffer at work has failed to show up for her fluffing shift.':'Một nhân viên hỗ trợ tại phim trường người lớn đã vắng mặt trong ca làm.'}
def translate(s):
 if not s:return ''
 def prose(x):
  term=x.strip()
  if not term:return x
  if term not in tr and term not in overrides:missing.add(term);return term
  return x[:len(x)-len(x.lstrip())]+overrides.get(term,tr.get(term,''))+x[len(x.rstrip()):]
 out=[]
 for seg in re.split(r'(<[^<>]+>)',s):
  if seg.startswith('<') and seg.endswith('>'):
   inner=seg[1:-1]
   out.append('<pronoun>' if inner.lower() in ['he/she','him/her','his/her','himself/herself'] else '<'+'/'.join(prose(x) for x in inner.split('/'))+'>' if '/' in inner else seg)
  else:out.append(prose(seg))
 value=''.join(out)
 value=re.sub(r'\\u([0-9a-fA-F]{4})',lambda m:chr(int(m[1],16)),value)
 return value.replace('\\n','\n').strip()

overrides.update({"I can't pick just one color":"Tôi không thể chọn chỉ một màu", "I don't know anything about that":"Tôi không biết gì về chuyện đó", "I don't watch that show":"Tôi không xem chương trình đó", "I'd rather not say":"Tôi xin phép không trả lời", "I've never watched 'Star Wars'":"Tôi chưa từng xem Chiến tranh giữa các vì sao", "I've never watched that show":"Tôi chưa từng xem chương trình đó", "None: superheroes are ridiculous":"Không ai cả: siêu anh hùng thật ngớ ngẩn", "There is nothing I can't live without":"Không có thứ gì mà tôi không thể sống thiếu", "What are you talking about?":"Bạn đang nói về chuyện gì vậy?"})
def num(s,default=0):
 try:return int(float(s))
 except (ValueError,TypeError):return default
def dollars(s):return round(float(re.sub(r'[^0-9.]','',s) or 0)*1000)
def get(name):return next(t for t in tables if t['name']==name)
staged={}
def save(file,data):staged[file]=data
degrees={'None':'','':'','High School':'edu_upper_secondary','Community College':'edu_college','Undergraduate':'edu_university','Graduate':'edu_postgraduate','Medical':'edu_medical','Dental':'apk_edu_dental','Law':'apk_edu_law','Nursing':'apk_edu_nursing','Pharmacy':'apk_edu_pharmacy','Veterinary':'apk_edu_veterinary'}
majors={'Journalism':'Báo chí','Computer Science':'Khoa học máy tính','Information Systems':'Hệ thống thông tin','Math':'Toán học','Finance':'Tài chính','Accounting':'Kế toán','Economics':'Kinh tế','Graphic Design':'Thiết kế đồ họa','Archaeology':'Khảo cổ học','Architecture':'Kiến trúc','Anthropology':'Nhân học','History':'Lịch sử','Art History':'Lịch sử nghệ thuật','Chemistry':'Hóa học','Biology':'Sinh học','Engineering':'Kỹ thuật','Criminal Justice':'Tư pháp hình sự','Physics':'Vật lý','Political Science':'Khoa học chính trị','Communications':'Truyền thông','Marketing':'Tiếp thị','Philosophy':'Triết học','Psychology':'Tâm lý học','Nursing':'Điều dưỡng','Education':'Giáo dục','Dance':'Múa','English':'Ngôn ngữ Anh','Music':'Âm nhạc'}
major_id=lambda x:'apk_major_'+re.sub(r'[^a-z0-9]+','_',x.lower()).strip('_')
save('majors.vi.json',[{'id':major_id(k),'name':v} for k,v in majors.items()])
jobs=[];jobIds={}
for index,r in enumerate(get('a16_careers-enc')['rows']):
 jid='apk_job_'+str(index+1);jobIds[r['Career']]=jid
 ranks=translate(r['Seniority Track']).split(',')
 if not r['Seniority Track']:ranks=[translate(r['Career'])]
 if len(ranks)!=len(r['Seniority Track'].split(',')) and r['Seniority Track']:
  # Preserve the source rank boundaries even if the translator changed punctuation.
  ranks=[translate(r['Career'])+' · Bậc '+str(i+1) for i in range(len(r['Seniority Track'].split(',')))]
 low=dollars(r['Starting Salary']);high=max(low,dollars(r['Salary Cap']));years=num(r['Seniority Track Years'])
 adult=bool(re.search('Porn|Escort|Stripper|Exotic Dancer|Nude Art Model',r['Career']))
 req={'gender':r['Gender'] or 'any','maxAge':num(r['Max Age'],150),'workYears':num(r['Required Working Years']),'majors':[major_id(x.strip()) for x in r['Required Major'].split(',') if x.strip()], 'karma':num(r['Min Karma']),'driving':bool(r['Requires Driving License']),'pilot':bool(r['Requires Pilots License']),'vehicle':bool(r['Requires Vehicle']),'celibacy':bool(r['Requires Celibacy']), 'unavailable':bool(r['Unavailable'])}
 company=r['Company Type'];industry=('yte' if company in ['Hospital','Medical Office','Dental Office','Veterinary Clinic','Mental Health Center'] else 'giaoduc' if 'School' in company or 'University' in company else 'congnghe' if company=='App Developer' else 'kinhdoanh' if company in ['Corporate','Bank','Stock Exchange','Insurance Agency','Real Estate'] else 'nghethuat' if company in ['Film Studio','Adult Film Studio','Record Label','Model Agency','Publisher','Television','Circus','Orchestra','Dance Company'] else 'nongnghiep' if company in ['Farm','Fishery'] else 'phapluat' if company in ['Law Firm','Police Department'] else 'dichvu')
 jobs.append({'id':jid,'name':translate(r['Career']),'industry':industry,'minAge':max(num(r['Min Age'],16),18 if adult else 0),'degree':degrees[r['Required Education']],'minIntelligence':num(r['Min Intelligence']),'minHealth':num(r['Min Health']),'minLooks':num(r['Min Appearance']),'noRecord':bool(r['Requires Clear Criminal Record']),'ranks':[{'name':n.strip(),'salary':round(low+(high-low)*i/max(1,len(ranks)-1)),'minYears':round(years*i/max(1,len(ranks)-1))} for i,n in enumerate(ranks)],'retireAge':max(40,num(r['Too Old Age'],65)),'duties':['Hoàn thành nhiệm vụ','Trau dồi chuyên môn','Hợp tác cùng đồng nghiệp'],'sourceKind':'apk_translation','apkRequirements':req})
job_titles='''Nhân viên phân loại giới tính gà tây|Người thử bánh bí ngô|Thần tài|Yêu tinh|Thỏ Phục sinh|Ma cà rồng|Phù thủy|Xác sống|Người hành hương|Tiên rừng|Ông già Noel|Diễn viên|Ca sĩ|DJ|Người mẫu|Diễn viên phim người lớn|Nhà văn|Phóng viên|Ảo thuật gia|Đầu bếp|Lập trình viên ứng dụng|Kế toán viên|Họa sĩ hoạt hình|Nhà khảo cổ học|Kiến trúc sư|Nhân viên phòng tranh|Thợ sửa ô tô|Nhân viên hành lý|Nhân viên ngân hàng|Người nuôi ong|Chuyên viên công nghệ sinh học|Bác sĩ phẫu thuật não|Tài xế xe buýt|Chuyên viên phân tích kinh doanh|Thợ thịt|Thu ngân|Kỹ sư hóa học|Thợ quét ống khói|Chuyên viên trị liệu cột sống|Lập trình viên|Công nhân xây dựng|Quản trị viên cơ sở dữ liệu|Chuyên viên vệ sinh răng miệng|Nha sĩ|Thám tử|Tài xế|Thợ điện|Nhà khoa học môi trường|Công nhân nhà máy|Bác sĩ gia đình|Nông dân|Nhân viên thức ăn nhanh|Cố vấn tài chính|Chuyên viên phân tích tài chính|Lính cứu hỏa|Ngư dân|Tiếp viên hàng không|Chuyên viên pháp y|Nhà thiết kế đồ họa|Nhân viên tạp hóa|Giáo viên lịch sử|Nhân viên bảo hiểm|Nhà thiết kế nội thất|Kiểm toán viên nội bộ|Thẩm phán|Luật sư|Thủ thư|Người vận động hành lang|Thợ rừng|Nhân viên bưu điện|Nhà sinh học biển|Chuyên viên tư vấn hôn nhân|Chuyên viên mát xa|Kỹ sư cơ khí|Nhà vi sinh vật học|Hộ sinh|Tu sĩ|Nhân viên tang lễ|Nhân viên bảo tàng|Nữ tu|Điều dưỡng viên|Chuyên viên phân tích vận hành|Thợ sơn|Trợ lý pháp lý|Người chăm sóc thú cưng|Dược sĩ|Chuyên viên vật lý trị liệu|Phi công|Thợ ống nước|Cảnh sát|Chuyên viên phân tích chính sách|Linh mục|Bác sĩ tâm thần|Môi giới bất động sản|Lễ tân|Nhân viên bán lẻ|Quản lý trường học|Chuyên viên tâm lý học đường|Giáo viên|Nhân viên bảo vệ|Môi giới chứng khoán|Thợ may|Chuyên viên hỗ trợ kỹ thuật|Nhân viên tiếp thị qua điện thoại|Biên dịch viên|Nhân viên du lịch|Tài xế xe tải|Bác sĩ thú y|Nhân viên thu gom rác|Giáo sư|Trưởng khoa|Nhà thiết kế thời trang|Thợ kim hoàn|Thợ mộc|Nhân viên sòng bạc|Thám tử tư|Thợ làm bánh|Nài ngựa|Chuyên viên tổ chức đám cưới|Thợ làm móng|Nhân viên pha chế|Bảo vệ hộp đêm|Quay phim viên|Chuyên viên hành vi mèo|Biên đạo múa|Nghệ sĩ xiếc|Nghệ sĩ hề|Ngư dân đánh bắt cua|Giáo viên khiêu vũ|Vũ công|Biên tập viên|Người đồng hành dịch vụ|Người trừ tà|Vũ công biểu diễn người lớn|Thợ làm tóc|Nhân viên dọn phòng|Nhân viên vệ sinh|Người làm cảnh quan|Chuyên viên trang điểm|Vũ công thoát y nam|Người nấu rượu lậu|Nhà soạn nhạc|Người mẫu khỏa thân|Nhạc công dàn nhạc|Nhiếp ảnh gia|Nhân viên vệ sinh phim trường người lớn|Nhà nghiên cứu phim người lớn|Nhân viên hút bể vệ sinh di động|Nghệ sĩ múa rối|Nhân viên nhà hàng|Nhân viên thu dọn xác động vật trên đường|Nhà điêu khắc|Diễn viên đóng thế|Người thử cầu trượt nước|Người thu gom giun|Thợ rèn|Bác sĩ phẫu thuật thẩm mỹ|Nhà thiết kế bối cảnh|Người khóc thuê|Nhà ngoại cảm|Nhân viên thu hồi nợ|Ông già Noel ở trung tâm thương mại|Người chăm sóc tuần lộc|Huấn luyện viên cá nhân|Chuyên viên rượu vang|Khách hàng bí mật|Quản lý quan hệ công chúng|Bảo vệ trung tâm thương mại'''.split('|')
assert len(job_titles)==len(jobs)==168
for i,j in enumerate(jobs):
 j['name']=job_titles[i]
 if i in range(2,11):j['apkRequirements']['unavailable']=True
jobs[2]['name']='Thần tình yêu'
explicit_ranks={
1:'Nhân viên phân loại mới|Nhân viên phân loại chính|Trưởng bộ phận phân loại',
2:'Người thử bánh|Người nếm bánh|Chuyên gia thưởng thức bánh',3:'Thần tình yêu|Thánh Valentine',6:'Ma cà rồng|Dracula',7:'Phù thủy|Phù thủy hắc ám',
12:'Diễn viên lồng tiếng|Diễn viên|Diễn viên chính',13:'Ca sĩ hát bè|Ca sĩ phòng trà|Ca sĩ|Ca sĩ chính',
15:'Người mẫu bàn chân|Người mẫu bàn tay|Người mẫu ảnh quảng cáo|Người mẫu nội y|Người mẫu sàn diễn',
16:'Biên kịch phim người lớn|Quay phim viên phim người lớn|Diễn viên phim người lớn',
20:'Phụ bếp|Đầu bếp món nhanh|Đầu bếp tập sự|Đầu bếp luân phiên|Đầu bếp món nguội|Bếp phó tập sự|Đầu bếp nước sốt|Bếp phó|Bếp trưởng|Bếp trưởng điều hành',
21:'Kiểm thử viên ứng dụng|Lập trình viên ứng dụng tập sự|Lập trình viên ứng dụng|Lập trình viên ứng dụng cao cấp|Nhà thiết kế ứng dụng',
26:'Nhân viên phòng tranh|Nhân viên bảo quản tranh|Trợ lý giám tuyển|Giám tuyển|Giám đốc phòng tranh',
37:'Kỹ sư bậc I|Kỹ sư bậc II|Kỹ sư bậc III|Phó quản lý kỹ thuật|Quản lý kỹ thuật|Giám đốc kỹ thuật|Phó chủ tịch kỹ thuật',
52:'Nhân viên phục vụ|Quản lý ca|Quản lý nhà hàng|Tổng quản lý',
55:'Lính cứu hỏa tập sự|Lính cứu hỏa|Nhân viên vận hành thiết bị chữa cháy|Trung úy|Đại úy|Tiểu đoàn trưởng|Phó chỉ huy|Chỉ huy cứu hỏa',
57:'Tiếp viên tập sự|Tiếp viên hàng không|Tiếp viên cao cấp|Trưởng tiếp viên',
58:'Chuyên viên phân tích hiện trường|Kỹ thuật viên hiện trường|Điều tra viên pháp y',
65:'Thẩm phán cơ sở|Thẩm phán tòa sơ thẩm|Thẩm phán tòa khu vực|Phó chánh án|Chánh án',
66:'Thư ký pháp lý|Luật sư cộng sự tập sự|Luật sư cộng sự|Thành viên góp vốn mới|Thành viên góp vốn',
67:'Nhân viên thư viện|Trợ lý thư viện|Thủ thư|Thủ thư cao cấp',
78:'Nhân viên tang lễ|Chuyên viên bảo quản thi hài cao cấp|Giám đốc nhà tang lễ',
79:'Hướng dẫn viên bảo tàng|Nhân viên triển lãm|Trợ lý giám tuyển|Giám tuyển|Giám đốc bảo tàng',
81:'Điều dưỡng viên cơ sở|Điều dưỡng viên lâm sàng|Điều dưỡng viên thực hành nâng cao|Chuyên gia điều dưỡng lâm sàng',
84:'Thư ký pháp lý|Quản lý hồ sơ pháp lý|Trợ lý pháp lý',
88:'Phi công tập sự|Cơ phó|Phi công|Cơ trưởng|Phi công trưởng',
90:'Học viên cảnh sát|Cảnh sát tuần tra|Cảnh sát giao thông|Hạ sĩ|Trung sĩ|Thanh tra|Trung úy|Cảnh sát trưởng',
92:'Phó tế|Linh mục|Giám mục|Tổng giám mục|Hồng y',
97:'Phó hiệu trưởng|Hiệu trưởng|Phó giám đốc học khu|Giám đốc học khu',
103:'Chuyên viên hỗ trợ công nghệ tập sự|Chuyên viên hỗ trợ công nghệ|Chuyên viên hỗ trợ công nghệ cao cấp',
106:'Nhân viên du lịch|Điều hành chuyến du lịch|Tổng quản lý|Quản lý vùng|Người điều hành đại lý',
110:'Giáo sư',113:'Nhân viên bán hàng|Phó quản lý cửa hàng|Quản lý cửa hàng',
115:'Nhân viên chia bài|Giám sát sàn|Quản lý bàn chơi|Phó quản lý sòng bạc|Quản lý sòng bạc',
128:'Thủy thủ tập sự|Thủy thủ boong|Trưởng boong|Kỹ sư tàu|Thuyền trưởng',
129:'Trợ giảng khiêu vũ|Giáo viên khiêu vũ|Giám đốc khiêu vũ',
131:'Biên tập viên tập sự|Biên tập viên|Biên tập viên cao cấp|Tổng biên tập',
144:'Nhạc công kẻng tam giác|Nhạc công vĩ cầm|Nhạc công vĩ cầm chính|Ca sĩ nhạc kịch|Nhạc trưởng|Nhạc trưởng chính|Bậc thầy chỉ huy',
150:'Nhân viên rửa bát|Nhân viên dọn bàn|Nhân viên đón khách|Nhân viên mang món|Nhân viên phục vụ|Trưởng phục vụ|Điều phối ra món|Phó quản lý|Tổng quản lý',
158:'Nhân viên trang trí bối cảnh|Trợ lý thiết kế bối cảnh|Nhà thiết kế bối cảnh|Quản lý bối cảnh|Giám đốc bối cảnh',
159:'Người viếng thầm lặng|Chuyên viên khóc thuê|Trưởng nhóm khóc thuê',
160:'Người xem chỉ tay|Chuyên viên bài tiên tri|Người gọi hồn|Chuyên viên tư vấn trực giác|Nhà tiên tri',
163:'Người chăm sóc tập sự|Người chăm sóc có kinh nghiệm|Trưởng nhóm chăm sóc',
165:'Chuyên viên rượu vang nhập môn|Chuyên viên rượu vang được chứng nhận|Chuyên viên rượu vang cao cấp|Bậc thầy rượu vang',
167:'Trợ lý quan hệ công chúng|Chuyên viên quan hệ công chúng|Quản lý khách hàng truyền thông|Giám đốc truyền thông',
}
explicit_ranks[74]=explicit_ranks[37]
for i,(j,r) in enumerate(zip(jobs,get('a16_careers-enc')['rows']),1):
 track=r['Seniority Track']
 if track in ['', 'None']:labels=[j['name']]
 elif track in ['Abbreviated','Working Class','Corporate']:labels=[j['name']+' tập sự',j['name'],j['name']+' cao cấp']
 else:
  assert i in explicit_ranks,(i,track)
  labels=explicit_ranks[i].split('|')
  assert len(labels)==len(track.split(',')),(i,track)
 low=dollars(r['Starting Salary']);high=max(low,dollars(r['Salary Cap']));years=num(r['Seniority Track Years'])
 j['ranks']=[{'name':label,'salary':round(low+(high-low)*n/max(1,len(labels)-1)),'minYears':round(years*n/max(1,len(labels)-1))} for n,label in enumerate(labels)]
save('jobs.vi.json',jobs)
save('education.vi.json',[{'id':'apk_edu_'+k,'name':v,'minAge':18,'years':years,'cost':cost,'requires':['edu_upper_secondary'],'minScore':score,'specialty':True,'sourceKind':'apk_translation'} for k,v,years,cost,score in [('dental','Nha khoa',6,28000000,75),('law','Luật',4,20000000,60),('nursing','Điều dưỡng',4,18000000,60),('pharmacy','Dược',5,24000000,70),('veterinary','Thú y',5,24000000,65)]])
core=['universal','calendar','career','friend','holiday','orphan','prison'];events=[];deferred=[];source_rows=[];seen_ids=set()
trips={'vacation':'a16_dumb-scenarios-vacation-enc','camp':'a16_outdoor-camping-dumb-scenario-enc','hike':'a16_outdoor-hiking-dumb-scenario-enc'}
for group in core+list(trips):
 t=get(trips[group] if group in trips else 'a16_dumb-scenarios-'+group+'-enc')
 for row,r in enumerate(t['rows']):
  index=r.get('Index') or str(row+1);eid='apk_'+group+'_'+index
  if eid in seen_ids:eid+='_record_'+str(row+1)
  seen_ids.add(eid)
  alltext=' '.join(v for k,v in r.items() if k in ['Body','Scenario','Title','CTA'] or re.match(r'^(Choice|Narrative) \d+$',k))
  tags=set(re.findall(r'<([^<>/]+)>',alltext))
  req={'gender':r.get('Hero Gender','') or 'any','student':bool(r.get('Student')) or bool(tags&{'teacher','classmate'}),'job':bool(r.get('Job')) or bool(tags&{'coworker','co-worker'}),'parents':bool(r.get('Both Parents Alive')),'lover':bool(r.get('Hero Has Lover')) or any(x.startswith('lover') for x in tags),'noLover':bool(r.get("Hero Doesn't Have Lover")),'loverGender':r.get('Lover Gender','') or 'any','parent':any(x.startswith('parent') for x in tags),'friend':group=='friend' or any(x.startswith('friend') for x in tags),'orphan':group=='orphan','prison':group=='prison','careerId':jobIds.get(r.get('Type',''),'') if group=='career' else ''}
  blocked=[]
  if group in trips:
   req['trip']='cruise' if r.get('Type')=='Cruise' else group
   if r.get('Requires Companion'):
    companion_types={'Friend':'friend','Family Member':'family','Lover':'lover','Dog':'dog','Pet':'pet'}
    req['companions']=[companion_types[x.strip()] for x in r['Companion Type'].split(',')]
   if tags & {'pet',' pet'} and not r.get('Requires Companion'):req['companions']=['pet']
  if r.get('Vampire') or r.get('Royal'):blocked.append('Cần xác minh bộ lọc ma cà rồng/hoàng gia của engine gốc')
  if group=='career' and not req['careerId']:blocked.append('Nghề đặc biệt chưa có trong engine web')
  if group=='friend':
   if r.get('Friend Min Craziness'):req['friendMinCraziness']=num(r['Friend Min Craziness'])
   for native,field in [('Friend Has Job','friendJob'),('Friend Is Student','friendStudent'),('Friend Has Child','friendChild'),('Friend Is Married','friendMarried'),('Friend Is Enemy','friendEnemy')]:
    if r.get(native):req[field]=True
  if group=='friend':req.update(friendMinAge=num(r.get('Friend Min Age'),0),friendMaxAge=num(r.get('Friend Max Age'),200),friendGender=r.get('Friend Gender','') or 'any')
  if blocked:deferred.append({'id':eid,'table':t['name'],'row':index,'reasons':blocked});continue
  choices=[]
  for n in range(1,7):
   if not r.get('Choice '+str(n)):continue
   effects=[]
   for native,dest in [('Appearance','looks'),('Happiness','happiness'),('Intelligence','intelligence'),('Health','health'),('Smarts','intelligence'),('Enjoyment','happiness')]:
    if r.get(native+' Impact '+str(n)):effects.append({'stat':dest,'delta':impact(t['name'],row+1,native+' Impact '+str(n),r[native+' Impact '+str(n)])})
   for native in ['Karma','Discipline','Behavior','Respect','Job','Friend']:
    if r.get(native+' Impact '+str(n)):effects.append({'apkAttribute':native.lower(),'delta':impact(t['name'],row+1,native+' Impact '+str(n),r[native+' Impact '+str(n)])})
   narrative=translate(r.get('Narrative '+str(n),'')).strip() or 'Bạn đã ghi lại lựa chọn của mình.'
   choices.append({'id':eid+'_c'+str(n),'label':translate(r['Choice '+str(n)]),'outcomes':[{'chance':1,'text':narrative,'effects':effects}]})
  assert choices,(eid,'no choices')
  events.append({'id':eid,'group':'manual' if group in trips else 'apk_'+group,'minAge':num(r.get('Hero Min Age'),18 if group in ['career','vacation'] else 0),'maxAge':num(r.get('Hero Max Age'),120),'weight':1,'once':False,'cooldownYears':5,'maxOccurrences':24,'conditions':[],'text':'\n\n'.join(translate(r.get(k,'')) for k in ['Title','Body','Scenario','CTA'] if r.get(k)), 'choices':choices,'sourceKind':'apk_translation','apkRequirements':req})
  source_rows.append({'id':eid,'table':t['name'],'index':index,'record':row+1})
for e in events:
 r=e['apkRequirements']
 for k in ['gender','loverGender','friendGender']:
  if r.get(k)=='both':r[k]='any'
save('events.vi.json',events)
coins=[{'id':'apk_coin_'+r['Symbol'].lower(),'name':r['Name'],'ticker':r['Symbol'],'group':'crypto','initialPrice':1000*10**(num(r['Expense Score'])-1),'risk':95,'liquidity':0.25,'yieldRate':0,'termYears':0,'expenseScore':num(r['Expense Score']),'winnerScore':num(r['Winner Score'])} for r in get('a16_financial-cryptocurrencies-enc')['rows']]
save('coins.json',coins)
stock_table=get('a16_financial-universal-stocks-enc')
stocks=[]
# shortcut: stock pricing, risk and returns use the web model until native market formulas are verified.
for row,r in enumerate(stock_table['rows'],1):
 lo,hi=num(r['Min Price']),num(r['Max Price'])
 assert 0<lo<=hi
 stocks.append({'id':'apk_stock_'+r['Symbol'].lower(),'name':r['Name'],'ticker':r['Symbol'],'group':'stock','sector':r['Sector'],'minPriceUSD':lo,'maxPriceUSD':hi,'winnerScore':num(r['Winner Score']),'ownershipCap':num(r['Hero Ownership Cap']) if r['Hero Ownership Cap'] else None,'initialPrice':(lo+hi)*500,'risk':50,'liquidity':0.9,'yieldRate':0.01,'termYears':0,'source':{'table':stock_table['name'],'record':row}})
assert len({s['id'] for s in stocks})==len(stocks)==107
save('stocks.json',stocks)
interview_table=get('a16_interview-questions-enc')
interviews=[]
for row,r in enumerate(interview_table['rows'],1):
 iid='apk_interview_'+str(row)
 def answer(field,score,aid):
  value=num(r.get(score))
  assert 1<=value<=5,(iid,field,score)
  return {'id':aid,'label':translate(r[field]),'score':value}
 answers=[answer('Choice '+str(n),'Choice '+str(n)+' Score',iid+'_a'+str(n)) for n in range(1,21) if r.get('Choice '+str(n))]
 default=answer('Default Choice','Default Choice Score',iid+'_default') if r.get('Default Choice') else None
 assert len(answers)>=3
 interviews.append({'id':iid,'question':translate(r['Question']),'cta':translate(r['CTA']),'commonness':num(r['Commonness Score']),'answers':answers,'defaultAnswer':default,'source':{'table':interview_table['name'],'record':row}})
save('interviews.vi.json',interviews)
coverage={'apkSha256':'8c1248cb94a7e8cfb4fa8cc6ca2f7886e7cbe8dd318d7ef2abc6b428ab469234','package':'com.candywriter.bitlife','version':'3.25','decodedTables':len(tables),'rawRows':sum(len(t['rows']) for t in tables),'choiceTables':len([t for t in tables if 'Choice 1' in t['fields']]),'choiceRows':sum(len(t['rows']) for t in tables if 'Choice 1' in t['fields']),'coreRows':sum(len(get('a16_dumb-scenarios-'+g+'-enc')['rows']) for g in core),'playableEvents':len(events),'careerRows':len(jobs),'cryptoRows':len(coins),'deferredCore':deferred,'otherChoiceTables':[{'table':t['name'],'rows':len(t['rows']),'status':'native_logic_pending'} for t in tables if 'Choice 1' in t['fields'] and t['name'] not in ['a16_dumb-scenarios-'+g+'-enc' for g in core]]}
save('coverage.json',coverage)
coverage['tripRows']=sum(len(get(n)['rows']) for n in trips.values())
coverage['friendRows']=len(get('a16_dumb-scenarios-friend-enc')['rows'])
coverage['interviewRows']=len(interviews)
coverage['interviewAnswers']=sum(len(q['answers'])+bool(q['defaultAnswer']) for q in interviews)
coverage['stockRows']=len(stocks)
coverage['unverifiedEffects']=anomalies
coverage['otherChoiceTables']=[row for row in coverage['otherChoiceTables'] if row['table'] not in [*trips.values(),interview_table['name']]]
save('event-sources.json',source_rows)
assert len(events)+len(deferred)==1254+coverage['tripRows']
print({'events':len(events),'deferred':len(deferred),'jobs':len(jobs),'coins':len(coins),'missingTranslations':len(missing)})
if missing:(p/'missing-port-translations.json').write_text(json.dumps(sorted(missing),ensure_ascii=False),encoding='utf8')
if missing:raise SystemExit('Translation checkpoint not complete for the port. Do not publish these files yet.')
for file,data in staged.items():
 dest=repo/'src/content/apk'/file;dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
