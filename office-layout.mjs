// Layout is presentation only: it never creates agent identities or jobs.
export function roomLayout(count){
 if(!Number.isSafeInteger(count)||count<0||count>500)throw Error('Quantidade inválida');
 const positions=Array.from({length:count},(_,i)=>i<6
 ?{x:i<3?-3.60:3.65,z:-4.65+(i%3)*3.15,rotation:i<3?Math.PI/2:-Math.PI/2}
 :{x:[-4.5,-1.5,1.5,4.5][(i-6)%4],z:9+Math.floor((i-6)/4)*3.15,rotation:0});
 const end=count>6?positions.at(-1).z+2.2:6.6;
 return {positions,end,center:(end-6.85)/2,span:Math.max(15,end+6.85)};
}
