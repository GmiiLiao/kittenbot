/* eslint-disable operator-linebreak */
// TelegramBot extension for KittenBlock
// Browser-compatible: uses fetch() API - works in kblock.kittenbot.cc AND KittenBlock desktop
// No require() / no bundling needed

const _Scratch = (typeof Scratch !== 'undefined') ? Scratch : {};
const _BT = _Scratch.BlockType || {};
const _AT = _Scratch.ArgumentType || {};

// Merge Scratch constants with fallbacks to guarantee ALL properties exist
// (Scratch online may have BlockType but without KittenBlock-specific DIVLABEL etc.)
const ArgumentType = {
    ANGLE:   _AT.ANGLE   || 'angle',
    BOOLEAN: _AT.BOOLEAN || 'Boolean',
    COLOR:   _AT.COLOR   || 'color',
    IMAGE:   _AT.IMAGE   || 'image',
    MATRIX:  _AT.MATRIX  || 'matrix',
    NOTE:    _AT.NOTE    || 'note',
    NUMBER:  _AT.NUMBER  || 'Number',
    STRING:  _AT.STRING  || 'String',
};

const BlockType = {
    BOOLEAN:     _BT.BOOLEAN     || 'Boolean',
    COMMAND:     _BT.COMMAND     || 'command',
    CONDITIONAL: _BT.CONDITIONAL || 'conditional',
    DIVLABEL:    _BT.DIVLABEL    || 'label',
    EVENT:       _BT.EVENT       || 'event',
    HAT:         _BT.HAT         || 'hat',
    LOOP:        _BT.LOOP        || 'loop',
    REPORTER:    _BT.REPORTER    || 'reporter',
};

const formatMessage = _Scratch.formatMessage || function(obj) {
    if (typeof obj === 'string') return obj;
    return obj.default || obj.id || '';
};
const log = (_Scratch.log || console.log).bind(console);

const TELEGRAM_API = 'https://api.telegram.org';
const EXT_ID = 'TelegramBot';

const MPY_TG_HEADER = [
    "class _KBTelegramBot:",
    " def __init__(s):",
    "  s.tk='';s.nm='';s.un='';s.off=0;s.pol=False;s.msg={};s.lst={};s.cmds=None;s.cbs=[]"
];
const MPY_TG_FOOTER = ["_kb_tg=_KBTelegramBot()"];
const MPY_TG_METHODS = {
    on_msg: { deps: [], code: [
        " def on_msg(s,fn):",
        "  if fn not in s.cbs:s.cbs.append(fn)"
    ]},
    _req: { deps: [], code: [
        " def _req(s,m,p=None,to=10):",
        "  import gc",
        "  try:import ujson as _js",
        "  except ImportError:import json as _js",
        "  try:import urequests as _rq",
        "  except ImportError:import requests as _rq",
        "  if not s.tk:return None",
        "  gc.collect();u='https://api.telegram.org/bot'+s.tk+'/'+m;r=None",
        "  try:",
        "   if p is not None:",
        "    b=_js.dumps(p).encode('utf-8')",
        "    try:r=_rq.post(u,data=b,headers={'Content-Type':'application/json'},timeout=to)",
        "    except TypeError:r=_rq.post(u,data=b,headers={'Content-Type':'application/json'})",
        "   else:",
        "    try:r=_rq.get(u,timeout=to)",
        "    except TypeError:r=_rq.get(u)",
        "   d=_js.loads(r.text)",
        "   if d.get('ok'):return d.get('result')",
        "  except Exception as e:print('[TG]',m,e)",
        "  finally:",
        "   if r:",
        "    try:r.close()",
        "    except Exception:pass",
        "   gc.collect()",
        "  return None"
    ]},
    set_bot: { deps: ['_req'], code: [
        " def set_bot(s,tk):",
        "  s.tk=str(tk).strip();s.off=0;s.cmds=None",
        "  s._req('deleteWebhook',{'drop_pending_updates':False})",
        "  me=s._req('getMe')",
        "  if isinstance(me,dict):s.nm=me.get('first_name','');s.un=me.get('username','')"
    ]},
    get_name: { deps: ['_req'], code: [
        " def get_name(s):",
        "  if not s.nm:me=s._req('getMe');s.nm=me.get('first_name','') if isinstance(me,dict) else ''",
        "  return s.nm"
    ]},
    get_username: { deps: ['_req'], code: [
        " def get_username(s):",
        "  if not s.un:me=s._req('getMe');s.un=me.get('username','') if isinstance(me,dict) else ''",
        "  return s.un"
    ]},
    poll_once: { deps: ['_req'], code: [
        " def poll_once(s,to=0):",
        "  res=s._req('getUpdates',{'offset':s.off,'timeout':int(to),'limit':5,'allowed_updates':['message']},to=int(to)+10)",
        "  if not isinstance(res,list):return False",
        "  got=False",
        "  for u in res:",
        "   uid=u.get('update_id',0)",
        "   if uid>=s.off:s.off=uid+1",
        "   if 'message' in u:",
        "    s.msg=u['message'];got=True",
        "    for cb in s.cbs:",
        "     try:cb()",
        "     except Exception as e:print('[TG cb]',e)",
        "  return got"
    ]},
    set_polling: { deps: ['poll_once'], code: [
        " def set_polling(s,sw):",
        "  import time;s.pol=(str(sw)=='on' or sw is True)",
        "  while s.pol:",
        "   s.poll_once(0);time.sleep_ms(600)"
    ]},
    msg_is: { deps: [], code: [
        " def msg_is(s,tp):",
        "  mp={'file':'document','video note':'video_note'}",
        "  return mp.get(str(tp),str(tp)) in s.msg"
    ]},
    msg_prop: { deps: [], code: [
        " def msg_prop(s,st):",
        "  m=s.msg;f=m.get('from',{});c=m.get('chat',{})",
        "  if st=='text':return m.get('text','')",
        "  if st=='id':return m.get('message_id',0)",
        "  if st=='date':return m.get('date',0)",
        "  if st=='chat id':return str(c.get('id',''))",
        "  if st=='chat type':return c.get('type','')",
        "  if st=='user/bot id':return str(f.get('id',''))",
        "  if st=='user/bot name':return (f.get('first_name','')+(' '+f['last_name'] if f.get('last_name') else '')).strip()",
        "  if st=='user/bot username':return f.get('username','')",
        "  if st=='is bot?':return bool(f.get('is_bot',False))",
        "  return ''"
    ]},
    ent_cnt: { deps: [], code: [
        " def ent_cnt(s):return len(s.msg.get('entities',[]))"
    ]},
    ent_is: { deps: [], code: [
        " def ent_is(s,idx,tp):",
        "  es=s.msg.get('entities',[]);i=int(idx)-1",
        "  return 0<=i<len(es) and es[i].get('type')==tp"
    ]},
    ent_prop: { deps: [], code: [
        " def ent_prop(s,idx,st):",
        "  es=s.msg.get('entities',[]);i=int(idx)-1",
        "  if not (0<=i<len(es)):return ''",
        "  e=es[i]",
        "  if st=='text':o=e.get('offset',0);return s.msg.get('text','')[o:o+e.get('length',0)]",
        "  return e.get(st,'')"
    ]},
    fwd_msg: { deps: ['_req', 'msg_prop'], code: [
        " def fwd_msg(s,cid,nf='on'):",
        "  p={'chat_id':str(cid),'from_chat_id':s.msg_prop('chat id'),'message_id':s.msg_prop('id')}",
        "  if str(nf)!='on':p['disable_notification']=True",
        "  return s._req('forwardMessage',p)"
    ]},
    send_msg: { deps: ['_req'], code: [
        " def send_msg(s,cid,txt,pm='none',nf='on',mid=0):",
        "  p={'chat_id':str(cid),'text':str(txt)}",
        "  if str(pm).lower()!='none':p['parse_mode']=str(pm)",
        "  if str(nf)!='on':p['disable_notification']=True",
        "  if int(mid)>0:p['reply_to_message_id']=int(mid)",
        "  r=s._req('sendMessage',p)",
        "  if r:s.lst['text']=r"
    ]},
    send_media: { deps: ['_req'], code: [
        " def send_media(s,mt,mk,val,cid,cap='',pm='none',nf='on',mid=0,sk=''):",
        "  p={'chat_id':str(cid),mk:str(val)}",
        "  if cap:p['caption']=str(cap)",
        "  if str(pm).lower()!='none':p['parse_mode']=str(pm)",
        "  if str(nf)!='on':p['disable_notification']=True",
        "  if int(mid)>0:p['reply_to_message_id']=int(mid)",
        "  r=s._req(mt,p)",
        "  if r and sk:s.lst[sk]=r"
    ]},
    last_id: { deps: [], code: [
        " def last_id(s,sk):",
        "  m=s.lst.get(sk,{})",
        "  if sk=='photo':ps=m.get('photo',[]);return ps[-1].get('file_id','') if ps else ''",
        "  if sk=='text':return m.get('message_id',0)",
        "  return m.get(sk,{}).get('file_id','')"
    ]},
    send_loc: { deps: ['_req'], code: [
        " def send_loc(s,cid,lat,lon):s._req('sendLocation',{'chat_id':str(cid),'latitude':float(lat),'longitude':float(lon)})"
    ]},
    send_contact: { deps: ['_req'], code: [
        " def send_contact(s,cid,ph,fn,ln=''):",
        "  p={'chat_id':str(cid),'phone_number':str(ph),'first_name':str(fn)}",
        "  if ln:p['last_name']=str(ln)",
        "  s._req('sendContact',p)"
    ]},
    _cmds: { deps: ['_req'], code: [
        " def _cmds(s):",
        "  if s.cmds is None:r=s._req('getMyCommands');s.cmds=r if isinstance(r,list) else []",
        "  return s.cmds"
    ]},
    cmd_cnt: { deps: ['_cmds'], code: [
        " def cmd_cnt(s):return len(s._cmds())"
    ]},
    cmd_prop: { deps: ['_cmds'], code: [
        " def cmd_prop(s,idx,st):",
        "  cs=s._cmds();i=int(idx)-1",
        "  return cs[i].get(st,'') if 0<=i<len(cs) else ''"
    ]},
    set_cmd: { deps: ['_cmds', '_req'], code: [
        " def set_cmd(s,cmd,desc):",
        "  cs=list(s._cmds());found=False",
        "  for c in cs:",
        "   if c.get('command')==str(cmd):c['description']=str(desc);found=True",
        "  if not found:cs.append({'command':str(cmd),'description':str(desc)})",
        "  if s._req('setMyCommands',{'commands':cs}) is not None:s.cmds=cs"
    ]},
    rm_cmd: { deps: ['_cmds', '_req'], code: [
        " def rm_cmd(s,idx):",
        "  cs=list(s._cmds());i=int(idx)-1",
        "  if 0<=i<len(cs):cs.pop(i)",
        "  if s._req('setMyCommands',{'commands':cs}) is not None:s.cmds=cs"
    ]},
    clr_cmd: { deps: ['_req'], code: [
        " def clr_cmd(s):",
        "  if s._req('setMyCommands',{'commands':[]}) is not None:s.cmds=[]"
    ]}
};
const MPY_TG_ORDER = Object.keys(MPY_TG_METHODS);
function buildMpyTgHelper(usedSet) {
    const active = new Set();
    const add = (k) => {
        if (active.has(k) || !MPY_TG_METHODS[k]) return;
        active.add(k);
        (MPY_TG_METHODS[k].deps || []).forEach(add);
    };
    usedSet.forEach(add);
    const lines = [...MPY_TG_HEADER];
    for (const k of MPY_TG_ORDER) {
        if (active.has(k)) lines.push(...MPY_TG_METHODS[k].code);
    }
    lines.push(...MPY_TG_FOOTER);
    return lines.join('\n');
}
const MPY_TG_HELPER_DEF = buildMpyTgHelper(new Set(MPY_TG_ORDER));

const menuIconURI = "data:image/png;base64,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";
const blockIconURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAgAElEQVR4Ae2de5AcR33HF8eWHyjmSghLWLE5CUl2XhUlECoPCHIIcVVSqRhCAoEEjlSRVF5VFyCQ/JHyQYokfwQOkpiT9fDqdTqd7k5rgwE/ZM6gk093p9Oe7v3U2pJsy8/Fsp0AlVSnfjPXuz09PTPdMz0zPTO/q2p1z+zc3u5oPvP9zq+7f10q4Y/RZ2Bbpbbj9srSzm2V5bbtlZWObZWVzm2V84O0bK+skCiFvo9dr3Taf2O5zf6btR1Gnxz8cHgGTDkDAMxtlZV2Cuj2ykotCpiaf7dGAYfPCJ/VlPOGnwPPQOJngMK6vbJS3l5ZqWqGLZIiK34W+OxlhDrxSwj/YJJnAIC1ren5QUVAkoRRy98CpYbviiqd5BWGf0vrGbi9UmsFVdpeWankHViJ71exFbrWqvUk45vhGdB5BiDYBM+vGbfEWlTYB+qq/YyPwTGd1x6+V8gzAEq7Cq1JAae4IdT1/jU4d3AOQ55+/DU8A+pnoLVSa1m1x1kOPumCUNf7VOGcwrlV/x/B38AzIHEGtkJf7MByedvxZQJlewVKtD5Y/H3h+StjAEzigsRDgs8AKAIMoNh2fLlGweVrG2SEOYabUQ3OPapy8HWKR3Bn4PbKXOv2gaWObceX6zywftuoykJFjepU6na3FD4rc5cpbvJnAMB9+8ByeevAEtl2HIptl1VrBDkWkOFGUMagF3/V4naJBRfgZYsNcjiY0V4jyIhXjGfAD1wW4qYihwMZFBxVORaYUZFj5MPYt4bAyNaBhQ4eUtlttNexwBjlWbkDg13G4qb3g20ZWGrf0r9Y3zKwSKBstYrTNquBHE6V0V5rvwnUoS9Z79WC72bMGdjat7RzS/9ibUv/InGVBsgAtDrMUZ6T0V5rB7mG/cjGYBf9g4C12tK/VHFB6wGyHlXG6HUM/cKqFruCtjo6P6m+Q+vAfPuW/oW6FLws0GivVWEx9Xi01akSGPKPt/bMtW7uWxzc3L9AaNnSv0DsIrDQLLx8G+21qXBKfy6Yo4z9xyFhSvrXWvvm2zf3LdQ39y2QRtEEMtpr7c+r0hBqsOSoxknDqPL3GqrLgitqu2BWV2Q9IGP0WgOUyjcAVGMVqhI6trV/4a7NffNO1RXBy+5zgQwWWx1muxsKo9dpwBjhb9a3V5bvSujyxD/jdQYgyth6bKH8tr55QsvmvnliF8ZCs+DybU0g61FljF5HgFJZjWFsNUaqveiKeT9Y5tZj89XWY/OELRRkqJVABrBdMKsrsh6Q0V4nCHIVA1wxw8q/fWvvwl2tx+brLLh8Wy/IaK8TBCqMkkb9HbTUPGRxbbf2znW0HpsjdnGqLw8xbLtBBmVGe51zIMMC3RHXdVv4922tVFvedmy+cmsDXgox1MEgi2GWBBntdVggsvh7OIJL990G4L21d756a+8cAYBpaSqxGsxuVY4CMtrrHKp5FYNbmihuPTaz49be+boFLwDMFl+Yg1XZDTLa6xzCGNYF1CHXt6bLuJhv4wuvRpDRXmPCAY8bF0Ic9tZzy7G5NofassB6tX0VWe5Z2a3KaK89Lu6wypa534PsmGGv40L+HsB7S+8coUUZZADcF2a010GJ+jAFkHPcN0IseSu6pWeu7Zajs8QqDMShYY4IMtprtNfUgSDEARDf0jPThJdCTGsOZmVV9gUZ7XWQImPmEFuREWIPiG14Z8gtR2lZVWEKMK2jgoz22kobhIn5nBaZqqxMjRBzEG/qmWnbdHSGQGkCTNtyIIPF1qvKwc/JaK+La68R4lWIWXgpxEoggzJHVWW016srUYSbRFFUe114iC14e2bIJrasKjGF2a3IoMxyqqysyGiv0V4rrjhZWIg3dc/s2NQz7YTXB2QlVeYUGe21eqpcSK8bJV1ukfJeF27ElgXv0em6DTBAHBPIaK/tLCOYmC/uwSPFGbHVWq62vPXodP2tPdMEihNius3ZaqrMaK+tpANRMmzqSTiAmUME0ep67idAALw3H5muUnjZOgrIaK8xc4gAqLhVV/T++Z7FdPORqcrNR6YJLSzAbNsNs5wiK4GM9hrttWLASvImUeF6SfOxeXP3VAcFl69ZeNm2G2T5Z2WMXqelymivt1dW8pXZ4+Yjs3fx0Iq2WXjZdhSQlVQZo9fWio16npPD9SnnJ3qdk7S1EHHecGS6vvHINKFFBC+/jwWYbbthRnstzPHlyrCJmUMkLbDo2TbMvnrms11C0GpD91SVgsvXPLSibRZetu0GGe11nCDrUeXC2etsB7U2dk+WN3ZPkUZhVJiFWQQuv4+Fl21HARntdVrPyYWy1+VMRrFuPjJ518buSdIsDMgAdSIwo72OU5VxWRnZGU0Zex7e2FNt3dA9WW/Cy4IMbQbmREBGex0nyGivA0HO1vPwhiOTgxu6JwkUb4jNBhntNdprnUEvWBUxE1Z6w+Fz7RRetpYGGe11I58X5r3OV9DrtspKu9EQW9b58Ln6hsO2+rIA07Y/yGarMg4OSUuVcwOy2VZ6w+HJwQ2Hz5FmmSThYTb3ORntdVogZz96bayVtqyzA94YQEZ7jfb6OJ2nnF1VNs5Kt5SrLW85fK7+Fk+AOZhXA1zUVtMa7bVCXi/fNEDB+bzcCexxWRmdQauA9zJr6uH67okKwMuWpo1m4WXbaK/5XF6YOaRQmUPMmLW08VB1JwuuqO0PsyaQ0V6jvc6Yvb69srQz9aj0TYcnajcdmiC0iACm+/xBBnXG6DWvypiYL4oqG/+cXEsV4A2Hq+0UXL6m0IpqKZBDw4zR6wb0EZ+TMe91/HmvUwtoQeBq/aGJ+npGfXmIYVsEMLvPH2a016I1ohqAyiaz9wUZl5VJeVmZdAJa6w9VOwBetogAZvex4PJtf5DRXmsBGfNem5r3OtkMHhvL1VYWXL7NQitq8/Cy21Igo72OeTWK4G4otNd67XWik//ffHCivP7gBLEKp8IqMLPgitr+MKO91qLKaK8jJbDXuKxMMvOGLfWl8LJ1BJBBpUUA033+IKO91gIy2uvU7XUiKryOVV8WYLbtA7PIUrP7KLSiWgpktNdorwcWreR8dsKBKN1QiY+9jleFW8rV1nUHJwgtDRvNwsu2fUAGq82Cy7dFALP7/GFGe61FldFeJ26vY1VhUF8KL1/7whwBZACbBZdv+4OM9loLyGivk7TX8aiwrb5Vsu4glKYK821fkEGdfWDmVZjf5uFlt6VARnuN9joD9joWFV53oNqx7kCVWMWCOD6Q0V7TRd7kc3kpzVHOwLIyf/vE0+TQUp2MPv/fhP258uP/I489/SqB1zev5r6OstiboYn59PYLw6irdQeq9QbAFGSoAxQZFNpXlX0UOQhktNerWTdzsmrjHd9eIYeWXiYAqczP/bVXGhADzFFANiwxn97RWS0Hq20tB6oEihDiBsjxqTJvp/lt1k7zbbTXM6SZDmiWWM/FoMJsSXFZmb859bRLaWUAhmPumX2RNDJuulajyG7mkG2V5TZtEx1aDlRrFGBapwVykCrz8PLb/jBj9FpL0Esien3Ht1bIPTMvkEuv/ViWVeFxoNYNgPsW7LYL5EwuK6NnplJLubqTQutV+8PsHfBCe91capVfiQK22RUo2HaU1SiaSqyuysqTKATR648//hSp1H4ghDHszk88fsENMcCsCeS07PVWHfOFW/aPl1sOnCV2sW10OJDRXotWoxCBy+9j4WXbUUBWCnpFtNc7KovkXyYuR1ZbL8CtgBZVX6/aBXMG7PXAcrQuJQhetew/SxqlATIA7Q2zvyLHBzLaa7Oi17//cM1SW9mglBegQfvvmX1BrMAimF0gm22vWyu1ltDPwi3l8fYGvCFABsj9YUZ7bZIq67LX/zj6DJmr/08Qd9pe/7eJ58jmPkjKl7/EfFsHIiSDv3H/2eqNLLh8W1KRg0GOT5X5aDW/zQe52G3/gNfqKC8cHGINDnnvg8vkwOJL0l1A2uglhHz88QvEnWVzNaAlUmF+n0uVTbLXK9VQCgwjrwBevggVGcCWhNlfkeMDGe11PPb6r4cukhOXrujkUfm9AGCYn6x/jrIZ9jrUyKwb94933rh/nNhFP8jBqoz22lR7/QvH58m/VuMLSqkSDF1SFGBauxU5w/a6stSprMJvKo/XmgBTkKF2whxVkYNBjk+VeTvNb7N2mm8X0V7/3sMr5HitrspX7MdTaL1qN8xZs9fLan3CLeXqjjeVxwktMiDreFZGe80vx8pk2Ewx7/U/jDydaFBKhXgYCGKv4hicBkgvyMna622VxR3SKry2PN5J4eVrN8xORdYBcrAqo72O217/xjcWyYGFl8iVH8mNS1aBTuexo8+/vgowZNcMm2EzE/Za3kavLZ+pri2PEyg8wHTbDTLaa2qzs2yv/+SxGjlx8RWdjMX6XgcXX7ZWpHCvpRysyGC59apyjNHr/iW5aDREn9eWz1jwUoijgqxDldFex2evf75/jnz+9CVy6bUfxQpbHG/+XzMvNJaUudVSYKrEbB0Ms16Q47HXt1fmWgNt9BvL4+02wACxG2Q1mItjr6n6etVSqpzwqo3veWCRHD9fN94m+4H/8cGniGOMtu9EijAgG2Wv2wMBXls+U3ECTEF2w0ztNF+jvXau1MhCLQVyzINDQG1HnnvNj4vMvAbDNR0AwwQKwSQKp8UOBtlQex28ouFP3neG0JIEyGivYUSXqOid2vjuBxbIf0w9l2m1Fd1VhPBSiANBDhv0itINFc1e+yrw2vLYzhsYgFVBRnstzrTJKrCoLQaYhTr8qo1/+b2nyKMZCkqJIPXaB11IgQBLwxysyu7n5OTt9dY+nyVJb9g31gEA00IBprW3IqO9hqGaQcM1YaCICGC6TwpkCXv9c32z5Evjz2QyKOUFq2j/yHOvW+OwlSAOVOVgkFO1130L3vmyrr9vbPCG+8YaAHuBDEB7w2x3P9EINv98TLdlnpPRXrMqzLbF9vqjJ1bIwPmXRdd6LvfB5Al2PWW9IJtprzf3Lw562mgbXgCYlqYae8EsCzLa63js9c8emyGfG75IZl9ObvqeKXcDGI+tJQWQBlVO0l4LAV67B55/Kbh8HQVktNdx2Otfv3/OUtsrP/pfU3hK/HP86XefNCYxHzsO2w1zlKCXe3CI8Dn4+n1j7TfsGyONIgkzfT5ma1lVpnaar9Fee3dDfW74Ajl9OR9dQFGJf+83l5wA+2TZzJW9Hlhy9wev2Xem3IA3BMhgsVmIVZ6T0V7722tQ269NXiZFVlsR7M4MIlyaXAozl89LGWQz7bU7V9a1e8eq1+4bI7S4YJZUZDWQ0V772eu/eLxGHr2gN4OjCIQs7oMIdJKJ+SzwI47y0hi9do+LvnbfKLFLE2KA2QUy7JOEmVdkFVXmbTXdzru9/uneafLPZy6RS69mb1xykjeCE5desQAGiJVABmWOqsq+ICcTvXYEsq7bM7azCbB+kNVU2dkNVRR7/eFHlkn/yktJMhDqb8GgkM8PXyQfO3He6msO9SYafuk/p58nm3pseCnEYpAh/3X+7HVr39zOBsTX7htrdwMsBlmoypKKrAZy/u317UenyN+feorMvuxcwEvD9a39LaB/+d33z5ON3eysqCntf0f2Df/q5EUbYIBYALIYZjmQQaGVn5V9VVn/4JDWvvlmIOvaPaOd1+2lwPrVaK+Dkw0EpwD6teMzltpmISgFEW83uDbEMEwzrR+Yt2yBSwGmNbfQmxLIGbLXW/oWmxP8r9k7OggA0+KtxhRufSCrqXK27fVnTz1FTl9+Na1rXunvwtxgGNm1gZviyCpwmqO+nKtSrKowhZjWHMzOqDVdWkZOlZUVGVQ8oiq7+5PZsdfMiKw1e0dra/aOElooyMGq7AQZ7bU7kf2vHp8hXz33TKa6gP5j8jKBEV4bYNy1x9hrgDutH7i5OAGmKXPlQFZSZS7gZYy97l9oJrpbs3ekAS+FGGp5kEGZnTAXPXr954PnySNPmZfB0Q86eBb/3W8tCqY3OkH+mb7ZVIduQheS/xpRMYBsoL22gljX7B7dYQMMENPSVOM0Qc6avd7WM0m+MHaRXMxgF1B5/gVrppTMjKg0rTPcgA4svOgAmMIcRZWzaK9bjy3uKF23Z3hnE1wKMK2dIKvB7FTkPNvrO785R/qWze8CEqkv2NGPPLrsmuboBXLa8MJ3+NL4sySu5VczZa+hK+mafaNt3gDrADmf9nr7kXPks0NPktmXzO8CEoEL+8pzLxAYOELnI3vVFGYT4IXP/dHHzlsAs8uwUhXma7cq58lez7WV1uwZ6VizZ4RYpWGhKbii2qnKaT0np2Wv39U/Te6bhdQ02Z0FBKO8/viRZaKyEoUp8ALA73lgwQUwhZkHmG67QYbAlxzMxtrr3rmO0tV7RjuvpgDTOgTIebfXnxl6kgw/m40uIC/Fpap7W++0C14/mE2CF74DhdWvpuDydRSQjbPXvfOdpav3nB68es9pYpdVJU4MZLPt9bv6pkjnxNPk4qs/9GMiE69BYA2Ga9LJE2zNw8tuD6yYleEDsmmyq1L4QUxf4yGm226Y5RRZCeR4o9eDHMBNkHWoclbt9R9+ZyFzXUB+d5Hy3PMEhm2y0IraLLjQHjBwbDaMxWYBpm0Kq19NweVrN8iZsddeAOsFOQv2emt3lXSMXMiF2lKYbdVdIusPTrjLahI+L5BNhBe+F6TG3ZjYQm/yICupsqbBIbccm7MAXrXPFFqvOp/2+rcfmCF9yy/Qaz439SMXfkC2g+qK4GX3CUA2eVYUjL+2AAaIaTkynYAqm2mvS9fs9gLWa/8Iybq9fvvhKvn0yRqZeen13ABLvwhEx2EU2LqD7hUcfWFeBdlkeOE7fuzEimtGVLIgy6tyEtHr0lW7TxOAmJZmQMsLYLpfD8hJ2ut3Hpsk+2Yuk1cy3AVEQRXVMHRz+9FJsu5g8IwoEcymwwvfmZ1M4WwnrcjyIMdpr0tv2D1MoIQHGYA2215/+uR5MvzsFdE1n4t9DdU9wEymsCCWBzkL8MKoMZgd5QSX32ZATuxZOT173QBYF8g6YNYRvX5n7znyleqlXAWlRHcbUN3beiZJ8Dxlt6UGmw3PyVmAF747zE1mpzf6gwxgMzAn8pwsr8q67LULYBbk8Kqcnr3+g2/PkYefNKvvUgRe1H2gup8aPG+BC/CyRXYtZYA3S0NB98+/6ABYHmZzQY5qrz0BpiBnwV5vOTRO7j79ZO7VlkIPqrut5xxpOXDWAS4LcZAiw7NyluCF7w7zlP3mKBfRXksBTGEOr8j2c7Jue/2O3glybCl/XUAUVL62VPe7K6Rl/1m7WAADxP4g8zCD5c4avHAuPvroMjdXOfyqjXmx16Wr7rWDWBRSmRpADg9zdHtdNHDh4oVx2L/SP92El0IMtQLIWYUXzgEkuKczo5y1M+EAa62VVNmw52QZe10q3TtMoIQBOQ17/eWzF3lhyvU2qO4XRi8QWKmRLQ0VZkEOgBkSDmRReel/MEx3dILLb2sCOUPR61Lp3idIs9ggh4E5vCLL2+tji8/T/8tC1KC67+qfIs1k9k6IVZZfhaQDWcwUQv+jIQLNzlf2BxnALoa95gCmMIdX5bjsdZHgBdX94sgForIahZ8i3/nN2UzPXwaIYUojCzBtS4EcGmbzo9ceAEcHWae9ft/xSXojzn1tqW7fVANeCjHUTSVm2/6qfOc3sg8v/Kd/bfJZIcAUZKj9Yc6nvQ4AmIIMdXr2ugjPvTC8E2ZDwVIybGEBZttumN0g5wVeABgWeqPTHVloRW1/kPNlrxUApjAnb6/zDjAM8/zlvkniXFc5LMigzmdJnuAFgH/nwYUGwBRkqEUA031SIGfcXpdKuyiYqnV4kFXt9S8dPZtL60xVV/eqjZ8ZquXufMG8ZRZcvk2h9ar9Yc6uvQaAB0u7TpHwICdjr/dMP5urixKmMr7//hnti6LnEV5IOM8mHuDhZbe9AKb7/UHOnL0eZAAGiKODTJ+VZQaEsMfIRK/zAjFMsoCsmmzh11J22mlYqZEtYnv9mZP5U164a0MXEgswbbPgitoUWlEtBbL59loEMAOygfb6bQfGSPv3lslDtewlUrdVd5pbIN0fZFl7nVd4AeCvnXtWCDAFGWoRwHSfCGB2nz/MRttrAHio01ZeCq6oVn0+Zo+PL3qdJZgt1d03xsHLbjtBVsl73bf8Yq4eL/gvA2soNxIQCFIAJQOygfb66HRnqdR1qiMYYAo1C6ZqO3zQS8ZemwrzzIuvk/fdP01ci71pWhQ9j/m8eIA//Ei4xHxUgUU1q8B821+RV0E2wF7f3DPVAQC3yQPMgGygvabpgEyBGVQ3zlUb+woyE6uhvmwyPradmiqna683dc+0lUpdJ3eWuiiYYWpVJWaPj89eszC3PbpAehefTywXlq26U8S5ULpzsTeXIivYa0jKV4SkBaDEMH6bTdDnC3NqIKdjr3+qZ2pnqXTPqR2lriFilzAA099hwVRtx2uvKcxQU5gvXIlntYWvnAXVhRUnvIoTZNVVGwHePGbT5G0z3T59+VUHwBRmX5BBnX1gFllqdh9vqdltk+z1pu6ZHdYawU2AGZBDq/ITEfqUw4OsOjgEYL7j+CSBrqmZF1+j10voGpZf+eC3ZmNdFP3th88WCl74z7hv7nkhwDpAznr02oYX/u0aqrkhBphP2cXqH6ZKq1KrKjF7fPz2mlVmGO1193DN6p6SVWcYSfXQky+RP3t0kUB6XLboSMzH2uz33z9dOHgB4C+OXSRWjq+AVLkAtK8q+yhyvCDHZq9rLMCDYoCpIq/CnBLIcQ4OYSF2tkfIBx6cIR98cJbcPfwkgfHYUP7u+yuW0r6jt0rE6yo7QdaR9xrgzWsu6yDL85GHF22AacpcxXS5Qqh9YGattKjN2mm+nbC9HmwCDH3BjedgFlpRO4oqZ8de8zA31lCGHNixL7/aXLURuqCKCi/ADSmAhFk2YwY5XlWOHr3ecGSyswnw14fa5QGmUEcBGWw4a5dV28na6ybM0fN5qSjyJ08sFRpeSGzAZtoUggzKXEB7/dbD59qbAFtdSRTMMLXKczF/rCq87PHhg14yg0Oa4NLlZGitB2Q/mD95YjHIXeb+dUhuwAJM2/4gy69GkWl7fQi6kNgfaQvtB3gUVUZ7TQNfkHWzyLaZ3plgiCiFVlSnBbIJ9ppF127vGqqq22gvmKOAjPa6SLmuKayi+qsTzzApc52rT/BA+8MsXlZGqivKJ+AVL8h+0etzVTfAXUNlfQCzYPOWWWWbtcuq7Wza680Hx0XXciH3/dFDC5ES2DugjjnoJYpYs/v4iDW7rRq9vql7suwGOFQgiwU1qB1FlYtjr2EwCP7YZ0CYyF4yib0DXtoF1Qh4xfecHK8qr0avHQEsinLkQFYQwPT1KCDn314jwM3bl0rea95Ss9v+MGfPXm88VOUCWA2IKWRJ1Sp2mj9W1VKzx5trr3+zUpwUuk1U3S1YQSLqShQsxND2Bzk+VWattKjN2mm+LbLXFFd33TUkMSIrDrijqHL+7DWMqy76D6zAaKfOdafL9Uti31wnyjvolRbIeuz1JDMCi0e462RHPIEsWeijgJwfew1jq4v+0znxNJfIXj/Iwapsnr2+6dC5Dh7b5nZiz8EyQPOWWWWbtcuqbTPsdV/B1oHib1ifemzZWp3CncDeznudrL2OALLmqY3rPZ9/KcZaBnTIACp7TBRVzra9hiQERf2584FZx/IyMiDrCHqZbq8ppt71rlOVdG20F9hRQM6uvYaZUEX8geVl2KVk2LYb5sLY64o3uPSV2PuDvQBV2a9ip/ljVS01e3w69hqmNRZpaCUE8cKtD5Vve73hcJWZwECB5euu4VYzFVgEeBRVzpa9hoQDOjKHZEHNYa0oO5G9OIE9q8bQdiuyG+Q82OuN5Worj6t4W+u4aBF4uvdFATlb9jovq1P43UggAu23EkVB7bVg/LMYXzvZu3HBLFnoecusss3aZdV2cvY675b60ydrHMDBy8qEUeWo/cmxdkPx0euD55gJ/F7g0v2OTJWy4Jh2XBRVNt9eQ+7rJ555xU/IMvvah74z31j0zanE8YCcBXv9lu7qagZKCmlQ7ZnozjRQgz5PFJDNt9eQiC9vP5A6V36xN+dzch7t9ZsPTjAJ7ILApa8r5ckKgsiU11XsNH+sqqVmj4/XXkN63LwEuCDarnvVxuzbaxX7TAHOVDRa9QYRRZXNtdd5CHBBBPoGa90o52JvvCLLrtqopshmRq/lo88UXlpnLhqdJMhm2msIcMnmtTbReu+bucyt4OgEWWXVRrYvmbZ5Nabb7q4oQwaHHJpQiD5TcGmdiUEdqtB6Hc9bZpVt1i6rtvXbawhwZVWN7x55igOYLsEaBWQIfjmflSm4fO0G2a3KyUavZQZvUGD5unOwJTuDOrzAVN2fH3sN60BlbQTXh74911yKVXIJ1jzb65ZytYXHUm07tlxZqmAlfXwUkM2x16DGD9VeMtEtCz/TO3vPNQGGFRsVVm3Mnb3eXxXkvlLDd3X50aThMe3vqdhp/lhVS80er89ef/KRbKgxu54yuzZUfCCba6/Xl71S5yhD7LX4mWmgxf15oqhy+tHr1v1mq/ETz1xZXZbVuQSrC2QFVc6wvQ7R9+sFdteptuI9C/vdDKKAnL69NlWNIR+2c11lfSBnzl4frLZ54ai+H4JZu4bqCLEIat4yq2yzdlm1Hc1e32qgGn+l6rU4uhNk1UXR2YEhaiCnZq/r0YNXPOap58sSwWPSviiqnJ69/oRBz8aQC8ypwLBKI1+cMOfTXo/75L3iwZTdzvXILJ03giggp2OvTVHj36pMEbo+lBvc+EBWU2Vnf7LaSC/JwSHS835l4aXHFbZLKSzgKnaaP1bVUrPHh7PXH3hwOtVRXLBaIy0UZKj9YXYqcvbt9biGriMKLF+jCpNwcYAoqpysvb51/zGknz8AAAcRSURBVCjZM/WMsI82zp0zL77egJdC7Lf8qhhqJ8xZtNctsakvhRlVOCTEoOJRQE7WXietxtCFtGbvCFOaapwmyMna6zjVtwFwlnJmhbW+Sfweb5lVtlm7rNqWt9dJqvGXz15k4PUGWQ1mpyKbbq/jV98GxHEtRZoEOKb9jSiqnIy9TkKNYU0opwKzEEPbqchqIMNztBNmA+11jM++FFxa47NwBBvtdQOJAnL89jpONb545YdkzZ4RuzhsNA8x3XbCLB/w0guyTnudnPo2IE57HSUvEPKwX8VO88eqWmr2+GB7HYcag32+mgJM6xAgq6myU5HTtNct5Tj6fSmoXjWOzopBhfmbTxRVjtde//v4BS1TFSH5AMyYunrP6dWyqsSJgaxXlUOMvY5h1JUXtPz+Qk345+FKcjsKyPHZa7DVUUGGDCJNeCnEUI9oUWXT7fUby+MSqy3w4Onczk32yiSBjPK3eMusss3aZdW2t72mIKum8mn/3rIHvPpBNtFev7F8RuOMo7BQG7UkaRQwsva7UVQ5Pnv9iUfmCayq6Acz5LO+Y2CSXLObBVWmnS97vbY8tjMsdnp/z9gVDbMGZZjPGwXk+Oz1G3YPk1/sOUsg6PVPwzXLakMb9sFrV+0+bQEMEIcBWUfQK1V7ve+MxEqDejH1fjcMaCUQ0JKBW8VO88eqWmr2eG97DbD6FQA5PMx6npNTsNcpBq68MMaAliEQA+hRVDk+e+0Hsg5VbvQlQwQ79m6o8NHr6/eNpRy48oK4a2gw3GB/GXXBY9TPbRSQ47XXfjCHV2Tzo9fX3zc26IVP+vthhBZm7jBIidmbHm+ZVbZZu6zaRnvNDNusX1cellzjNy2c0UobCjCFOYoqo72mgS/xdEaw1bQ4R3oBxOZaZ/5mgVbacIgB5iggo71WBtlo6+wCGK20+vMqVcg0ahU7zR+raqnZ4wtjrzNgnXmIv/79u7J1EacBjml/M4oqo732UuU1e0fu4vHIxjZm78iAlRbdRKKAjPaaBXnNvtEE5/nqvi3YAzyqqMQiSLKyj7fMKtusXVZtZ99eX7t3tKo/v7NuSIPeD7uWMqrC/A0miioX0l5n8LnXC2Z8Hs4JxAB1FJALZa8z+tzrBTGu7JAjiKk6q9hp/lhVS80eb7i93jMSw8oKXmAluR9nLeUQ4qiqnDd7fTrDQaugmwEGtXIKMKPIYLF3hS2syqq2h8lV99rFb5y16DWNY6+rpXK1JQiDbL+OUw9zDjEDc0oglyKAHB7mkXr+4aW3nntO7cBJD/RCz3sdJeiVGXtdv2b36A56eRejBoi78n7x4vdr/h9HARksuaqlZo+P114XD156i+o61db8D8aLvTjnIuwzcnSQddvra3YPt9HLuZg1QlyQZ2LRDTqKKptgr4sOL71lIcQFhhjAjgJydFUOE73+icIrL4WX1ghxwSGmCm2+vS4hvJRarkaIEeJGYDOKKsdnrxFejlnXJkKMEDcgNsteI7wuWj12IMQIsQPi9O01PvN6sOq5GyFGiIUQR1XlEPYan3k9MfV/AUdsIcSeEEcFWSp6XS/tPlWwEVb+SKq/ihAjxL4Qx2avEV51Wj1+A2cxIcRSEEdV5Ya9rpbKgzmfVeTBWmy7LYhPVYoz3JAqC9bh/s9Dd0OVEd7YKC6VSpjZA9VYWo3pzU9ycEjXqZxm0ogTyDDvDTm2cA0mBDkMyOKEA/XSvU/kLIdVGLCS/B072yWmrFW+iKkqFbl22OtqCa4l/EnhDMBzMSaPRyUOfRM7VS7BNYQ/KZ8BtNQIsQrE8PgF1wz+GHQGwAbhqogIcjDIg2iZDeLW9VFgfWIMcCHIPMiW6g61u64X3GHgGUA1RoCdAKPqGohp8EdCNS42yKi6wYwYfwSO4ComxLAKCEaYjcdT/gN2ndxZ6hqqhRuWV+Q+08x991oJ/q/xJ6dnAG11PhUZ7XJOgRV9LWsAyMkOVOPMqavHzedkB9pl0YWe9312tLqMIGcW5DL26eYdUpnvhyB7KJuxYCO4Mtd14Y5BkE0HGcEtHJRhvrAF8skOHNFlgAJbo+ogXoEzhsJcysX+HSvYZS3Aht1PzpFNSSh1rQSZSbEvt9gMavv2dj8yBrziB7mM/bjarlp8I9cZAEWw+5IxmYAumHcNVa1zimrrutxwR5xnAJ7Ldg114givUM/KNfvc4bNtnJcovrfsGbDzV3eWQE10KVPe3gfODdzw4FzhD54BY88AKLNlszENbgkmFcC5wCiysZcrfrCgM2AFwKyhm4MFUOdBO/UvTigIuizw9ayeAQDaUqWhcqYtt/24ULa/CwKb1csRP7eOM0ChtoNioNQm9T3DZxm0nl+tGw/CquO/HN+jCGcAAj6WBYcBJdboMIh6A+C0RB1UQd/HBtRa+cL6Wzsx2GT+Bfb/3ryg3USUPX0AAAAASUVORK5CYII=";

class TelegramBotExtension {
    constructor (runtime) {
        this.runtime = runtime;
        this.EXTENSION_ID = EXT_ID;
        // registerPeripheralExtension may not exist in online kblock.kittenbot.cc
        if (runtime && typeof runtime.registerPeripheralExtension === 'function') {
            try { runtime.registerPeripheralExtension('TelegramBot', this); } catch(e) {}
        }
        this.bot = undefined;       // {token, received_message, last_*_message, commands}
        this._pollingActive = false;
        this._pollOffset = 0;
        this._messageFlag = false;   // edge-activated hat flag
        this._hookedGens = new WeakSet();
        this._usedByDefs = new WeakMap();
        this._cbCounter = 0;
        this._setupGeneratorHooks();
    }

    // ─── MicroPython Code Generation & Hardware Board Integration ──────────────

    _detectBoardId () {
        try {
            if (typeof window !== 'undefined' && window.rivenstore && typeof window.rivenstore.getState === 'function') {
                const st = window.rivenstore.getState();
                const sb = st && st.scratchGui && st.scratchGui.kittenblock && st.scratchGui.kittenblock.selectedBoard;
                if (sb && sb.id) return sb.id;
            }
        } catch (e) {}
        return 'futureboard@kext';
    }

    _syncCategoryMasterExt (rt) {
        if (!rt || !rt._blockInfo) return;
        const boardId = this._detectBoardId();
        const list = typeof rt._blockInfo.values === 'function'
            ? Array.from(rt._blockInfo.values())
            : (Array.isArray(rt._blockInfo) ? rt._blockInfo : []);
        for (const bi of list) {
            if (bi && bi.id === EXT_ID) {
                bi.masterExt = boardId;
            }
        }
    }

    _restoreBlockColors () {
        try {
            if (typeof window === 'undefined' || !window.ws || typeof window.ws.getAllBlocks !== 'function') return;
            const blocks = window.ws.getAllBlocks();
            for (const b of blocks) {
                if (b && b.type && b.type.startsWith(EXT_ID + '_') && b.svgPath_) {
                    const curFill = b.svgPath_.getAttribute('fill') || '';
                    if (curFill.includes('url(#')) {
                        b.svgPath_.setAttribute('fill', b.colour_ || '#33CCFF');
                        b.svgPath_.setAttribute('stroke', b.colourTertiary_ || '#1E90CC');
                        b.svgPath_.setAttribute('fill-opacity', '1');
                        b.oldTertiary_ = null;
                    }
                }
            }
        } catch (e) {}
    }

    _setupGeneratorHooks () {
        const tryHookAll = () => {
            const rts = [
                this.runtime,
                typeof window !== 'undefined' && window.vm && window.vm.runtime
            ].filter(Boolean);
            for (const rt of rts) {
                this._syncCategoryMasterExt(rt);
                const pe = rt.peripheralExtensions || {};
                Object.keys(pe).forEach((k) => {
                    const ext = pe[k];
                    if (ext && ext.gen) {
                        this._registerOnGenerator(ext.gen);
                    }
                });
            }
            this._restoreBlockColors();
        };
        tryHookAll();
        if (this.runtime && this.runtime.on) {
            this.runtime.on('HARDWARE_ADDED', () => setTimeout(tryHookAll, 50));
            this.runtime.on('PROJECT_START', () => tryHookAll());
        }
        this._hookTimer = setInterval(tryHookAll, 600);
    }

    _ensureGenDefs (gen, usedMethods) {
        if (!gen.definitions_) gen.definitions_ = {};
        let used = this._usedByDefs.get(gen.definitions_);
        if (!used) {
            used = new Set();
            this._usedByDefs.set(gen.definitions_, used);
        }
        (usedMethods || []).forEach((m) => used.add(m));
        if (used.has('set_polling')) {
            gen.definitions_['import_time'] = 'import time';
        }
        gen.definitions_['kb_tg_helper'] = buildMpyTgHelper(used);
    }

    _pyQuote (val) {
        return JSON.stringify(String(val === undefined || val === null ? '' : val));
    }

    _getStrArg (gen, block, name, defVal) {
        if (block && block.getField && block.getField(name)) {
            return this._pyQuote(block.getFieldValue(name));
        }
        if (block && block.getInputTargetBlock) {
            const tb = block.getInputTargetBlock(name);
            if (!tb) return this._pyQuote(defVal);
            if (tb.type === 'text' && typeof tb.getFieldValue === 'function') {
                return this._pyQuote(tb.getFieldValue('TEXT'));
            }
            if (tb.type && tb.type.includes('_menu_')) {
                try {
                    const mv = tb.inputList && tb.inputList[0] && tb.inputList[0].fieldRow && tb.inputList[0].fieldRow[0] && tb.inputList[0].fieldRow[0].value_;
                    if (mv !== undefined && mv !== null) return this._pyQuote(mv);
                } catch (e) {}
            }
        }
        if (gen && gen.valueToCode && block) {
            const v = gen.valueToCode(block, name, gen.ORDER_NONE || 99);
            if (v !== undefined && v !== null && v !== '') return v;
        }
        return this._pyQuote(defVal);
    }

    _getNumArg (gen, block, name, defVal) {
        if (block && block.getField && block.getField(name)) {
            return String(block.getFieldValue(name));
        }
        if (gen && gen.valueToCode && block) {
            const v = gen.valueToCode(block, name, gen.ORDER_NONE || 99);
            if (v !== undefined && v !== null && v !== '') return v;
        }
        return String(defVal);
    }

    _registerOnGenerator (gen) {
        if (!gen || this._hookedGens.has(gen)) return;
        this._hookedGens.add(gen);

        const menus = [
            'switchstates', 'messagetypes', 'textmessagestates',
            'textmessageentitytypes', 'textmessageentitystates',
            'parsemodes', 'commandstates'
        ];
        menus.forEach((m) => {
            if (gen.registerBlock && gen.dropdownToCode) {
                gen.registerBlock(`${EXT_ID}_menu_${m}`, gen.dropdownToCode.bind(gen));
            }
        });

        const regCmd = (opcode, methods, fn) => {
            gen.registerBlock(`${EXT_ID}_${opcode}`, (g, block) => {
                const targetGen = (g && g.definitions_) ? g : gen;
                const targetBlock = (block && block.type) ? block : g;
                this._ensureGenDefs(targetGen, methods);
                return fn(targetGen, targetBlock) + '\n';
            });
        };

        const regRep = (opcode, methods, fn) => {
            gen.registerBlock(`${EXT_ID}_${opcode}`, (g, block) => {
                const targetGen = (g && g.definitions_) ? g : gen;
                const targetBlock = (block && block.type) ? block : g;
                this._ensureGenDefs(targetGen, methods);
                return [fn(targetGen, targetBlock), targetGen.ORDER_FUNCTION_CALL || 2.2];
            });
        };

        // Setup & Info
        regCmd('block_setbot', ['set_bot'], (g, b) => `_kb_tg.set_bot(${this._getStrArg(g, b, 'TOKEN', '')})`);
        regRep('block_getname', ['get_name'], () => `_kb_tg.get_name()`);
        regRep('block_getusername', ['get_username'], () => `_kb_tg.get_username()`);

        // Receive & Polling
        regCmd('block_setpolling', ['set_polling'], (g, b) => `_kb_tg.set_polling(${this._getStrArg(g, b, 'SW', 'on')})`);
        regCmd('block_pollonce', ['poll_once'], () => `_kb_tg.poll_once()`);

        // HAT block: When message received -> generates callback function & registers via _kb_tg.on_msg()
        gen.registerBlock(`${EXT_ID}_block_whenmessagereceived`, (g, block) => {
            const targetGen = (g && g.definitions_) ? g : gen;
            const targetBlock = (block && block.type) ? block : g;
            this._ensureGenDefs(targetGen, ['on_msg']);
            const nextBlock = targetBlock && targetBlock.nextConnection && targetBlock.nextConnection.targetBlock && targetBlock.nextConnection.targetBlock();
            let body = nextBlock && targetGen.blockToCode ? targetGen.blockToCode(nextBlock) : '';
            if (!body || !String(body).trim()) body = 'pass\n';
            const lines = String(body).replace(/\r\n/g, '\n').split('\n');
            if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
            const ind = targetGen.INDENT || '  ';
            const globals = (targetGen.getVarGlobals && targetGen.getVarGlobals()) || '';
            const gLine = globals ? (ind + globals + '\n') : '';
            const indented = lines.map((l) => ind + l).join('\n');
            const rawId = (targetBlock && targetBlock.id) ? String(targetBlock.id).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 8) : String(++this._cbCounter);
            const fnName = `_kb_tg_on_msg_${rawId || '1'}`;
            targetGen.definitions_[`kb_tg_cb_${fnName}`] = `def ${fnName}():\n${gLine}${indented}\n_kb_tg.on_msg(${fnName})`;
            return null;
        });

        regRep('block_receivedmessageis', ['msg_is'], (g, b) => `_kb_tg.msg_is(${this._getStrArg(g, b, 'TYPE', 'text')})`);
        regRep('block_getreceivedtextmessagestate', ['msg_prop'], (g, b) => `_kb_tg.msg_prop(${this._getStrArg(g, b, 'STATE', 'text')})`);
        regRep('block_getreceivedtextmessageentitiescount', ['ent_cnt'], () => `_kb_tg.ent_cnt()`);
        regRep('block_receivedtextmessageentityis', ['ent_is'], (g, b) => `_kb_tg.ent_is(${this._getNumArg(g, b, 'INDEX', 1)}, ${this._getStrArg(g, b, 'TYPE', 'bot_command')})`);
        regRep('block_getreceivedtextmessageentitystate', ['ent_prop'], (g, b) => `_kb_tg.ent_prop(${this._getNumArg(g, b, 'INDEX', 1)}, ${this._getStrArg(g, b, 'STATE', 'type')})`);
        regCmd('block_forwardreceivedmessage', ['fwd_msg'], (g, b) => `_kb_tg.fwd_msg(${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'NOTIF', 'on')})`);

        // Send Text & Media
        regCmd('block_sendmessage', ['send_msg'], (g, b) => `_kb_tg.send_msg(${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'TEXT', 'Hi')}, ${this._getStrArg(g, b, 'PARSE', 'none')}, ${this._getStrArg(g, b, 'NOTIF', 'on')}, ${this._getNumArg(g, b, 'MSGID', 0)})`);
        regRep('block_lasttextmessageid', ['last_id'], () => `_kb_tg.last_id('text')`);

        regCmd('block_sendphoto', ['send_media'], (g, b) => `_kb_tg.send_media('sendPhoto', 'photo', ${this._getStrArg(g, b, 'PHOTO', '')}, ${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'CAPTION', '')}, ${this._getStrArg(g, b, 'PARSE', 'none')}, ${this._getStrArg(g, b, 'NOTIF', 'on')}, ${this._getNumArg(g, b, 'MSGID', 0)}, 'photo')`);
        regRep('block_lastphotoid', ['last_id'], () => `_kb_tg.last_id('photo')`);

        regCmd('block_sendaudio', ['send_media'], (g, b) => `_kb_tg.send_media('sendAudio', 'audio', ${this._getStrArg(g, b, 'AUDIO', '')}, ${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'CAPTION', '')}, ${this._getStrArg(g, b, 'PARSE', 'none')}, ${this._getStrArg(g, b, 'NOTIF', 'on')}, ${this._getNumArg(g, b, 'MSGID', 0)}, 'audio')`);
        regRep('block_lastaudioid', ['last_id'], () => `_kb_tg.last_id('audio')`);

        regCmd('block_sendvideo', ['send_media'], (g, b) => `_kb_tg.send_media('sendVideo', 'video', ${this._getStrArg(g, b, 'VIDEO', '')}, ${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'CAPTION', '')}, ${this._getStrArg(g, b, 'PARSE', 'none')}, ${this._getStrArg(g, b, 'NOTIF', 'on')}, ${this._getNumArg(g, b, 'MSGID', 0)}, 'video')`);
        regRep('block_lastvideoid', ['last_id'], () => `_kb_tg.last_id('video')`);

        regCmd('block_sendanimation', ['send_media'], (g, b) => `_kb_tg.send_media('sendAnimation', 'animation', ${this._getStrArg(g, b, 'ANIMATION', '')}, ${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'CAPTION', '')}, ${this._getStrArg(g, b, 'PARSE', 'none')}, ${this._getStrArg(g, b, 'NOTIF', 'on')}, ${this._getNumArg(g, b, 'MSGID', 0)}, 'animation')`);
        regRep('block_lastanimationid', ['last_id'], () => `_kb_tg.last_id('animation')`);

        regCmd('block_sendvoice', ['send_media'], (g, b) => `_kb_tg.send_media('sendVoice', 'voice', ${this._getStrArg(g, b, 'VOICE', '')}, ${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'CAPTION', '')}, ${this._getStrArg(g, b, 'PARSE', 'none')}, ${this._getStrArg(g, b, 'NOTIF', 'on')}, ${this._getNumArg(g, b, 'MSGID', 0)}, 'voice')`);
        regRep('block_lastvoiceid', ['last_id'], () => `_kb_tg.last_id('voice')`);

        regCmd('block_senddocument', ['send_media'], (g, b) => `_kb_tg.send_media('sendDocument', 'document', ${this._getStrArg(g, b, 'DOCUMENT', '')}, ${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'CAPTION', '')}, ${this._getStrArg(g, b, 'PARSE', 'none')}, ${this._getStrArg(g, b, 'NOTIF', 'on')}, ${this._getNumArg(g, b, 'MSGID', 0)}, 'document')`);
        regRep('block_lastdocumentid', ['last_id'], () => `_kb_tg.last_id('document')`);

        regCmd('block_sendlocation', ['send_loc'], (g, b) => `_kb_tg.send_loc(${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getNumArg(g, b, 'LATITUDE', 25.021356)}, ${this._getNumArg(g, b, 'LONGITUDE', 121.525577)})`);
        regCmd('block_sendcontact', ['send_contact'], (g, b) => `_kb_tg.send_contact(${this._getStrArg(g, b, 'CHATID', '0')}, ${this._getStrArg(g, b, 'PHONE', '0223681604')}, ${this._getStrArg(g, b, 'FNAME', 'Gmii')}, ${this._getStrArg(g, b, 'LNAME', '')})`);

        // Commands
        regRep('block_getcommandcount', ['cmd_cnt'], () => `_kb_tg.cmd_cnt()`);
        regRep('block_getcommandstate', ['cmd_prop'], (g, b) => `_kb_tg.cmd_prop(${this._getNumArg(g, b, 'INDEX', 1)}, ${this._getStrArg(g, b, 'STATE', 'command')})`);
        regCmd('block_setcommand', ['set_cmd'], (g, b) => `_kb_tg.set_cmd(${this._getStrArg(g, b, 'COMMAND', 'start')}, ${this._getStrArg(g, b, 'DESCRIPTION', 'start bot')})`);
        regCmd('block_removecommand', ['rm_cmd'], (g, b) => `_kb_tg.rm_cmd(${this._getNumArg(g, b, 'INDEX', 1)})`);
        regCmd('block_clearcommand', ['clr_cmd'], () => `_kb_tg.clr_cmd()`);
    }

    // ─── Core: Telegram API via fetch ──────────────────────────────────────────

    _request (method, params) {
        const token = this.bot && this.bot.token;
        if (!token) return Promise.reject(new Error('Please set the bot first.'));
        // Use URLSearchParams (application/x-www-form-urlencoded) to avoid CORS preflight
        const body = new URLSearchParams();
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                body.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
            }
        }
        return fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
            method: 'POST',
            body: body
        }).then(r => r.json()).then(json => {
            if (json.ok) return json.result;
            throw new Error(json.description || `Telegram error in ${method}`);
        });
    }

    _requestForm (method, formData) {
        const token = this.bot && this.bot.token;
        if (!token) return Promise.reject(new Error('Please set the bot first.'));
        return fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
            method: 'POST',
            body: formData
        }).then(r => r.json()).then(json => {
            if (json.ok) return json.result;
            throw new Error(json.description || `Telegram error in ${method}`);
        });
    }

    _dataURLtoBlob (dataURL) {
        const parts = dataURL.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const binary = atob(parts[1]);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new Blob([arr], { type: mime });
    }

    // Show a modal file-picker dialog (required by browser security – file input must be triggered by real user click)
    _pickFile (accept) {
        return new Promise((resolve) => {
            // --- Overlay ---
            const ov = document.createElement('div');
            ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:999999;display:flex;align-items:center;justify-content:center;';

            // --- Card ---
            const card = document.createElement('div');
            card.style.cssText = 'background:#fff;padding:28px 32px;border-radius:14px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.4);min-width:280px;font-family:sans-serif;';

            const title = document.createElement('p');
            title.textContent = '📎 選擇要傳送的檔案';
            title.style.cssText = 'font-size:17px;font-weight:bold;color:#333;margin:0 0 22px;';

            // Hidden file input
            const fi = document.createElement('input');
            fi.type = 'file';
            fi.style.display = 'none';
            if (accept) fi.accept = accept;

            // Browse button (real user-click triggers browser file picker)
            const btnPick = document.createElement('button');
            btnPick.textContent = '📁 瀏覽檔案';
            btnPick.style.cssText = 'background:#1E88E5;color:#fff;border:none;padding:11px 22px;border-radius:8px;font-size:15px;cursor:pointer;margin-right:10px;';
            btnPick.onmouseenter = () => { btnPick.style.background = '#1565C0'; };
            btnPick.onmouseleave = () => { btnPick.style.background = '#1E88E5'; };

            const btnCancel = document.createElement('button');
            btnCancel.textContent = '取消';
            btnCancel.style.cssText = 'background:#9E9E9E;color:#fff;border:none;padding:11px 22px;border-radius:8px;font-size:15px;cursor:pointer;';
            btnCancel.onmouseenter = () => { btnCancel.style.background = '#757575'; };
            btnCancel.onmouseleave = () => { btnCancel.style.background = '#9E9E9E'; };

            const cleanup = () => { try { document.body.removeChild(ov); } catch(e) {} };

            btnPick.onclick = () => fi.click();  // User clicks button → user gesture → file picker allowed

            fi.onchange = () => {
                const file = fi.files && fi.files[0];
                cleanup();
                if (!file) { resolve(null); return; }
                const reader = new FileReader();
                reader.onload  = (e) => resolve(e.target.result);  // data URL
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            };

            btnCancel.onclick = () => { cleanup(); resolve(null); };

            card.append(title, fi, btnPick, btnCancel);
            ov.appendChild(card);
            document.body.appendChild(ov);
        });
    }

    // ─── Polling ───────────────────────────────────────────────────────────────

    _getUpdates () {
        const token = this.bot && this.bot.token;
        if (!token) return Promise.resolve([]);
        const offset = this._pollOffset || 0;
        return fetch(
            `${TELEGRAM_API}/bot${token}/getUpdates?offset=${offset}&timeout=20&allowed_updates=%5B%22message%22%5D`
        ).then(r => r.json()).then(json => json.ok ? json.result : []).catch(() => []);
    }

    async _pollLoop () {
        console.log('[TelegramBot] Poll loop started, offset=', this._pollOffset);
        while (this._pollingActive) {
            try {
                const updates = await this._getUpdates();
                for (const update of updates) {
                    this._pollOffset = update.update_id + 1;
                    if (update.message) {
                        console.log('[TelegramBot] ✅ Message received:', update.message.text || '(no text)', '| flag before:', this._messageFlag);
                        if (this.bot) this.bot.received_message = update.message;
                        this._messageFlag = true;
                        // Try all possible startHats key formats
                        if (this.runtime && typeof this.runtime.startHats === 'function') {
                            console.log('[TelegramBot] Calling startHats (TelegramBot_...)');
                            try { this.runtime.startHats('TelegramBot_block_whenmessagereceived', {}); } catch(e) { console.warn('startHats TelegramBot_ failed:', e.message); }
                            try { this.runtime.startHats('telegrambot_block_whenmessagereceived', {}); } catch(e) { console.warn('startHats telegrambot_ failed:', e.message); }
                        } else {
                            console.warn('[TelegramBot] runtime.startHats NOT available! runtime:', typeof this.runtime);
                        }
                    }
                }
            } catch (e) {
                if (this._pollingActive) {
                    console.error('[TelegramBot] Poll error:', e.message || e);
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }
        console.log('[TelegramBot] Poll loop stopped');
    }

    // ─── Helper Getters ────────────────────────────────────────────────────────

    getBot () {
        if (!this.bot) return Promise.reject(new Error('Please set the bot first.'));
        return Promise.resolve(this.bot);
    }

    getReceivedMessage () {
        return this.getBot().then(bot => {
            if (bot.received_message) return bot.received_message;
            throw new Error('No received message from polling.');
        });
    }

    getReceivedTextMessageEntity (index) {
        return this.getReceivedMessage().then(message => {
            if (message.entities && index < message.entities.length) {
                return message.entities[index];
            }
            throw new Error('No entity at that index.');
        });
    }

    getLastTextMessage () {
        return this.getBot().then(bot => {
            if (bot.last_text_message) return bot.last_text_message;
            throw new Error('No sent text message.');
        });
    }

    getLastPhotoMessage () {
        return this.getBot().then(bot => {
            if (bot.last_photo_message) return bot.last_photo_message;
            throw new Error('No sent photo message.');
        });
    }

    getLastAudioMessage () {
        return this.getBot().then(bot => {
            if (bot.last_audio_message) return bot.last_audio_message;
            throw new Error('No sent audio message.');
        });
    }

    getLastVideoMessage () {
        return this.getBot().then(bot => {
            if (bot.last_video_message) return bot.last_video_message;
            throw new Error('No sent video message.');
        });
    }

    getLastAnimationMessage () {
        return this.getBot().then(bot => {
            if (bot.last_animation_message) return bot.last_animation_message;
            throw new Error('No sent animation message.');
        });
    }

    getLastVoiceMessage () {
        return this.getBot().then(bot => {
            if (bot.last_voice_message) return bot.last_voice_message;
            throw new Error('No sent voice message.');
        });
    }

    getLastDocumentMessage () {
        return this.getBot().then(bot => {
            if (bot.last_document_message) return bot.last_document_message;
            throw new Error('No sent document message.');
        });
    }

    getCommands () {
        return this.getBot().then(bot => {
            if (bot.commands) return Promise.resolve(bot.commands);
            return this._request('getMyCommands', {}).then(commands => {
                bot.commands = commands;
                return commands;
            });
        });
    }

    setCommands (commands) {
        return this._request('setMyCommands', { commands }).then(res => {
            if (this.bot) delete this.bot.commands;
            return res;
        });
    }

    // ─── Media helper ──────────────────────────────────────────────────────────

    async _sendMedia (method, mediaParam, mediaValue, chatid, extra, storeKey) {
        // Determine accepted file types for the picker
        const acceptMap = {
            photo: 'image/*', audio: 'audio/*', video: 'video/*',
            animation: 'image/gif,video/mp4', voice: 'audio/*',
            document: '*/*', thumb: 'image/*'
        };
        let value = String(mediaValue || '').trim();
        // If field is empty or still has the default placeholder → open file picker
        if (!value || value === 'https://example.com/file') {
            console.log('[TelegramBot] Opening file picker for', mediaParam);
            value = await this._pickFile(acceptMap[mediaParam] || '*/*');
            if (!value) { console.log('[TelegramBot] File picker cancelled'); return; }
        }
        const params = Object.assign({ chat_id: chatid }, extra);
        if (value.startsWith('data:')) {
            // Local file selected via picker – upload as multipart/form-data
            const ext = (value.split(';')[0].split('/')[1] || 'bin').replace('jpeg','jpg');
            const blob = this._dataURLtoBlob(value);
            const formData = new FormData();
            formData.append('chat_id', String(chatid));
            formData.append(mediaParam, blob, `file.${ext}`);
            for (const [k, v] of Object.entries(extra)) { if (v !== undefined) formData.append(k, String(v)); }
            return this._requestForm(method, formData).then(res => {
                if (this.bot) this.bot[storeKey] = res;
            });
        } else {
            // URL or Telegram file_id
            params[mediaParam] = value;
            return this._request(method, params).then(res => {
                if (this.bot) this.bot[storeKey] = res;
            });
        }
    }

    noop () {}

    getInfo (){
        return {
            id: 'TelegramBot',
            
            name: 'TelegramBot',
            masterExt: this._detectBoardId(),

            color1: '#33CCFF', // block
            color2: '#33CCFF', // background
            color3: '#1E90CC', // border

            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'block_setbot',
                    blockType: BlockType.COMMAND,

                    text: 'Set the bot token [TOKEN]',
                    arguments: {
                        TOKEN: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        }
                    },
                    func: 'block_setbot',
                    sepafter: 36
                },
                {
                    opcode: 'block_getname',
                    blockType: BlockType.REPORTER,

                    text: 'Bot name',
                    func: 'block_getname'
                },
                {
                    opcode: 'block_getusername',
                    blockType: BlockType.REPORTER,

                    text: 'Bot username',
                    func: 'block_getusername',
                    sepafter: 36
                },
                {
                    func: 'noop',
                    blockType: BlockType.DIVLABEL,
                    text: 'Receive'
                },
                // {
                //     opcode: 'block_getupdates',
                //     blockType: BlockType.COMMAND,

                //     text: 'Get updates: offset [OFFSET] limit [LIMIT] (1~100) timeout [TIMEOUT] s',
                //     arguments: {
                //         OFFSET: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 0
                //         },
                //         LIMIT: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 100
                //         },
                //         TIMEOUT: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 0
                //         }
                //     },
                //     func: 'block_getupdates'
                // },
                // {
                //     opcode: 'block_getnumofmessages',
                //     blockType: BlockType.REPORTER,

                //     text: 'Number of messages',
                //     func: 'block_getnumofmessages'
                // },
                // {
                //     opcode: 'block_messageis',
                //     blockType: BlockType.BOOLEAN,

                //     text: 'Message [INDEX] is [TYPE] ?',
                //     arguments: {
                //         INDEX: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 1
                //         },
                //         TYPE: {
                //             type: ArgumentType.STRING,
                //             menu: 'messagetypes',
                //             defaultValue: 'text'
                //         }
                //     },
                //     func: 'block_messageis'
                // },
                // {
                //     opcode: 'block_gettextmessagestate',
                //     blockType: BlockType.REPORTER,

                //     text: 'Text message [INDEX] [STATE]',
                //     arguments: {
                //         INDEX: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 1
                //         },
                //         STATE: {
                //             type: ArgumentType.STRING,
                //             menu: 'textmessagestates',
                //             defaultValue: 'text'
                //         }
                //     },
                //     func: 'block_gettextmessagestate',
                //     sepafter: 36
                // },
                {
                    opcode: 'block_setpolling',
                    blockType: BlockType.COMMAND,

                    text: 'Message polling [SW]',
                    arguments: {
                        SW: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        }
                    },
                    func: 'block_setpolling'
                },
                {
                    opcode: 'block_pollonce',
                    blockType: BlockType.COMMAND,

                    text: 'Check new message once (put in loop)',
                    func: 'block_pollonce'
                },
                {
                    opcode: 'block_whenmessagereceived',
                    blockType: BlockType.HAT,
                    isEdgeActivated: true,

                    text: 'When message received',
                    func: 'block_whenmessagereceived'
                },
                {
                    opcode: 'block_receivedmessageis',
                    blockType: BlockType.BOOLEAN,

                    text: 'Received message is [TYPE] ?',
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'messagetypes',
                            defaultValue: 'text'
                        }
                    },
                    func: 'block_receivedmessageis'
                },
                {
                    opcode: 'block_getreceivedtextmessagestate',
                    blockType: BlockType.REPORTER,

                    text: 'Received text message [STATE]',
                    arguments: {
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'textmessagestates',
                            defaultValue: 'text'
                        }
                    },
                    func: 'block_getreceivedtextmessagestate'
                },
                {
                    opcode: 'block_getreceivedtextmessageentitiescount',
                    blockType: BlockType.REPORTER,

                    text: 'Number of entities in received text message',
                    func: 'block_getreceivedtextmessageentitiescount'
                },
                {
                    opcode: 'block_receivedtextmessageentityis',
                    blockType: BlockType.BOOLEAN,

                    text: 'Received text message entity [INDEX] is [TYPE] ?',
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'textmessageentitytypes',
                            defaultValue: 'bot_command'
                        }
                    },
                    func: 'block_receivedtextmessageentityis'
                },
                {
                    opcode: 'block_getreceivedtextmessageentitystate',
                    blockType: BlockType.REPORTER,

                    text: 'Received text message entity [INDEX] [STATE]',
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'textmessageentitystates',
                            defaultValue: 'type'
                        }
                    },
                    func: 'block_getreceivedtextmessageentitystate'
                },
                {
                    opcode: 'block_forwardreceivedmessage',
                    blockType: BlockType.COMMAND,

                    text: 'Forward received message to chat id/username/channel [CHATID] , notification [NOTIF]',
                    arguments: {
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        }
                    },
                    func: 'block_forwardreceivedmessage',
                    sepafter: 36
                },
                {
                    func: 'noop',
                    blockType: BlockType.DIVLABEL,
                    text: 'Send'
                },
                {
                    opcode: 'block_sendmessage',
                    blockType: BlockType.COMMAND,

                    text: 'Send message [TEXT] parsing through [PARSE] to chat id/username/channel [CHATID] , notification [NOTIF] , reply to message id [MSGID]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hi'
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        PARSE: {
                            type: ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'none'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendmessage',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendphoto',
                    blockType: BlockType.COMMAND,

                    text: 'Send photo [PHOTO] to chat id/username/channel [CHATID] with caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]',
                    arguments: {
                        PHOTO: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        CAPTION: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendphoto'
                },
                {
                    opcode: 'block_lastphotoid',
                    blockType: BlockType.REPORTER,

                    text: 'Sent photo id',
                    func: 'block_lastphotoid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendaudio',
                    blockType: BlockType.COMMAND,

                    text: 'Send audio [AUDIO] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]',
                    arguments: {
                        AUDIO: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendaudio'
                },
                {
                    opcode: 'block_lastaudioid',
                    blockType: BlockType.REPORTER,

                    text: 'Sent audio id',
                    func: 'block_lastaudioid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendvideo',
                    blockType: BlockType.COMMAND,

                    text: 'Send video [VIDEO] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]',
                    arguments: {
                        VIDEO: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendvideo'
                },
                {
                    opcode: 'block_lastvideoid',
                    blockType: BlockType.REPORTER,

                    text: 'Sent video id',
                    func: 'block_lastvideoid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendanimation',
                    blockType: BlockType.COMMAND,

                    text: 'Send animation [ANIMATION] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]',
                    arguments: {
                        ANIMATION: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendanimation'
                },
                {
                    opcode: 'block_lastanimationid',
                    blockType: BlockType.REPORTER,

                    text: 'Sent animation id',
                    func: 'block_lastanimationid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendvoice',
                    blockType: BlockType.COMMAND,

                    text: 'Send voice [VOICE] to chat id/username/channel [CHATID] with caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]',
                    arguments: {
                        VOICE: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        CAPTION: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendvoice'
                },
                {
                    opcode: 'block_lastvoiceid',
                    blockType: BlockType.REPORTER,

                    text: 'Sent voice id',
                    func: 'block_lastvoiceid',
                    sepafter: 36
                },
                {
                    opcode: 'block_senddocument',
                    blockType: BlockType.COMMAND,

                    text: 'Send document [DOCUMENT] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]',
                    arguments: {
                        DOCUMENT: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_senddocument'
                },
                {
                    opcode: 'block_lastdocumentid',
                    blockType: BlockType.REPORTER,

                    text: 'Sent document id',
                    func: 'block_lastdocumentid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendlocation',
                    blockType: BlockType.COMMAND,

                    text: 'Send location latitude [LATITUDE] longitude [LONGITUDE] to chat id/username/channel [CHATID]',
                    arguments: {
                        LATITUDE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 25.021356
                        },
                        LONGITUDE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 121.525577
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        }
                    },
                    func: 'block_sendlocation',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendcontact',
                    blockType: BlockType.COMMAND,

                    text: 'Send contact first name [FNAME] last name [LNAME] phone number [PHONE] to chat id/username/channel [CHATID]',
                    arguments: {
                        FNAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Gmii'
                        },
                        LNAME: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PHONE: {
                            type: ArgumentType.STRING,
                            defaultValue: '0223681604'
                        },
                        CHATID: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        }
                    },
                    func: 'block_sendcontact',
                    sepafter: 36
                },
                {
                    func: 'noop',
                    blockType: BlockType.DIVLABEL,
                    text: 'Command'
                },
                {
                    opcode: 'block_getcommandcount',
                    blockType: BlockType.REPORTER,

                    text: 'Number of commands',
                    func: 'block_getcommandcount'
                },
                {
                    opcode: 'block_getcommandstate',
                    blockType: BlockType.REPORTER,

                    text: 'Command [INDEX] [STATE]',
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'commandstates',
                            defaultValue: 'command'
                        }
                    },
                    func: 'block_getcommandstate'
                },
                {
                    opcode: 'block_setcommand',
                    blockType: BlockType.COMMAND,

                    text: 'Set Command [COMMAND] [DESCRIPTION]',
                    arguments: {
                        COMMAND: {
                            type: ArgumentType.STRING,
                            defaultValue: 'start'
                        },
                        DESCRIPTION: {
                            type: ArgumentType.STRING,
                            defaultValue: 'start bot'
                        }
                    },
                    func: 'block_setcommand'
                },
                {
                    opcode: 'block_removecommand',
                    blockType: BlockType.COMMAND,

                    text: 'Remove Command [INDEX]',
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'block_removecommand'
                },
                {
                    opcode: 'block_clearcommand',
                    blockType: BlockType.COMMAND,

                    text: 'Clear Command',
                    func: 'block_clearcommand',
                    sepafter: 36
                }
            ],
            menus: {
                switchstates: ['on', 'off'],
                messagetypes: ['text', 'sticker', 'photo', 'audio', 'video', 'animation', 'file', 'voice', 'video note', 'location', 'venue', 'contact', 'poll', 'dice', 'game'],
                textmessagestates: ['id', 'text', 'date', 'chat id', 'chat type', 'user/bot id', 'user/bot name', 'user/bot username', 'is bot?'],
                textmessageentitytypes: ['mention', 'hashtag', 'cashtag', 'bot_command', 'url', 'email', 'phone_number', 'bold', 'italic', 'underline', 'strikethrough', 'code', 'pre', 'text_link', 'text_mention'],
                textmessageentitystates: ['type', 'offset', 'length', 'text'],
                parsemodes: ['none', 'Markdown', 'MarkdownV2', 'HTML'],
                commandstates: ['command', 'description']
            },
            translation_map: {
                'zh-tw': {
                    block_setbot: '設定機器人 token [TOKEN]',
                    block_getname: '機器人名稱',
                    block_getusername: '機器人使用者名稱',
                    
                    block_receive: '接收',
                    block_setpolling: '訊息輪詢 [SW]',
                    block_pollonce: '檢查一次新訊息 (放入重複迴圈)',
                    block_whenmessagereceived: '當收到訊息',
                    block_receivedmessageis: '收到的訊息是 [TYPE] ?',
                    block_getreceivedtextmessagestate: '收到的文字訊息的 [STATE]',
                    block_getreceivedtextmessageentitiescount: '收到的文字訊息中特殊實體的數量',
                    block_receivedtextmessageentityis: '收到的文字訊息中第 [INDEX] 個特殊實體是 [TYPE] ?',
                    block_getreceivedtextmessageentitystate: '收到的文字訊息中第 [INDEX] 個特殊實體的 [STATE]',
                    block_forwardreceivedmessage: '轉傳收到的訊息至聊天室ID/使用者名稱/頻道 [CHATID] , 提醒 [NOTIF]',

                    block_send: '發送',
                    block_sendmessage: '發送透過 [PARSE] 解析的文字 [TEXT] 至聊天室ID/使用者名稱/頻道 [CHATID] , 提醒 [NOTIF] , 回覆的訊息ID [MSGID]',
                    block_sendphoto: '發送照片 [PHOTO] 至聊天室ID/使用者名稱/頻道 [CHATID] , 包含透過 [PARSE] 解析的標題 [CAPTION] , 提醒 [NOTIF] , 回覆的訊息ID [MSGID]',
                    block_lastphotoid: '發送的照片ID',
                    block_sendaudio: '發送音訊 [AUDIO] 至聊天室ID/使用者名稱/頻道 [CHATID] , 包含縮圖 [THUMB] , 透過 [PARSE] 解析的標題 [CAPTION] , 提醒 [NOTIF] , 回覆的訊息ID [MSGID]',
                    block_lastaudioid: '發送的音訊ID',
                    block_sendvideo: '發送視訊 [VIDEO] 至聊天室ID/使用者名稱/頻道 [CHATID] , 包含縮圖 [THUMB] , 透過 [PARSE] 解析的標題 [CAPTION] , 提醒 [NOTIF] , 回覆的訊息ID [MSGID]',
                    block_lastvideoid: '發送的視訊ID',
                    block_sendanimation: '發送動畫 [ANIMATION] 至聊天室ID/使用者名稱/頻道 [CHATID] , 包含縮圖 [THUMB] , 透過 [PARSE] 解析的標題 [CAPTION] , 提醒 [NOTIF] , 回覆的訊息ID [MSGID]',
                    block_lastanimationid: '發送的動畫ID',
                    block_sendvoice: '發送語音 [VOICE] 至聊天室ID/使用者名稱/頻道 [CHATID] , 包含透過 [PARSE] 解析的標題 [CAPTION] , 提醒 [NOTIF] , 回覆的訊息ID [MSGID]',
                    block_lastvoiceid: '發送的語音ID',
                    block_senddocument: '發送檔案 [DOCUMENT] 至聊天室ID/使用者名稱/頻道 [CHATID] , 包含縮圖 [THUMB] , 透過 [PARSE] 解析的標題 [CAPTION] , 提醒 [NOTIF] , 回覆的訊息ID [MSGID]',
                    block_lastdocumentid: '發送的檔案ID',
                    block_sendlocation: '發送位置 緯度 [LATITUDE] 經度 [LONGITUDE] 至聊天室ID/使用者名稱/頻道 [CHATID]',
                    block_sendcontact: '發送聯絡資訊 姓 [LNAME] 名 [FNAME] 電話號碼 [PHONE] 至聊天室ID/使用者名稱/頻道 [CHATID]',
                    
                    block_command: '命令',
                    block_getcommandcount: '命令數量',
                    block_getcommandstate: '第 [INDEX] 個命令的 [STATE]',
                    block_setcommand: '設置命令 [COMMAND] 描述 [DESCRIPTION]',
                    block_removecommand: '刪除第 [INDEX] 個命令',
                    block_clearcommand: '清除所有命令',

                    switchstates: {
                        'on': '開', 
                        'off': '關'
                    },
                    messagetypes: {
                        'text': '文字', 
                        'sticker': '表情符號', 
                        'photo': '照片', 
                        'audio': '音訊', 
                        'video': '視訊', 
                        'animation': '動畫', 
                        'file': '檔案', 
                        'voice': '語音', 
                        'video note': '視訊筆記', 
                        'location': '位置', 
                        'venue': '會場', 
                        'contact': '聯絡資訊', 
                        'poll': '投票', 
                        'dice': '骰子', 
                        'game': '遊戲'
                    },
                    textmessagestates: {
                        'id': 'ID', 
                        'text': '文字', 
                        'date': '時間', 
                        'chat id': '聊天室 ID', 
                        'chat type': '聊天室 種類', 
                        'user/bot id': '使用者/機器人 ID', 
                        'user/bot name': '使用者/機器人 名稱', 
                        'user/bot username': '使用者/機器人 使用者名稱', 
                        'is bot?': '是機器人?'
                    },
                    textmessageentitystates: {
                        'type': '種類', 
                        'offset': '開始位置', 
                        'length': '長度', 
                        'text': '文字'
                    },
                    parsemodes: {
                        'none': '無', 
                        'Markdown': 'Markdown', 
                        'MarkdownV2': 'MarkdownV2', 
                        'HTML': 'HTML'},
                    commandstates: {
                        'command': '命令', 
                        'description': '描述'
                    }
                }
            }
        }
    }
    
    /****************************************************************************************************/
    /****************************************************************************************************/
    /****************************************************************************************************/

    getTextMessageProperty (message, state){
        switch (state) {
            case 'text':
                return message.text;
            case 'id':
                return message.message_id;
            case 'date':
                return message.date;
            case 'is bot?':
                return message.from.is_bot;
            case 'user/bot id':
                return message.from.id;
            case 'user/bot name':
                let name = message.from.first_name;
                if (message.from.last_name) {
                    name += ' ' + message.from.last_name;
                }
                return name;
            case 'user/bot username':
                return message.from.username;
            case 'chat id':
                return message.chat.id;
            case 'chat type':
                return message.chat.type;
            default:
                return undefined;
        }
    }

    checkMessageType (message, type){
        switch (type) {
            case 'text':
                return ('text' in message);
            case 'sticker':
                return ('sticker' in message);
            case'photo':
                return ('photo' in message);
            case'audio':
                return ('audio' in message);
            case'video':
                return ('video' in message);
            case'animation':
                return ('animation' in message);
            case'file':
                return ('document' in message);
            case'voice':
                return ('voice' in message);
            case'video note':
                return ('video_note' in message);
            case'location':
                return ('location' in message);
            case'venue':
                return ('venue' in message);
            case'contact':
                return ('contact' in message);
            case'poll':
                return ('poll' in message);
            case'dice':
                return ('dice' in message);
            case'game':
                return ('game' in message);
            default:
                return false;
        }
    }


    /****************************************************************************************************/
    /****************************************************************************************************/
    /****************************************************************************************************/

    block_setbot (args, util) {
        const token = args.TOKEN;
        if (!this.bot || this.bot.token !== token) {
            this._pollingActive = false;
            this._pollOffset = 0;
            this.bot = { token };
            // Step 1: Delete webhook (fix 409 Conflict – can't poll while webhook is active)
            console.log('[TelegramBot] Deleting webhook...');
            return fetch(`${TELEGRAM_API}/bot${token}/deleteWebhook?drop_pending_updates=false`)
                .then(r => r.json())
                .then(d => { console.log('[TelegramBot] deleteWebhook:', d.ok ? 'OK' : d.description); })
                // Step 2: Verify bot
                .then(() => fetch(`${TELEGRAM_API}/bot${token}/getMe`))
                .then(r => r.json())
                .then(json => {
                    if (json.ok && json.result.is_bot) {
                        this.bot.name = json.result.first_name;
                        this.bot.username = json.result.username;
                        this.bot.id = json.result.id;
                        console.log('[TelegramBot] Connected:', json.result.username);
                        // Auto-start polling so users don't need a separate block
                        if (!this._pollingActive) {
                            this._pollingActive = true;
                            this._pollLoop();
                            console.log('[TelegramBot] Auto-started polling');
                        }
                    } else {
                        this.bot = undefined;
                        throw new Error(json.description || 'Invalid bot token');
                    }
                });
        }
    }

    block_getname (args, util) {
        return this._request('getMe', {}).then(res => res.first_name);
    }

    block_getusername (args, util) {
        return this._request('getMe', {}).then(res => res.username);
    }

    block_setpolling (args, util) {
        const sw = args.SW;
        if (!this.bot) return;
        if (sw === 'on') {
            if (!this._pollingActive) {
                this._pollingActive = true;
                console.log('[TelegramBot] Starting custom polling...');
                this._pollLoop();
            } else {
                console.log('[TelegramBot] Already polling');
            }
        } else {
            this._pollingActive = false;
            console.log('[TelegramBot] Polling stopped');
        }
    }

    async block_pollonce (args, util) {
        const token = this.bot && this.bot.token;
        if (!token) return;
        try {
            const offset = this._pollOffset || 0;
            const res = await fetch(`${TELEGRAM_API}/bot${token}/getUpdates?offset=${offset}&timeout=0&limit=5&allowed_updates=%5B%22message%22%5D`);
            const json = await res.json();
            if (json && json.ok && Array.isArray(json.result)) {
                for (const update of json.result) {
                    this._pollOffset = update.update_id + 1;
                    if (update.message) {
                        this.bot.received_message = update.message;
                        this._messageFlag = true;
                        if (this.runtime && typeof this.runtime.startHats === 'function') {
                            try { this.runtime.startHats('TelegramBot_block_whenmessagereceived', {}); } catch (e) {}
                            try { this.runtime.startHats('telegrambot_block_whenmessagereceived', {}); } catch (e) {}
                        }
                    }
                }
            }
        } catch (e) {}
    }

    block_whenmessagereceived (args, util) {
        // Called every frame by runtime (isEdgeActivated:true)
        if (this._messageFlag) {
            console.log('[TelegramBot] 🔔 Hat triggered! Resetting flag.');
            this._messageFlag = false;
            return true;
        }
        return false;
    }

    block_receivedmessageis (args, util) {
        const type = args.TYPE;
        return this.getReceivedMessage().then(message => this.checkMessageType(message, type));
    }

    block_getreceivedtextmessagestate (args, util) {
        const state = args.STATE;
        return this.getReceivedMessage().then(message => this.getTextMessageProperty(message, state));
    }

    block_getreceivedtextmessageentitiescount (args, util) {
        return this.getReceivedMessage().then(message => {
            if (message.entities) return message.entities.length;
            return 0;
        });
    }

    block_receivedtextmessageentityis (args, util) {
        const index = parseInt(args.INDEX);
        const type = args.TYPE;
        return this.getReceivedTextMessageEntity(index - 1).then(entity => entity.type === type);
    }

    block_getreceivedtextmessageentitystate (args, util) {
        const index = parseInt(args.INDEX);
        const state = args.STATE;
        return this.getReceivedTextMessageEntity(index - 1).then(entity => {
            if (state === 'text') {
                return this.getReceivedMessage().then(message => {
                    const text = this.getTextMessageProperty(message, 'text');
                    return text.substr(entity.offset, entity.length);
                });
            }
            return entity[state];
        });
    }

    block_forwardreceivedmessage (args, util) {
        const chatid = args.CHATID;
        const notification = args.NOTIF === 'on';
        return this.getReceivedMessage().then(message => {
            const fromchatid = this.getTextMessageProperty(message, 'chat id');
            const messageid  = this.getTextMessageProperty(message, 'id');
            const params = { chat_id: chatid, from_chat_id: fromchatid, message_id: messageid };
            if (!notification) params.disable_notification = true;
            return this._request('forwardMessage', params);
        });
    }

    block_sendmessage (args, util) {
        const params = { chat_id: args.CHATID, text: args.TEXT };
        if (args.PARSE !== 'none') params.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') params.disable_notification = true;
        if (parseInt(args.MSGID) > 0) params.reply_to_message_id = parseInt(args.MSGID);
        return this._request('sendMessage', params).then(res => {
            if (this.bot) this.bot.last_text_message = res;
        });
    }

    block_lasttextmessageid (args, util) {
        return this.getLastTextMessage().then(m => m.message_id);
    }

    block_sendphoto (args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendPhoto', 'photo', args.PHOTO, args.CHATID, extra, 'last_photo_message');
    }

    block_lastphotoid (args, util) {
        return this.getLastPhotoMessage().then(m => m.photo[m.photo.length - 1].file_id);
    }

    block_sendaudio (args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendAudio', 'audio', args.AUDIO, args.CHATID, extra, 'last_audio_message');
    }

    block_lastaudioid (args, util) {
        return this.getLastAudioMessage().then(m => m.audio.file_id);
    }

    block_sendvideo (args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendVideo', 'video', args.VIDEO, args.CHATID, extra, 'last_video_message');
    }

    block_lastvideoid (args, util) {
        return this.getLastVideoMessage().then(m => m.video.file_id);
    }

    block_sendanimation (args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendAnimation', 'animation', args.ANIMATION, args.CHATID, extra, 'last_animation_message');
    }

    block_lastanimationid (args, util) {
        return this.getLastAnimationMessage().then(m => m.animation.file_id);
    }

    block_sendvoice (args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendVoice', 'voice', args.VOICE, args.CHATID, extra, 'last_voice_message');
    }

    block_lastvoiceid (args, util) {
        return this.getLastVoiceMessage().then(m => m.voice.file_id);
    }

    block_senddocument (args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendDocument', 'document', args.DOCUMENT, args.CHATID, extra, 'last_document_message');
    }

    block_lastdocumentid (args, util) {
        return this.getLastDocumentMessage().then(m => m.document.file_id);
    }

    block_sendlocation (args, util) {
        return this._request('sendLocation', {
            chat_id: args.CHATID,
            latitude: parseFloat(args.LATITUDE),
            longitude: parseFloat(args.LONGITUDE)
        });
    }

    block_sendcontact (args, util) {
        const params = {
            chat_id: args.CHATID,
            phone_number: args.PHONE,
            first_name: args.FNAME
        };
        if (args.LNAME && args.LNAME.length > 0) params.last_name = args.LNAME;
        return this._request('sendContact', params);
    }

    block_getcommandcount (args, util) {
        return this.getCommands().then(commands => commands.length);
    }

    block_getcommandstate (args, util) {
        const index = parseInt(args.INDEX);
        const state = args.STATE;
        return this.getCommands().then(commands => {
            const cmd = commands[index - 1];
            if (!cmd) throw new Error('Command index out of range.');
            return cmd[state];
        });
    }

    block_setcommand (args, util) {
        const command     = args.COMMAND;
        const description = args.DESCRIPTION;
        return this.getCommands().then(commands => {
            const existing = commands.find(c => c.command === command);
            if (existing) {
                existing.description = description;
            } else {
                commands.push({ command, description });
            }
            return this.setCommands(commands);
        });
    }

    block_removecommand (args, util) {
        const index = parseInt(args.INDEX);
        return this.getCommands().then(commands => {
            commands.splice(index - 1, 1);
            return this.setCommands(commands);
        });
    }

    block_clearcommand (args, util) {
        return this.setCommands([]);
    }
}

module.exports = TelegramBotExtension;
