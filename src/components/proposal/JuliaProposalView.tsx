// Julia-pixel proposal layout — used in the client-facing Proposal page.
// Reads narrative + scope + totals from proposal_data with safe fallbacks
// so older proposals (pre-Julia-pixel schema) still render correctly.
//
// All visible text comes from proposal_data, which is fully editable in the
// admin ProposalBuilder. Costs, weeks and payment splits remain controlled by
// the existing math in proposalBuilder.ts.

import React from 'react';

export interface PProposalItem {
  title: string;
  cost?: number;
  weeks?: number;
  recommendation?: string;
  explanation?: string;
  estimated_annual_impact?: number;
  _type?: 'big_hit' | 'quick_win';
  locked?: boolean;
}

export interface JuliaProposalData {
  // Header / narrative
  proposal_title?: string;
  what_we_heard?: string;
  highlight_box?: { headline?: string; body?: string };
  what_this_means?: { heading?: string; body?: string }[];
  what_we_need_from_you?: string[];
  oversight_note?: string;
  closing_paragraph?: string;
  keyFindings?: string;
  projectOverview?: string;

  // Structural data (existing)
  items?: PProposalItem[];
  totals?: {
    subtotalExGst?: number;
    gst?: number;
    totalIncGst?: number;
    deposit?: number;
    mvp?: number;
    final?: number;
    totalWeeks?: number;
  };
  feeStructure?: {
    deposit?: { label?: string; percent?: number; amount?: number; when?: string };
    mvp?: { label?: string; percent?: number; amount?: number; when?: string };
    final?: { label?: string; percent?: number; amount?: number; when?: string };
  };
}

interface Props {
  proposalData: JuliaProposalData;
  contactName: string;
  businessName: string;
  preparedBy?: string;
  proposalDate: string; // formatted
  industry?: string | null;
  selectedIndexes?: Set<number>; // for selection display in client view
  roiAnnualImpact?: number;
}

const fmt = (n: number | undefined | null) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = (n: number | undefined | null) => {
  const v = n || 0;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return fmt(v);
};

const JuliaProposalView: React.FC<Props> = ({
  proposalData,
  contactName,
  businessName,
  preparedBy,
  proposalDate,
  industry,
  selectedIndexes,
  roiAnnualImpact,
}) => {
  const items = Array.isArray(proposalData.items) ? proposalData.items : [];
  const totals = proposalData.totals || {};
  const fee = proposalData.feeStructure || {};

  const visibleItems = selectedIndexes
    ? items.filter((_, i) => selectedIndexes.has(i))
    : items;

  // Narrative fallbacks
  const proposalTitle =
    proposalData.proposal_title ||
    `Phase 1 Proposal for ${businessName || 'your business'}`;
  const whatWeHeard =
    proposalData.what_we_heard ||
    proposalData.keyFindings ||
    proposalData.projectOverview ||
    `Based on our Reality Check™ assessment and Straight Talk™ conversation, we have identified the highest-leverage opportunities for ${businessName || 'your business'}.`;
  const highlight = proposalData.highlight_box;
  const whatThisMeans = (proposalData.what_this_means || []).filter(b => b.heading || b.body);
  const needs = (proposalData.what_we_need_from_you || []).filter(Boolean);
  const oversight = proposalData.oversight_note;
  const closing = proposalData.closing_paragraph;

  return (
    <div className="julia-proposal" style={{
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '15px',
      lineHeight: 1.8,
      color: '#1e293b',
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
        color: 'white',
        padding: '44px 40px',
        borderRadius: '14px',
        marginBottom: '40px',
      }}>
        <div style={{
          color: '#93c5fd',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '10px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
          Phase 4 Proposal · Green Light™
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '10px',
          lineHeight: 1.3,
          color: 'white',
        }}>{proposalTitle}</h1>
        {highlight?.headline && (
          <div style={{ color: '#bfdbfe', fontSize: '15px' }}>{highlight.headline}</div>
        )}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          gap: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ color: '#93c5fd', fontSize: '12px' }}>Prepared for</span>
            <strong style={{ color: 'white', display: 'block', fontSize: '14px', marginTop: '2px' }}>
              {contactName}{businessName ? ` — ${businessName}` : ''}
            </strong>
          </div>
          <div>
            <span style={{ color: '#93c5fd', fontSize: '12px' }}>Prepared by</span>
            <strong style={{ color: 'white', display: 'block', fontSize: '14px', marginTop: '2px' }}>
              {preparedBy || 'Aidan Leonard & Eoghan'}
            </strong>
          </div>
          <div>
            <span style={{ color: '#93c5fd', fontSize: '12px' }}>Date</span>
            <strong style={{ color: 'white', display: 'block', fontSize: '14px', marginTop: '2px' }}>
              {proposalDate}
            </strong>
          </div>
          {industry && (
            <div>
              <span style={{ color: '#93c5fd', fontSize: '12px' }}>Industry</span>
              <strong style={{ color: 'white', display: 'block', fontSize: '14px', marginTop: '2px' }}>
                {industry}
              </strong>
            </div>
          )}
        </div>
      </header>

      {/* What We Heard */}
      <section>
        <h2 style={sectionH2}>What We Heard</h2>
        {whatWeHeard.split(/\n\n+/).map((p, i) => (
          <p key={i} style={paraStyle}>{p}</p>
        ))}
      </section>

      {/* What We Are Building (highlight + scope items) */}
      <section>
        <h2 style={sectionH2}>What We Are Building</h2>
        {highlight && (highlight.headline || highlight.body) && (
          <div style={highlightBox}>
            {highlight.headline && <h3 style={{ ...subH3, color: '#1e3a5f', marginTop: 0 }}>{highlight.headline}</h3>}
            {highlight.body && <p style={paraStyle}>{highlight.body}</p>}
          </div>
        )}
        {visibleItems.map((item, idx) => (
          <div key={idx} style={scopeItem}>
            <div style={scopeNum}>{idx + 1}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ ...subH3, marginTop: 0, marginBottom: '4px', fontSize: '15px' }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.65 }}>
                {item.recommendation || item.explanation || ''}
                {item.estimated_annual_impact ? (
                  <> Estimated annual impact: <strong>{fmt(item.estimated_annual_impact)}</strong>.</>
                ) : null}
              </p>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', fontFamily: '-apple-system, sans-serif' }}>
                <strong style={{ color: '#1e3a5f' }}>{fmt(item.cost || 0)}</strong>
                {item.weeks ? <> · {item.weeks} {item.weeks === 1 ? 'week' : 'weeks'}</> : null}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* What This Means */}
      {whatThisMeans.length > 0 && (
        <section>
          <h2 style={sectionH2}>What This Means in Practice</h2>
          {whatThisMeans.map((b, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              {b.heading && <h3 style={subH3}>{b.heading}</h3>}
              {b.body && <p style={paraStyle}>{b.body}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Investment */}
      <section>
        <h2 style={sectionH2}>Investment</h2>
        <div style={investmentGrid}>
          <div style={{ ...invCell, ...invCellAccent }}>
            <div style={{ ...invLabel, color: '#93c5fd' }}>Total Build (ex GST)</div>
            <div style={{ ...invValue, color: 'white' }}>{fmtShort(totals.subtotalExGst)}</div>
          </div>
          <div style={invCell}>
            <div style={invLabel}>Timeline</div>
            <div style={invValue}>{totals.totalWeeks || 0} wks</div>
          </div>
          <div style={invCell}>
            <div style={invLabel}>Annual Impact</div>
            <div style={invValue}>{fmtShort(roiAnnualImpact)}</div>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
          All figures ex GST. GST of {fmt(totals.gst)} applies — total inc GST {fmt(totals.totalIncGst)}.
        </p>

        <div style={card}>
          <h3 style={{ ...subH3, marginTop: 0 }}>Payment Schedule</h3>
          {(['deposit', 'mvp', 'final'] as const).map((k) => {
            const f = (fee as any)[k] || {};
            const fallback = k === 'deposit'
              ? { label: 'Commitment Deposit', amount: totals.deposit, when: 'On commencement' }
              : k === 'mvp'
                ? { label: 'MVP Payment', amount: totals.mvp, when: 'On MVP working in test environment' }
                : { label: 'Final Balance', amount: totals.final, when: 'On go-live' };
            return (
              <div key={k} style={paymentRow}>
                <div>
                  <div style={paymentLabel}>{f.label || fallback.label}</div>
                  <div style={paymentDesc}>{f.when || fallback.when}</div>
                </div>
                <div style={paymentAmount}>{fmt(f.amount ?? fallback.amount ?? 0)}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* What We Need from You */}
      {needs.length > 0 && (
        <section>
          <h2 style={sectionH2}>What We Need from You</h2>
          <ul style={{ paddingLeft: '22px', marginBottom: '14px' }}>
            {needs.map((n, i) => (
              <li key={i} style={{ marginBottom: '6px', color: '#334155' }}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Oversight callout */}
      {oversight && (
        <div style={{
          ...highlightBox,
          background: '#fffbeb',
          borderColor: '#fde68a',
          borderLeftColor: '#f59e0b',
        }}>
          <h3 style={{ ...subH3, marginTop: 0, color: '#92400e' }}>On accuracy and oversight</h3>
          <p style={{ ...paraStyle, color: '#78350f' }}>{oversight}</p>
        </div>
      )}

      {/* Closing */}
      {closing && (
        <div style={{ marginTop: '40px' }}>
          {closing.split(/\n\n+/).map((p, i) => (
            <p key={i} style={paraStyle}>{p}</p>
          ))}
          <p style={{ marginTop: '24px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '2px' }}>
              Aidan Leonard
            </span>
            <span style={{ color: '#64748b', fontSize: '13px', fontFamily: '-apple-system, sans-serif' }}>
              Co-Founder &amp; Business Analyst, 5to10X
            </span>
          </p>
          <p style={{ marginTop: '6px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '2px' }}>
              Eoghan
            </span>
            <span style={{ color: '#64748b', fontSize: '13px', fontFamily: '-apple-system, sans-serif' }}>
              Co-Founder — Engineering Build Advisor, 5to10X
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// ---- inline style tokens ----
const sectionH2: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#1e3a5f',
  margin: '36px 0 14px',
  paddingBottom: '8px',
  borderBottom: '2px solid #e2e8f0',
};
const subH3: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1e293b',
  margin: '20px 0 8px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};
const paraStyle: React.CSSProperties = {
  marginBottom: '14px',
  color: '#334155',
};
const card: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '22px 24px',
  marginBottom: '16px',
  marginTop: '20px',
};
const highlightBox: React.CSSProperties = {
  background: '#f0f9ff',
  border: '1px solid #bfdbfe',
  borderLeft: '4px solid #1e40af',
  borderRadius: '0 10px 10px 0',
  padding: '18px 20px',
  margin: '20px 0',
};
const scopeItem: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '18px 20px',
  marginBottom: '12px',
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
};
const scopeNum: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: '#1e3a5f',
  color: 'white',
  fontSize: '13px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontFamily: '-apple-system, sans-serif',
};
const investmentGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '12px',
  margin: '16px 0',
};
const invCell: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '16px',
  textAlign: 'center',
};
const invCellAccent: React.CSSProperties = {
  background: '#1e3a5f',
  borderColor: '#1e3a5f',
};
const invLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
  fontFamily: '-apple-system, sans-serif',
};
const invValue: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#1e3a5f',
  fontFamily: '-apple-system, sans-serif',
};
const paymentRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #f1f5f9',
  fontFamily: '-apple-system, sans-serif',
};
const paymentLabel: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#1e293b',
};
const paymentDesc: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  marginTop: '2px',
};
const paymentAmount: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#1e3a5f',
};

export default JuliaProposalView;
