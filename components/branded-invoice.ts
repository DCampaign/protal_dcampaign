export type BrandedInvoice={
  invoiceNumber?:string;
  client:string;
  clientEmail?:string;
  clientPhone?:string;
  clientAddress?:string;
  service:string;
  lineItems?:{description:string;amount:number}[];
  amount:number;
  paidAmount?:number;
  due?:string;
  paid?:string;
  status:string;
  method?:string;
  notes?:string;
};

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char));
const money=(value:number)=>`₹${value.toLocaleString('en-IN')}`;

export function openBrandedInvoice(invoice:BrandedInvoice){
  if(typeof window==='undefined')return;
  const paid=invoice.paidAmount||0;
  const remaining=Math.max(0,invoice.amount-paid);
  const lineItems=invoice.lineItems?.length?invoice.lineItems:invoice.service.split(',').map(description=>({description:description.trim(),amount:invoice.amount}));
  const number=invoice.invoiceNumber||`DC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const popup=window.open('','_blank','width=900,height=700');
  if(!popup)return;
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(number)} · DCampaign Digital</title><style>
  *{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;padding:36px}.sheet{max-width:820px;margin:auto;background:#fff;border:1px solid #ddd;border-radius:22px;overflow:hidden}.top{padding:30px 38px;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;gap:24px}.logo{width:210px;height:auto;display:block;margin-bottom:18px}.title{margin:0;font-size:38px;letter-spacing:-.04em}.tagline{margin-top:7px;color:#666;font-size:12px}.online-note{margin-top:18px;color:#555;font-size:11px;line-height:1.5;border-left:3px solid #f16133;padding-left:10px}.meta{text-align:right;font-size:12px;line-height:1.8;color:#666}.meta b{color:#111;font-size:15px}.body{padding:30px 38px}.parties{display:grid;grid-template-columns:1fr 1fr;gap:28px;padding-bottom:26px;border-bottom:1px solid #2c2c30}.label{font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:#666}.client{margin-top:8px;font-size:19px;font-weight:700}.details{margin-top:7px;color:#666;font-size:12px;line-height:1.7;white-space:pre-line}.table{width:100%;border-collapse:collapse;margin-top:28px}.table th,.table td{text-align:left;padding:13px 0;border-bottom:1px solid #2c2c30}.table th{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#85858f}.table td{font-size:14px}.right{text-align:right!important}.total{margin:24px 0 0 auto;max-width:320px}.total div{display:flex;justify-content:space-between;padding:8px 0;color:#666}.total .due{font-size:20px;font-weight:800;color:#ff8b60;border-top:1px solid #f16133;padding-top:14px}.status{display:inline-block;margin-top:24px;border:1px solid #f16133;color:#ff8b60;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:700}.notes{margin-top:25px;padding:15px;border:1px solid #2c2c30;border-radius:12px;color:#b3b3bd;font-size:12px;line-height:1.6}.foot{padding:20px 38px;background:#f5f5f5;color:#666;font-size:12px;display:flex;justify-content:space-between;gap:12px}@page{margin:0;background:#fff}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{background:#fff!important;color:#111!important;padding:0}.sheet{border:0;border-radius:0;background:#fff!important;min-height:100vh}.top{border-color:#ddd}.foot{background:#f5f5f5!important}.status{color:#c74420;border-color:#f16133}}
  </style></head><body><main class="sheet"><header class="top"><div><h1 class="title">Invoice</h1><div class="tagline">Digital marketing, built to move brands forward.</div><div class="online-note">Online-generated invoice · For an official signed invoice, please contact DCampaign Digital.</div></div><div class="meta"><b>${escapeHtml(number)}</b><br>Issued ${escapeHtml(new Date().toLocaleDateString('en-IN'))}<br>Due ${escapeHtml(invoice.due||'On receipt')}<br>Payment: ${escapeHtml(invoice.method||'—')}</div></header><section class="body"><div class="parties"><div><div class="label">From</div><div class="client">DCampaign Digital</div><div class="details">Digital Marketing Agency<br>dcampaign.com<br>contact@dcampaign.com</div></div><div><div class="label">Bill to</div><div class="client">${escapeHtml(invoice.client)}</div><div class="details">${escapeHtml([invoice.clientEmail,invoice.clientPhone,invoice.clientAddress].filter(Boolean).join('\n')||'Client details on file')}</div></div></div><table class="table"><thead><tr><th>Description</th><th class="right">Amount</th></tr></thead><tbody>${lineItems.map(item=>`<tr><td><b>${escapeHtml(item.description||"Professional services")}</b><br><span class="details">DCampaign Digital service</span></td><td class="right">${money(item.amount)}</td></tr>`).join("")}</tbody></table><div class="total"><div><span>Invoice total</span><b>${money(invoice.amount)}</b></div><div><span>Paid to date</span><b>${money(paid)}</b></div><div class="due"><span>Balance due</span><b>${money(remaining)}</b></div></div><div class="status">${escapeHtml(invoice.status)}${invoice.due?` · Due ${escapeHtml(invoice.due)}`:''}</div>${invoice.notes?`<div class="notes"><b>Notes</b><br>${escapeHtml(invoice.notes)}</div>`:''}</section><footer class="foot"><span>Thank you for working with DCampaign Digital.</span><span>dcampaign.com · contact@dcampaign.com</span></footer></main><script>setTimeout(()=>window.print(),250)</script></body></html>`);
  popup.document.close();
}
