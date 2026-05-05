import { prisma } from './prisma'
import { Resend } from 'resend'
import twilio from 'twilio'

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 3

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────

export async function sendEmailOtp(email: string, role: 'customer' | 'vendor'): Promise<void> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  // Invalidate any previous unused OTPs for this target
  await prisma.verificationOtp.updateMany({
    where: { target: email, type: 'email', used: false },
    data: { used: true },
  })

  await prisma.verificationOtp.create({
    data: { target: email, type: 'email', role, code, expires_at },
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'

  await resend.emails.send({
    from,
    to: email,
    subject: `Your OneSeva verification code: ${code}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="font-size:24px;font-weight:900;color:#1a0904;margin:0 0 8px">Verify your email</h2>
        <p style="color:#6b7280;margin:0 0 24px">Enter this code to verify your OneSeva account. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <div style="background:#faf8f6;border:1px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1a0904">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0">If you didn't create an OneSeva account, you can ignore this email.</p>
      </div>
    `,
  })
}

export async function sendPhoneOtp(phone: string, role: 'customer' | 'vendor'): Promise<void> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  const normalised = normalisePhone(phone)

  await prisma.verificationOtp.updateMany({
    where: { target: normalised, type: 'phone', used: false },
    data: { used: true },
  })

  await prisma.verificationOtp.create({
    data: { target: normalised, type: 'phone', role, code, expires_at },
  })

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_SMS_FROM // a regular Twilio phone number, e.g. +12015551234

  if (!sid || !token || !from) {
    // Dev: just log the code
    console.log(`[OTP] SMS to ${normalised}: ${code}`)
    return
  }

  const client = twilio(sid, token)
  await client.messages.create({
    body: `Your OneSeva verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    from,
    to: normalised,
  })
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'expired' | 'max_attempts' }

export async function verifyOtp(
  target: string,
  type: 'email' | 'phone',
  code: string,
): Promise<VerifyResult> {
  const normalised = type === 'phone' ? normalisePhone(target) : target.toLowerCase().trim()

  const otp = await prisma.verificationOtp.findFirst({
    where: { target: normalised, type, used: false },
    orderBy: { created_at: 'desc' },
  })

  if (!otp) return { ok: false, error: 'invalid' }
  if (otp.expires_at < new Date()) return { ok: false, error: 'expired' }
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'max_attempts' }

  if (otp.code !== code) {
    await prisma.verificationOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    })
    return { ok: false, error: 'invalid' }
  }

  await prisma.verificationOtp.update({ where: { id: otp.id }, data: { used: true } })
  return { ok: true }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise phone to E.164, falling back to raw if already formatted */
function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (phone.startsWith('+')) return phone.trim()
  if (digits.length === 10) return `+1${digits}` // default US
  return `+${digits}`
}
