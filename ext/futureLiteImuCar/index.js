/* 未來板 Lite AI (futureboard-lite-mpy, ESP32-S3) 板載 6軸IMU (SC7I22) + 雙編碼馬達差速航向鎖定與 PCA9685 舵機擴展插件
 * 支援：
 *   1. 線上即時互動模式 (透過未來板 Lite AI REPL 即時執行 MicroPython)
 *   2. MicroPython 按需精簡程式碼生成與上傳模式 (只輸出有用到的函式，節省主控器空間，並標記 masterExt 避免代碼模式積木變灰)
 */
const EXT_ID = 'futureLiteImuCar';

const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#0077B6"/><circle cx="64" cy="64" r="44" fill="#0A192F" stroke="#00E5FF" stroke-width="6"/><polygon points="64,22 50,78 64,68 78,78" fill="#FFD60A"/><circle cx="64" cy="64" r="6" fill="#FFFFFF"/></svg>';
const menuIconURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg);

const MPY_HEADER = [
  "class _KBLiteImuCarHelper:",
  " def __init__(s):",
  "  s.imu=s.motor=s.pca=s.pl=s.pr=None;s.lid,s.rid,s.ld,s.rd=1,2,-1,1",
  "  s.wd,s.wc,s.ax,s.tg,s.ys,s.md=6.6,20.7345,14.2,1.0,1.0,0",
  "  s.kp,s.ki,s.kd=8.0,0.05,1.2;s.ty=s.iy=s.le=s.ho=s.al=s.ar=s.dl0=s.dr0=0.0"
];
const MPY_FOOTER = ["_kb_lite_car=_KBLiteImuCarHelper()"];
const MPY_METHODS = {
  _w: { deps: [], code: [
    " def _w(s,d):return((float(d)+180.0)%360.0)-180.0"
  ]},
  ensure_imu: { deps: [], code: [
    " def ensure_imu(s):",
    "  if s.imu is None:from sensor import IMU;s.imu=IMU()",
    "  return s.imu"
  ]},
  _rp: { deps: [], code: [
    " def _rp(s):",
    "  if s.motor is None:return None,None",
    "  import time",
    "  try:p1=s.motor.get_position(s.lid);time.sleep_ms(6);p2=s.motor.get_position(s.rid);time.sleep_ms(6);return p1,p2",
    "  except Exception:return None,None"
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
  calibrate_imu: { deps: ['ensure_imu', '_upd'], code: [
    " def calibrate_imu(s):",
    "  try:imu=s.ensure_imu();imu.calibrate();imu.reset_yaw()",
    "  except Exception:pass",
    "  s._upd();s.ho=s.al-s.ar;s.ty=s.iy=s.le=0.0"
  ]},
  reset_yaw: { deps: ['ensure_imu', '_upd'], code: [
    " def reset_yaw(s):",
    "  try:imu=s.ensure_imu();imu.reset_yaw()",
    "  except Exception:pass",
    "  s._upd();s.ho=s.al-s.ar;s.ty=s.iy=s.le=0.0"
  ]},
  reset_encoders: { deps: ['_upd'], code: [
    " def reset_encoders(s):s._upd();s.dl0,s.dr0=s.al,s.ar"
  ]},
  get_imu_yaw: { deps: ['ensure_imu'], code: [
    " def get_imu_yaw(s):",
    "  try:imu=s.ensure_imu();imu.update();return round(float(imu.yaw())*s.ys,2)",
    "  except Exception:return 0.0"
  ]},
  get_enc_yaw: { deps: ['_upd'], code: [
    " def get_enc_yaw(s,refresh=False):",
    "  if refresh:s._upd()",
    "  dn=2.0*(s.ax/s.wd)*s.tg",
    "  return round(((s.al-s.ar)-s.ho)/dn,2) if dn>0 else 0.0"
  ]},
  get_yaw: { deps: ['get_imu_yaw', 'get_enc_yaw'], code: [
    " def get_yaw(s,refresh=False):",
    "  if s.md==1:return s.get_enc_yaw(refresh)",
    "  iy=s.get_imu_yaw()",
    "  if s.md==2 and s.motor is not None:",
    "   ey=s.get_enc_yaw(refresh);return round(0.75*iy+0.25*ey,2)",
    "  return iy"
  ]},
  get_dist_cm: { deps: ['_upd'], code: [
    " def get_dist_cm(s,refresh=False):",
    "  if refresh:s._upd()",
    "  dl,dr=s.al-s.dl0,s.ar-s.dr0;return round((0.5*(dl+dr)/360.0)*s.wc,2)"
  ]},
  get_angle: { deps: ['ensure_imu'], code: [
    " def get_angle(s,axis):",
    "  imu=s.ensure_imu();imu.update()",
    "  if axis=='pitch':return round(float(imu.pitch()),2)",
    "  if axis=='roll':return round(float(imu.roll()),2)",
    "  return round(float(imu.yaw())*s.ys,2)"
  ]},
  get_gyro: { deps: ['ensure_imu'], code: [
    " def get_gyro(s,idx):imu=s.ensure_imu();imu.update();return round(float(imu.read_gyroscope()[int(idx)]),2)"
  ]},
  init_car: { deps: ['_upd', 'calibrate_imu', 'reset_encoders'], code: [
    " def init_car(s,uart_port='uart0',left_id=1,left_dir=-1,right_id=2,right_dir=1,wheel_cm=6.6,axle_cm=14.2,turn_gain=1.0,yaw_sign=1.0,mode=0):",
    "  from machine import Pin;from encoderMotor import EncoderMotor;import math,time",
    "  if uart_port=='uart0':Pin(43,Pin.IN,Pin.PULL_UP);Pin(44,Pin.OUT)",
    "  s.motor=EncoderMotor(uart_port);s.lid,s.rid=int(left_id),int(right_id)",
    "  s.ld=1 if int(left_dir)>=0 else -1;s.rd=1 if int(right_dir)>=0 else -1",
    "  wd=float(wheel_cm);ax=float(axle_cm)",
    "  if wd>20.0:wd/=10.0",
    "  if ax>40.0:ax/=10.0",
    "  s.wd=max(1.0,wd);s.wc=math.pi*s.wd;s.ax=max(1.0,ax);s.tg=max(0.1,float(turn_gain));s.ys=float(yaw_sign);s.md=int(mode)",
    "  try:s.motor.set_mode(2);time.sleep_ms(8)",
    "  except Exception:",
    "   try:s.motor.set_mode(2,0xFD);time.sleep_ms(8)",
    "   except Exception:pass",
    "  s.pl=s.pr=None;s.al=s.ar=0.0;s._upd();s.calibrate_imu();s.reset_encoders()"
  ]},
  set_pid: { deps: [], code: [
    " def set_pid(s,kp,ki,kd,turn_gain=None):",
    "  s.kp,s.ki,s.kd=float(kp),float(ki),float(kd)",
    "  if turn_gain is not None:s.tg=max(0.1,float(turn_gain))",
    "  s.iy=s.le=0.0"
  ]},
  set_wheels: { deps: [], code: [
    " def set_wheels(s,l_dps,r_dps):",
    "  if s.motor is None:return",
    "  import time;l=max(-480,min(480,int(l_dps)))*s.ld;r=max(-480,min(480,int(r_dps)))*s.rd",
    "  s.motor.set_speed(s.lid,l,0);time.sleep_ms(5);s.motor.set_speed(s.rid,r,0)"
  ]},
  stop_car: { deps: [], code: [
    " def stop_car(s):",
    "  if s.motor is None:return",
    "  import time;s.motor.set_speed(s.lid,0,0);time.sleep_ms(5);s.motor.set_speed(s.rid,0,0)"
  ]},
  straight_step: { deps: ['_upd', 'get_yaw', 'set_wheels'], code: [
    " def straight_step(s,speed_dps=240,target_yaw=0.0):",
    "  if s.md!=0:s._upd()",
    "  er=float(target_yaw)-s.get_yaw(False);s.iy=max(-150.0,min(150.0,s.iy+er));dr=er-s.le;s.le=er",
    "  c=s.kp*er+s.ki*s.iy+s.kd*dr;mc=max(60.0,abs(float(speed_dps))*0.65);c=max(-mc,min(mc,c))",
    "  s.set_wheels(float(speed_dps)+c,float(speed_dps)-c)"
  ]},
  move_straight_cm: { deps: ['reset_encoders', '_rp', '_upd', 'get_dist_cm', 'get_yaw', 'set_wheels', 'stop_car', 'move_straight_time'], code: [
    " def move_straight_cm(s,target_yaw,dist_cm,speed_dps=240):",
    "  import time;d,sp=float(dist_cm),abs(float(speed_dps))",
    "  if d==0 or sp==0:return",
    "  s.reset_encoders();s.iy=s.le=0.0;sd=sp if d>0 else -sp;ta=abs(d)",
    "  p1,_=s._rp()",
    "  if p1 is not None:",
    "   try:",
    "    while True:",
    "     s._upd();rm=ta-abs(s.get_dist_cm(False))",
    "     if rm<=0.2:break",
    "     sc=min(1.0,max(0.35,rm/4.0));er=float(target_yaw)-s.get_yaw(False);s.iy=max(-150.0,min(150.0,s.iy+er));dr=er-s.le;s.le=er",
    "     c=s.kp*er+s.ki*s.iy+s.kd*dr;bs=sd*sc;mc=max(60.0,abs(bs)*0.65);c=max(-mc,min(mc,c))",
    "     s.set_wheels(bs+c,bs-c);time.sleep_ms(12)",
    "   finally:s.stop_car();s._upd()",
    "   return",
    "  ms=int((ta/((sp/360.0)*s.wc))*1000.0);s.move_straight_time(target_yaw,sd,ms)"
  ]},
  move_straight_mm: { deps: ['move_straight_cm'], code: [
    " def move_straight_mm(s,target_yaw,distance_mm,speed_dps=240):",
    "  s.move_straight_cm(target_yaw,float(distance_mm)/10.0,speed_dps)"
  ]},
  move_straight_sec: { deps: ['move_straight_time'], code: [
    " def move_straight_sec(s,target_yaw,sec,speed_dps=240):",
    "  s.move_straight_time(target_yaw,speed_dps,int(float(sec)*1000.0))"
  ]},
  move_straight_time: { deps: ['reset_encoders', 'straight_step', 'stop_car', '_upd'], code: [
    " def move_straight_time(s,target_yaw,speed_dps,duration_ms):",
    "  import time;s.reset_encoders();s.iy=s.le=0.0;t0=time.ticks_ms()",
    "  try:",
    "   while time.ticks_diff(time.ticks_ms(),t0)<int(duration_ms):s.straight_step(speed_dps,target_yaw);time.sleep_ms(15)",
    "  finally:s.stop_car();s._upd()"
  ]},
  turn_to_yaw: { deps: ['_upd', 'get_yaw', 'get_imu_yaw', 'stop_car', 'set_wheels'], code: [
    " def turn_to_yaw(s,target_yaw,max_speed_dps=220,tol=0.45,timeout_ms=5000):",
    "  import time;s.ty=float(target_yaw);ms=max(55.0,min(480.0,abs(float(max_speed_dps))));t0=time.ticks_ms()",
    "  if s.motor is not None:",
    "   for _ in range(2):",
    "    s._upd();er=s.ty-s.get_yaw(False)",
    "    if abs(er)<=float(tol):break",
    "    wdeg=int(round(abs(er)*(s.ax/s.wd)*s.tg))",
    "    if wdeg<1:break",
    "    sp=int(max(55.0,min(ms,abs(er)*4.5+35.0)));sgn=1 if er>0 else -1",
    "    try:",
    "     try:s.motor.set_mode(2);time.sleep_ms(5)",
    "     except Exception:s.motor.set_mode(2,0xFD);time.sleep_ms(5)",
    "     s.motor.set_position_speed(s.lid,wdeg*sgn*s.ld,sp);time.sleep_ms(6)",
    "     s.motor.set_position_speed(s.rid,-wdeg*sgn*s.rd,sp)",
    "     wt=int((wdeg/float(sp))*1000.0)+120;w0=time.ticks_ms()",
    "     while time.ticks_diff(time.ticks_ms(),w0)<wt:s._upd();s.get_imu_yaw();time.sleep_ms(12)",
    "    except Exception:break",
    "  ok=0;le=0.0;it=0.0",
    "  try:",
    "   while time.ticks_diff(time.ticks_ms(),t0)<int(timeout_ms):",
    "    s._upd();er=s.ty-s.get_yaw(False);dr=er-le;le=er",
    "    if abs(er)<=float(tol):",
    "     s.stop_car();ok+=1",
    "     if ok>=2:break",
    "    else:",
    "     ok=0;it=max(-30.0,min(30.0,it+er));sp=max(42.0,min(ms,abs(4.8*er+0.35*it+1.2*dr)))",
    "     if er>0:s.set_wheels(sp,-sp)",
    "     else:s.set_wheels(-sp,sp)",
    "    time.sleep_ms(12)",
    "  finally:s.stop_car();s._upd()"
  ]},
  turn_by_deg: { deps: ['_upd', 'get_yaw', 'turn_to_yaw'], code: [
    " def turn_by_deg(s,delta_deg,max_speed_dps=220):",
    "  s._upd();s.turn_to_yaw(s.get_yaw(False)+float(delta_deg),max_speed_dps)"
  ]},
  _ep: { deps: [], code: [
    " def _ep(s,addr=0x40):",
    "  if s.pca is not None:return s.pca",
    "  import board,time,math;from machine import I2C,SoftI2C,Pin;bus=None",
    "  try:",
    "   hw=I2C(0,scl=Pin(1),sda=Pin(2),freq=100000);board.i2c=hw",
    "   if addr in hw.scan():bus=hw",
    "  except Exception:pass",
    "  if bus is None:",
    "   sw=SoftI2C(scl=Pin(2),sda=Pin(1),freq=100000)",
    "   if addr in sw.scan():bus=sw",
    "  if bus is None:raise OSError('PCA9685 0x40 not found')",
    "  for b in ((0,0),(1,4),(0,1)):bus.writeto(addr,bytearray(b))",
    "  time.sleep_ms(5);bus.writeto(addr,bytearray([0]));m1=bus.readfrom(addr,1)[0]&~0x10;bus.writeto(addr,bytearray([0,m1]));time.sleep_ms(5)",
    "  ps=int(math.floor(25000000.0/4096.0/50.0-0.5))",
    "  for b in ((0,(m1&0x7F)|0x10),(0xFE,ps),(0,m1)):bus.writeto(addr,bytearray(b))",
    "  time.sleep_ms(5);bus.writeto(addr,bytearray([0,m1|0x80]));s.pca=bus;return bus"
  ]},
  pca_set_pwm: { deps: ['_ep'], code: [
    " def pca_set_pwm(s,ch,on,off,addr=0x40):",
    "  bus=s._ep(addr);b=0x06+4*int(ch)",
    "  for k,v in ((b,on&0xFF),(b+1,on>>8),(b+2,off&0xFF),(b+3,off>>8)):bus.writeto(addr,bytearray([k,v]))"
  ]},
  pca_servo180: { deps: ['pca_set_pwm'], code: [
    " def pca_servo180(s,ch,deg):",
    "  d=max(0.0,min(180.0,float(deg)));tk=int((500.0+(2000.0*d/180.0))*4096.0/20000.0)",
    "  try:s.pca_set_pwm(ch,0,tk)",
    "  except OSError:s.pca=None;s.pca_set_pwm(ch,0,tk)"
  ]},
  pca_release: { deps: ['pca_set_pwm'], code: [
    " def pca_release(s,ch):",
    "  try:s.pca_set_pwm(ch,0,0)",
    "  except OSError:s.pca=None"
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

class FutureLiteImuCarExtension {
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
        bi.masterExt = 'futureboard-lite-mpy';
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
            b.svgPath_.setAttribute('fill', b.colour_ || '#00B4D8');
            b.svgPath_.setAttribute('stroke', b.colourTertiary_ || '#0077B6');
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

  _cleanStr(val, defVal) {
    if (val === undefined || val === null || val === '') return defVal;
    return String(val).replace(/^['"]|['"]$/g, '');
  }

  _ensureGenDefs(gen, usedMethods) {
    if (!gen.definitions_) gen.definitions_ = {};
    let used = this._usedByDefs.get(gen.definitions_);
    if (!used) {
      used = new Set();
      this._usedByDefs.set(gen.definitions_, used);
    }
    if (Array.isArray(usedMethods)) {
      for (const m of usedMethods) used.add(m);
    } else if (typeof usedMethods === 'string') {
      used.add(usedMethods);
    }
    gen.definitions_['import_time'] = 'import time';
    gen.definitions_['import_math'] = 'import math';
    gen.definitions_['kb_lite_car_helper'] = buildMpyHelper(used);
  }

  _registerOnGenerator(gen) {
    if (!gen || this._hookedGens.has(gen)) return;
    this._hookedGens.add(gen);

    const menus = ['UART_PORT', 'MOTOR_ID', 'DIR_SIGN', 'YAW_SIGN_MENU', 'LITE_HEADING_MODE', 'ANGLE_AXIS', 'GYRO_AXIS', 'PCA_CH'];
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

    regCmd('imuInitCalibrate', ['calibrate_imu'], () => `_kb_lite_car.calibrate_imu()`);
    regCmd('imuResetYaw', ['reset_yaw'], () => `_kb_lite_car.reset_yaw()`);
    regCmd('carResetEncoders', ['reset_encoders'], () => `_kb_lite_car.reset_encoders()`);
    regRep('imuGetYaw', ['get_yaw'], () => `_kb_lite_car.get_yaw(True)`);
    regRep('carGetEncYaw', ['get_enc_yaw'], () => `_kb_lite_car.get_enc_yaw(True)`);
    regRep('carGetDistCm', ['get_dist_cm'], () => `_kb_lite_car.get_dist_cm(True)`);
    regRep('imuGetAngle', ['get_angle'], (g, b) => {
      const axis = this._cleanStr(this._getArg(g, b, 'AXIS', 'yaw'), 'yaw');
      return `_kb_lite_car.get_angle('${axis}')`;
    });
    regRep('imuGetGyro', ['get_gyro'], (g, b) => {
      const axis = this._cleanStr(this._getArg(g, b, 'AXIS', '2'), '2');
      return `_kb_lite_car.get_gyro(${axis})`;
    });

    regCmd('carInit', ['init_car'], (g, b) => {
      const uart = this._cleanStr(this._getArg(g, b, 'UART', 'uart0'), 'uart0');
      const lid = this._getArg(g, b, 'LEFT_ID', '1');
      const ldir = this._getArg(g, b, 'LEFT_DIR', '-1');
      const rid = this._getArg(g, b, 'RIGHT_ID', '2');
      const rdir = this._getArg(g, b, 'RIGHT_DIR', '1');
      const wd = this._getArg(g, b, 'WHEEL_CM', this._getArg(g, b, 'WHEEL_D', '6.6'));
      const ax = this._getArg(g, b, 'AXLE_CM', '14.2');
      const tg = this._getArg(g, b, 'TURN_GAIN', '1.0');
      const ys = this._getArg(g, b, 'YAW_SIGN', '1');
      const md = this._getArg(g, b, 'MODE', '0');
      return `_kb_lite_car.init_car('${uart}', ${lid}, ${ldir}, ${rid}, ${rdir}, ${wd}, ${ax}, ${tg}, ${ys}, ${md})`;
    });
    regCmd('carSetPid', ['set_pid'], (g, b) => {
      const kp = this._getArg(g, b, 'KP', '8.0');
      const ki = this._getArg(g, b, 'KI', '0.05');
      const kd = this._getArg(g, b, 'KD', '1.2');
      const tg = this._getArg(g, b, 'TURN_GAIN', '1.0');
      return `_kb_lite_car.set_pid(${kp}, ${ki}, ${kd}, ${tg})`;
    });
    regCmd('carMoveStraightCm', ['move_straight_cm'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const cm = this._getArg(g, b, 'CM', '20');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.move_straight_cm(${yaw}, ${cm}, ${spd})`;
    });
    regCmd('carMoveStraightSec', ['move_straight_sec'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const sec = this._getArg(g, b, 'SEC', '2');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.move_straight_sec(${yaw}, ${sec}, ${spd})`;
    });
    regCmd('carMoveStraightMm', ['move_straight_mm'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const dist = this._getArg(g, b, 'DIST', '300');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.move_straight_mm(${yaw}, ${dist}, ${spd})`;
    });
    regCmd('carMoveStraightTime', ['move_straight_time'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const ms = this._getArg(g, b, 'MS', '2000');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.move_straight_time(${yaw}, ${spd}, ${ms})`;
    });
    regCmd('carStraightStep', ['straight_step'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.straight_step(${spd}, ${yaw})`;
    });
    regCmd('carTurnToYaw', ['turn_to_yaw'], (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '90');
      const spd = this._getArg(g, b, 'SPEED', '220');
      return `_kb_lite_car.turn_to_yaw(${yaw}, ${spd})`;
    });
    regCmd('carTurnByDeg', ['turn_by_deg'], (g, b) => {
      const deg = this._getArg(g, b, 'DEG', '90');
      const spd = this._getArg(g, b, 'SPEED', '220');
      return `_kb_lite_car.turn_by_deg(${deg}, ${spd})`;
    });
    regCmd('carStop', ['stop_car'], () => `_kb_lite_car.stop_car()`);

    regCmd('pcaServo180', ['pca_servo180'], (g, b) => {
      const ch = this._getArg(g, b, 'CH', '0');
      const deg = this._getArg(g, b, 'DEG', '90');
      return `_kb_lite_car.pca_servo180(${ch}, ${deg})`;
    });
    regCmd('pcaServoRelease', ['pca_release'], (g, b) => {
      const ch = this._getArg(g, b, 'CH', '0');
      return `_kb_lite_car.pca_release(${ch})`;
    });
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
        for (const k of ['futureboard-lite-mpy', 'futureboardlite', 'FutureBoardLite', ...keys]) {
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
        const check = await board.repl.execLine("print('$tmp=', '_kb_lite_car' in globals())\r\n", 2000);
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
      console.warn('[futureLiteImuCar REPL]', e);
    }
  }

  getInfo() {
    return {
      id: EXT_ID,
      name: 'LiteAI航向車控',
      masterExt: 'futureboard-lite-mpy',
      color1: '#00B4D8',
      color2: '#0096C7',
      color3: '#0077B6',
      menuIconURI,
      blockIconURI: menuIconURI,
      blocks: [
        {
          func: 'noop',
          blockType: 'divlabel',
          text: '1. 未來板Lite AI 板載 6軸IMU 與航向基準 (SC7I22)'
        },
        {
          opcode: 'imuInitCalibrate',
          blockType: 'command',
          text: '初始化並靜置校準板載 6軸IMU (航向角歸零)'
        },
        {
          opcode: 'imuResetYaw',
          blockType: 'command',
          text: '將目前車頭方向設為 0° (重置航向角基準)'
        },
        {
          opcode: 'carResetEncoders',
          blockType: 'command',
          text: '重置行駛距離里程起點為 0 cm'
        },
        {
          opcode: 'imuGetYaw',
          blockType: 'reporter',
          text: '目前主航向角 Yaw (°)'
        },
        {
          opcode: 'carGetEncYaw',
          blockType: 'reporter',
          text: '雙輪編碼器差速推算航向角 (°)'
        },
        {
          opcode: 'carGetDistCm',
          blockType: 'reporter',
          text: '目前已行駛距離 (cm)'
        },
        {
          opcode: 'imuGetAngle',
          blockType: 'reporter',
          text: '讀取 IMU 姿態角 [AXIS] (°)',
          arguments: {
            AXIS: {
              type: 'string',
              menu: 'ANGLE_AXIS',
              defaultValue: 'yaw'
            }
          }
        },
        {
          opcode: 'imuGetGyro',
          blockType: 'reporter',
          text: '讀取陀螺儀角速度 [AXIS] (度/秒)',
          arguments: {
            AXIS: {
              type: 'string',
              menu: 'GYRO_AXIS',
              defaultValue: '2'
            }
          },
          sepafter: 36
        },
        {
          func: 'noop',
          blockType: 'divlabel',
          text: '2. 航向鎖定 + 編碼馬達小車控制'
        },
        {
          opcode: 'carInit',
          blockType: 'command',
          text: '初始化 航向小車 串口[UART] 左輪ID[LEFT_ID]方向[LEFT_DIR] 右輪ID[RIGHT_ID]方向[RIGHT_DIR] 輪徑[WHEEL_CM]cm 輪距[AXLE_CM]cm 轉向係數[TURN_GAIN] 航向極性[YAW_SIGN] 感應模式[MODE]',
          arguments: {
            UART: { type: 'string', menu: 'UART_PORT', defaultValue: 'uart0' },
            LEFT_ID: { type: 'string', menu: 'MOTOR_ID', defaultValue: '1' },
            LEFT_DIR: { type: 'string', menu: 'DIR_SIGN', defaultValue: '-1' },
            RIGHT_ID: { type: 'string', menu: 'MOTOR_ID', defaultValue: '2' },
            RIGHT_DIR: { type: 'string', menu: 'DIR_SIGN', defaultValue: '1' },
            WHEEL_CM: { type: 'number', defaultValue: 6.6 },
            AXLE_CM: { type: 'number', defaultValue: 14.2 },
            TURN_GAIN: { type: 'number', defaultValue: 1.0 },
            YAW_SIGN: { type: 'string', menu: 'YAW_SIGN_MENU', defaultValue: '1' },
            MODE: { type: 'string', menu: 'LITE_HEADING_MODE', defaultValue: '0' }
          }
        },
        {
          opcode: 'carSetPid',
          blockType: 'command',
          text: '設定控制參數 航向Kp[KP] Ki[KI] Kd[KD] 轉向係數[TURN_GAIN]',
          arguments: {
            KP: { type: 'number', defaultValue: 8.0 },
            KI: { type: 'number', defaultValue: 0.05 },
            KD: { type: 'number', defaultValue: 1.2 },
            TURN_GAIN: { type: 'number', defaultValue: 1.0 }
          }
        },
        {
          opcode: 'carMoveStraightCm',
          blockType: 'command',
          text: '鎖定航向 [YAW]° 直線行駛 距離 [CM] cm 速度 [SPEED] 度/秒(deg/s)',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            CM: { type: 'number', defaultValue: 20 },
            SPEED: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'carMoveStraightSec',
          blockType: 'command',
          text: '鎖定航向 [YAW]° 直線行駛 時間 [SEC] 秒 速度 [SPEED] 度/秒(deg/s)',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            SEC: { type: 'number', defaultValue: 2 },
            SPEED: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'carMoveStraightMm',
          blockType: 'command',
          text: '鎖定航向 [YAW]° 直線行駛 距離 [DIST] mm 速度 [SPEED] 度/秒',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            DIST: { type: 'number', defaultValue: 200 },
            SPEED: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'carMoveStraightTime',
          blockType: 'command',
          text: '鎖定航向 [YAW]° 直線行駛 時間 [MS] 毫秒 速度 [SPEED] 度/秒',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            MS: { type: 'number', defaultValue: 2000 },
            SPEED: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'carStraightStep',
          blockType: 'command',
          text: '持續鎖定航向 [YAW]° 直線前進 (放入重複迴圈) 速度 [SPEED] 度/秒',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            SPEED: { type: 'number', defaultValue: 240 }
          }
        },
        {
          opcode: 'carTurnToYaw',
          blockType: 'command',
          text: '精準原地轉向至 絕對航向 [YAW]° 最大速度 [SPEED] 度/秒',
          arguments: {
            YAW: { type: 'number', defaultValue: 90 },
            SPEED: { type: 'number', defaultValue: 220 }
          }
        },
        {
          opcode: 'carTurnByDeg',
          blockType: 'command',
          text: '精準原地旋轉 相對角度 [DEG]° 最大速度 [SPEED] 度/秒',
          arguments: {
            DEG: { type: 'number', defaultValue: 90 },
            SPEED: { type: 'number', defaultValue: 220 }
          }
        },
        {
          opcode: 'carStop',
          blockType: 'command',
          text: '停止小車編碼馬達',
          sepafter: 36
        },
        {
          func: 'noop',
          blockType: 'divlabel',
          text: '3. PCA9685 16路舵機控制器 (I2C 0x40)'
        },
        {
          opcode: 'pcaServo180',
          blockType: 'command',
          text: 'PCA9685 16路舵機 通道 [CH] 轉至角度 [DEG]° (0~180°)',
          arguments: {
            CH: { type: 'string', menu: 'PCA_CH', defaultValue: '0' },
            DEG: { type: 'number', defaultValue: 90 }
          }
        },
        {
          opcode: 'pcaServoRelease',
          blockType: 'command',
          text: 'PCA9685 16路舵機 釋放通道 [CH] 扭力',
          arguments: {
            CH: { type: 'string', menu: 'PCA_CH', defaultValue: '0' }
          }
        }
      ],
      menus: {
        UART_PORT: {
          acceptReporters: true,
          items: [
            { text: 'UART0 (自動修復腳位衝突)', value: 'uart0' },
            { text: 'UART1', value: 'uart1' }
          ]
        },
        MOTOR_ID: {
          acceptReporters: true,
          items: [
            { text: 'ID 1 (編碼馬達1)', value: '1' },
            { text: 'ID 2 (編碼馬達2)', value: '2' },
            { text: 'ID 3', value: '3' },
            { text: 'ID 4', value: '4' },
            { text: 'ID 5', value: '5' },
            { text: 'ID 6', value: '6' },
            { text: 'ID 7', value: '7' },
            { text: 'ID 8', value: '8' }
          ]
        },
        DIR_SIGN: {
          acceptReporters: true,
          items: [
            { text: '逆時針 (-1)', value: '-1' },
            { text: '順時針 (+1)', value: '1' }
          ]
        },
        YAW_SIGN_MENU: {
          acceptReporters: true,
          items: [
            { text: '正向 (+1)', value: '1' },
            { text: '反向 (-1)', value: '-1' }
          ]
        },
        LITE_HEADING_MODE: {
          acceptReporters: true,
          items: [
            { text: '板載6軸IMU陀螺儀 + 編碼馬達硬體位置精準轉向 (預設推薦)', value: '0' },
            { text: '零飄移雙輪編碼器差速航向 (與方糖盒相同)', value: '1' },
            { text: '6軸IMU陀螺儀 + 雙輪編碼器雙重融合航向', value: '2' }
          ]
        },
        ANGLE_AXIS: {
          acceptReporters: true,
          items: [
            { text: '航向角 (Yaw)', value: 'yaw' },
            { text: '俯仰角 (Pitch)', value: 'pitch' },
            { text: '翻滾角 (Roll)', value: 'roll' }
          ]
        },
        GYRO_AXIS: {
          acceptReporters: true,
          items: [
            { text: 'Z軸 (水平偏航角速度)', value: '2' },
            { text: 'X軸 (俯仰角速度)', value: '0' },
            { text: 'Y軸 (翻滾角速度)', value: '1' }
          ]
        },
        PCA_CH: {
          acceptReporters: true,
          items: Array.from({ length: 16 }, (_, i) => ({
            text: `servo${i} (通道 ${i})`,
            value: String(i)
          }))
        }
      }
    };
  }

  imuInitCalibrate() { return this._execRepl('_kb_lite_car.calibrate_imu()'); }
  imuResetYaw() { return this._execRepl('_kb_lite_car.reset_yaw()'); }
  carResetEncoders() { return this._execRepl('_kb_lite_car.reset_encoders()'); }
  imuGetYaw() { return this._execRepl('_kb_lite_car.get_yaw(True)', true); }
  carGetEncYaw() { return this._execRepl('_kb_lite_car.get_enc_yaw(True)', true); }
  carGetDistCm() { return this._execRepl('_kb_lite_car.get_dist_cm(True)', true); }
  imuGetAngle(args) { return this._execRepl(`_kb_lite_car.get_angle('${(args && args.AXIS) || 'yaw'}')`, true); }
  imuGetGyro(args) { return this._execRepl(`_kb_lite_car.get_gyro(${Number((args && args.AXIS) || 2)})`, true); }

  carInit(args) {
    const wd = Number((args && (args.WHEEL_CM ?? args.WHEEL_D)) || 6.6);
    const ax = Number((args && args.AXLE_CM) || 14.2);
    const tg = Number((args && args.TURN_GAIN) || 1.0);
    const ys = Number((args && args.YAW_SIGN) || 1);
    const md = Number((args && args.MODE) ?? 0);
    return this._execRepl(
      `_kb_lite_car.init_car('${(args && args.UART) || 'uart0'}', ${Number((args && args.LEFT_ID) || 1)}, ${Number((args && args.LEFT_DIR) || -1)}, ${Number((args && args.RIGHT_ID) || 2)}, ${Number((args && args.RIGHT_DIR) || 1)}, ${wd}, ${ax}, ${tg}, ${ys}, ${md})`,
      false,
      6000
    );
  }
  carSetPid(args) {
    return this._execRepl(`_kb_lite_car.set_pid(${Number((args && args.KP) || 8)}, ${Number((args && args.KI) || 0.05)}, ${Number((args && args.KD) || 1.2)}, ${Number((args && args.TURN_GAIN) || 1.0)})`);
  }
  carMoveStraightCm(args) {
    const cm = Number((args && args.CM) || 20);
    const spd = Math.max(20, Math.abs(Number((args && args.SPEED) || 240)));
    const estMs = Math.ceil((Math.abs(cm) / ((spd / 360) * 20.7)) * 1000) + 3500;
    return this._execRepl(`_kb_lite_car.move_straight_cm(${Number((args && args.YAW) || 0)}, ${cm}, ${spd})`, false, estMs);
  }
  carMoveStraightSec(args) {
    const sec = Number((args && args.SEC) || 2);
    return this._execRepl(`_kb_lite_car.move_straight_sec(${Number((args && args.YAW) || 0)}, ${sec}, ${Number((args && args.SPEED) || 240)})`, false, Math.ceil(sec * 1000) + 3000);
  }
  carMoveStraightMm(args) {
    const dist = Number((args && args.DIST) || 200);
    const spd = Math.max(10, Math.abs(Number((args && args.SPEED) || 240)));
    const estMs = Math.ceil((Math.abs(dist) / ((spd / 360) * 207)) * 1000) + 3000;
    return this._execRepl(`_kb_lite_car.move_straight_mm(${Number((args && args.YAW) || 0)}, ${dist}, ${spd})`, false, estMs);
  }
  carMoveStraightTime(args) {
    const ms = Number((args && args.MS) || 2000);
    return this._execRepl(`_kb_lite_car.move_straight_time(${Number((args && args.YAW) || 0)}, ${Number((args && args.SPEED) || 240)}, ${ms})`, false, ms + 3000);
  }
  carStraightStep(args) {
    return this._execRepl(`_kb_lite_car.straight_step(${Number((args && args.SPEED) || 240)}, ${Number((args && args.YAW) || 0)})`);
  }
  carTurnToYaw(args) {
    return this._execRepl(`_kb_lite_car.turn_to_yaw(${Number((args && args.YAW) || 90)}, ${Number((args && args.SPEED) || 220)})`, false, 6000);
  }
  carTurnByDeg(args) {
    return this._execRepl(`_kb_lite_car.turn_by_deg(${Number((args && args.DEG) || 90)}, ${Number((args && args.SPEED) || 220)})`, false, 6000);
  }
  carStop() { return this._execRepl('_kb_lite_car.stop_car()'); }

  pcaServo180(args) {
    return this._execRepl(`_kb_lite_car.pca_servo180(${Number((args && args.CH) || 0)}, ${Number((args && args.DEG) || 90)})`);
  }
  pcaServoRelease(args) {
    return this._execRepl(`_kb_lite_car.pca_release(${Number((args && args.CH) || 0)})`);
  }
}

module.exports = FutureLiteImuCarExtension;