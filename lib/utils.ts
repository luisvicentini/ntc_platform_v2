import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"
import jwt from "jsonwebtoken"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generateActivationToken(): string {
  // Usar JWT para gerar o token de ativação
  const token = jwt.sign(
    { timestamp: Date.now() },
    process.env.NEXTAUTH_SECRET || "seu-fallback-secret",
    { expiresIn: "24h" }
  )
  return token
}

