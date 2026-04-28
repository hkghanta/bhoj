import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['customer', 'vendor']),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password, role } = parsed.data

        if (role === 'customer') {
          const customer = await prisma.customer.findUnique({ where: { email } })
          if (!customer?.password_hash) return null
          const valid = await bcrypt.compare(password, customer.password_hash)
          if (!valid) return null
          return { id: customer.id, email: customer.email, name: customer.name, role: 'customer' }
        }

        if (role === 'vendor') {
          const vendor = await prisma.vendor.findUnique({ where: { email } })
          if (!vendor?.password_hash) return null
          const valid = await bcrypt.compare(password, vendor.password_hash)
          if (!valid) return null
          return { id: vendor.id, email: vendor.email, name: vendor.business_name, role: 'vendor' }
        }

        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'customer'
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      ;(session.user as any).role = token.role
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.AUTH_SECRET,
})
