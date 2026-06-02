INSERT INTO public.email_templates (template_key, name, subject, from_name, from_email, html_body, description, trigger_description) VALUES
('drip-email-1',
 'Outbound Drip — Email 1 (Hidden Inefficiencies)',
 'Most businesses are leaking hours without realising it',
 '5to10X',
 'grow@5to10x.app',
 '<div style="font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;color:#334155;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Most business owners don''t have a workload problem.</p>
<p>They have an efficiency visibility problem.</p>
<p>Usually the biggest bottlenecks aren''t dramatic — they''re hidden in:</p>
<ul style="padding-left:20px;">
<li>repeated admin</li>
<li>double handling</li>
<li>manual follow-ups</li>
<li>fragmented systems</li>
<li>staff doing low-value tasks repeatedly</li>
</ul>
<p>The tricky part is they slowly become "normal."</p>
<p>We built a short business efficiency questionnaire to help identify where time, revenue, and momentum may be getting lost inside day-to-day operations.</p>
<p>It takes about 3–5 minutes and gives you a practical snapshot of where hidden opportunities may exist in your business.</p>
<p>👉 Start here:<br/><a href="{{trackedLink}}" style="color:#6d3ce8;font-weight:600;">{{trackedLink}}</a></p>
<p>No pressure. No technical knowledge needed.</p>
<p>Just a useful exercise for business owners who know things could probably run smoother than they currently do.</p>
<p>– Aidan<br/>5to10x</p>
<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px;">
You''re receiving this because we identified your business as a potential fit for AI-driven efficiency improvements.<br/>
Not interested? <a href="{{unsubscribeUrl}}" style="color:#6d3ce8;font-weight:600;">Unsubscribe here</a> — we won''t email you again.
</div>
</div>',
 'First outbound drip email — introduces hidden inefficiencies and invites the prospect to take the efficiency questionnaire.',
 'Sent automatically as Email 1 of the outbound drip sequence when a prospect is added to the Outbound Funnel. Available placeholders: {{firstName}}, {{trackedLink}}, {{unsubscribeUrl}}.'),

('drip-email-2',
 'Outbound Drip — Email 2 (Quick Question)',
 'A quick question about your business operations',
 '5to10X',
 'grow@5to10x.app',
 '<div style="font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;color:#334155;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Quick question:</p>
<p>How much time do you think your business loses each week to tasks that could probably be automated, simplified, or removed entirely?</p>
<p>For most businesses we speak with, it''s far more than they realise.</p>
<p>The challenge is that inefficiency rarely shows up as one obvious problem — it shows up as:</p>
<ul style="padding-left:20px;">
<li>staff interruptions</li>
<li>repeated data entry</li>
<li>delayed communication</li>
<li>missed follow-ups</li>
<li>admin overflow</li>
<li>systems that don''t talk to each other</li>
</ul>
<p>Over time, it drains energy from the business owner and the team.</p>
<p>That''s exactly why we created the "Discover Where Efficiency Is Hiding" questionnaire.</p>
<p>It''s designed to help identify operational friction points and uncover areas where AI, automation, or process improvements could create immediate impact.</p>
<p>👉 Take the assessment here:<br/><a href="{{trackedLink}}" style="color:#6d3ce8;font-weight:600;">{{trackedLink}}</a></p>
<p>Even if you don''t work with us afterwards, most business owners finish it with a clearer understanding of where their time is actually going.</p>
<p>– Aidan<br/>5to10x</p>
<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px;">
You''re receiving this because we identified your business as a potential fit for AI-driven efficiency improvements.<br/>
Not interested? <a href="{{unsubscribeUrl}}" style="color:#6d3ce8;font-weight:600;">Unsubscribe here</a> — we won''t email you again.
</div>
</div>',
 'Second outbound drip email — frames inefficiency as friction points and re-invites the prospect to complete the questionnaire.',
 'Sent automatically 7 days after Email 1 if no response. Available placeholders: {{firstName}}, {{trackedLink}}, {{unsubscribeUrl}}.'),

('drip-email-3',
 'Outbound Drip — Email 3 (Reducing Friction)',
 'Most businesses already know where the problem is',
 '5to10X',
 'grow@5to10x.app',
 '<div style="font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;color:#334155;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>In our experience, most business owners already know where the inefficiencies are.</p>
<p>They just haven''t had the time to stop and properly map them.</p>
<p>Usually it sounds like:</p>
<ul style="padding-left:20px;">
<li>"We''re constantly chasing things."</li>
<li>"Too much relies on one person."</li>
<li>"We''ve outgrown our systems."</li>
<li>"Everything works… but it feels heavier than it should."</li>
</ul>
<p>That operational drag adds up quietly:</p>
<ul style="padding-left:20px;">
<li>slower growth</li>
<li>team fatigue</li>
<li>missed opportunities</li>
<li>unnecessary overhead</li>
<li>owner burnout</li>
</ul>
<p>The businesses that scale best aren''t necessarily working harder.</p>
<p>They''re reducing friction.</p>
<p>That''s the purpose of the "Discover Where Efficiency Is Hiding" questionnaire — helping business owners identify where simplification, automation, and smarter systems could unlock time and momentum.</p>
<p>👉 Complete the questionnaire here:<br/><a href="{{trackedLink}}" style="color:#6d3ce8;font-weight:600;">{{trackedLink}}</a></p>
<p>Sometimes the fastest growth comes from removing what''s slowing you down.</p>
<p>– Aidan<br/>5to10x</p>
<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px;">
You''re receiving this because we identified your business as a potential fit for AI-driven efficiency improvements.<br/>
Not interested? <a href="{{unsubscribeUrl}}" style="color:#6d3ce8;font-weight:600;">Unsubscribe here</a> — we won''t email you again.
</div>
</div>',
 'Third and final outbound drip email — reframes around reducing friction and gives one last call to complete the questionnaire.',
 'Sent automatically 7 days after Email 2 if no response. Available placeholders: {{firstName}}, {{trackedLink}}, {{unsubscribeUrl}}.')
ON CONFLICT (template_key) DO NOTHING;