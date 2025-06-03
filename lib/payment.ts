/**
 * Constantes para cálculos de pagamento
 */
export const PAYMENT_CONSTANTS = {
  LASTLINK: {
    TRANSACTION_FEE_PERCENTAGE: 5.0, // 5% de taxa de transação
    FIXED_FEE_CENTS: 0, // Taxa fixa em centavos
  },
  STRIPE: {
    TRANSACTION_FEE_PERCENTAGE: 3.5, // 3.5% de taxa de transação
    FIXED_FEE_CENTS: 50, // R$0,50 taxa fixa
  }
}

/**
 * Calcula o valor bruto a partir do valor líquido desejado, considerando as taxas da Lastlink
 * @param netAmount Valor líquido desejado (o valor que o vendedor quer receber)
 * @returns Valor bruto a ser cobrado do cliente
 */
export function calculateLastlinkPriceWithFee(netAmount: number): number {
  const { TRANSACTION_FEE_PERCENTAGE, FIXED_FEE_CENTS } = PAYMENT_CONSTANTS.LASTLINK
  
  // Se o valor líquido é zero ou negativo, retornar zero
  if (netAmount <= 0) return 0
  
  // Convertendo para centavos para evitar problemas de arredondamento
  const netAmountCents = Math.round(netAmount * 100)
  
  // Fórmula: valorBruto = (valorLíquido + taxaFixa) / (1 - (taxaPercentual / 100))
  const grossAmountCents = Math.round(
    (netAmountCents + FIXED_FEE_CENTS) / (1 - (TRANSACTION_FEE_PERCENTAGE / 100))
  )
  
  // Convertendo de volta para reais
  return grossAmountCents / 100
}

/**
 * Calcula o valor líquido que o vendedor receberá, aplicando as taxas da Lastlink
 * @param grossAmount Valor bruto cobrado do cliente
 * @returns Valor líquido que o vendedor receberá
 */
export function calculateLastlinkNetAmount(grossAmount: number): number {
  const { TRANSACTION_FEE_PERCENTAGE, FIXED_FEE_CENTS } = PAYMENT_CONSTANTS.LASTLINK
  
  // Se o valor bruto é zero ou negativo, retornar zero
  if (grossAmount <= 0) return 0
  
  // Convertendo para centavos para evitar problemas de arredondamento
  const grossAmountCents = Math.round(grossAmount * 100)
  
  // Fórmula: valorLíquido = valorBruto * (1 - (taxaPercentual / 100)) - taxaFixa
  const netAmountCents = Math.round(
    grossAmountCents * (1 - (TRANSACTION_FEE_PERCENTAGE / 100)) - FIXED_FEE_CENTS
  )
  
  // Convertendo de volta para reais
  return Math.max(0, netAmountCents / 100)  // Garantir que não retorne valor negativo
}

/**
 * Calcula o valor bruto a partir do valor líquido desejado, considerando as taxas do Stripe
 * @param netAmount Valor líquido desejado (o valor que o vendedor quer receber)
 * @returns Valor bruto a ser cobrado do cliente
 */
export function calculateStripePriceWithFee(netAmount: number): number {
  const { TRANSACTION_FEE_PERCENTAGE, FIXED_FEE_CENTS } = PAYMENT_CONSTANTS.STRIPE
  
  // Se o valor líquido é zero ou negativo, retornar zero
  if (netAmount <= 0) return 0
  
  // Convertendo para centavos para evitar problemas de arredondamento
  const netAmountCents = Math.round(netAmount * 100)
  
  // Fórmula: valorBruto = (valorLíquido + taxaFixa) / (1 - (taxaPercentual / 100))
  const grossAmountCents = Math.round(
    (netAmountCents + FIXED_FEE_CENTS) / (1 - (TRANSACTION_FEE_PERCENTAGE / 100))
  )
  
  // Convertendo de volta para reais
  return grossAmountCents / 100
}

/**
 * Calcula o valor líquido que o vendedor receberá, aplicando as taxas do Stripe
 * @param grossAmount Valor bruto cobrado do cliente
 * @returns Valor líquido que o vendedor receberá
 */
export function calculateStripeNetAmount(grossAmount: number): number {
  const { TRANSACTION_FEE_PERCENTAGE, FIXED_FEE_CENTS } = PAYMENT_CONSTANTS.STRIPE
  
  // Se o valor bruto é zero ou negativo, retornar zero
  if (grossAmount <= 0) return 0
  
  // Convertendo para centavos para evitar problemas de arredondamento
  const grossAmountCents = Math.round(grossAmount * 100)
  
  // Fórmula: valorLíquido = valorBruto * (1 - (taxaPercentual / 100)) - taxaFixa
  const netAmountCents = Math.round(
    grossAmountCents * (1 - (TRANSACTION_FEE_PERCENTAGE / 100)) - FIXED_FEE_CENTS
  )
  
  // Convertendo de volta para reais
  return Math.max(0, netAmountCents / 100)  // Garantir que não retorne valor negativo
} 