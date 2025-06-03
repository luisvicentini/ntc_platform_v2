export const phoneMasks = {
  BR: {
    mask: "+55 (99) 99999-9999",
    placeholder: "(11) 98765-4321"
  },
  US: {
    mask: "+1 (999) 999-9999",
    placeholder: "(555) 123-4567"
  },
  PT: {
    mask: "+351 999 999 999",
    placeholder: "912 345 678"
  }
}

export const getPhoneMask = (countryCode: string) => {
  return phoneMasks[countryCode] || {
    mask: `${countries.find(c => c.code === countryCode)?.dial_code} 99999999999`,
    placeholder: "Digite o número"
  }
} 