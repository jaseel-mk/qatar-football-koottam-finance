/* Report calculations use integer dirhams and date-only end-of-day cutoffs. */
(function (root) {
  const cents = value => Math.round(Number(value || 0) * 100);
  const sum = (rows, fn) => rows.reduce((n, row) => n + fn(row), 0);
  const movement = t => (t.to_member_id ? cents(t.amount) : 0) - (t.from_member_id ? cents(t.amount) : 0);
  function build(data, options = {}) {
    const matches = data.matches.filter(x => !x.deleted_at);
    const expenses = data.expenses.filter(x => !x.deleted_at);
    const ledger = data.ledger.filter(x => !x.deleted_at);
    const match = matches.find(x => x.id === options.matchId);
    const start = match ? match.match_date : options.start || '';
    const end = match ? match.match_date : options.end || '9999-12-31';
    if (start && start > end) throw new Error('Start date must be before the end date.');
    const within = date => (!start || date >= start) && date <= end;
    const selectedMatches = matches.filter(x => match ? x.id === match.id : within(x.match_date));
    const selectedExpenses = expenses.filter(x => match ? x.match_id === match.id && x.expense_date <= end : within(x.expense_date));
    const period = ledger.filter(x => within(x.transaction_date));
    const before = ledger.filter(x => start && x.transaction_date < start);
    const through = ledger.filter(x => x.transaction_date <= end);
    const opening = sum(before, movement), closing = sum(through, movement);
    const income = sum(selectedMatches, x => cents(x.total_collected));
    const spent = sum(selectedExpenses, x => cents(x.amount));
    const adjustments = sum(period.filter(x => x.type === 'cash_adjustment'), movement);
    const scoped = period.filter(x => !match || x.match_id === match.id);
    const actualIncome = sum(scoped.filter(x => x.type === 'match_collection'), movement);
    const actualExpense = -sum(scoped.filter(x => x.type === 'expense_payment'), movement);
    const other = sum(period.filter(x => x.type !== 'cash_adjustment' && (match ? x.match_id !== match.id : !['match_collection','expense_payment','cash_transfer'].includes(x.type))), movement);
    const difference = closing - (opening + income - spent + adjustments + other);
    const members = (data.allMembers || data.members || []).map(m => {
      const balance = rows => sum(rows, t => (t.to_member_id === m.id ? cents(t.amount) : 0) - (t.from_member_id === m.id ? cents(t.amount) : 0));
      return {...m, opening: balance(before), balance: balance(through)};
    });
    const unlistedBalance = sum(members.filter(m => m.active !== true || m.deleted_at), m => m.balance);
    const warnings = [];
    if (income !== actualIncome) warnings.push('Collections differ from cash entries. Review collection amounts, recipients and dates.');
    if (spent !== actualExpense) warnings.push('Expenses differ from cash entries. Review payment amounts and dates.');
    if (difference) warnings.push('Financial records and cash ledger do not reconcile. Difference: ' + (difference / 100).toFixed(2) + ' QAR.');
    if (sum(members,x=>x.balance) !== closing) warnings.push('Some cash is assigned to an unknown member.');
    if (match && matches.filter(x=>x.match_date===end).length > 1) warnings.push('Multiple matches share this date. Cash balances include the entire day.');
    if (match && expenses.some(x=>x.match_id===match.id && x.expense_date>end)) warnings.push('Later expenses are excluded from this match-day report. Use Full Reports to include them.');
    return {match,start,end,opening,closing,income,spent,adjustments,other,difference,unlistedBalance,members: members.filter(m => m.active === true && !m.deleted_at),warnings,selectedMatches,selectedExpenses,period,ledger};
  }
  root.QFKReports = {build,cents,movement};
  if (typeof module !== 'undefined') module.exports = root.QFKReports;
})(typeof window === 'undefined' ? globalThis : window);

if (typeof window !== 'undefined') {
  const reportMoney = n => 'QAR ' + (n / 100).toFixed(2);
  let currentReport;
  function reportName(id) { return state.allMembers.find(x=>x.id===id)?.name || 'Unassigned'; }
  function reportCollectors(m,r) {
    return [...new Set(r.ledger.filter(t=>t.match_id===m.id && t.type==='match_collection' && t.transaction_date<=r.end).map(t=>reportName(t.to_member_id)))].join(', ') || 'Not recorded';
  }
  function reportMessage(r) {
    const categories = {};
    r.selectedExpenses.forEach(e=>categories[e.category]=(categories[e.category]||0)+QFKReports.cents(e.amount));
    return [r.match ? 'QFK - Match '+r.match.match_number : 'QFK - Full financial report',
      r.match ? dateText(r.end) : `${r.start || 'Beginning'} to ${r.end==='9999-12-31'?'Latest recorded date':r.end}`,
      '', 'Previous balance in hand: '+reportMoney(r.opening), '',
      ...(r.match ? ['Collected by: '+reportCollectors(r.match,r)] : []),
      'Total amount collected: '+reportMoney(r.income), '', 'Total expense: '+reportMoney(r.spent),
      ...Object.entries(categories).map(([k,v])=>'  '+(k==='Ground'?'Ground fee':k)+': '+reportMoney(v)),
      '', (r.match?'Match balance: ':'Net balance: ')+reportMoney(r.income-r.spent),
      ...(r.other?['Other cash movements during period: '+reportMoney(r.other)]:[]),
      ...(r.adjustments?['Cash adjustments: '+reportMoney(r.adjustments)]:[]),
      '', 'Total in-hand balance: '+reportMoney(r.closing),
      ...r.members.map(m=>m.name+': '+reportMoney(m.balance)),
      ...(r.unlistedBalance?['Cash outside visible account list: '+reportMoney(r.unlistedBalance)]:[]),
      '', 'Cash balances: end of '+(r.end==='9999-12-31'?'latest recorded date':r.end),
      ...r.warnings.map(w=>'REVIEW: '+w)].join('\n');
  }
  function reportTables(r) {
    return [
      ['Summary',['Item','Amount (QAR)'],[['Previous balance',r.opening/100],['Collected',r.income/100],['Expenses',r.spent/100],['Net balance',(r.income-r.spent)/100],['Other movements',r.other/100],['Adjustments',r.adjustments/100],['Reconciliation difference',r.difference/100],['Closing cash',r.closing/100]]],
      ['Collections',['Match','Date','Collected by','Amount (QAR)'],r.selectedMatches.map(m=>[m.match_number,m.match_date,reportCollectors(m,r),Number(m.total_collected)])],
      ['Expenses',['Date','Match','Category','Paid by','Amount (QAR)','Notes'],r.selectedExpenses.map(e=>[e.expense_date,state.matches.find(m=>m.id===e.match_id)?.match_number || '',e.category,reportName(e.paid_by),Number(e.amount),e.description||''])],
      ['Transfers',['Date','From','To','Amount (QAR)','Reason'],r.period.filter(t=>t.type==='cash_transfer').map(t=>[t.transaction_date,reportName(t.from_member_id),reportName(t.to_member_id),Number(t.amount),t.description||''])],
      ['Cash movements',['Date','Type','From','To','Amount (QAR)','Notes'],r.period.map(t=>[t.transaction_date,t.type,t.from_member_id?reportName(t.from_member_id):'',t.to_member_id?reportName(t.to_member_id):'',Number(t.amount),t.description||''])],
      ['Member balances',['Member','Opening (QAR)','Closing (QAR)'],r.members.map(m=>[m.name,m.opening/100,m.balance/100])]
    ];
  }
  function renderReportDetail() {
    const matchMode = $('reportMode').value==='match';
    document.querySelectorAll('[data-report-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.reportTab===$('reportMode').value)));
    $('reportMatchWrap').hidden=!matchMode; $('reportDates').hidden=matchMode;
    try {
      currentReport=QFKReports.build(state,matchMode?{matchId:$('reportMatch').value}:{start:$('reportStart').value,end:$('reportEnd').value});
      if(matchMode && !currentReport.match) throw new Error('Add a match to generate a match report.');
      $('reportPreview').innerHTML=qfkReportHTML(currentReport,currentReport.match?reportCollectors(currentReport.match,currentReport):'',reportName,reportMoney,esc);
      $('reportWarnings').textContent=currentReport.warnings.join(' ');
      $('reportDetails').innerHTML=reportTables(currentReport).map(([title,head,rows])=>`<h3>${esc(title)}</h3><div class="table-wrap"><table class="data-table"><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(typeof v==='number'&&!Number.isInteger(v)?v.toFixed(2):v)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${head.length}">No records</td></tr>`}</tbody></table></div>`).join('');
      document.querySelectorAll('[data-report-export]').forEach(b=>b.disabled=false);
    } catch(e) {currentReport=null; $('reportPreview').textContent=e.message; $('reportDetails').innerHTML=''; $('reportWarnings').textContent=''; document.querySelectorAll('[data-report-export]').forEach(b=>b.disabled=true);}
  }
  window.renderReports = function () {
    const select=$('reportMatch'), previous=select.value;
    select.innerHTML=state.matches.slice().sort((a,b)=>b.match_date.localeCompare(a.match_date)||b.match_number-a.match_number).map(m=>`<option value="${esc(m.id)}">Match ${esc(m.match_number)} - ${esc(m.match_date)}</option>`).join('');
    if(state.matches.some(m=>m.id===previous))select.value=previous;
    renderReportDetail();
  };
  async function reportExport(kind) {
    const r=currentReport;if(!r)return;
    try {
      if(kind==='copy') { await navigator.clipboard.writeText(reportMessage(r));toast('Report copied');return; }
      const title=r.match?'Match '+r.match.match_number:'Full financial report';
      const period=`${r.start||'Beginning'} to ${r.end==='9999-12-31'?'latest recorded date':r.end}`;
      const filename='QFK-'+(r.match?'match-'+r.match.match_number:'report')+'-'+(r.end==='9999-12-31'?'all-time':r.end);
      if(kind==='excel') {
        const book=new ExcelJS.Workbook();book.creator='QFK Finance';
        for(const [name,head,rows] of reportTables(r)) {
          const sheet=book.addWorksheet(name);sheet.addRow(['QATAR FOOTBALL KOOTTAM']);sheet.addRow([title+' | '+period]);
          r.warnings.forEach(w=>sheet.addRow(['REVIEW: '+w]));
          const header=sheet.addRow(head);sheet.addRows(rows);
          [sheet.getRow(1),header].forEach(row=>{row.font={bold:true,color:{argb:'FFFFFFFF'}};row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF880D3F'}};});
          sheet.columns.forEach((col,i)=>{col.width=i===head.length-1?32:24;if(head[i].includes('(QAR)'))col.numFmt='0.00';});
          sheet.views=[{state:'frozen',ySplit:header.number}];
        }
        const url=URL.createObjectURL(new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
        const a=document.createElement('a');a.href=url;a.download=filename+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
      }
      const doc=new jspdf.jsPDF();
      const logo=new Image();logo.src='assets/brand/qfk-logo.png';await logo.decode();
      let y=48;
      const addTable=(head,body)=>{doc.autoTable({startY:y,head:[head],body:body.length?body:[['No records']],margin:{top:45,bottom:18},styles:{fontSize:9,overflow:'linebreak'},headStyles:{fillColor:[136,13,63]},didDrawPage:()=>{}});y=doc.lastAutoTable.finalY+12;};
      if(r.match) { y=qfkMatchPDF(doc,r,reportCollectors(r.match,r),reportName,reportMoney); }
      else for(const [name,head,rows] of reportTables(r)) {if(y>245){doc.addPage();y=48;}doc.setFontSize(12);doc.text(name,14,y-3);addTable(head,rows);}
      if(r.warnings.length) addTable(['Review required'],r.warnings.map(w=>[w]));
      const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.addImage(logo,'PNG',14,8,22,22);doc.setTextColor(136,13,63);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('QATAR FOOTBALL KOOTTAM',40,17);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text('FINANCE / MATCH REPORT',40,25);doc.setFontSize(8);doc.text('Play | Connect | Grow',40,31);doc.setDrawColor(136,13,63);doc.line(14,35,196,35);doc.setFontSize(8);doc.setTextColor(100);doc.text('QFK Finance | Balances at end of report date',14,287);doc.text(`${p} / ${pages}`,182,287);}
      doc.save(filename+'.pdf');
    }catch(e){console.error(e);toast('Could not export report. '+e.message);}
  }
  ['reportMode','reportMatch','reportStart','reportEnd'].forEach(id=>$(id).addEventListener('change',renderReportDetail));
  document.querySelectorAll('[data-report-tab]').forEach(b=>b.addEventListener('click',()=>{$('reportMode').value=b.dataset.reportTab;renderReportDetail();}));
  document.querySelectorAll('[data-report-export]').forEach(b=>b.addEventListener('click',()=>reportExport(b.dataset.reportExport)));
}
