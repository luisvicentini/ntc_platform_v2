import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

interface SendActivationEmailParams {
  to: string
  name: string
  activationUrl: string
  userType: string
}

export async function sendActivationEmail({ to, name, activationUrl, userType }: SendActivationEmailParams) {
  const userTypeText = {
    master: "Master",
    business: "Estabelecimento",
    partner: "Parceiro",
    member: "Assinante"
  }[userType]

  const html = `
    <h1>Bem-vindo(a) ao NTC Platform</h1>
    <p>Olá ${name},</p>
    <p>Você foi cadastrado(a) como ${userTypeText} em nossa plataforma.</p>
    <p>Para ativar sua conta e definir sua senha, clique no link abaixo:</p>
    <p><a href="${activationUrl}">Ativar minha conta</a></p>
    <p>Este link é válido por 7 dias.</p>
    <p>Se você não solicitou este cadastro, por favor ignore este email.</p>
  `

  await transporter.sendMail({
    from: `"NTC Platform" <${process.env.SMTP_FROM}>`,
    to,
    subject: "Ative sua conta na NTC Platform",
    html
  })
}
