import { detailRow, emailShell, escapeHtml, sendClubEmail, type ClubEmailResult } from './clubEmail';

/**
 * "We got your registration" email, sent from the new member's own browser
 * right after they register (through the club's EmailJS mailbox, like every
 * other club email). Their club ID comes later, in the acceptance email an
 * admin sends from the portal.
 *
 * A failed send never fails the registration: it is already saved.
 */
export function sendRegistrationReceivedEmail(member: {
  name: string;
  email: string;
  classSection: string;
  collegeId: string;
}): Promise<ClubEmailResult> {
  const firstName = escapeHtml(member.name.trim().split(/s+/)[0] || member.name);
  const body = `<p style="margin:0 0 18px;color:#334;font-size:15px;line-height:1.6">Thanks for registering with <strong>ACC Robotics Club</strong>. We've received your membership request.</p>
<p style="margin:0 0 22px;color:#334;font-size:15px;line-height:1.6">Our team will review it soon. Once you're accepted, we'll email you again with your <strong>club ID</strong>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e0d8;padding-top:12px">
${detailRow('Name', member.name)}${detailRow('Section', member.classSection)}${detailRow('College ID', member.collegeId)}
</table>
<p style="margin:22px 0 0;color:#8a8177;font-size:13px;line-height:1.6">If you didn't register, you can ignore this email.</p>`;
  return sendClubEmail({
    toEmail: member.email,
    toName: member.name,
    subject: 'ACCRC: we received your membership registration',
    html: emailShell('ACCRC / MEMBERSHIP', `Registration received, ${firstName}.`, body),
  });
}
