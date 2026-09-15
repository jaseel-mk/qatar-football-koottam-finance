/* Shared visual hierarchy for the on-screen letterhead and PDF. */
function qfkReportHTML(r, collectors, memberName, money, escape) {
  const row=(label,value,note='',bold=false)=>`<div class="report-row ${bold?'strong':''}"><span>${escape(label)}</span><small>${escape(note)}</small><span>${escape(value)}</span></div>`;
  return `<h2 class="report-title">${r.match?'Match '+escape(r.match.match_number):'Financial report'}</h2><p class="report-date">${escape(r.end==='9999-12-31'?'All recorded dates':r.end)} | Balance as of end of report date</p>
  <div class="report-opening"><small>PREVIOUS BALANCE IN HAND</small><strong>${money(r.opening)}</strong></div>
  <h4>01 &nbsp; COLLECTION</h4>${r.match?row('Collected by',collectors):''}${row('Total amount collected',money(r.income),'',true)}
  <h4>02 &nbsp; EXPENSES</h4>${r.selectedExpenses.map(e=>row(e.category==='Ground'?'Ground fee':e.category,money(Math.round(Number(e.amount)*100)),'Paid by '+memberName(e.paid_by))).join('')}${row('Total expense',money(r.spent),'',true)}${row(r.match?'Match surplus / deficit':'Net surplus / deficit',money(r.income-r.spent))}
  ${r.other?row('Other cash movements',money(r.other)):''}${r.adjustments?row('Cash adjustments',money(r.adjustments)):''}
  <div class="report-closing"><small>TOTAL IN-HAND BALANCE</small><strong>${money(r.closing)}</strong></div>
  <h4>03 &nbsp; CASH HELD BY MEMBERS</h4>${r.members.map(m=>row(m.name,money(m.balance))).join('')}${row('Total shown',money(r.members.reduce((s,m)=>s+m.balance,0)),'',true)}
  ${r.unlistedBalance?'<p class="report-date">Group total includes '+money(r.unlistedBalance)+' held outside the visible account list.</p>':''}`;
}
function qfkMatchPDF(doc,r,collectors,memberName,money){
  let y=49;
  const ensure=h=>{if(y+h>273){doc.addPage();y=49;}};
  const text=(s,x,yy,size=10,bold=false,color='#26242a',align='left')=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);doc.text(Array.isArray(s)?s:String(s),x,yy,{align});};
  const row=(label,value,note='',bold=false)=>{const lines=doc.splitTextToSize(label,84);const notes=doc.splitTextToSize(note,48);const h=Math.max(lines.length,notes.length)*5+4;ensure(h);text(lines,16,y,10,bold);if(note)text(notes,110,y,8,false,'#77727a');text(value,194,y,10,bold,'#26242a','right');y+=h;};
  const section=s=>{ensure(14);y+=5;text(s,16,y,10,true,'#880d3f');y+=9;};
  text('Match '+r.match.match_number,16,y,25,true);y+=9;text(r.end+' | Balance as of end of report date',16,y,9,false,'#77727a');y+=9;
  doc.setFillColor('#f7f1f4');doc.roundedRect(16,y,178,20,3,3,'F');text('PREVIOUS BALANCE IN HAND',20,y+7,8,true,'#77727a');text(money(r.opening),20,y+15,17,true,'#880d3f');y+=26;
  section('01  COLLECTION');row('Collected by',collectors);row('Total amount collected',money(r.income),'',true);
  section('02  EXPENSES');r.selectedExpenses.forEach(e=>row(e.category==='Ground'?'Ground fee':e.category,money(Math.round(Number(e.amount)*100)),'Paid by '+memberName(e.paid_by)));
  row('Total expense',money(r.spent),'',true);row('Match surplus / deficit',money(r.income-r.spent));if(r.other)row('Other cash movements',money(r.other));if(r.adjustments)row('Cash adjustments',money(r.adjustments));
  ensure(28);doc.setFillColor('#880d3f');doc.roundedRect(16,y,178,23,3,3,'F');text('TOTAL IN-HAND BALANCE',20,y+7,8,true,'#ffffff');text(money(r.closing),20,y+18,23,true,'#ffffff');y+=28;
  section('03  CASH HELD BY MEMBERS');r.members.forEach(m=>row(m.name,money(m.balance)));row('Total shown',money(r.members.reduce((s,m)=>s+m.balance,0)),'',true);
  if(r.unlistedBalance)row('Cash outside visible account list',money(r.unlistedBalance));
  return y+8;
}
