// Partnerseite politik-duell.de/partner/ (Pitch-Präsentation, statisch; Anpassungen in der Präsentation, dann neu erzeugen).
(function(){
var S=[].slice.call(document.querySelectorAll('#buehne > section')),i=0,b=document.getElementById('buehne');
function skalieren(){var k=Math.min(innerWidth/1920,innerHeight/1080);b.style.transform='scale('+k+') translate(-50%,-50%)';}
function zaehlen(s){[].forEach.call(s.querySelectorAll('.wert[data-ziel]'),function(e){var z=e.getAttribute('data-ziel'),m=z.match(/^(\D*)([\d.]+)(.*)$/);if(!m)return;var n=parseInt(m[2].replace(/\./g,''),10),t0=null,dauer=1100;
 function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/dauer,1),v=Math.round(n*(1-Math.pow(1-p,3)));e.textContent=m[1]+v.toLocaleString('de-DE')+m[3];if(p<1)requestAnimationFrame(f);}
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;requestAnimationFrame(f);});}
function zeige(n){n=Math.max(0,Math.min(S.length-1,n));S[i].classList.remove('aktiv');i=n;var s=S[i];
 void s.offsetWidth;s.classList.add('aktiv');zaehlen(s);
 document.getElementById('zaehler').textContent=(i+1)+' / '+S.length;
 document.getElementById('fortschritt').style.width=((i+1)/S.length*100)+'%';
 if(location.hash!=='#'+(i+1))history.replaceState(null,'','#'+(i+1));}
addEventListener('resize',skalieren);skalieren();
addEventListener('keydown',function(e){if(['ArrowRight','PageDown',' ','Enter'].indexOf(e.key)>-1){e.preventDefault();zeige(i+1);}
 else if(['ArrowLeft','PageUp','Backspace'].indexOf(e.key)>-1){e.preventDefault();zeige(i-1);}
 else if(e.key==='Home')zeige(0);else if(e.key==='End')zeige(S.length-1);else if(e.key==='f')voll();});
document.getElementById('weiter').onclick=function(e){e.stopPropagation();zeige(i+1);};
document.getElementById('zurueck').onclick=function(e){e.stopPropagation();zeige(i-1);};
function voll(){var d=document;if(!d.fullscreenElement&&d.documentElement.requestFullscreen)d.documentElement.requestFullscreen();else if(d.exitFullscreen)d.exitFullscreen();}
document.getElementById('voll').onclick=function(e){e.stopPropagation();voll();};
document.addEventListener('click',function(e){if(e.target.closest('a,#steuerung'))return;zeige(e.clientX<innerWidth/3?i-1:i+1);});
var x0=null;addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)zeige(dx<0?i+1:i-1);x0=null;});
setTimeout(function(){document.getElementById('hinweis').style.opacity=0;},4000);
var h=parseInt(location.hash.slice(1),10);S[0].classList.add('aktiv');zeige(h>0?h-1:0);
})();
