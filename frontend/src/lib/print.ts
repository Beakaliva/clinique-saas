import type { Ordonnance, Facture } from '@/types'
import { mediaUrl } from './media'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fmtMoney(v: string | number) {
  return Number(v).toLocaleString('fr-FR') + ' GNF'
}

interface ClinicInfo {
  name: string
  telephone?: string
  adresse?: string
  email?: string
  type_display?: string
  logo?: string | null
}

// ── Ordonnance ──────────────────────────────────────────────────────────────
export function printOrdonnance(o: Ordonnance, clinic: ClinicInfo, medecinNom?: string) {
  const lignesHTML = o.lignes.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${l.medicament}</strong></td>
      <td>${l.quantite}</td>
      <td>${l.posologie}</td>
      <td>${l.duree || '—'}</td>
      <td>${l.notes || '—'}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Ordonnance — ${o.patient_nom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 28px 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 20px; }
    .clinic-left { display: flex; align-items: flex-start; gap: 12px; }
    .clinic-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; padding: 3px; background: #f9fafb; }
    .clinic-name { font-size: 20px; font-weight: 700; color: #1d4ed8; }
    .clinic-meta { font-size: 11px; color: #555; margin-top: 3px; line-height: 1.5; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 22px; font-weight: 700; color: #1d4ed8; letter-spacing: 1px; text-transform: uppercase; }
    .doc-title .rx { font-size: 42px; font-weight: 900; color: #1d4ed8; line-height: 1; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .meta-box { background: #f0f4ff; border-left: 3px solid #1d4ed8; padding: 8px 12px; border-radius: 4px; }
    .meta-box .label { font-size: 10px; text-transform: uppercase; font-weight: 600; color: #888; margin-bottom: 2px; }
    .meta-box .value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th { background: #1d4ed8; color: white; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    tbody tr:nth-child(even) { background: #f8f9ff; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 12px; }
    .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; margin-bottom: 24px; }
    .notes .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #92400e; margin-bottom: 4px; }
    .signature { display: flex; justify-content: flex-end; margin-top: 32px; }
    .sign-box { text-align: center; }
    .sign-line { width: 200px; border-bottom: 1px solid #333; margin-bottom: 6px; height: 50px; }
    .sign-label { font-size: 11px; color: #555; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 12px 18px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-left">
      ${mediaUrl(clinic.logo) ? `<img src="${mediaUrl(clinic.logo)}" alt="logo" class="clinic-logo" />` : ''}
      <div>
        <div class="clinic-name">${clinic.name}</div>
        <div class="clinic-meta">
          ${clinic.type_display ? clinic.type_display + '<br/>' : ''}
          ${clinic.telephone ? '📞 ' + clinic.telephone + '<br/>' : ''}
          ${clinic.adresse ? '📍 ' + clinic.adresse + '<br/>' : ''}
          ${clinic.email ? '✉ ' + clinic.email : ''}
        </div>
      </div>
    </div>
    <div class="doc-title">
      <div class="rx">℞</div>
      <h1>Ordonnance</h1>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="label">Patient</div>
      <div class="value">${o.patient_nom}</div>
    </div>
    <div class="meta-box">
      <div class="label">Date</div>
      <div class="value">${fmtDate(o.date)}</div>
    </div>
    ${medecinNom || o.medecin_nom ? `
    <div class="meta-box">
      <div class="label">Médecin</div>
      <div class="value">Dr ${medecinNom || o.medecin_nom}</div>
    </div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th>Médicament</th>
        <th style="width:40px">Qté</th>
        <th>Posologie</th>
        <th>Durée</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>${lignesHTML || '<tr><td colspan="6" style="text-align:center;color:#999;padding:16px">Aucun médicament</td></tr>'}</tbody>
  </table>

  ${o.notes ? `
  <div class="notes">
    <div class="label">Instructions générales</div>
    <div>${o.notes}</div>
  </div>` : ''}

  <div class="signature">
    <div class="sign-box">
      <div class="sign-line"></div>
      <div class="sign-label">Signature et cachet du médecin</div>
    </div>
  </div>

  <div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')} — ${clinic.name}</div>
</body>
</html>`

  openPrint(html)
}

// ── Facture ─────────────────────────────────────────────────────────────────
export function printFacture(f: Facture, clinic: ClinicInfo) {
  const lignesHTML = f.lignes.map(l => `
    <tr>
      <td>${l.description}</td>
      <td style="text-align:center">${l.quantite}</td>
      <td style="text-align:right">${fmtMoney(l.prix_unitaire)}</td>
      <td style="text-align:right"><strong>${fmtMoney(l.montant)}</strong></td>
    </tr>
  `).join('')

  const paiementsHTML = f.paiements?.length > 0
    ? f.paiements.map(p => `
        <tr>
          <td>${new Date(p.date).toLocaleDateString('fr-FR')}</td>
          <td>${p.payeur_label}</td>
          <td>${p.mode_label}</td>
          <td style="text-align:right;color:#16a34a"><strong>${fmtMoney(p.montant)}</strong></td>
          ${p.notes ? `<td style="color:#888">${p.notes}</td>` : '<td>—</td>'}
        </tr>
      `).join('')
    : `<tr><td colspan="5" style="text-align:center;color:#999;padding:12px">Aucun paiement</td></tr>`

  const statutColor: Record<string, string> = {
    payee: '#16a34a', emise: '#2563eb', brouillon: '#6b7280',
    partielle: '#d97706', annulee: '#dc2626',
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture ${f.numero} — ${f.patient_nom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 28px 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 20px; }
    .clinic-left { display: flex; align-items: flex-start; gap: 12px; }
    .clinic-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; padding: 3px; background: #f9fafb; }
    .clinic-name { font-size: 20px; font-weight: 700; color: #1d4ed8; }
    .clinic-meta { font-size: 11px; color: #555; margin-top: 3px; line-height: 1.6; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 26px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; }
    .doc-title .numero { font-size: 16px; color: #555; margin-top: 4px; font-family: monospace; }
    .statut-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; color: white; background: ${statutColor[f.statut] ?? '#6b7280'}; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .meta-box { background: #f0f4ff; border-left: 3px solid #1d4ed8; padding: 8px 12px; border-radius: 4px; }
    .meta-box .label { font-size: 10px; text-transform: uppercase; font-weight: 600; color: #888; margin-bottom: 2px; }
    .meta-box .value { font-size: 14px; font-weight: 600; }
    .insurance-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
    .insurance-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; margin-bottom: 6px; }
    .insurance-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th { background: #1d4ed8; color: white; padding: 8px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    thead th:first-child { text-align: left; }
    tbody tr:nth-child(even) { background: #f8f9ff; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .totals { margin-left: auto; width: 280px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 7px 14px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
    .total-row.grand { background: #1d4ed8; color: white; font-weight: 700; font-size: 14px; }
    .total-row.paid { color: #16a34a; }
    .total-row.rest { color: #dc2626; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 8px; letter-spacing: 0.5px; }
    .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 12px 18px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-left">
      ${mediaUrl(clinic.logo) ? `<img src="${mediaUrl(clinic.logo)}" alt="logo" class="clinic-logo" />` : ''}
      <div>
        <div class="clinic-name">${clinic.name}</div>
        <div class="clinic-meta">
          ${clinic.type_display ? clinic.type_display + '<br/>' : ''}
          ${clinic.telephone ? '📞 ' + clinic.telephone + '<br/>' : ''}
          ${clinic.adresse ? '📍 ' + clinic.adresse + '<br/>' : ''}
          ${clinic.email ? '✉ ' + clinic.email : ''}
        </div>
      </div>
    </div>
    <div class="doc-title">
      <h1>Facture</h1>
      <div class="numero">${f.numero}</div>
      <div class="statut-badge">${f.statut_label}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="label">Patient</div>
      <div class="value">${f.patient_nom}</div>
    </div>
    <div class="meta-box">
      <div class="label">Date</div>
      <div class="value">${fmtDate(f.date)}</div>
    </div>
  </div>

  ${f.est_assure ? `
  <div class="insurance-box">
    <div class="label">🛡 Prise en charge assurance</div>
    <div class="insurance-row"><span>Compagnie :</span><strong>${f.assurance_nom || '—'}</strong></div>
    ${f.assurance_code ? `<div class="insurance-row"><span>N° police :</span><strong>${f.assurance_code}</strong></div>` : ''}
    <div class="insurance-row"><span>Taux couverture :</span><strong>${f.taux_assurance}%</strong></div>
    <div class="insurance-row"><span>Part assurance :</span><strong style="color:#1d4ed8">${fmtMoney(f.part_assurance)}</strong></div>
    <div class="insurance-row"><span>Part patient :</span><strong>${fmtMoney(f.part_patient)}</strong></div>
  </div>` : ''}

  <div class="section-title">Détail des prestations</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center;width:50px">Qté</th>
        <th style="text-align:right;width:120px">Prix unit.</th>
        <th style="text-align:right;width:120px">Montant</th>
      </tr>
    </thead>
    <tbody>${lignesHTML || '<tr><td colspan="4" style="text-align:center;color:#999;padding:16px">Aucune ligne</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <div class="total-row grand"><span>Total</span><span>${fmtMoney(f.montant_total)}</span></div>
    <div class="total-row paid"><span>Payé</span><span>${fmtMoney(f.montant_paye)}</span></div>
    <div class="total-row rest"><span>Reste à payer</span><span>${fmtMoney(f.montant_restant)}</span></div>
  </div>

  ${f.paiements?.length > 0 ? `
  <div class="section-title">Historique des paiements</div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Payeur</th><th>Mode</th>
        <th style="text-align:right">Montant</th><th>Notes</th>
      </tr>
    </thead>
    <tbody>${paiementsHTML}</tbody>
  </table>` : ''}

  ${f.notes ? `
  <div class="notes">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#92400e;margin-bottom:4px">Notes</div>
    <div>${f.notes}</div>
  </div>` : ''}

  <div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')} — ${clinic.name}</div>
</body>
</html>`

  openPrint(html)
}

// ── Helper ──────────────────────────────────────────────────────────────────
function openPrint(html: string) {
  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}
