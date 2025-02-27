import { getPartnerLinkByCode } from "@/lib/firebase/partner-links"
import { redirect } from "next/navigation"
import { CheckoutPreview } from "@/components/checkout-preview"

export default async function CheckoutPage({ params }: { params: { code: string } }) {
  const link = await getPartnerLinkByCode(params.code)
  
  if (!link) {
    redirect('/404')
  }

  return <CheckoutPreview partnerLink={link} />
} 