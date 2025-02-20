import { customAlphabet } from 'nanoid'

// Gera um código alfanumérico de 6 caracteres
export function generateVoucherCode() {
  // Usando apenas letras maiúsculas e números para facilitar a digitação
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)
  return nanoid()
} 