
(() => {
"use strict";
const C = window.FLIPBOOK_CONFIG;
const $ = id => document.getElementById(id);
let pageFlip=null, zoom=1, panX=0, panY=0, autoTimer=null, tocOpen=false, thumbsOpen=false, soundOn=true;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const current=()=>pageFlip ? pageFlip.getCurrentPageIndex() : 0;

function syncUI(){
  $("page-input").value=current()+1;
  document.querySelectorAll(".thumb").forEach((x,i)=>x.classList.toggle("active",i===current()));
}
function sound(){
  if(!soundOn)return;
  const a=$("flip-sound"); a.currentTime=0; a.play().catch(()=>{});
}
function transform(){
  $("flipbook-wrap").style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;
}
function panLimit(x,y){
  const s=$("stage"),w=$("flipbook-wrap");
  const mx=Math.max(0,(zoom*w.offsetWidth-s.offsetWidth)/2);
  const my=Math.max(0,(zoom*w.offsetHeight-s.offsetHeight)/2);
  return [clamp(x,-mx,mx),clamp(y,-my,my)];
}
function applyZoom(v){
  zoom=clamp(v,.35,3);
  if(zoom<=1){panX=panY=0;$("pan-overlay").classList.remove("active")}
  else{$("pan-overlay").classList.add("active");[panX,panY]=panLimit(panX,panY)}
  transform();
}
function init(saved=0){
  const wrap=$("flipbook-wrap");
  const mobile=innerWidth<768 || (innerWidth<1024 && "ontouchstart" in window);
  const ratio=C.pageWidth/C.pageHeight;
  const aw=innerWidth-(mobile?20:20), ah=innerHeight-C.toolbarHeight-20;
  let h=ah,w=mobile?h*ratio:h*ratio*2;
  if(w>aw){w=aw;h=w/(mobile?ratio:ratio*2)}
  const cssW=Math.max(1,Math.floor(mobile?w:w/2)), cssH=Math.max(1,Math.floor(h));
  const dpr=Math.min(devicePixelRatio||1,3), rw=Math.floor(cssW*dpr), rh=Math.floor(cssH*dpr);
  wrap.innerHTML="";
  const s=document.createElement("div");
  s.style.cssText=`width:${mobile?cssW:cssW*2}px;height:${cssH}px;overflow:hidden;flex-shrink:0`;
  const inner=document.createElement("div");
  inner.style.cssText=`transform:scale(${1/dpr});transform-origin:top left`;
  const host=document.createElement("div");host.id="flipbook";inner.appendChild(host);s.appendChild(inner);wrap.appendChild(s);
  zoom=1;panX=panY=0;transform();$("pan-overlay").classList.remove("active");
  pageFlip=new St.PageFlip(host,{width:rw,height:rh,size:"fixed",showCover:true,usePortrait:mobile,mobileScrollSupport:false,
    drawShadow:true,maxShadowOpacity:.85,flippingTime:800,useMouseEvents:true,swipeDistance:mobile?20:25,showPageCorners:true});
  pageFlip.loadFromImages(C.images);
  pageFlip.on("changeState",st=>{if(st==="flipping")sound();syncUI()});
  pageFlip.on("init",()=>{pageFlip.turnToPage(saved||0);$("loader").classList.add("hidden");syncUI()});
}
function toc(){
  const box=$("toc-items");box.innerHTML="";
  if(!C.bookmarks.length){box.innerHTML='<p style="padding:16px;color:#9ca3af">No outline in this PDF.</p>';return}
  C.bookmarks.forEach(b=>{
    const e=document.createElement("div");e.className="toc-item"+(b.level===2?" toc-l2":b.level>=3?" toc-l3":"");
    e.textContent=b.title;e.title="Page "+(b.page+1);e.onclick=()=>{pageFlip.turnToPage(b.page);toggleToc()};box.appendChild(e);
  });
}
function toggleToc(){tocOpen=!tocOpen;$("toc").classList.toggle("open",tocOpen);$("stage").classList.toggle("toc-open",tocOpen);$("btn-toc").classList.toggle("active",tocOpen)}
function thumbs(){
  const bar=$("thumbs-bar");
  if(!bar.children.length) C.thumbnails.forEach((src,i)=>{const im=document.createElement("img");im.src=src;im.className="thumb";im.loading="lazy";im.title="Page "+(i+1);im.onclick=()=>pageFlip.turnToPage(i);bar.appendChild(im)});
  thumbsOpen=!thumbsOpen;bar.classList.toggle("open",thumbsOpen);$("btn-thumbs").classList.toggle("active",thumbsOpen);
}
function auto(){
  if(autoTimer){clearInterval(autoTimer);autoTimer=null;$("btn-auto").textContent="▶ Auto";$("btn-auto").classList.remove("active")}
  else{autoTimer=setInterval(()=>current()>=C.totalPages-1?auto():pageFlip.flipNext(),3000);$("btn-auto").textContent="Ⅱ Stop";$("btn-auto").classList.add("active")}
}
function fullscreen(){if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen()}
function wire(){
  $("btn-toc").onclick=toggleToc;$("nav-prev").onclick=()=>pageFlip.flipPrev();$("nav-next").onclick=()=>pageFlip.flipNext();
  $("btn-first").onclick=()=>pageFlip.turnToPage(0);$("btn-prev").onclick=()=>pageFlip.flipPrev();$("btn-next").onclick=()=>pageFlip.flipNext();$("btn-last").onclick=()=>pageFlip.turnToPage(C.totalPages-1);
  $("btn-zoom-in").onclick=()=>applyZoom(zoom+.15);$("btn-zoom-out").onclick=()=>applyZoom(zoom-.15);$("btn-fit").onclick=()=>applyZoom(1);
  $("btn-thumbs").onclick=thumbs;$("btn-auto").onclick=auto;$("btn-fullscreen").onclick=fullscreen;
  $("btn-sound").onclick=()=>{soundOn=!soundOn;$("btn-sound").classList.toggle("active",soundOn);$("btn-sound").textContent=soundOn?"🔊 Sound":"🔇 Sound"};
  $("page-input").onchange=()=>{let p=parseInt($("page-input").value);if(p>=1&&p<=C.totalPages)pageFlip.turnToPage(p-1)};
  addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;const k=e.key;
    if(k==="ArrowLeft"||k==="ArrowUp")pageFlip.flipPrev();if(k==="ArrowRight"||k==="ArrowDown")pageFlip.flipNext();
    if(k==="Home")pageFlip.turnToPage(0);if(k==="End")pageFlip.turnToPage(C.totalPages-1);
    if("fF".includes(k))fullscreen();if("tT".includes(k))toggleToc();if("hH".includes(k))thumbs();if("aA".includes(k))auto();if("sS".includes(k))$("btn-sound").click();
    if(k==="+"||k==="=")applyZoom(zoom+.15);if(k==="-"||k==="_")applyZoom(zoom-.15);if(k==="0")applyZoom(1);
  });
  addEventListener("wheel",e=>{if(e.ctrlKey){e.preventDefault();applyZoom(zoom+(e.deltaY<0?.1:-.1))}else if(zoom>1){e.preventDefault();[panX,panY]=panLimit(panX-e.deltaX,panY-e.deltaY);transform()}},{passive:false});
  let drag=null;const ov=$("pan-overlay");
  ov.onmousedown=e=>{drag={x:e.clientX,y:e.clientY,px:panX,py:panY};ov.classList.add("panning")};
  addEventListener("mousemove",e=>{if(!drag)return;[panX,panY]=panLimit(drag.px+e.clientX-drag.x,drag.py+e.clientY-drag.y);transform()});
  addEventListener("mouseup",()=>{drag=null;ov.classList.remove("panning")});
  let pinch=null;
  addEventListener("touchstart",e=>{if(e.touches.length===2)pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
  addEventListener("touchmove",e=>{if(e.touches.length===2&&pinch){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);applyZoom(zoom*d/pinch);pinch=d;e.preventDefault()}},{passive:false});
  addEventListener("touchend",()=>{pinch=null},{passive:true});
  let timer;addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>init(current()),250)});
}
addEventListener("DOMContentLoaded",()=>{document.title=C.title;$("toolbar-title").textContent=C.title;$("document-title").textContent=C.title;$("page-count").textContent="/ "+C.totalPages;toc();wire();init()});
})();
