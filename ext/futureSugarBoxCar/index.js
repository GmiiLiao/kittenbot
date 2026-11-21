/* 未來板 (FutureBoard ESP32) + 方糖盒 (SugarBox) 零飄移航向鎖定與雙編碼馬達差速同步擴展插件
 * 支援：
 *   1. 線上即時互動模式 (透過未來板 REPL 即時執行 MicroPython)
 *   2. MicroPython 按需精簡程式碼生成與上傳模式 (只輸出有用到的函式，節省主控器空間，並標記 masterExt 避免代碼模式積木變灰)
 */
const EXT_ID = 'futureSugarBoxCar';

const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#0B7A6B"/><circle cx="64" cy="64" r="44" fill="#072227" stroke="#4AE2C0" stroke-width="6"/><polygon points="64,22 50,78 64,68 78,78" fill="#FFD60A"/><circle cx="64" cy="64" r="6" fill="#FFFFFF"/></svg>';
const menuIconURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg);

const MPY_HEADER = [
  "class _KBSugarBoxHeadingCar:",
  " def __init__(s):",
  "  s.em=s.ml=s.mr=s.pl=s.pr=None;s.lid,s.rid,s.ld,s.rd=1,2,-1,1;s.wd,s.wc,s.ax,s.tg,s.uc=6.6,20.7345,14.2,1.0,False",
  "  s.kpy,s.kiy,s.kdy,s.kpe=6.0,0.08,1.5,2.2;s.yz=s.ho=s.fy=s.iy=s.le=s.al=s.ar=s.dl0=s.dr0=0.0"
];
const MPY_FOOTER = ["_kb_sb_car=_KBSugarBoxHeadingCar()"];
const MPY_METHODS = {
  _w: { deps: [], code: [
    " def _w(s,d):return((float(d)+180.0)%360.0)-180.0"
  ]},
  _rh: { deps: [], code: [
    " def _rh(s):",
    "  try:from future import sensor as _f;return float(_f.heading())%360.0",
    "  except Exception:return 0.0"
  ]},
  sb_init: { deps: ['_upd', 'sb_reset_heading', 'sb_reset_encoders'], code: [
    " def sb_init(s,l_port=1,l_dir=-1,r_port=2,r_dir=1,wheel_cm=6.6,axle_cm=14.2,use_comp=0,turn_gain=1.0):",
    "  import math,time",
    "  s.lid,s.rid=int(l_port),int(r_port);s.ld=1 if int(l_dir)>=0 else -1;s.rd=1 if int(r_dir)>=0 else -1",
    "  s.wd=max(1.0,float(wheel_cm));s.wc=math.pi*s.wd;s.ax=max(1.0,float(axle_cm));s.tg=max(0.1,float(turn_gain));s.uc=bool(int(use_comp))",
    "  try:",
    "   from encoderMotor import EncoderMotor;em=EncoderMotor('P2','P12',timeout_ms=25)",
    "   q1=em.quick_query(s.lid);time.sleep_ms(12);q2=em.quick_query(s.rid);time.sleep_ms(12);s.em=em",
    "   if q1 or q2:",
    "    try:em.set_mode(2,s.lid);time.sleep_ms(8);em.set_mode(2,s.rid);time.sleep_ms(8);em.set_mode(2,0xFD);time.sleep_ms(8)",
    "    except Exception:pass",
    "  except Exception:",
    "   import sugarbox;s.em=None;s.ml=sugarbox.EMotor(s.lid);s.mr=sugarbox.EMotor(s.rid)",
    "  s.pl=s.pr=None;s.al=s.ar=0.0;s._upd();s.sb_reset_heading();s.sb_reset_encoders()"
  ]},
  sb_set_pid: { deps: [], code: [
    " def sb_set_pid(s,kp_yaw,ki_yaw,kd_yaw,kp_enc,turn_gain=None):",
    "  s.kpy,s.kiy,s.kdy,s.kpe=float(kp_yaw),float(ki_yaw),float(kd_yaw),float(kp_enc)",
    "  if turn_gain is not None:s.tg=max(0.1,float(turn_gain))",
    "  s.iy=s.le=0.0"
  ]},
  _rp: { deps: ['sb_init'], code: [
    " def _rp(s):",
    "  import time",
    "  if s.em is None and s.ml is None:s.sb_init()",
    "  if s.em is not None:",
    "   p1=s.em.get_position(s.lid);time.sleep_ms(10);p2=s.em.get_position(s.rid);time.sleep_ms(8);return p1,p2",
    "  return s.ml.get_degree(),s.mr.get_degree()"
  ]},
  _upd: { deps: ['_rp', '_w'], code: [
    " def _upd(s):",
    "  try:",
    "   p1,p2=s._rp()",
    "   if p1 is not None:",
    "    p1=float(p1)",
    "    if s.pl is None:s.pl=p1",
    "    dl=p1-s.pl",
    "    if abs(dl)>180.0:dl=s._w(dl)",
    "    s.pl=p1;s.al+=dl*s.ld",
    "   if p2 is not None:",
    "    p2=float(p2)",
    "    if s.pr is None:s.pr=p2",
    "    dr=p2-s.pr",
    "    if abs(dr)>180.0:dr=s._w(dr)",
    "    s.pr=p2;s.ar+=dr*s.rd",
    "  except Exception:pass"
  ]},
  sb_reset_heading: { deps: ['_upd', '_rh'], code: [
    " def sb_reset_heading(s):",
    "  import math,time;s._upd();s.ho=s.al-s.ar;ss=sc=0.0",
    "  for _ in range(5):h=s._rh();ss+=math.sin(math.radians(h));sc+=math.cos(math.radians(h));time.sleep_ms(10)",
    "  s.yz=math.degrees(math.atan2(ss,sc))%360.0;s.fy=s.iy=s.le=0.0"
  ]},
  sb_reset_encoders: { deps: ['_upd'], code: [
    " def sb_reset_encoders(s):s._upd();s.dl0,s.dr0=s.al,s.ar"
  ]},
  sb_get_compass_yaw: { deps: ['_w', '_rh'], code: [
    " def sb_get_compass_yaw(s):",
    "  raw=s._w(s._rh()-s.yz);s.fy=s._w(s.fy+0.35*s._w(raw-s.fy));return round(s.fy,2)"
  ]},
  sb_wheel_degs: { deps: ['_upd'], code: [
    " def sb_wheel_degs(s,refresh=True):",
    "  if refresh:s._upd()",
    "  return round(s.al-s.dl0,2),round(s.ar-s.dr0,2)"
  ]},
  sb_get_enc_yaw: { deps: ['_upd'], code: [
    " def sb_get_enc_yaw(s,refresh=False):",
    "  if refresh:s._upd()",
    "  dn=2.0*(s.ax/s.wd)*s.tg",
    "  return round(((s.al-s.ar)-s.ho)/dn,2) if dn>0 else 0.0"
  ]},
  sb_get_fused_yaw: { deps: ['sb_get_enc_yaw', 'sb_get_compass_yaw', '_w'], code: [
    " def sb_get_fused_yaw(s,refresh=False):",
    "  ey=s.sb_get_enc_yaw(refresh)",
    "  if not s.uc:return ey",
    "  try:from future import sensor as _f;ok=(getattr(_f,'mid_x',0)!=0)or(getattr(_f,'mid_y',0)!=0)",
    "  except Exception:ok=False",
    "  if not ok:return ey",
    "  df=s._w(s.sb_get_compass_yaw()-ey)",
    "  return ey if abs(df)>20.0 else round(ey+0.15*df,2)"
  ]},
  sb_get_dist_cm: { deps: ['sb_wheel_degs'], code: [
    " def sb_get_dist_cm(s,refresh=False):",
    "  dl,dr=s.sb_wheel_degs(refresh);return round((0.5*(dl+dr)/360.0)*s.wc,2)"
  ]},
  sb_set_rpm: { deps: ['sb_init'], code: [
    " def sb_set_rpm(s,l_dps,r_dps):",
    "  import time",
    "  if s.em is None and s.ml is None:s.sb_init()",
    "  l=int(max(-700.0,min(700.0,float(l_dps)))*s.ld);r=int(max(-700.0,min(700.0,float(r_dps)))*s.rd)",
    "  if s.em is not None:s.em.set_speed(s.lid,l,0);time.sleep_ms(8);s.em.set_speed(s.rid,r,0);time.sleep_ms(8)",
    "  else:s.ml.run(speed=l/6.0);s.mr.run(speed=r/6.0)"
  ]},
  sb_stop: { deps: [], code: [
    " def sb_stop(s):",
    "  import time",
    "  if s.em is not None:s.em.set_speed(s.lid,0,0);time.sleep_ms(8);s.em.set_speed(s.rid,0,0);time.sleep_ms(8)",
    "  elif s.ml is not None:s.ml.stop();s.mr.stop()"
  ]},
  sb_straight_step: { deps: ['_upd', 'sb_get_fused_yaw', 'sb_set_rpm'], code: [
    " def sb_straight_step(s,base_dps=240,target_yaw=0.0):",
    "  s._upd();ey=float(target_yaw)-s.sb_get_fused_yaw(False);s.iy=max(-120.0,min(120.0,s.iy+ey));dy=ey-s.le;s.le=ey",
    "  c=s.kpy*ey+s.kiy*s.iy+s.kdy*dy;mc=max(60.0,abs(float(base_dps))*0.65);c=max(-mc,min(mc,c))",
    "  s.sb_set_rpm(float(base_dps)+c,float(base_dps)-c)"
  ]},
  sb_move_cm: { deps: ['sb_reset_encoders', 'sb_get_dist_cm', 'sb_straight_step', 'sb_stop', '_upd'], code: [
    " def sb_move_cm(s,target_yaw,dist_cm,speed_dps=240):",
    "  import time;d,sp=float(dist_cm),abs(float(speed_dps))",
    "  if d==0 or sp==0:return",
    "  s.sb_reset_encoders();s.iy=s.le=0.0;sd=sp if d>0 else -sp;ta=abs(d)",
    "  try:",
    "   while True:",
    "    rm=ta-abs(s.sb_get_dist_cm(False))",
    "    if rm<=0.2:break",
    "    s.sb_straight_step(sd*min(1.0,max(0.32,rm/4.0)),target_yaw);time.sleep_ms(10)",
    "  finally:s.sb_stop();s._upd()"
  ]},
  sb_move_sec: { deps: ['sb_reset_encoders', 'sb_straight_step', 'sb_stop', '_upd'], code: [
    " def sb_move_sec(s,target_yaw,sec,speed_dps=240):",
    "  import time;ms=int(float(sec)*1000)",
    "  if ms<=0:return",
    "  s.sb_reset_encoders();s.iy=s.le=0.0;t0=time.ticks_ms()",
    "  try:",
    "   while time.ticks_diff(time.ticks_ms(),t0)<ms:s.sb_straight_step(speed_dps,target_yaw);time.sleep_ms(10)",
    "  finally:s.sb_stop();s._upd()"
  ]},
  sb_turn_to_yaw: { deps: ['_upd', 'sb_get_fused_yaw', 'sb_stop', 'sb_set_rpm'], code: [
    " def sb_turn_to_yaw(s,target_yaw,max_dps=200,tol=0.35,timeout_ms=5000):",
    "  import time;ty=float(target_yaw);mr=max(60.0,min(500.0,abs(float(max_dps))));t0=time.ticks_ms()",
    "  if s.em is not None:",
    "   for _ in range(3):",
    "    s._upd();er=ty-s.sb_get_fused_yaw(False)",
    "    if abs(er)<=float(tol):break",
    "    wdeg=int(round(abs(er)*(s.ax/s.wd)*s.tg))",
    "    if wdeg<1:break",
    "    sp=int(max(55.0,min(mr,abs(er)*4.5+35.0)));sgn=1 if er>0 else -1",
    "    try:",
    "     s.em.set_mode(2,s.lid);time.sleep_ms(5);s.em.set_mode(2,s.rid);time.sleep_ms(5)",
    "     s.em.set_position_speed(s.lid,wdeg*sgn*s.ld,sp);time.sleep_ms(6)",
    "     s.em.set_position_speed(s.rid,-wdeg*sgn*s.rd,sp)",
    "     wt=int((wdeg/float(sp))*1000.0)+140;w0=time.ticks_ms()",
    "     while time.ticks_diff(time.ticks_ms(),w0)<wt:s._upd();time.sleep_ms(12)",
    "    except Exception:break",
    "  ok=0;le=0.0;it=0.0",
    "  try:",
    "   while time.ticks_diff(time.ticks_ms(),t0)<int(timeout_ms):",
    "    s._upd();er=ty-s.sb_get_fused_yaw(False);dr=er-le;le=er",
    "    if abs(er)<=float(tol):",
    "     s.sb_stop();ok+=1",
    "     if ok>=2:break",
    "    else:",
    "     ok=0;it=max(-30.0,min(30.0,it+er));sp=max(42.0,min(mr,abs(4.8*er+0.35*it+1.2*dr)))",
    "     if er>0:s.sb_set_rpm(sp,-sp)",
    "     else:s.sb_set_rpm(-sp,sp)",
    "    time.sleep_ms(10)",
    "  finally:s.sb_stop();s._upd()"
  ]},
  sb_turn_by_deg: { deps: ['_upd', 'sb_get_fused_yaw', 'sb_turn_to_yaw'], code: [
    " def sb_turn_by_deg(s,delta_deg,max_dps=200):",
    "  s._upd();s.sb_turn_to_yaw(s.sb_get_fused_yaw(False)+float(delta_deg),max_dps)"
  ]}
};
const MPY_ORDER = Object.keys(MPY_METHODS);
function buildMpyHelper(usedSet) {
  const active = new Set();
  const add = (k) => {
    if (active.has(k) || !MPY_METHODS[k]) return;
    active.add(k);
    (MPY_METHODS[k].deps || []).forEach(add);
  };
  usedSet.forEach(add);
  const lines = [...MPY_HEADER];
  for (const k of MPY_ORDER) {
    if (active.has(k)) lines.push(...MPY_METHODS[k].code);
  }
  lines.push(...MPY_FOOTER);
  return lines.join('\n');
}
const MPY_HELPER_DEF = buildMpyHelper(new Set(MPY_ORDER));

class FutureSugarBoxCarExtension {
  constructor(runtime) {
    this.runtime = runtime;
    this.EXTENSION_ID = EXT_ID;
    this.helpersReady = false;
    this._hookedGens = new WeakSet();
    this._usedByDefs = new WeakMap();
    this._setupGeneratorHooks();
  }

  noop() {}

  _syncCategoryMasterExt(rt) {
    if (!rt || !rt._blockInfo) return;
    const list = typeof rt._blockInfo.values === 'function'
      ? Array.from(rt._blockInfo.values())
      : (Array.isArray(rt._blockInfo) ? rt._blockInfo : []);
    for (const bi of list) {
      if (bi && bi.id === EXT_ID && !bi.masterExt) {
        bi.masterExt = 'futureboard@kext';
      }
    }
  }

  _restoreBlockColors() {
    try {
      if (typeof window === 'undefined' || !window.ws || typeof window.ws.getAllBlocks !== 'function') return;
      const blocks = window.ws.getAllBlocks();
      for (const b of blocks) {
        if (b && b.type && b.type.startsWith(EXT_ID + '_') && b.svgPath_) {
          const curFill = b.svgPath_.getAttribute('fill') || '';
          if (curFill.includes('url(#')) {
            b.svgPath_.setAttribute('fill', b.colour_ || '#0F9D8A');
            b.svgPath_.setAttribute('stroke', b.colourTertiary_ || '#085E52');
            b.svgPath_.setAttribute('fill-opacity', '1');
            b.oldTertiary_ = null;
          }
        }
      }
    } catch (e) {}
  }

  _setupGeneratorHooks() {
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

  _getArg(gen, block, name, defVal) {
    if (block && block.getField && block.getField(name)) {
      return block.getFieldValue(name);
    }
    if (gen && gen.valueToCode && block) {
      const v = gen.valueToCode(block, name, gen.ORDER_NONE || 99);
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return defVal;
  }

  _ensureGenDefs(gen, usedMethods) {
    if (!gen.definitions_) gen.definitions_ = {};
    let used = this._usedByDefs.get(gen.definitions_);
    if (!used) {
      used = new Set();
      this._usedByDefs.set(gen.definitions_, used);
    }
    (usedMethods || []).forEach((m) => used.add(m));
    gen.definitions_['import_time'] = 'import time';
    gen.definitions_['import_math'] = 'import math';
    gen.definitions_['kb_sb_car_helper'] = buildMpyHelper(used);
  }

  _registerOnGenerator(gen) {
    if (!gen || this._hookedGens.has(gen)) return;
    this._hookedGens.add(gen);

    const menus = ['DIR_SIGN', 'SB_EM_PORT', 'SB_COMP_MODE'];
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

    regCmd('sbCarInit', ['sb_init'], (g, b) => {
      const lp = this._getArg(g, b, 'L_PORT', '1');
      const ld = this._getArg(g, b, 'L_DIR', '-1');
      const rp = this._getArg(g, b, 'R_PORT', '2');
      const rd = this._getArg(g, b, 'R_DIR', '1');
      const wd = this._getArg(g, b, 'WHEEL_CM', '6.6');
      const ax = this._getArg(g, b, 'AXLE_CM', '14.2');
      const cm = this._getArg(g, b, 'COMP', '0');
      const tg = this._getArg(g, b, 'TURN_GAIN', '1.0');
      return `_kb_sb_car.sb_init(${lp}, ${ld}, ${rp}, ${rd}, ${wd}, ${ax}, ${cm}, ${tg})`;
    });
    regCmd('sbCarResetHeading', ['sb_reset_heading'], () => `_kb_sb_car.sb_reset_heading()`);
    regCmd('sbCarResetEncoders', ['sb_reset_encoders'], () => `_kb_sb_car.sb_reset_encoders()`);
    regCmd('sbCarSetPid', ['sb_set_pid'], (g, b) => {
      const kpy = this._getArg(g, b, 'KP_YAW', '6.0');
      const kiy = this._getArg(g, b, 'KI_YAW', '0.08');
      const kdy = this._getArg(g, b, 'KD_YAW', '1.5');
      const kpe = this._getArg(g, b, 'KP_ENC', '2.2');
      const tg = this._getArg(g, b, 'TURN_GAIN', '1.0');
      return `_kb_sb_car.sb_set_pid(${kpy}, ${kiy}, ${kdy}, ${kpe}, ${tg})`;
    });
    regCmd('sbCarMoveCm', ['sb_move_cm'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const cm = this._getArg(g, b, 'CM', '20');
      const rpm = this._getArg(g, b, 'RPM', '240');
      return `_kb_sb_car.sb_move_cm(${yaw}, ${cm}, ${rpm})`;
    });
    regCmd('sbCarMoveSec', ['sb_move_sec'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const sec = this._getArg(g, b, 'SEC', '2');
      const rpm = this._getArg(g, b, 'RPM', '240');
      return `_kb_sb_car.sb_move_sec(${yaw}, ${sec}, ${rpm})`;
    });
    regCmd('sbCarStraightStep', ['sb_straight_step'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const rpm = this._getArg(g, b, 'RPM', '240');
      return `_kb_sb_car.sb_straight_step(${rpm}, ${yaw})`;
    });
    regCmd('sbCarTurnToYaw', ['sb_turn_to_yaw'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '90');
      const rpm = this._getArg(g, b, 'RPM', '200');
      return `_kb_sb_car.sb_turn_to_yaw(${yaw}, ${rpm})`;
    });
    regCmd('sbCarTurnByDeg', ['sb_turn_by_deg'], (g, b) => {
      const deg = this._getArg(g, b, 'DEG', '90');
      const rpm = this._getArg(g, b, 'RPM', '200');
      return `_kb_sb_car.sb_turn_by_deg(${deg}, ${rpm})`;
    });
    regCmd('sbCarStop', ['sb_stop'], () => `_kb_sb_car.sb_stop()`);
    regRep('sbCarGetFusedYaw', ['sb_get_fused_yaw'], () => `_kb_sb_car.sb_get_fused_yaw(True)`);
    regRep('sbCarGetCompassYaw', ['sb_get_compass_yaw'], () => `_kb_sb_car.sb_get_compass_yaw()`);
    regRep('sbCarGetEncYaw', ['sb_get_enc_yaw'], () => `_kb_sb_car.sb_get_enc_yaw(True)`);
    regRep('sbCarGetDistCm', ['sb_get_dist_cm'], () => `_kb_sb_car.sb_get_dist_cm(True)`);
  }

  _getConnectedBoard() {
    const rts = [
      this.runtime,
      typeof window !== 'undefined' && window.vm && window.vm.runtime
    ].filter(Boolean);
    for (const rt of rts) {
      const stores = [
        rt.peripheralExtensions,
        rt._peripheralExtensions,
        rt.peripherals,
        rt._peripherals
      ].filter(Boolean);
      for (const store of stores) {
        const keys = typeof store === 'object' ? Object.keys(store) : [];
        for (const k of ['futureboard@kext', 'futureboard', 'FutureBoard', ...keys]) {
          const ext = store && store[k];
          if (!ext || ext === this) continue;
          if (ext.io && ext.io.connected && ext.repl) return ext;
          if (typeof ext.micropyExecLine === 'function') {
            const online = ext.isHardwareOnline !== false;
            const connected = !ext.comm || !ext.comm.isConnected || ext.comm.isConnected();
            if (online && connected) return ext;
          }
        }
      }
    }
    return null;
  }

  async _execRepl(pyLine, isReporter = false, timeout = 5000) {
    const board = this._getConnectedBoard();
    if (!board) return isReporter ? 0 : undefined;
    try {
      if (board.repl) {
        const check = await board.repl.execLine("print('$tmp=', '_kb_sb_car' in globals())\r\n", 2000);
        if (!check || !String(check).includes('True')) {
          if (board.repl.exec_raw) {
            await board.repl.exec_raw(MPY_HELPER_DEF + "\r\n");
          } else {
            await board.repl.execLine(MPY_HELPER_DEF + "\r\n", 5000);
          }
        }
        if (isReporter) {
          const out = await board.repl.execLine(`print('$tmp=', ${pyLine})\r\n`, timeout);
          if (board.processMPYResult) return board.processMPYResult(out, pyLine);
          if (typeof out === 'string' && out.includes('$tmp=')) {
            return Number(out.split('$tmp=')[1].trim()) || 0;
          }
          return out;
        } else {
          await board.repl.execLine(`${pyLine}\r\n`, timeout);
        }
        return;
      }
      if (typeof board.micropyExecLine === 'function') {
        if (!this.helpersReady && typeof board.micropyExec === 'function') {
          await board.micropyExec(MPY_HELPER_DEF + "\r\n");
          this.helpersReady = true;
        }
        if (isReporter) {
          return await board.micropyExecLine(`print('$tmp=', ${pyLine})`, true, timeout);
        } else {
          await board.micropyExecLine(pyLine, false, timeout);
        }
      }
    } catch (e) {
      console.warn('[futureSugarBoxCar REPL]', e);
    }
  }

  getInfo() {
    return {
      id: EXT_ID,
      name: '方糖盒航向車控',
      masterExt: 'futureboard@kext',
      color1: '#0F9D8A',
      color2: '#0B7A6B',
      color3: '#085E52',
      menuIconURI,
      blockIconURI: menuIconURI,
      blocks: [
        {
          func: 'noop',
          blockType: 'divlabel',
          text: '1. 未來板 + 方糖盒 (SugarBox) 雙閉迴路航向初始化'
        },
        {
          opcode: 'sbCarInit',
          blockType: 'command',
          text: '初始化 方糖盒航向小車 左輪[L_PORT]方向[L_DIR] 右輪[R_PORT]方向[R_DIR] 輪徑[WHEEL_CM]cm 輪距[AXLE_CM]cm 轉向係數[TURN_GAIN] 感應模式[COMP]',
          arguments: {
            L_PORT: { type: 'string', menu: 'SB_EM_PORT', defaultValue: '1' },
            L_DIR: { type: 'string', menu: 'DIR_SIGN', defaultValue: '-1' },
            R_PORT: { type: 'string', menu: 'SB_EM_PORT', defaultValue: '2' },
            R_DIR: { type: 'string', menu: 'DIR_SIGN', defaultValue: '1' },
            WHEEL_CM: { type: 'number', defaultValue: 6.6 },
            AXLE_CM: { type: 'number', defaultValue: 14.2 },
            TURN_GAIN: { type: 'number', defaultValue: 1.0 },
            COMP: { type: 'string', menu: 'SB_COMP_MODE', defaultValue: '0' }
          }
        },
        {
          opcode: 'sbCarResetHeading',
          blockType: 'command',
          text: '將目前車頭方向設為 0° (重置航向角基準)'
        },
        {
          opcode: 'sbCarResetEncoders',
          blockType: 'command',
          text: '重置行駛距離里程起點為 0 cm'
        },
        {
          opcode: 'sbCarSetPid',
          blockType: 'command',
          text: '設定控制參數 航向Kp[KP_YAW] Ki[KI_YAW] Kd[KD_YAW] 編碼器同步Kp[KP_ENC] 轉向係數[TURN_GAIN]',
          arguments: {
            KP_YAW: { type: 'number', defaultValue: 6.0 },
            KI_YAW: { type: 'number', defaultValue: 0.08 },
            KD_YAW: { type: 'number', defaultValue: 1.5 },
            KP_ENC: { type: 'number', defaultValue: 2.2 },
            TURN_GAIN: { type: 'number', defaultValue: 1.0 }
          },
          sepafter: 36
        },
        {
          func: 'noop',
          blockType: 'divlabel',
          text: '2. 航向鎖定直線行駛與精準轉向'
        },
        {
          opcode: 'sbCarMoveCm',
          blockType: 'command',
          text: '鎖定航向 [YAW]° 直線行駛 距離 [CM] cm 速度 [RPM] 度/秒(deg/s)',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            CM: { type: 'number', defaultValue: 20 },
            RPM: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'sbCarMoveSec',
          blockType: 'command',
          text: '鎖定航向 [YAW]° 直線行駛 時間 [SEC] 秒 速度 [RPM] 度/秒(deg/s)',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            SEC: { type: 'number', defaultValue: 2 },
            RPM: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'sbCarStraightStep',
          blockType: 'command',
          text: '持續鎖定航向 [YAW]° 直線前進 (放入重複迴圈) 速度 [RPM] 度/秒(deg/s)',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            RPM: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'sbCarTurnToYaw',
          blockType: 'command',
          text: '精準原地轉向至 絕對航向 [YAW]° 最大速度 [RPM] 度/秒(deg/s)',
          arguments: {
            YAW: { type: 'number', defaultValue: 90 },
            RPM: { type: 'number', defaultValue: 200 }
          }
        },
        {
          opcode: 'sbCarTurnByDeg',
          blockType: 'command',
          text: '精準原地旋轉 相對角度 [DEG]° 最大速度 [RPM] 度/秒(deg/s)',
          arguments: {
            DEG: { type: 'number', defaultValue: 90 },
            RPM: { type: 'number', defaultValue: 200 }
          }
        },
        {
          opcode: 'sbCarStop',
          blockType: 'command',
          text: '停止雙路編碼馬達',
          sepafter: 36
        },
        {
          func: 'noop',
          blockType: 'divlabel',
          text: '3. 航向角與編碼器里程回授讀取'
        },
        {
          opcode: 'sbCarGetFusedYaw',
          blockType: 'reporter',
          text: '目前融合航向角 Yaw (°)'
        },
        {
          opcode: 'sbCarGetCompassYaw',
          blockType: 'reporter',
          text: '板載電子羅盤相對航向角 (°)'
        },
        {
          opcode: 'sbCarGetEncYaw',
          blockType: 'reporter',
          text: '雙輪編碼器差速推算航向角 (°)'
        },
        {
          opcode: 'sbCarGetDistCm',
          blockType: 'reporter',
          text: '目前已行駛距離 (cm)'
        }
      ],
      menus: {
        DIR_SIGN: {
          acceptReporters: true,
          items: [
            { text: '逆時針 (-1)', value: '-1' },
            { text: '順時針 (+1)', value: '1' }
          ]
        },
        SB_EM_PORT: {
          acceptReporters: true,
          items: [
            { text: 'M1 / ID 1 (編碼馬達1)', value: '1' },
            { text: 'M2 / ID 2 (編碼馬達2)', value: '2' }
          ]
        },
        SB_COMP_MODE: {
          acceptReporters: true,
          items: [
            { text: '零飄移雙輪編碼器差速航向 (預設推薦)', value: '0' },
            { text: '電子羅盤+雙編碼器抗干擾融合 (需先做磁場校準)', value: '1' }
          ]
        }
      }
    };
  }

  sbCarInit(args) {
    return this._execRepl(
      `_kb_sb_car.sb_init(${Number((args && args.L_PORT) || 1)}, ${Number((args && args.L_DIR) || -1)}, ${Number((args && args.R_PORT) || 2)}, ${Number((args && args.R_DIR) || 1)}, ${Number((args && args.WHEEL_CM) || 6.6)}, ${Number((args && args.AXLE_CM) || 14.2)}, ${Number((args && args.COMP) ?? 0)}, ${Number((args && args.TURN_GAIN) || 1.0)})`,
      false,
      4000
    );
  }
  sbCarResetHeading() { return this._execRepl('_kb_sb_car.sb_reset_heading()'); }
  sbCarResetEncoders() { return this._execRepl('_kb_sb_car.sb_reset_encoders()'); }
  sbCarSetPid(args) {
    return this._execRepl(
      `_kb_sb_car.sb_set_pid(${Number((args && args.KP_YAW) || 6.0)}, ${Number((args && args.KI_YAW) || 0.08)}, ${Number((args && args.KD_YAW) || 1.5)}, ${Number((args && args.KP_ENC) || 2.2)}, ${Number((args && args.TURN_GAIN) || 1.0)})`
    );
  }
  sbCarMoveCm(args) {
    const cm = Number((args && args.CM) || 20);
    const dps = Math.max(20, Math.abs(Number((args && args.RPM) || 240)));
    const estMs = Math.ceil((Math.abs(cm) / ((dps / 360) * 20.7)) * 1000) + 3500;
    return this._execRepl(`_kb_sb_car.sb_move_cm(${Number((args && args.YAW) || 0)}, ${cm}, ${dps})`, false, estMs);
  }
  sbCarMoveSec(args) {
    const sec = Number((args && args.SEC) || 2);
    return this._execRepl(`_kb_sb_car.sb_move_sec(${Number((args && args.YAW) || 0)}, ${sec}, ${Number((args && args.RPM) || 240)})`, false, Math.ceil(sec * 1000) + 3000);
  }
  sbCarStraightStep(args) {
    return this._execRepl(`_kb_sb_car.sb_straight_step(${Number((args && args.RPM) || 240)}, ${Number((args && args.YAW) || 0)})`);
  }
  sbCarTurnToYaw(args) {
    return this._execRepl(`_kb_sb_car.sb_turn_to_yaw(${Number((args && args.YAW) || 90)}, ${Number((args && args.RPM) || 200)})`, false, 6000);
  }
  sbCarTurnByDeg(args) {
    return this._execRepl(`_kb_sb_car.sb_turn_by_deg(${Number((args && args.DEG) || 90)}, ${Number((args && args.RPM) || 200)})`, false, 6000);
  }
  sbCarStop() { return this._execRepl('_kb_sb_car.sb_stop()'); }
  sbCarGetFusedYaw() { return this._execRepl('_kb_sb_car.sb_get_fused_yaw(True)', true); }
  sbCarGetCompassYaw() { return this._execRepl('_kb_sb_car.sb_get_compass_yaw()', true); }
  sbCarGetEncYaw() { return this._execRepl('_kb_sb_car.sb_get_enc_yaw(True)', true); }
  sbCarGetDistCm() { return this._execRepl('_kb_sb_car.sb_get_dist_cm(True)', true); }
}

module.exports = FutureSugarBoxCarExtension;