import { Dialog, DialogTitle, DialogContent, DialogHeader } from "../ui/dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible";
import { useState } from "react";

export default function Footer() {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  
  // Dados mockados para o FAQ
  const faqData = [
    {
      pergunta: "Como funciona o Não Tem Chef?",
      resposta: "O Não Tem Chef é um clube de vantagens onde você paga uma assinatura (anual, semestral ou mensal) e ganha descontos exclusivos nos melhores restaurantes parceiros. Basta apresentar seu voucher ao restaurante no momento do pagamento."
    },
    {
      pergunta: "Quando vai abrir as inscrições?",
      resposta: "As inscrições vão começar em breve, então fique ligado no grupo de whatsapp para não perder a chance de ser um dos primeiros a saber quando vamos começar."
    },
    {
      pergunta: "Como faço para cancelar minha assinatura?",
      resposta: "Você pode cancelar sua assinatura a qualquer momento através do aplicativo, na seção 'Minha Conta' > 'Assinatura' > 'Cancelar'. O cancelamento será efetivado ao fim do período contratado."
    },
    {
      pergunta: "Os descontos têm limite de uso?",
      resposta: "Nossos descontos podem ser utilizados quantas vezes você quiser durante o período de sua assinatura, respeitando apenas as regras específicas de cada restaurante parceiro."
    },
    {
      pergunta: "Posso levar acompanhantes?",
      resposta: "Sim! A maioria dos descontos se aplica à você e seu acompanhante. Alguns restaurantes podem ter limitações específicas, que estarão claramente informadas no Clube na sua área do assinante."
    }
  ];
  
  return (
    <footer className="py-12 px-4 md:px-8 lg:px-16 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna 1 - Contato */}
        <div className="text-center md:text-left">
          <h3 className="text-white font-bold text-lg mb-4">Contato</h3>
          <ul className="space-y-2 text-zinc-400">
            <li>
              <a href="https://wa.me/5519982240767?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20Não%20Tem%20Chef." className="hover:text-[#F24957] transition-colors">
                WhatsApp: (19) 98224-0767
              </a>
            </li>
            <li>
              <a href="mailto:suporte@naotemchef.com.br" className="hover:text-[#F24957] transition-colors">
                Email: suporte@naotemchef.com.br
              </a>
            </li>
          </ul>
        </div>

        {/* Coluna 2 - Links Úteis */}
        <div className="text-center md:text-left">
          <ul className="space-y-2 text-zinc-400">
            <li>
              <button onClick={() => setPrivacyModalOpen(true)} className="hover:text-[#F24957] transition-colors">
                Política de Privacidade
              </button>
            </li>
            <li>
              <button onClick={() => setFaqModalOpen(true)} className="hover:text-[#F24957] transition-colors">
                Perguntas Frequentes
              </button>
            </li>
            <li>
              <p className="text-zinc-400 sm:text-xs mt-4">Disclaimer: Todas as imagens são para efeito ilustrativo.</p>
            </li>
          </ul>

          <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
            <DialogContent className="max-w-[800px] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Política de Privacidade do Não Tem Chef</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[70vh] overflow-y-auto">
                <div className="p-4">
                  <p className="mb-4">
                    A sua privacidade é importante para nós. É política do Não Tem Chef respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar em nosso site e outros sites que possuímos e operamos.
                  </p>
                  <p className="mb-4">
                    Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
                  </p>
                  <p className="mb-4">
                    Também informamos por que estamos coletando e como será usado. Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
                  </p>
                  <p className="mb-4">
                    Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei. Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.
                  </p>
                  <p className="mb-4">
                    O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco.
                  </p>
                  <h3 className="text-lg font-bold my-4">Política de Cookies</h3>
                  <p className="mb-4">
                    Como é prática comum em quase todos os sites profissionais, este site usa cookies, que são pequenos arquivos baixados no seu computador, para melhorar sua experiência. Esta página descreve quais informações eles coletam, como as usamos e por que às vezes precisamos armazenar esses cookies. Também compartilharemos como você pode impedir que esses cookies sejam armazenados, no entanto, isso pode fazer o downgrade ou 'quebrar' certos elementos da funcionalidade do site.
                  </p>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
            <DialogContent className="max-w-[800px] max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Perguntas Frequentes</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] overflow-y-auto">
                <div className="p-4">
                  {faqData.map((faq, index) => (
                    <Collapsible key={index} className="mb-4">
                      <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-zinc-50 rounded-lg">
                        <span>{faq.pergunta}</span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 bg-zinc-100 rounded-b-lg mt-1">
                        {faq.resposta}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coluna 3 - Copyright */}
        <div className="text-center md:text-left">
          <p className="text-zinc-400 mb-4">
            O único clube de vantagens que te dá descontos de até 50% nos melhores restaurantes de verdade.
          </p>
          <p className="text-sm text-zinc-500">
            © 2025 Não Tem Chef - Leo Corvo. Todos direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
