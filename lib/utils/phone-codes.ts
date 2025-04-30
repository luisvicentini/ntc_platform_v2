export interface PhoneCode {
  code: string
  country: string
  flag: string
  mask: string
}

export const phoneCodes: PhoneCode[] = [
  {
    code: "55",
    country: "Brasil",
    flag: "🇧🇷",
    mask: "(99) 99999-9999"
  },
  {
    code: "1",
    country: "Estados Unidos",
    flag: "🇺🇸",
    mask: "(999) 999-9999"
  },
  {
    code: "351",
    country: "Portugal",
    flag: "🇵🇹",
    mask: "999 999 999"
  },
  {
    code: "44",
    country: "Reino Unido",
    flag: "🇬🇧",
    mask: "99999 999999"
  },
  {
    code: "34",
    country: "Espanha",
    flag: "🇪🇸",
    mask: "999 999 999"
  },
  {
    code: "33",
    country: "França",
    flag: "🇫🇷",
    mask: "99 99 99 99 99"
  },
  {
    code: "49",
    country: "Alemanha",
    flag: "🇩🇪",
    mask: "999 999999"
  },
  {
    code: "39",
    country: "Itália",
    flag: "🇮🇹",
    mask: "999 999 9999"
  },
  {
    code: "81",
    country: "Japão",
    flag: "🇯🇵",
    mask: "99 9999 9999"
  },
  {
    code: "86",
    country: "China",
    flag: "🇨🇳",
    mask: "999 9999 9999"
  },
  {
    code: "82",
    country: "Coreia do Sul",
    flag: "🇰🇷",
    mask: "99 9999 9999"
  },
  {
    code: "52",
    country: "México",
    flag: "🇲🇽",
    mask: "999 999 9999"
  },
  {
    code: "54",
    country: "Argentina",
    flag: "🇦🇷",
    mask: "999 9999 9999"
  },
  {
    code: "56",
    country: "Chile",
    flag: "🇨🇱",
    mask: "999 999 999"
  },
  {
    code: "57",
    country: "Colômbia",
    flag: "🇨🇴",
    mask: "999 999 9999"
  },
  {
    code: "58",
    country: "Venezuela",
    flag: "🇻🇪",
    mask: "999 999 9999"
  },
  {
    code: "51",
    country: "Peru",
    flag: "🇵🇪",
    mask: "999 999 999"
  },
  {
    code: "598",
    country: "Uruguai",
    flag: "🇺🇾",
    mask: "999 999 999"
  },
  {
    code: "595",
    country: "Paraguai",
    flag: "🇵🇾",
    mask: "999 999 999"
  },
  {
    code: "593",
    country: "Equador",
    flag: "🇪🇨",
    mask: "999 999 9999"
  }
]

// Função para obter a máscara de telefone baseada no DDI
export function getPhoneMask(ddi: string): string {
  const phoneCode = phoneCodes.find(code => code.code === ddi)
  return phoneCode?.mask || "(99) 99999-9999" // Retorna máscara padrão Brasil se não encontrar
}

// Função para formatar o número de telefone baseado no DDI
export function formatPhoneNumber(phone: string, ddi: string): string {
  const mask = getPhoneMask(ddi)
  let formattedPhone = phone.replace(/\D/g, "") // Remove não-dígitos
  let result = ""
  let maskIndex = 0
  let phoneIndex = 0

  while (maskIndex < mask.length && phoneIndex < formattedPhone.length) {
    if (mask[maskIndex] === "9") {
      result += formattedPhone[phoneIndex]
      phoneIndex++
    } else {
      result += mask[maskIndex]
    }
    maskIndex++
  }

  return result
}
