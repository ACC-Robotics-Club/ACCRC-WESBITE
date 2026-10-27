/**
 * Confirmation emails for admin review decisions.
 *
 * When an admin "accepts" a role application in the portal, or "verifies" a
 * fest registration in the fest portal, the applicant's confirmation email
 * is sent from the admin's own browser through the shared EmailJS pipeline
 * (lib/clubEmail.ts) — the same mailbox path already used for membership
 * acceptances. Every send is recorded on the document (verifiedEmailSentAt)
 * so organizers can see whether a reply went out, and a failed send never
 * blocks or reverses the review decision itself.
 */

import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Application, FestRegistration, Registration } from './firestore';
import { detailRow, emailShell, escapeHtml, sendClubEmail, type ClubEmailResult } from './clubEmail';

export interface VerifiedEmailResult extends ClubEmailResult {
  toEmail: string;
}

/* ─── Role applications (executive / prefect / sub-executive) ─── */

const APPLICATION_TYPE_LABEL: Record<Application['type'], string> = {
  executive: 'Executive',
  prefect: 'Prefect',
  'sub-executive': 'Sub-Executive',
};

export async function sendApplicationAcceptedEmail(application: Application): Promise<VerifiedEmailResult> {
  const firstName = escapeHtml(application.name.trim().split(/\s+/)[0] || application.name);
  const role = application.roleApplyingFor || APPLICATION_TYPE_LABEL[application.type];
  const html = emailShell(
    'ACCRC / APPLICATION',
    `Congrats, ${firstName} — you're selected!`,
    `<p style="margin:0 0 20px;color:#3a3530;font-size:15px;line-height:1.6">Your application to the <strong>Adamjee Cantonment College Robotics Club</strong> has been reviewed and <strong style="color:#b23a2a">approved</strong>. Welcome aboard!</p>
<div style="background:#fdefea;border:2px dashed #c94030;border-radius:14px;padding:20px;text-align:center">
<p style="margin:0;color:#c94030;font:700 11px/1 monospace;letter-spacing:3px">YOUR ROLE</p>
<p style="margin:10px 0 0;color:#17130f;font:900 22px/1.2 monospace;letter-spacing:1px">${escapeHtml(APPLICATION_TYPE_LABEL[application.type])} · ${escapeHtml(role)}</p>
</div>
<p style="margin:20px 0 24px;color:#5b5248;font-size:13px;line-height:1.6">Keep an eye on this inbox and the club's notice channels — an organizer will share your duties, orientation schedule and the group you'll work with.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e0d4;padding-top:12px">
${detailRow('Name', application.name)}${detailRow('Section', application.section)}${detailRow('College ID', application.idNumber)}
</table>`
  );
  const result = await sendClubEmail({
    toEmail: application.email,
    toName: application.name,
    subject: `Your ACCRC ${APPLICATION_TYPE_LABEL[application.type]} application is approved`,
    html,
  });
  if (result.sent && application.id) {
    await updateDoc(doc(db, 'applications', application.id), { verifiedEmailSentAt: Timestamp.now() }).catch(() => undefined);
  }
  return { ...result, toEmail: application.email };
}

/* ─── Fest registrations (verified teams) ─── */

export async function sendFestRegistrationVerifiedEmail(registration: FestRegistration): Promise<VerifiedEmailResult> {
  const firstName = escapeHtml(registration.leaderName.trim().split(/\s+/)[0] || registration.leaderName);
  const html = emailShell(
    'ACCRC / FEST REGISTRATION',
    `You're verified, ${firstName}!`,
    `<p style="margin:0 0 20px;color:#3a3530;font-size:15px;line-height:1.6">The organizers have <strong style="color:#b23a2a">verified your registration and payment</strong> for <strong>${escapeHtml(registration.segmentTitle)}</strong>. See you at the fest!</p>
<div style="background:#fdefea;border:2px dashed #c94030;border-radius:14px;padding:20px;text-align:center">
<p style="margin:0;color:#c94030;font:700 11px/1 monospace;letter-spacing:3px">PARTICIPANT ID</p>
<p style="margin:10px 0 0;color:#17130f;font:900 26px/1 monospace;letter-spacing:2px">${escapeHtml(registration.participantId || '—')}</p>
</div>
<p style="margin:20px 0 24px;color:#5b5248;font-size:13px;line-height:1.6">Bring this ID (a screenshot is fine) to the venue for gate check-in. Your team's status is now <strong>Verified</strong>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e0d4;padding-top:12px">
${detailRow('Team', registration.teamName)}${detailRow('Segment', registration.segmentTitle)}${detailRow('Leader', registration.leaderName)}${detailRow('Institution', registration.institution)}
</table>`
  );
  const result = await sendClubEmail({
    toEmail: registration.leaderEmail,
    toName: registration.leaderName,
    subject: `Registration verified: ${registration.teamName} — ${registration.segmentTitle}`,
    html,
  });
  if (result.sent && registration.id) {
    await updateDoc(doc(db, 'registrations', registration.id), { verifiedEmailSentAt: Timestamp.now() }).catch(() => undefined);
  }
  return { ...result, toEmail: registration.leaderEmail };
}

/* ─── Membership registrations use the acceptance email instead; this
       helper covers any other registration type an admin accepts. ─── */

export async function sendEventRegistrationAcceptedEmail(registration: Registration): Promise<VerifiedEmailResult> {
  const firstName = escapeHtml(registration.name.trim().split(/\s+/)[0] || registration.name);
  const html = emailShell(
    'ACCRC / EVENT REGISTRATION',
    `You're in, ${firstName}!`,
    `<p style="margin:0 0 20px;color:#3a3530;font-size:15px;line-height:1.6">Your event registration has been reviewed and <strong style="color:#b23a2a">accepted</strong> by the organizers.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e0d4;padding-top:12px">
${detailRow('Name', registration.name)}${detailRow('Section', registration.classSection)}${detailRow('College ID', registration.collegeId || registration.rollNumber)}
</table>`
  );
  const result = await sendClubEmail({
    toEmail: registration.email,
    toName: registration.name,
    subject: 'Your ACCRC event registration is accepted',
    html,
  });
  if (result.sent && registration.id) {
    await updateDoc(doc(db, 'registrations', registration.id), { verifiedEmailSentAt: Timestamp.now() }).catch(() => undefined);
  }
  return { ...result, toEmail: registration.email };
}
