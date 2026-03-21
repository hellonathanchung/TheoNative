import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // Path: /live/<token> or /live/<token>/data
  const token = parts.find((_, i) => parts[i - 1] === "live") ?? parts[parts.length - 1];
  const isDataEndpoint = parts[parts.length - 1] === "data" && parts.length > 2;

  if (!token || token === "live" || token === "data") {
    return new Response("Missing token", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Validate the share link
  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("user_id, expires_at, is_active")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    const body = isDataEndpoint
      ? JSON.stringify({ error: "Invalid or expired link" })
      : expiredHTML();
    return new Response(body, {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": isDataEndpoint ? "application/json" : "text/html" },
    });
  }

  if (!link.is_active || new Date(link.expires_at) < new Date()) {
    const body = isDataEndpoint
      ? JSON.stringify({ error: "Link expired" })
      : expiredHTML();
    return new Response(body, {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": isDataEndpoint ? "application/json" : "text/html" },
    });
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", link.user_id)
    .single();

  // Fetch contractions
  const { data: contractions } = await supabase
    .from("contractions")
    .select("*")
    .eq("user_id", link.user_id)
    .order("start_time", { ascending: true });

  const rows = (contractions ?? []).map((c: any) => ({
    id: c.id,
    startTime: c.start_time,
    endTime: c.end_time,
    duration: c.duration,
    intensity: c.intensity,
  }));

  const displayName = profile?.display_name || profile?.email?.split("@")[0] || "Patient";
  const expiresAt = link.expires_at;

  if (isDataEndpoint) {
    return new Response(JSON.stringify({ contractions: rows, displayName, expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(dashboardHTML(displayName, rows, expiresAt, token), {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});

function expiredHTML(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Theo - Link Expired</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#F5FAF5;color:#2E3B2E;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{text-align:center;padding:40px;max-width:400px}.icon{font-size:48px;margin-bottom:16px}h1{font-size:20px;margin:0 0 8px}p{color:#5A6B5A;font-size:14px}</style>
</head><body><div class="card"><div class="icon">&#128148;</div><h1>Link Expired</h1><p>This sharing link is no longer active. Ask your patient to generate a new one from the Theo app.</p></div></body></html>`;
}

function dashboardHTML(name: string, contractions: any[], expiresAt: string, token: string): string {
  const dataJson = JSON.stringify(contractions);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Theo - Live Contractions</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F5FAF5;color:#2E3B2E;padding:16px;max-width:600px;margin:0 auto}
header{text-align:center;padding:20px 0 16px;border-bottom:1px solid #E8F0E8;margin-bottom:16px}
h1{font-size:22px;font-weight:700;color:#4CAF50}
.subtitle{font-size:13px;color:#5A6B5A;margin-top:4px}
.expiry{font-size:11px;color:#8A9B8A;margin-top:4px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.stat{background:#E8F0E8;border-radius:12px;padding:14px 10px;text-align:center}
.stat-value{font-size:22px;font-weight:700;color:#4CAF50}
.stat-label{font-size:11px;color:#5A6B5A;margin-top:2px}
.alert-banner{background:#C8E6C9;border-radius:12px;padding:12px 16px;margin-bottom:16px;text-align:center;font-weight:600;font-size:14px;color:#2E3B2E;display:none}
.alert-banner.warning{background:#FFF3E0;color:#E65100}
.alert-banner.urgent{background:#FFEBEE;color:#C62828}
table{width:100%;border-collapse:collapse;font-size:13px}
thead{position:sticky;top:0}
th{background:#E8F0E8;padding:10px 8px;text-align:left;font-size:11px;font-weight:600;color:#5A6B5A;text-transform:uppercase}
td{padding:10px 8px;border-bottom:1px solid #E8F0E8}
tr:last-child td{border-bottom:none}
.intensity-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.mild{background:#7CB342}.moderate{background:#F9A825}.strong{background:#E64A19}
.empty{text-align:center;padding:40px 20px;color:#8A9B8A;font-size:14px}
.refresh-note{text-align:center;font-size:11px;color:#8A9B8A;margin-top:12px}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#4CAF50;margin-right:4px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
</style>
</head>
<body>
<header>
  <h1>Theo</h1>
  <div class="subtitle"><span class="live-dot"></span> Live contractions for <strong id="patientName">${escapeHtml(name)}</strong></div>
  <div class="expiry" id="expiryText"></div>
</header>

<div class="alert-banner" id="alertBanner"></div>

<div class="stats">
  <div class="stat"><div class="stat-value" id="countStat">-</div><div class="stat-label">Contractions<br>(past hour)</div></div>
  <div class="stat"><div class="stat-value" id="durationStat">-</div><div class="stat-label">Avg Duration<br>(seconds)</div></div>
  <div class="stat"><div class="stat-value" id="intervalStat">-</div><div class="stat-label">Avg Interval<br>(minutes)</div></div>
</div>

<div id="tableContainer"></div>
<div class="refresh-note">Auto-refreshes every 10 seconds</div>

<script>
const TOKEN = "${token}";
let contractions = ${dataJson};
const expiresAt = new Date("${expiresAt}");

function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmtTime(ts){const d=new Date(ts);return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'})}
function fmtDuration(s){if(!s)return'-';const m=Math.floor(s/60);const sec=s%60;return m>0?m+'m '+sec+'s':sec+'s'}

function intensityClass(i){if(!i)return'';if(i<=3)return'mild';if(i<=6)return'moderate';return'strong'}
function intensityLabel(i){if(!i)return'-';if(i<=3)return'Mild';if(i<=6)return'Moderate';return'Strong'}

function updateExpiry(){
  const now=new Date();
  const diff=expiresAt-now;
  if(diff<=0){document.getElementById('expiryText').textContent='Link expired';return}
  const h=Math.floor(diff/3600000);const m=Math.floor((diff%3600000)/60000);
  document.getElementById('expiryText').textContent='Expires in '+h+'h '+m+'m';
}

function evaluateAlert(rows){
  const banner=document.getElementById('alertBanner');
  const oneHourAgo=Date.now()-3600000;
  const recent=rows.filter(c=>c.endTime&&c.startTime>=oneHourAgo);
  if(recent.length<3){banner.style.display='none';return}
  const intervals=[];
  for(let i=1;i<recent.length;i++){intervals.push((recent[i].startTime-recent[i-1].startTime)/60000)}
  const avgInterval=intervals.reduce((a,b)=>a+b,0)/intervals.length;
  const avgDuration=recent.reduce((a,c)=>a+(c.duration||0),0)/recent.length;
  if(recent.length>=6&&avgInterval<=3&&avgDuration>=60){
    banner.textContent='3-1-1 Pattern Detected - Consider heading to the hospital';
    banner.className='alert-banner urgent';banner.style.display='block';
  }else if(recent.length>=4&&avgInterval<=4&&avgDuration>=60){
    banner.textContent='4-1-1 Pattern Detected';
    banner.className='alert-banner warning';banner.style.display='block';
  }else if(recent.length>=3&&avgInterval<=5&&avgDuration>=60){
    banner.textContent='5-1-1 Pattern Approaching';
    banner.className='alert-banner';banner.style.display='block';
  }else{banner.style.display='none'}
}

function render(){
  const oneHourAgo=Date.now()-3600000;
  const recentHour=contractions.filter(c=>c.endTime&&c.startTime>=oneHourAgo);

  document.getElementById('countStat').textContent=recentHour.length||'-';
  if(recentHour.length>0){
    const avgDur=Math.round(recentHour.reduce((a,c)=>a+(c.duration||0),0)/recentHour.length);
    document.getElementById('durationStat').textContent=avgDur||'-';
  }else{document.getElementById('durationStat').textContent='-'}
  if(recentHour.length>1){
    const intervals=[];
    for(let i=1;i<recentHour.length;i++){intervals.push((recentHour[i].startTime-recentHour[i-1].startTime)/60000)}
    document.getElementById('intervalStat').textContent=intervals.length?Math.round(intervals.reduce((a,b)=>a+b,0)/intervals.length*10)/10+' min':'-';
  }else{document.getElementById('intervalStat').textContent='-'}

  evaluateAlert(contractions);

  const container=document.getElementById('tableContainer');
  if(contractions.length===0){
    container.innerHTML='<div class="empty">No contractions recorded yet. They will appear here in real time.</div>';
    return;
  }
  const sorted=[...contractions].reverse();
  let html='<table><thead><tr><th>#</th><th>Time</th><th>Duration</th><th>Intensity</th><th>Interval</th></tr></thead><tbody>';
  sorted.forEach((c,idx)=>{
    const num=contractions.length-idx;
    const ic=intensityClass(c.intensity);
    const dot=ic?'<span class="intensity-dot '+ic+'"></span>':'';
    let interval='-';
    if(idx<sorted.length-1){
      const prev=sorted[idx+1];
      const gap=Math.round((c.startTime-prev.startTime)/60000*10)/10;
      interval=gap+' min';
    }
    html+='<tr><td>'+num+'</td><td>'+fmtTime(c.startTime)+'</td><td>'+fmtDuration(c.duration)+'</td><td>'+dot+intensityLabel(c.intensity)+'</td><td>'+interval+'</td></tr>';
  });
  html+='</tbody></table>';
  container.innerHTML=html;
}

async function refresh(){
  try{
    const base=window.location.href.split('?')[0].replace(/\\/$/,'');
    const resp=await fetch(base+'/data');
    if(resp.ok){
      const json=await resp.json();
      contractions=json.contractions||[];
      render();
    }
  }catch(e){console.warn('refresh failed',e)}
}

render();
updateExpiry();
setInterval(refresh,10000);
setInterval(updateExpiry,60000);
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
