import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const C = { bg:"#0c0c0e", card:"#141416", border:"#1f1f24", orange:"#ff6b2b", orangeD:"#e55a1e", green:"#22c55e", yellow:"#f59e0b", red:"#ef4444", blue:"#3b82f6", text:"#e8e8ee", muted:"#52525e", sub:"#8888a0" };
const PIE_COLORS = ["#ff6b2b","#fb923c","#f59e0b","#22c55e","#3b82f6","#a855f7","#ec4899","#14b8a6"];

// ── REAL DATA — CV Trio Jaya Sentosa, Feb 2026 ───────────
const REAL_DATA = {"sales":[{"name":"Agus Triyono","area":"Kab. Cilacap","nett":751338350,"customers":302,"orders":402,"visits":492,"orderRate":82,"avgDuration":5.9,"status":"danger","pct":3},{"name":"Alwi Husein","area":"Kab. Banyumas","nett":979719100,"customers":465,"orders":730,"visits":906,"orderRate":79,"avgDuration":2.9,"status":"danger","pct":3},{"name":"Arif Gunawan","area":"Kab. Banyumas","nett":851161300,"customers":448,"orders":725,"visits":871,"orderRate":83,"avgDuration":1.9,"status":"danger","pct":3},{"name":"Bayu Prakoso","area":"Kab. Purbalingga","nett":671963750,"customers":486,"orders":764,"visits":999,"orderRate":76,"avgDuration":3.8,"status":"danger","pct":2},{"name":"Bayu Satrya Febrianto","area":"Kab. Banyumas","nett":428843600,"customers":192,"orders":227,"visits":319,"orderRate":69,"avgDuration":5.5,"status":"danger","pct":2},{"name":"Budi Santoso","area":"Kab. Tegal","nett":501332200,"customers":425,"orders":597,"visits":613,"orderRate":97,"avgDuration":3.0,"status":"danger","pct":2},{"name":"Dede Kurnia","area":"Kab. Banyumas","nett":814598700,"customers":485,"orders":762,"visits":1038,"orderRate":73,"avgDuration":2.7,"status":"danger","pct":3},{"name":"Dedi Ruswandi","area":"Kab. Banjarnegara","nett":760332850,"customers":440,"orders":740,"visits":780,"orderRate":95,"avgDuration":3.1,"status":"danger","pct":3},{"name":"Deny Mardianto","area":"Kab. Banyumas","nett":45007700,"customers":55,"orders":61,"visits":76,"orderRate":80,"avgDuration":9.7,"status":"danger","pct":0},{"name":"Dwi Listiyono","area":"Kab. Purbalingga","nett":281334350,"customers":390,"orders":630,"visits":1059,"orderRate":59,"avgDuration":2.4,"status":"danger","pct":1},{"name":"Fajar Sukirno","area":"Kab. Cilacap","nett":16269566300,"customers":83,"orders":226,"visits":235,"orderRate":96,"avgDuration":4.9,"status":"warning","pct":58},{"name":"Ferry Adhi Sonjaya","area":"Kab. Cilacap","nett":136618000,"customers":83,"orders":83,"visits":125,"orderRate":66,"avgDuration":5.1,"status":"danger","pct":0},{"name":"Heri Nur Patoni","area":"Kab. Banyumas","nett":22743837000,"customers":62,"orders":210,"visits":229,"orderRate":91,"avgDuration":29.7,"status":"good","pct":81},{"name":"Kirwan","area":"Kab. Cilacap","nett":693782500,"customers":368,"orders":554,"visits":645,"orderRate":86,"avgDuration":3.1,"status":"danger","pct":2},{"name":"Maryono","area":"Kab. Purbalingga","nett":11345046500,"customers":77,"orders":247,"visits":259,"orderRate":92,"avgDuration":12.2,"status":"warning","pct":40},{"name":"Mokhammad Juandi","area":"Kab. Pemalang","nett":28249161500,"customers":61,"orders":157,"visits":165,"orderRate":95,"avgDuration":22.7,"status":"top","pct":100},{"name":"Mulat Maryono","area":"Kab. Cilacap","nett":947917200,"customers":418,"orders":650,"visits":805,"orderRate":80,"avgDuration":3.8,"status":"danger","pct":3},{"name":"Nurdianto","area":"Kab. Pemalang","nett":874597150,"customers":433,"orders":746,"visits":1041,"orderRate":69,"avgDuration":4.1,"status":"danger","pct":3},{"name":"Satria Raja Situmorang","area":"Kab. Pemalang","nett":1324483050,"customers":473,"orders":860,"visits":918,"orderRate":92,"avgDuration":3.4,"status":"danger","pct":5},{"name":"Senja Febiana","area":"Kab. Brebes","nett":409875000,"customers":2,"orders":3,"visits":0,"orderRate":0,"avgDuration":0,"status":"danger","pct":1},{"name":"Sutarso","area":"Kab. Cilacap","nett":14582764000,"customers":61,"orders":180,"visits":214,"orderRate":84,"avgDuration":9.1,"status":"warning","pct":52},{"name":"Tegar Krisna Diansyah","area":"Kab. Purbalingga","nett":822049050,"customers":530,"orders":816,"visits":1119,"orderRate":73,"avgDuration":3.6,"status":"danger","pct":3},{"name":"Vinsensius Agung Prasodjo","area":"Kab. Tegal","nett":13724498000,"customers":64,"orders":186,"visits":222,"orderRate":81,"avgDuration":21.4,"status":"warning","pct":49},{"name":"Yogi Wahyu Aldi","area":"Kab. Purbalingga","nett":666747000,"customers":407,"orders":707,"visits":858,"orderRate":82,"avgDuration":2.7,"status":"danger","pct":2},{"name":"Yudhistira Arifianto Sumbardjo","area":"Kab. Banyumas","nett":857892800,"customers":454,"orders":693,"visits":849,"orderRate":82,"avgDuration":2.4,"status":"danger","pct":3}],"products":[{"name":"GROW KUNING K12","value":43.2},{"name":"GROW BOLD F12","value":16.5},{"name":"GROW BOLD F20","value":12.9},{"name":"GROW BERRY BOLD F12","value":9.3},{"name":"GROW REGULER F12","value":6.7},{"name":"GROW BERRY BOLD F16","value":5.8},{"name":"927 ISTIMEWA K12","value":3.0},{"name":"92 FILTER KING SIZE HIJAU F12","value":2.6}],"daily":[{"day":"02/02","total":5221.6},{"day":"03/02","total":6787},{"day":"04/02","total":9565.5},{"day":"05/02","total":4512},{"day":"06/02","total":5928.2},{"day":"07/02","total":1357.8},{"day":"09/02","total":12589},{"day":"10/02","total":14354.8},{"day":"11/02","total":8316.3},{"day":"12/02","total":6888.7},{"day":"13/02","total":4401.4},{"day":"14/02","total":1474.8},{"day":"18/02","total":7446.2},{"day":"19/02","total":5564.9},{"day":"20/02","total":4265.5},{"day":"21/02","total":1256.6},{"day":"23/02","total":2342.1},{"day":"24/02","total":4052.4},{"day":"25/02","total":5558.6},{"day":"26/02","total":3162.9},{"day":"27/02","total":3711.1},{"day":"28/02","total":977.2}],"stock":[{"name":"GROW KUNING K12","qty":1546368,"stock":202230},{"name":"GROW BOLD F12","qty":614419,"stock":103607},{"name":"GROW BOLD F20","qty":433933,"stock":73510},{"name":"GROW BERRY BOLD F12","qty":312162,"stock":38156},{"name":"GROW BERRY BOLD F16","qty":223516,"stock":24208},{"name":"GROW REGULER F12","qty":197367,"stock":26996},{"name":"92 FILTER KING SIZE HI","qty":119634,"stock":53457},{"name":"927 ISTIMEWA K12","qty":107414,"stock":16502},{"name":"GROW REGULER F16","qty":85994,"stock":11913},{"name":"GROW COKLAT K12","qty":52275,"stock":8889}],"period":"Feb 2026","company":"CV Trio Jaya Sentosa"};

const fmtRp  = (n) => n>=1e9?`Rp${(n/1e9).toFixed(1)}M`:n>=1e6?`Rp${(n/1e6).toFixed(0)}jt`:`Rp${Number(n).toLocaleString("id-ID")}`;
const fmtFull= (n) => `Rp${Number(n).toLocaleString("id-ID")}`;
const STATUS_CFG = { top:{label:"TOP",bg:C.orange,text:"#fff"}, good:{label:"ON TRACK",bg:C.green,text:"#fff"}, warning:{label:"WARNING",bg:C.yellow,text:"#111"}, danger:{label:"CRITICAL",bg:C.red,text:"#fff"} };

function buildData({ salesOrder, callReport, stockTransfer }) {
  const salesAgg={}, prodAgg={}, daily={};
  if (salesOrder) {
    salesOrder.forEach(r=>{
      const name=r["Nama Staff"]; if(!name) return;
      if(!salesAgg[name]) salesAgg[name]={nett:0,customers:new Set(),orders:new Set(),area:""};
      salesAgg[name].nett += Number(r["Nett Total"])||0;
      salesAgg[name].customers.add(r["Nama Customer"]);
      salesAgg[name].orders.add(r["Nomor Order"]);
      const area=r["Kota/Kab. Customer"]; if(area&&area!=="-") salesAgg[name].area=area;
      const prod=r["Nama Produk"],qty=Number(r["Kuantitas Order"])||0; if(prod) prodAgg[prod]=(prodAgg[prod]||0)+qty;
      const tgl=String(r["Tanggal Order"]||"").slice(0,10); if(tgl) daily[tgl]=(daily[tgl]||0)+(Number(r["Nett Total"])||0);
    });
  }
  const visitAgg={};
  if (callReport) {
    callReport.forEach(r=>{
      const name=r["STAFF NAME"]; if(!name) return;
      if(!visitAgg[name]) visitAgg[name]={visits:0,with_order:0,duration:0};
      visitAgg[name].visits++;
      if(Number(r["SALES ORDER COUNT"])>0) visitAgg[name].with_order++;
      visitAgg[name].duration+=Number(r["DURATION IN MINUTE"])||0;
    });
  }
  const stockAgg={};
  if (stockTransfer) {
    stockTransfer.forEach(r=>{
      const prod=r["Product Name"]; if(!prod) return;
      if(!stockAgg[prod]) stockAgg[prod]={qty:0,stock:0};
      stockAgg[prod].qty+=Number(r["Quantity to Transfer"])||0;
      stockAgg[prod].stock=Number(r["After Transfer Quantity (Destination)"])||0;
    });
  }
  const allNames=new Set([...Object.keys(salesAgg),...Object.keys(visitAgg)]);
  const maxNett=Math.max(...Object.values(salesAgg).map(v=>v.nett),1);
  const sales=[...allNames].sort().map(name=>{
    const so=salesAgg[name]||{nett:0,customers:new Set(),orders:new Set(),area:"–"};
    const vi=visitAgg[name]||{visits:0,with_order:0,duration:0};
    const pct=Math.round(so.nett/maxNett*100);
    const status=pct>=90?"top":pct>=65?"good":pct>=40?"warning":"danger";
    const area=(so.area||"–").replace("KABUPATEN ","Kab. ").replace("KOTA ","Kota ").replace(/\b\w/g,c=>c.toUpperCase()).replace(/\b[A-Z]{3,}\b/g,w=>w[0]+w.slice(1).toLowerCase());
    return {name:name.replace(/\b\w/g,c=>c.toUpperCase()),area,nett:so.nett,customers:so.customers.size,orders:so.orders.size,visits:vi.visits,orderRate:vi.visits?Math.round(vi.with_order/vi.visits*100):0,avgDuration:vi.visits?Math.round(vi.duration/vi.visits*10)/10:0,status,pct};
  });
  const topProds=Object.entries(prodAgg).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const totalQty=topProds.reduce((s,[,v])=>s+v,0);
  const products=topProds.map(([n,v])=>({name:n.slice(0,25),value:Math.round(v/totalQty*1000)/10}));
  const dailyArr=Object.entries(daily).sort().map(([k,v])=>{
    const p=k.split("-"); const label=p.length>=3?`${p[2]}/${p[1]}`:k.slice(0,5);
    return {day:label,total:Math.round(v/1e6*10)/10};
  });
  const stock=Object.entries(stockAgg).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10).map(([n,v])=>({name:n.slice(0,22),qty:Math.round(v.qty),stock:Math.round(v.stock)}));
  const period=dailyArr.length>0?`${dailyArr[0].day.slice(3)}/${new Date().getFullYear()}`:"–";
  return {sales,products,daily:dailyArr,stock,period,company:"CV Trio Jaya Sentosa"};
}

async function parseDistriFiles(files) {
  const results={salesOrder:null,callReport:null,stockTransfer:null};
  await Promise.all(Array.from(files).map(file=>new Promise(res=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try {
        const wb=XLSX.read(e.target.result,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
        const keys=rows[0]?Object.keys(rows[0]).join(",").toLowerCase():"";
        if(keys.includes("nama staff")&&keys.includes("nett total")) results.salesOrder=rows;
        else if(keys.includes("staff name")&&keys.includes("duration in minute")) results.callReport=rows;
        else if(keys.includes("product name")&&keys.includes("quantity to transfer")) results.stockTransfer=rows;
      } catch(e){console.error(e);}
      res();
    };
    reader.readAsArrayBuffer(file);
  })));
  const d=buildData(results);
  return d.sales.length>0?d:null;
}

async function askClaude(q, history, data) {
  const topS=[...data.sales].sort((a,b)=>b.nett-a.nett).slice(0,5).map(s=>`${s.name}(${s.area}): ${fmtRp(s.nett)}, ${s.visits} visits, ${s.orderRate}% order rate`).join("\n");
  const attn=data.sales.filter(s=>["warning","danger"].includes(s.status)).slice(0,8).map(s=>`${s.name}: ${fmtRp(s.nett)}, ${s.visits} visits, ${s.orderRate}% order rate`).join("\n");
  const sys=`Kamu AI assistant untuk manager CV Trio Jaya Sentosa, distributor rokok Jawa Tengah. Periode: ${data.period}. ${data.sales.length} sales.\nTOP 5:\n${topS}\nPERLU PERHATIAN:\n${attn}\nPRODUK: ${data.products.slice(0,5).map(p=>`${p.name}(${p.value}%)`).join(", ")}\nJawab singkat bahasa Indonesia casual-profesional. Emoji sesekali. Maks 5 kalimat. Berikan rekomendasi actionable.`;
  const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:sys,messages:[...history,{role:"user",content:q}]})});
  const d=await res.json();
  return d.content?.[0]?.text||"Maaf ada gangguan. Coba lagi.";
}

function KpiCard({label,value,sub,icon,color}) {
  return <div style={{background:C.card,borderRadius:14,padding:"18px 20px",border:`1px solid ${C.border}`,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:14,right:16,fontSize:26,opacity:0.12}}>{icon}</div>
    <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>{label}</div>
    <div style={{fontSize:28,fontWeight:700,color,fontFamily:"'Bebas Neue'",letterSpacing:1}}>{value}</div>
    <div style={{fontSize:11,color:C.sub,marginTop:3}}>{sub}</div>
  </div>;
}

export default function App() {
  const [tab,setTab]=useState("dashboard");
  const [data,setData]=useState(REAL_DATA);
  const [uploadLabel,setUploadLabel]=useState(null);
  const [expanded,setExpanded]=useState(null);
  const [chat,setChat]=useState([]);
  const [apiHist,setApiHist]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [drag,setDrag]=useState(false);
  const chatEnd=useRef(); const fileInput=useRef();

  useEffect(()=>{
    const top=[...data.sales].sort((a,b)=>b.nett-a.nett)[0];
    setChat([{role:"assistant",content:`Halo Boss! 👋 Data **${data.company} — ${data.period}** sudah aktif.\n\nAda **${data.sales.length} sales**, top performer: **${top?.name}** dengan ${fmtRp(top?.nett||0)}.\n\nMau analisa apa hari ini?`}]);
  },[data]);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[chat]);

  const handleFiles=useCallback(async(files)=>{
    const arr=Array.from(files).filter(f=>f.name.match(/\.(xlsx|xls|csv)$/i));
    if(!arr.length) return alert("Upload file .xlsx dari Distri.id ya Boss!");
    const parsed=await parseDistriFiles(arr);
    if(parsed){setData(parsed);setUploadLabel(`✅ ${arr.length} file`);setTab("dashboard");}
    else alert("Format tidak cocok. Pastikan upload: Sales Order Report, Call Report, atau Stock Transfer dari Distri.id.");
  },[]);

  const onDrop=useCallback(e=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);},[handleFiles]);

  const send=async()=>{
    if(!input.trim()||loading) return;
    const q=input.trim();setInput("");setLoading(true);
    const newChat=[...chat,{role:"user",content:q}];setChat(newChat);
    try{const reply=await askClaude(q,apiHist,data);setChat([...newChat,{role:"assistant",content:reply}]);setApiHist([...apiHist,{role:"user",content:q},{role:"assistant",content:reply}]);}
    catch{setChat([...newChat,{role:"assistant",content:"⚠️ Koneksi bermasalah. Coba lagi."}]);}
    setLoading(false);
  };

  const S=data.sales;
  const totalNett=S.reduce((s,x)=>s+x.nett,0);
  const totalOrders=S.reduce((s,x)=>s+x.orders,0);
  const totalVisits=S.reduce((s,x)=>s+x.visits,0);
  const avgOR=S.length?Math.round(S.reduce((s,x)=>s+x.orderRate,0)/S.length):0;

  const Tip=({active,payload,label})=>active&&payload?.length?<div style={{background:"#1e1e28",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.text}}><div style={{color:C.muted,marginBottom:3}}>{label}</div><div style={{color:C.orange,fontWeight:700}}>{payload[0]?.name==="total"?`Rp${payload[0].value}jt`:Number(payload[0].value).toLocaleString()}</div></div>:null;

  return <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Bebas+Neue&display=swap" rel="stylesheet"/>

    <header style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"0 20px",position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.orange},${C.orangeD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🚬</div>
          <div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:C.orange}}>DISTRIB AI</div>
            <div style={{fontSize:10,color:C.muted,marginTop:-3}}>{data.company} · {data.period}</div>
          </div>
        </div>
        <nav style={{display:"flex",gap:2}}>
          {[{id:"dashboard",label:"📊 Dashboard"},{id:"team",label:"👥 Tim Sales"},{id:"stock",label:"📦 Stok"},{id:"chat",label:"🤖 AI Assistant"}].map(t=>
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans'",background:tab===t.id?C.orange:"transparent",color:tab===t.id?"#fff":C.muted,transition:"all 0.18s"}}>{t.label}</button>
          )}
        </nav>
        <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={onDrop} onClick={()=>fileInput.current.click()}
          style={{padding:"6px 14px",borderRadius:8,border:`1.5px dashed ${drag?C.orange:C.border}`,cursor:"pointer",fontSize:11,color:drag?C.orange:C.muted,background:drag?"#1a1008":"transparent",transition:"all 0.2s",whiteSpace:"nowrap"}}>
          {uploadLabel||"⬆️ Upload bulan baru"}
        </div>
        <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
      </div>
    </header>

    <main style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>

      {tab==="dashboard"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          <KpiCard label="Total Penjualan"  value={fmtRp(totalNett)}            sub={`${S.length} sales aktif`}            icon="💰" color={C.orange}/>
          <KpiCard label="Total Order"      value={totalOrders.toLocaleString()} sub="transaksi bulan ini"                  icon="📋" color={C.blue}/>
          <KpiCard label="Total Visit"      value={totalVisits.toLocaleString()} sub="kunjungan ke outlet"                  icon="🗺️" color="#a855f7"/>
          <KpiCard label="Avg Order Rate"   value={`${avgOR}%`}                  sub="visit → order"                       icon="🎯" color={avgOR>=80?C.green:avgOR>=65?C.yellow:C.red}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
          <div style={{background:C.card,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>Trend Penjualan Harian</div>
            <div style={{fontSize:10,color:C.sub,marginBottom:16}}>Juta rupiah · {data.period}</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={data.daily}><CartesianGrid stroke="#1a1a20" strokeDasharray="3 3"/>
                <XAxis dataKey="day" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} interval={2}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Line type="monotone" dataKey="total" stroke={C.orange} strokeWidth={2.5} dot={{fill:C.orange,r:3,strokeWidth:0}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:C.card,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>Product Mix</div>
            <div style={{fontSize:10,color:C.sub,marginBottom:12}}>% dari total qty</div>
            <ResponsiveContainer width="100%" height={110}><PieChart><Pie data={data.products} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
              {data.products.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%8]}/>)}
            </Pie><Tooltip content={<Tip/>}/></PieChart></ResponsiveContainer>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
              {data.products.slice(0,5).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:C.sub}}><div style={{width:7,height:7,borderRadius:2,background:PIE_COLORS[i%8]}}/>{p.name.slice(0,14)}</div>)}
            </div>
          </div>
        </div>
        <div style={{background:C.card,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>Penjualan per Sales (Top 15)</div>
          <div style={{fontSize:10,color:C.sub,marginBottom:16}}>Juta rupiah</div>
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={[...S].sort((a,b)=>b.nett-a.nett).slice(0,15).map(s=>({name:s.name.split(" ")[0],nett:Math.round(s.nett/1e6),status:s.status}))} barSize={22}>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="nett" radius={[5,5,0,0]}>{[...S].sort((a,b)=>b.nett-a.nett).slice(0,15).map((s,i)=><Cell key={i} fill={s.status==="top"?C.orange:s.status==="good"?C.green:s.status==="warning"?C.yellow:C.red}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>}

      {tab==="team"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {[{label:"Top",count:S.filter(s=>s.status==="top").length,color:C.orange,icon:"🏆"},{label:"On Track",count:S.filter(s=>s.status==="good").length,color:C.green,icon:"✅"},{label:"Warning",count:S.filter(s=>s.status==="warning").length,color:C.yellow,icon:"⚡"},{label:"Critical",count:S.filter(s=>s.status==="danger").length,color:C.red,icon:"🔴"}].map((s,i)=>
            <div key={i} style={{background:C.card,borderRadius:12,padding:"14px 16px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20}}>{s.icon}</div>
              <div><div style={{fontSize:24,fontWeight:700,color:s.color,fontFamily:"'Bebas Neue'"}}>{s.count}</div><div style={{fontSize:11,color:C.muted}}>{s.label}</div></div>
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[...S].sort((a,b)=>b.nett-a.nett).map((s,i)=>{
            const sc=STATUS_CFG[s.status]; const open=expanded===i;
            return <div key={i} onClick={()=>setExpanded(open?null:i)} style={{background:C.card,borderRadius:12,padding:"14px 16px",border:`1px solid ${open?C.orange:C.border}`,cursor:"pointer",transition:"border-color 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:9,background:"#1e1e24",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
                    {s.status==="top"?"⭐":s.status==="good"?"✅":s.status==="warning"?"⚡":"🔴"}
                  </div>
                  <div><div style={{fontWeight:600,fontSize:13}}>{s.name}</div><div style={{fontSize:10,color:C.muted}}>📍 {s.area}</div></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:s.status==="top"?C.orange:s.status==="good"?C.green:s.status==="warning"?C.yellow:C.red}}>{fmtRp(s.nett)}</div>
                    <div style={{fontSize:10,color:C.muted}}>{s.orders} order · {s.visits} visit</div>
                  </div>
                  <div style={{padding:"3px 8px",borderRadius:5,fontSize:9,fontWeight:700,letterSpacing:1,background:sc.bg,color:sc.text}}>{sc.label}</div>
                </div>
              </div>
              {open&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                {[
                  {label:"Penjualan",  value:fmtFull(s.nett),      sub:"nett total"},
                  {label:"Customers",  value:s.customers,           sub:"outlet unik"},
                  {label:"Order Rate", value:`${s.orderRate}%`,     sub:"visit → order", color:s.orderRate>=85?C.green:s.orderRate>=70?C.yellow:C.red},
                  {label:"Avg Visit",  value:`${s.avgDuration}mnt`, sub:"durasi/toko"},
                  {label:"Total Visit",value:s.visits,              sub:"kunjungan"},
                ].map((m,j)=><div key={j} style={{background:"#0f0f12",borderRadius:9,padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{m.label}</div>
                  <div style={{fontSize:16,fontWeight:700,color:m.color||C.orange,fontFamily:"'Bebas Neue'"}}>{m.value}</div>
                  <div style={{fontSize:10,color:C.sub}}>{m.sub}</div>
                </div>)}
              </div>}
            </div>;
          })}
        </div>
      </div>}

      {tab==="stock"&&<div>
        <div style={{background:C.card,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`,marginBottom:14}}>
          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>Volume Transfer Stok</div>
          <div style={{fontSize:10,color:C.sub,marginBottom:16}}>Total qty keluar dari gudang (pack)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.stock} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} width={148}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="qty" fill={C.orange} radius={[0,5,5,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {data.stock.map((s,i)=><div key={i} style={{background:C.card,borderRadius:12,padding:"14px 16px",border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>{s.name}</div>
            <div style={{display:"flex",gap:20,marginBottom:8}}>
              <div><div style={{fontSize:10,color:C.muted}}>Qty Transfer</div><div style={{fontSize:20,fontWeight:700,color:C.orange,fontFamily:"'Bebas Neue'"}}>{(s.qty/1000).toFixed(0)}k</div></div>
              <div><div style={{fontSize:10,color:C.muted}}>Sisa Stok</div><div style={{fontSize:20,fontWeight:700,color:s.stock<10000?C.red:s.stock<50000?C.yellow:C.green,fontFamily:"'Bebas Neue'"}}>{(s.stock/1000).toFixed(0)}k</div></div>
            </div>
            <div style={{height:4,borderRadius:2,background:"#1e1e24",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(s.stock/(s.qty+s.stock)*100,100)}%`,background:s.stock<10000?C.red:s.stock<50000?C.yellow:C.green,borderRadius:2}}/>
            </div>
          </div>)}
        </div>
      </div>}

      {tab==="chat"&&<div style={{display:"grid",gridTemplateColumns:"1fr 250px",gap:12,height:"calc(100vh - 150px)"}}>
        <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:C.green}}/>
            <span style={{fontWeight:600,fontSize:13}}>AI Sales Assistant</span>
            <span style={{fontSize:10,color:C.muted}}>— {data.company} · {data.period}</span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
            {chat.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}}>
              {m.role==="assistant"&&<div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${C.orange},${C.orangeD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginTop:2}}>🤖</div>}
              <div style={{maxWidth:"76%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?`linear-gradient(135deg,${C.orange},${C.orangeD})`:"#1e1e26",fontSize:13,lineHeight:1.65,whiteSpace:"pre-line"}}>{m.content}</div>
            </div>)}
            {loading&&<div style={{display:"flex",gap:8}}>
              <div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${C.orange},${C.orangeD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🤖</div>
              <div style={{padding:"10px 14px",background:"#1e1e26",borderRadius:"14px 14px 14px 4px",display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(j=><div key={j} style={{width:7,height:7,borderRadius:"50%",background:C.orange,animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${j*0.3}s`}}/>)}
              </div>
            </div>}
            <div ref={chatEnd}/>
          </div>
          <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Tanya tentang penjualan atau tim..." style={{flex:1,background:"#1a1a22",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:"'DM Sans'"}}/>
            <button onClick={send} disabled={loading} style={{padding:"9px 15px",background:loading?C.border:`linear-gradient(135deg,${C.orange},${C.orangeD})`,border:"none",borderRadius:9,color:"#fff",fontSize:16,cursor:loading?"not-allowed":"pointer"}}>➤</button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Pertanyaan Cepat</div>
            {["Siapa top performer bulan ini?","Sales mana yg perlu coaching?","Produk apa paling laku?","Analisa order rate tim","Rekomendasi action minggu ini"].map((q,i)=>
              <button key={i} onClick={()=>setInput(q)} style={{width:"100%",background:"#14141a",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 10px",color:C.sub,fontSize:11,cursor:"pointer",textAlign:"left",marginBottom:5,fontFamily:"'DM Sans'",transition:"all 0.15s"}}
                onMouseOver={e=>{e.currentTarget.style.color=C.orange;e.currentTarget.style.borderColor=`${C.orange}50`}}
                onMouseOut={e=>{e.currentTarget.style.color=C.sub;e.currentTarget.style.borderColor=C.border}}>
                💬 {q}
              </button>
            )}
          </div>
          <div style={{background:C.card,borderRadius:14,padding:14,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>⚠️ Perlu Perhatian</div>
            {S.filter(s=>s.status==="warning").map((s,i)=>
              <div key={i} style={{marginBottom:7,padding:"8px 10px",background:"#0f0f12",borderRadius:7,borderLeft:`3px solid ${C.yellow}`}}>
                <div style={{fontSize:12,fontWeight:600}}>{s.name}</div>
                <div style={{fontSize:10,color:C.muted}}>{s.area} · {fmtRp(s.nett)}</div>
              </div>
            )}
          </div>
        </div>
      </div>}
    </main>
    <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:2px}`}</style>
  </div>;
}
