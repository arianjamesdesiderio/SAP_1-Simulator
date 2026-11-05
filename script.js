// SAP-1 interactive simulator — 8-bit data, 4-bit address
let PC=0, MAR=0, IR=0, A=0, B=0, OUT=0;
let RAM=new Array(16).fill(0);
let loaded=false, halted=false, running=false, timer=null, steps=0, activeAddress=-1;
const totalInstructions=5;
const $=id=>document.getElementById(id);
const binary=(n,bits)=>n.toString(2).padStart(bits,"0");
const hex=n=>n.toString(16).toUpperCase().padStart(2,"0");
const addrHex=n=>n.toString(16).toUpperCase();

function toast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function log(message){const box=$("log");const empty=box.querySelector(".log-empty");if(empty)empty.remove();const row=document.createElement("div");row.className="log-entry";row.innerHTML=`<span>${new Date().toLocaleTimeString()}</span>${message}`;box.appendChild(row);box.scrollTop=box.scrollHeight}
function setStatus(message){$("status").textContent=message}
function setState(state){const p=$("statePill");p.className="status-pill"+(state==="RUNNING"?" running":state==="HALTED"?" done":"");p.innerHTML=`<i></i> ${state}`}
function showBus(message){$("bus").textContent=message;const pulse=$("busPulse");pulse.classList.remove("pulse");void pulse.offsetWidth;pulse.classList.add("pulse")}
function updateRegisters(){
  const vals={PC:[PC,4],MAR:[MAR,4],IR:[IR,8],A:[A,8],B:[B,8],OUT:[OUT,8]};
  for(const [name,[value,bits]] of Object.entries(vals)){$(name).textContent=binary(value,bits);$(name==="OUT"?"outHex":name.toLowerCase()+"Hex").textContent=addrHex(value)+(name==="PC"||name==="MAR"?"H":"H")}
  $("outputHex").textContent=hex(OUT)+"H";$("ledStatus").textContent="0x"+hex(OUT);
  $("progressText").textContent=`${steps} / ${totalInstructions}`;$("progressBar").style.width=(steps/totalInstructions*100)+"%";
  renderLeds();
}
function renderLeds(){const box=$("leds");box.innerHTML="";for(let bit=7;bit>=0;bit--){const led=document.createElement("i");led.className="led"+(((OUT>>bit)&1)?" on":"");led.title=`Bit ${bit}: ${(OUT>>bit)&1}`;box.appendChild(led)}}
function renderRam(){const body=$("memoryTable");body.innerHTML="";for(let i=0;i<16;i++){const row=document.createElement("tr");if(i===activeAddress)row.classList.add("active-row");if([9,10,11].includes(i))row.classList.add("data-row");let type=i<5?"INSTRUCTION":([9,10,11].includes(i)?"USER DATA":"EMPTY");row.innerHTML=`<td>${addrHex(i)}H</td><td>${hex(RAM[i])}H</td><td>${binary(RAM[i],8)}</td><td><span class="type-label">${type}</span></td>`;body.appendChild(row)}}
function readInput(id){const v=$(id).value.trim();if(!/^[0-9a-fA-F]{1,2}$/.test(v))throw Error("Enter valid hexadecimal values from 00 to FF.");return parseInt(v,16)}
function updateFormula(){try{$("formulaPreview").textContent=[readInput("value1"),readInput("value2"),readInput("value3")].map(v=>hex(v)+"H").join(" + ").replace(/ \+ ([0-9A-F]{2}H)$/," − $1")}catch{$("formulaPreview").textContent="Check your hexadecimal inputs"}}
["value1","value2","value3"].forEach(id=>$(id).addEventListener("input",updateFormula));
function stopRun(){running=false;if(timer){clearInterval(timer);timer=null}}
function loadProgram(){
 stopRun();try{const x=readInput("value1"),y=readInput("value2"),z=readInput("value3");
 PC=MAR=IR=A=B=OUT=0;RAM=new Array(16).fill(0);steps=0;activeAddress=-1;halted=false;loaded=true;
 RAM[0]=0x09;RAM[1]=0x1A;RAM[2]=0x2B;RAM[3]=0xEF;RAM[4]=0xFF;RAM[9]=x;RAM[10]=y;RAM[11]=z;
 $("log").innerHTML="";log("Program loaded into RAM. Instructions are ready.");log(`Input data: ${hex(x)}H, ${hex(y)}H, ${hex(z)}H.`);setStatus("Program loaded successfully. Use Step to execute one instruction at a time, or Run for automatic execution.");setState("READY");showBus("W-Bus idle — waiting for CPU fetch.");updateRegisters();renderRam();toast("Program loaded successfully.");
 }catch(e){setStatus(e.message);toast(e.message)}
}
function stepCPU(){
 if(!loaded){setStatus("Load a program before execution.");toast("Please load a program first.");return}
 if(halted)return;
 if(PC>15){halted=true;setState("HALTED");setStatus("Program stopped: program counter is outside RAM.");stopRun();return}
 // FETCH
 MAR=PC;activeAddress=MAR;showBus(`FETCH: PC → MAR (${addrHex(MAR)}H)`);IR=RAM[MAR];showBus(`FETCH: RAM[${addrHex(MAR)}H] → IR (${binary(IR,8)})`);PC=(PC+1)&15;
 // DECODE
 const opcode=(IR>>4)&15,operand=IR&15;let description="";
 // EXECUTE
 if(opcode===0){MAR=operand;A=RAM[MAR];description=`LDA ${addrHex(operand)}H — loaded ${hex(A)}H into accumulator.`;showBus(`EXECUTE: RAM[${addrHex(MAR)}H] → A (${hex(A)}H)`)}
 else if(opcode===1){MAR=operand;B=RAM[MAR];showBus(`EXECUTE: RAM[${addrHex(MAR)}H] → B (${hex(B)}H)`);A=(A+B)&255;description=`ADD ${addrHex(operand)}H — accumulator is now ${hex(A)}H.`}
 else if(opcode===2){MAR=operand;B=RAM[MAR];showBus(`EXECUTE: RAM[${addrHex(MAR)}H] → B (${hex(B)}H)`);A=(A+((~B+1)&255))&255;description=`SUB ${addrHex(operand)}H — 2's complement subtraction gives ${hex(A)}H.`}
 else if(opcode===14){OUT=A;description=`OUT — accumulator value ${hex(OUT)}H copied to output register.`;showBus(`EXECUTE: A → OUT (${hex(OUT)}H)`)}
 else if(opcode===15){halted=true;description="HLT — halt instruction received. CPU stopped.";showBus("CONTROL: HLT — processor halted.")}
 else{halted=true;description=`Unknown opcode ${opcode.toString(16)}H — CPU stopped.`;showBus("ERROR: Invalid instruction.");}
 steps=Math.min(steps+1,totalInstructions);log(`<b>${description}</b>`);updateRegisters();renderRam();
 if(halted){stopRun();setState("HALTED");setStatus(`Execution complete. Final output: ${hex(OUT)}H.`);toast("Program execution completed.");}
 else{setState(running?"RUNNING":"READY");setStatus(`Instruction executed. Next instruction address: ${addrHex(PC)}H.`)}
}
function runCPU(){if(!loaded){setStatus("Load a program before execution.");return}if(halted){toast("Reset or load the program again.");return}if(running)return;running=true;setState("RUNNING");setStatus("Program running automatically...");timer=setInterval(()=>{stepCPU();if(halted)stopRun()},850)}
function resetCPU(){stopRun();PC=MAR=IR=A=B=OUT=0;steps=0;halted=false;activeAddress=-1;setState("READY");setStatus(loaded?"CPU reset. Program remains in RAM and is ready to run again.":"System ready. Load a program to begin.");showBus("W-Bus idle — waiting for CPU fetch.");$("log").innerHTML='<div class="log-empty">CPU reset. No instructions executed yet.</div>';updateRegisters();renderRam();toast("CPU registers reset.")}
$("loadBtn").addEventListener("click",loadProgram);$("stepBtn").addEventListener("click",stepCPU);$("runBtn").addEventListener("click",runCPU);$("resetBtn").addEventListener("click",resetCPU);$("clearLogBtn").addEventListener("click",()=>{$("log").innerHTML='<div class="log-empty">Log cleared.</div>'});
updateFormula();updateRegisters();renderRam();