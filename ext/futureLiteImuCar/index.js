/* 未來板 Lite AI (futureboard-lite-mpy, ESP32-S3) 板載 6軸IMU (SC7I22) 航向鎖定、編碼馬達 PID 小車與 PCA9685 舵機擴展插件
 * 支援：
 *   1. 線上即時互動模式 (透過未來板 Lite AI REPL 即時執行 MicroPython)
 *   2. MicroPython 程式碼生成與上傳模式 (掛載 board.gen.registerBlock，並標記 masterExt 避免代碼模式積木變灰)
 */
const EXT_ID = 'futureLiteImuCar';

const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#0077B6"/><circle cx="64" cy="64" r="44" fill="#0A192F" stroke="#00E5FF" stroke-width="6"/><polygon points="64,22 50,78 64,68 78,78" fill="#FFD60A"/><circle cx="64" cy="64" r="6" fill="#FFFFFF"/></svg>';
const menuIconURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg);

const MPY_HELPER_DEF = [
  "class _KBLiteImuCarHelper:",
  " def __init__(s):",
  "  s.imu=s.motor=s.pca=None;s.lid,s.rid,s.ld,s.rd=1,2,-1,1;s.wc,s.ys=207.345,1.0;s.kp,s.ki,s.kd=8.0,0.05,1.2;s.ty=s.iy=s.le=0.0",
  " def ensure_imu(s):",
  "  if s.imu is None:from sensor import IMU;s.imu=IMU()",
  "  return s.imu",
  " def calibrate_imu(s):imu=s.ensure_imu();imu.calibrate();imu.reset_yaw();s.ty=s.iy=s.le=0.0",
  " def reset_yaw(s):imu=s.ensure_imu();imu.reset_yaw();s.ty=s.iy=s.le=0.0",
  " def get_yaw(s):imu=s.ensure_imu();imu.update();return round(float(imu.yaw())*s.ys,2)",
  " def get_angle(s,axis):",
  "  imu=s.ensure_imu();imu.update()",
  "  if axis=='pitch':return round(float(imu.pitch()),2)",
  "  if axis=='roll':return round(float(imu.roll()),2)",
  "  return round(float(imu.yaw())*s.ys,2)",
  " def get_gyro(s,idx):imu=s.ensure_imu();imu.update();return round(float(imu.read_gyroscope()[int(idx)]),2)",
  " def init_car(s,uart_port='uart0',left_id=1,left_dir=-1,right_id=2,right_dir=1,wheel_d=66.0,yaw_sign=1.0):",
  "  from machine import Pin;from encoderMotor import EncoderMotor;import math",
  "  if uart_port=='uart0':Pin(43,Pin.IN,Pin.PULL_UP);Pin(44,Pin.OUT)",
  "  s.motor=EncoderMotor(uart_port);s.lid,s.rid=int(left_id),int(right_id);s.ld,s.rd=int(left_dir),int(right_dir)",
  "  s.wc=math.pi*float(wheel_d);s.ys=float(yaw_sign);s.calibrate_imu()",
  " def set_pid(s,kp,ki,kd):s.kp,s.ki,s.kd=float(kp),float(ki),float(kd);s.iy=s.le=0.0",
  " def set_wheels(s,l_dps,r_dps):",
  "  if s.motor is None:return",
  "  import time;l=max(-480,min(480,int(l_dps)))*s.ld;r=max(-480,min(480,int(r_dps)))*s.rd",
  "  s.motor.set_speed(s.lid,l,0);time.sleep_ms(5);s.motor.set_speed(s.rid,r,0)",
  " def stop_car(s):",
  "  if s.motor is None:return",
  "  import time;s.motor.set_speed(s.lid,0,0);time.sleep_ms(5);s.motor.set_speed(s.rid,0,0)",
  " def straight_step(s,speed_dps,target_yaw=0.0):",
  "  er=float(target_yaw)-s.get_yaw();s.iy=max(-200.0,min(200.0,s.iy+er));dr=er-s.le;s.le=er",
  "  c=s.kp*er+s.ki*s.iy+s.kd*dr;s.set_wheels(speed_dps-c,speed_dps+c)",
  " def move_straight_time(s,target_yaw,speed_dps,duration_ms):",
  "  import time;s.iy=s.le=0.0;t0=time.ticks_ms()",
  "  try:",
  "   while time.ticks_diff(time.ticks_ms(),t0)<int(duration_ms):s.straight_step(speed_dps,target_yaw);time.sleep_ms(20)",
  "  finally:s.stop_car()",
  " def move_straight_mm(s,target_yaw,distance_mm,speed_dps):",
  "  d,sp=float(distance_mm),abs(float(speed_dps))",
  "  if d==0 or sp==0:return",
  "  sd=sp if d>0 else -sp;ms=int((abs(d)/((sp/360.0)*s.wc))*1000.0);s.move_straight_time(target_yaw,sd,ms)",
  " def turn_to_yaw(s,target_yaw,max_speed_dps=240,tol=1.0,timeout_ms=4000):",
  "  import time;s.ty=float(target_yaw);ms=max(50,min(480,abs(int(max_speed_dps))));t0=time.ticks_ms();ok=0",
  "  try:",
  "   while time.ticks_diff(time.ticks_ms(),t0)<int(timeout_ms):",
  "    er=s.ty-s.get_yaw()",
  "    if abs(er)<=float(tol):",
  "     s.stop_car();ok+=1",
  "     if ok>=3:break",
  "    else:",
  "     ok=0;sp=max(45,min(ms,int(5.0*abs(er))))",
  "     if er>0:s.set_wheels(-sp,sp)",
  "     else:s.set_wheels(sp,-sp)",
  "    time.sleep_ms(20)",
  "  finally:s.stop_car()",
  " def turn_by_deg(s,delta_deg,max_speed_dps=240):s.turn_to_yaw(s.get_yaw()+float(delta_deg),max_speed_dps)",
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
  "  time.sleep_ms(5);bus.writeto(addr,bytearray([0,m1|0x80]));s.pca=bus;return bus",
  " def pca_set_pwm(s,ch,on,off,addr=0x40):",
  "  bus=s._ep(addr);b=0x06+4*int(ch)",
  "  for k,v in ((b,on&0xFF),(b+1,on>>8),(b+2,off&0xFF),(b+3,off>>8)):bus.writeto(addr,bytearray([k,v]))",
  " def pca_servo180(s,ch,deg):",
  "  d=max(0.0,min(180.0,float(deg)));tk=int((500.0+(2000.0*d/180.0))*4096.0/20000.0)",
  "  try:s.pca_set_pwm(ch,0,tk)",
  "  except OSError:s.pca=None;s.pca_set_pwm(ch,0,tk)",
  " def pca_release(s,ch):",
  "  try:s.pca_set_pwm(ch,0,0)",
  "  except OSError:s.pca=None",
  "_kb_lite_car=_KBLiteImuCarHelper()"
].join('\n');

class FutureLiteImuCarExtension {
  constructor(runtime) {
    this.runtime = runtime;
    this.EXTENSION_ID = EXT_ID;
    this.helpersReady = false;
    this._hookedGens = new WeakSet();
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

  _ensureGenDefs(gen) {
    if (!gen.definitions_) gen.definitions_ = {};
    gen.definitions_['import_time'] = 'import time';
    gen.definitions_['import_math'] = 'import math';
    gen.definitions_['kb_lite_car_helper'] = MPY_HELPER_DEF;
  }

  _registerOnGenerator(gen) {
    if (!gen || this._hookedGens.has(gen)) return;
    this._hookedGens.add(gen);

    const menus = ['UART_PORT', 'MOTOR_ID', 'DIR_SIGN', 'YAW_SIGN_MENU', 'ANGLE_AXIS', 'GYRO_AXIS', 'PCA_CH'];
    menus.forEach((m) => {
      if (gen.registerBlock && gen.dropdownToCode) {
        gen.registerBlock(`${EXT_ID}_menu_${m}`, gen.dropdownToCode.bind(gen));
      }
    });

    const regCmd = (opcode, fn) => {
      gen.registerBlock(`${EXT_ID}_${opcode}`, (g, block) => {
        const targetGen = (g && g.definitions_) ? g : gen;
        const targetBlock = (block && block.type) ? block : g;
        this._ensureGenDefs(targetGen);
        return fn(targetGen, targetBlock) + '\n';
      });
    };

    const regRep = (opcode, fn) => {
      gen.registerBlock(`${EXT_ID}_${opcode}`, (g, block) => {
        const targetGen = (g && g.definitions_) ? g : gen;
        const targetBlock = (block && block.type) ? block : g;
        this._ensureGenDefs(targetGen);
        return [fn(targetGen, targetBlock), targetGen.ORDER_FUNCTION_CALL || 2.2];
      });
    };

    regCmd('imuInitCalibrate', () => `_kb_lite_car.calibrate_imu()`);
    regCmd('imuResetYaw', () => `_kb_lite_car.reset_yaw()`);
    regRep('imuGetYaw', () => `_kb_lite_car.get_yaw()`);
    regRep('imuGetAngle', (g, b) => {
      const axis = this._cleanStr(this._getArg(g, b, 'AXIS', 'yaw'), 'yaw');
      return `_kb_lite_car.get_angle('${axis}')`;
    });
    regRep('imuGetGyro', (g, b) => {
      const axis = this._cleanStr(this._getArg(g, b, 'AXIS', '2'), '2');
      return `_kb_lite_car.get_gyro(${axis})`;
    });

    regCmd('carInit', (g, b) => {
      const uart = this._cleanStr(this._getArg(g, b, 'UART', 'uart0'), 'uart0');
      const lid = this._getArg(g, b, 'LEFT_ID', '1');
      const ldir = this._getArg(g, b, 'LEFT_DIR', '-1');
      const rid = this._getArg(g, b, 'RIGHT_ID', '2');
      const rdir = this._getArg(g, b, 'RIGHT_DIR', '1');
      const wd = this._getArg(g, b, 'WHEEL_D', '66');
      const ys = this._getArg(g, b, 'YAW_SIGN', '1');
      return `_kb_lite_car.init_car('${uart}', ${lid}, ${ldir}, ${rid}, ${rdir}, ${wd}, ${ys})`;
    });
    regCmd('carSetPid', (g, b) => {
      const kp = this._getArg(g, b, 'KP', '8.0');
      const ki = this._getArg(g, b, 'KI', '0.05');
      const kd = this._getArg(g, b, 'KD', '1.2');
      return `_kb_lite_car.set_pid(${kp}, ${ki}, ${kd})`;
    });
    regCmd('carMoveStraightMm', (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const dist = this._getArg(g, b, 'DIST', '300');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.move_straight_mm(${yaw}, ${dist}, ${spd})`;
    });
    regCmd('carMoveStraightTime', (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const ms = this._getArg(g, b, 'MS', '2000');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.move_straight_time(${yaw}, ${spd}, ${ms})`;
    });
    regCmd('carStraightStep', (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '0');
      const spd = this._getArg(g, b, 'SPEED', '240');
      return `_kb_lite_car.straight_step(${spd}, ${yaw})`;
    });
    regCmd('carTurnToYaw', (g, b) => {
      const yaw = this._getArg(g, b, 'YAW', '90');
      const spd = this._getArg(g, b, 'SPEED', '220');
      return `_kb_lite_car.turn_to_yaw(${yaw}, ${spd})`;
    });
    regCmd('carTurnByDeg', (g, b) => {
      const deg = this._getArg(g, b, 'DEG', '90');
      const spd = this._getArg(g, b, 'SPEED', '220');
      return `_kb_lite_car.turn_by_deg(${deg}, ${spd})`;
    });
    regCmd('carStop', () => `_kb_lite_car.stop_car()`);

    regCmd('pcaServo180', (g, b) => {
      const ch = this._getArg(g, b, 'CH', '0');
      const deg = this._getArg(g, b, 'DEG', '90');
      return `_kb_lite_car.pca_servo180(${ch}, ${deg})`;
    });
    regCmd('pcaServoRelease', (g, b) => {
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
          text: '1. 未來板Lite AI 板載 6軸IMU 航向角 (SC7I22)'
        },
        {
          opcode: 'imuInitCalibrate',
          blockType: 'command',
          text: '初始化並靜置校準板載 6軸IMU (航向角歸零)'
        },
        {
          opcode: 'imuResetYaw',
          blockType: 'command',
          text: '將目前車頭方向設為 0° (重置航向角)'
        },
        {
          opcode: 'imuGetYaw',
          blockType: 'reporter',
          text: '目前航向角 Yaw (°)'
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
          text: '初始化 航向小車 串口[UART] 左輪ID[LEFT_ID]方向[LEFT_DIR] 右輪ID[RIGHT_ID]方向[RIGHT_DIR] 輪徑[WHEEL_D]mm 航向極性[YAW_SIGN]',
          arguments: {
            UART: { type: 'string', menu: 'UART_PORT', defaultValue: 'uart0' },
            LEFT_ID: { type: 'string', menu: 'MOTOR_ID', defaultValue: '1' },
            LEFT_DIR: { type: 'string', menu: 'DIR_SIGN', defaultValue: '-1' },
            RIGHT_ID: { type: 'string', menu: 'MOTOR_ID', defaultValue: '2' },
            RIGHT_DIR: { type: 'string', menu: 'DIR_SIGN', defaultValue: '1' },
            WHEEL_D: { type: 'number', defaultValue: 66 },
            YAW_SIGN: { type: 'string', menu: 'YAW_SIGN_MENU', defaultValue: '1' }
          }
        },
        {
          opcode: 'carSetPid',
          blockType: 'command',
          text: '設定直線鎖定 PID 參數 Kp[KP] Ki[KI] Kd[KD]',
          arguments: {
            KP: { type: 'number', defaultValue: 8.0 },
            KI: { type: 'number', defaultValue: 0.05 },
            KD: { type: 'number', defaultValue: 1.2 }
          }
        },
        {
          opcode: 'carMoveStraightMm',
          blockType: 'command',
          text: '鎖定航向 [YAW]° 直線行駛 距離 [DIST] mm 速度 [SPEED] 度/秒',
          arguments: {
            YAW: { type: 'number', defaultValue: 0 },
            DIST: { type: 'number', defaultValue: 300 },
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
          text: '陀螺儀精準轉向至 絕對航向 [YAW]° 最大速度 [SPEED] 度/秒',
          arguments: {
            YAW: { type: 'number', defaultValue: 90 },
            SPEED: { type: 'number', defaultValue: 220 }
          }
        },
        {
          opcode: 'carTurnByDeg',
          blockType: 'command',
          text: '陀螺儀精準原地旋轉 相對角度 [DEG]° 最大速度 [SPEED] 度/秒',
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
            { text: 'ID 1', value: '1' },
            { text: 'ID 2', value: '2' },
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
  imuGetYaw() { return this._execRepl('_kb_lite_car.get_yaw()', true); }
  imuGetAngle(args) { return this._execRepl(`_kb_lite_car.get_angle('${(args && args.AXIS) || 'yaw'}')`, true); }
  imuGetGyro(args) { return this._execRepl(`_kb_lite_car.get_gyro(${Number((args && args.AXIS) || 2)})`, true); }

  carInit(args) {
    return this._execRepl(
      `_kb_lite_car.init_car('${(args && args.UART) || 'uart0'}', ${Number((args && args.LEFT_ID) || 1)}, ${Number((args && args.LEFT_DIR) || -1)}, ${Number((args && args.RIGHT_ID) || 2)}, ${Number((args && args.RIGHT_DIR) || 1)}, ${Number((args && args.WHEEL_D) || 66)}, ${Number((args && args.YAW_SIGN) || 1)})`,
      false,
      6000
    );
  }
  carSetPid(args) {
    return this._execRepl(`_kb_lite_car.set_pid(${Number((args && args.KP) || 8)}, ${Number((args && args.KI) || 0.05)}, ${Number((args && args.KD) || 1.2)})`);
  }
  carMoveStraightMm(args) {
    const dist = Number((args && args.DIST) || 300);
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